# AIMock — Technical Spike 01

This repository is the **production architecture experiment** for AIMock. It is not a finished SaaS and does not modify the separate design repository `Designersss/design-agents`.

## Scope
- Next.js + NestJS + Better Auth + PostgreSQL + Drizzle.
- Session-authenticated Workspace access; memberships are checked by the API.
- One *real* lead-agent request through the OpenAI-compatible ProxyAPI endpoint.
- Atomic wallet reservation, usage-based settlement, idempotency key, and an audit record.
- Open-source software only. External inference and server resources still cost money.

No simulated provider response is ever presented as real AI. Without a ProxyAPI key, model selection, explicit model prices or a funded test wallet, requests fail closed.

## Local setup
Requires Node.js 22+, pnpm 10+, Docker.
1. `docker compose up -d postgres`
2. `pnpm install`
3. Copy `.env.example` to `apps/api/.env`; provide a random Better Auth secret and provider credentials.
4. `pnpm --filter @aimock/api db:push`
5. `pnpm --filter @aimock/api auth:migrate`
6. `pnpm dev`; open http://localhost:3000.
7. Create a user and workspace. New wallets have **zero** balance.
8. For an isolated **development-only** experiment: `pnpm --filter @aimock/api seed:credit <workspace-uuid> <test-kopecks>`.

Read [the limitations](docs/TECHNICAL_SPIKE.md) before doing anything involving money or customer data. Database and auth schema migration commands used here are for development, not production.
