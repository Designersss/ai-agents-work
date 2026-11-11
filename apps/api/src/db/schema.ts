import { pgTable, uuid, text, timestamp, integer, bigint, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';

export const workspaces = pgTable('aimock_workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const members = pgTable('aimock_members', {
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').notNull(),
  role: text('role').notNull(),
}, t => [primaryKey({ columns: [t.workspaceId, t.userId] })]);

export const wallets = pgTable('aimock_wallets', {
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).primaryKey(),
  availableKopecks: bigint('available_kopecks', { mode: 'number' }).default(0).notNull(),
  reservedKopecks: bigint('reserved_kopecks', { mode: 'number' }).default(0).notNull(),
});

export const runs = pgTable('aimock_agent_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').notNull(),
  idempotencyKey: uuid('idempotency_key').notNull(),
  promptHash: text('prompt_hash').notNull(),
  status: text('status').notNull(),
  answer: text('answer'),
  modelId: text('model_id').notNull(),
  rateInputKopecks: integer('rate_input_kopecks').notNull(),
  rateOutputKopecks: integer('rate_output_kopecks').notNull(),
  reservedKopecks: bigint('reserved_kopecks', { mode: 'number' }).notNull(),
  chargeKopecks: bigint('charge_kopecks', { mode: 'number' }),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [uniqueIndex('aimock_one_run_per_request').on(t.workspaceId, t.userId, t.idempotencyKey)]);

export const ledger = pgTable('aimock_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  runId: uuid('run_id').references(() => runs.id).notNull(),
  deltaKopecks: bigint('delta_kopecks', { mode: 'number' }).notNull(),
  kind: text('kind').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [uniqueIndex('aimock_one_charge_per_run').on(t.runId, t.kind)]);
