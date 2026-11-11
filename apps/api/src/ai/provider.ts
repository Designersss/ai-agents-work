import { generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { OUTPUT_LIMIT } from '../domain/pricing.js';

export const LEAD_SYSTEM_PROMPT = 'Вы агент AIMock для входящих заявок. Уточняйте запрос и контакты, не придумывайте цены или сроки, не утверждайте, что связались с менеджером или изменили CRM.';
export type ModelSettings = Readonly<{ apiKey: string; modelId: string; baseURL: string; rates: { input: number; output: number } }>;
export type ModelResult = Readonly<{ text: string; inputTokens: number | undefined; outputTokens: number | undefined }>;

export async function generateLeadAnswer(prompt: string, settings: ModelSettings): Promise<ModelResult> {
  const proxy = createOpenAICompatible({ name: 'proxyapi', baseURL: settings.baseURL, apiKey: settings.apiKey });
  const result = await generateText({
    model: proxy.chatModel(settings.modelId),
    system: LEAD_SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: OUTPUT_LIMIT,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(30_000),
  });
  return { text: result.text, inputTokens: result.totalUsage.inputTokens, outputTokens: result.totalUsage.outputTokens };
}
