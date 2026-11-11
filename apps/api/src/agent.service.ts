import { createHash, randomUUID } from 'node:crypto';
import { Injectable, BadGatewayException, BadRequestException, ConflictException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { pool } from './db/client.js';
import { costKopecks, parseRate, reserveKopecks } from './domain/pricing.js';
import { generateLeadAnswer, LEAD_SYSTEM_PROMPT, type ModelSettings } from './ai/provider.js';

const requestSchema = z.object({
  workspaceId: z.uuid(),
  idempotencyKey: z.uuid(),
  prompt: z.string().trim().min(1).max(2000),
}).strict();

async function transaction<T>(handler: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

function modelSettings(): ModelSettings {
  const apiKey = process.env.PROXYAPI_KEY;
  const modelId = process.env.AI_MODEL_ID;
  const baseURL = process.env.PROXYAPI_BASE_URL ?? 'https://api.proxyapi.ru/v1';
  if (!apiKey || !modelId) throw new ServiceUnavailableException('AI provider is not configured');
  if (!baseURL.startsWith('https://')) throw new ServiceUnavailableException('AI endpoint must use HTTPS');
  try {
    return {
      apiKey, modelId, baseURL,
      rates: {
        input: parseRate(process.env.MODEL_INPUT_KOPECKS_PER_MILLION, 'Input rate'),
        output: parseRate(process.env.MODEL_OUTPUT_KOPECKS_PER_MILLION, 'Output rate'),
      },
    };
  } catch {
    throw new ServiceUnavailableException('Explicit model pricing is required');
  }
}

function hasUsage(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

@Injectable()
export class AgentService {
  async ask(userId: string, raw: unknown) {
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException('Invalid request');
    const { workspaceId, idempotencyKey, prompt } = parsed.data;
    const config = modelSettings();
    const promptHash = createHash('sha256').update(prompt).digest('hex');
    const reserved = reserveKopecks(LEAD_SYSTEM_PROMPT + '\n' + prompt, config.rates);

    const admission = await transaction(async client => {
      const allowed = await client.query(
        'SELECT 1 FROM aimock_members WHERE user_id=$1 AND workspace_id=$2 LIMIT 1',
        [userId, workspaceId],
      );
      if (!allowed.rowCount) throw new ForbiddenException('Workspace access denied');

      const existing = await client.query(
        'SELECT id, prompt_hash, status, answer, input_tokens, output_tokens, charge_kopecks FROM aimock_agent_runs WHERE workspace_id=$1 AND user_id=$2 AND idempotency_key=$3',
        [workspaceId, userId, idempotencyKey],
      );
      if (existing.rowCount) {
        const row = existing.rows[0];
        if (row.prompt_hash !== promptHash) throw new ConflictException('Idempotency key belongs to another prompt');
        if (row.status !== 'succeeded') throw new ConflictException('Request is in progress or needs reconciliation');
        return {
          kind: 'cached' as const,
          result: {
            status: 'succeeded' as const,
            id: row.id as string,
            answer: row.answer as string,
            inputTokens: row.input_tokens as number,
            outputTokens: row.output_tokens as number,
            chargedKopecks: Number(row.charge_kopecks),
          },
        };
      }

      const wallet = await client.query(
        'UPDATE aimock_wallets SET available_kopecks=available_kopecks-$1, reserved_kopecks=reserved_kopecks+$1 WHERE workspace_id=$2 AND available_kopecks >= $1 RETURNING workspace_id',
        [reserved, workspaceId],
      );
      if (!wallet.rowCount) throw new BadRequestException('Insufficient Workspace test balance');

      const runId = randomUUID();
      const inserted = await client.query(
        'INSERT INTO aimock_agent_runs (id,workspace_id,user_id,idempotency_key,prompt_hash,status,model_id,rate_input_kopecks,rate_output_kopecks,reserved_kopecks) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING RETURNING id',
        [runId, workspaceId, userId, idempotencyKey, promptHash, 'running', config.modelId, config.rates.input, config.rates.output, reserved],
      );
      if (!inserted.rowCount) throw new ConflictException('Concurrent duplicate request');
      return { kind: 'new' as const, runId };
    });

    if (admission.kind === 'cached') return admission.result;
    const { runId } = admission;
    let answer;
    try {
      answer = await generateLeadAnswer(prompt, config);
    } catch {
      await this.markForReview(runId);
      throw new BadGatewayException('Provider outcome uncertain; reserved funds need reconciliation');
    }

    const inputTokens = answer.inputTokens;
    const outputTokens = answer.outputTokens;
    if (!hasUsage(inputTokens) || !hasUsage(outputTokens) || inputTokens + outputTokens === 0 || !answer.text.trim()) {
      await this.markForReview(runId);
      throw new BadGatewayException('Provider usage or answer missing; reserved funds need reconciliation');
    }
    const chargedKopecks = costKopecks(inputTokens, outputTokens, config.rates);
    if (chargedKopecks > reserved) {
      await this.markForReview(runId);
      throw new BadGatewayException('Usage exceeded conservative reserve; manual reconciliation required');
    }

    await transaction(async client => {
      const pending = await client.query('SELECT status FROM aimock_agent_runs WHERE id=$1 FOR UPDATE', [runId]);
      if (pending.rows[0]?.status !== 'running') throw new ConflictException('Run already reconciled');
      const updated = await client.query(
        'UPDATE aimock_wallets SET available_kopecks=available_kopecks+$1, reserved_kopecks=reserved_kopecks-$2 WHERE workspace_id=$3 AND reserved_kopecks >= $2 RETURNING workspace_id',
        [reserved - chargedKopecks, reserved, workspaceId],
      );
      if (!updated.rowCount) throw new ConflictException('Inconsistent wallet reserve');
      await client.query(
        'UPDATE aimock_agent_runs SET status=$1,answer=$2,input_tokens=$3,output_tokens=$4,charge_kopecks=$5 WHERE id=$6',
        ['succeeded', answer.text, inputTokens, outputTokens, chargedKopecks, runId],
      );
      await client.query(
        'INSERT INTO aimock_ledger (workspace_id,run_id,delta_kopecks,kind) VALUES ($1,$2,$3,$4)',
        [workspaceId, runId, -chargedKopecks, 'ai_usage'],
      );
    });
    return { status: 'succeeded' as const, id: runId, answer: answer.text, inputTokens, outputTokens, chargedKopecks };
  }

  private async markForReview(id: string): Promise<void> {
    await pool.query(
      "UPDATE aimock_agent_runs SET status='needs_review' WHERE id=$1 AND status='running'",
      [id],
    );
  }
}
