# Technical Spike 01 — acceptance and boundaries

## Goal
Prove one real path: registered user → Workspace membership → model request → provider usage → atomic wallet settlement. We are evaluating an **AI SDK + NestJS** baseline. Mastra Core is a later comparative spike.

## Financial/security rules
1. Every run requires a valid Better Auth session and membership in the **specified** Workspace.
2. One idempotency key is valid only for one request payload. Duplicate calls cannot make a second paid request.
3. Hold wallet budget **before** invoking the provider in a committed PostgreSQL transaction, never across a network transaction.
4. Settle only from actual provider token usage. If usage is absent, inconsistent or exceeds the reserve, hold funds for reconciliation rather than fabricate a charge.
5. No public funding endpoint. A development-only CLI can grant test credit; it refuses production mode.
6. Model ID and rates must be supplied explicitly. Credentials stay on the server.
7. No real payment or external CRM operation is performed.

## Not production-ready
- No T-Bank payments, reversals or financial reconciliation service.
- No ledger-grade double-entry accounting, rate versioning, provider billing reconciliation, or token reservation guarantees. A conservative estimate is not a contractual maximum provider charge.
- No provider timeout/retry recovery beyond preserving an uncertain reservation for review.
- No agent tools, memory, long-lived Workflow, queues or human approval.
- No production deployment, migrations, backup/restore, error monitoring or privacy policy.
- Model pricing and production tenancy access controls must undergo security and integration review.
- Without a configured ProxyAPI key, **live inference has not been tested**.

## Next gates
1. CI typecheck/build and domain tests.
2. PostgreSQL integration tests for concurrent requests and cross-workspace access.
3. One low-limit real ProxyAPI smoke test using a developer-controlled key.
4. Compare Mastra vs AI SDK + BullMQ, then select an engine.
