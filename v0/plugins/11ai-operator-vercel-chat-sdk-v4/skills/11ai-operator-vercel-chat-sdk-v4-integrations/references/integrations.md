# Vercel Chat SDK integrations reference

These patterns are standalone and describe Vercel Chat SDK seams without requiring another 11ai plugin.

## Runtime boundary

Keep credentials and trusted actions on the server. Validate every client, webhook, model, or platform payload before use.

## Persistence and concurrency

Use durable shared state when several processes or cold starts must agree. Define idempotency keys, lock scope, timeout, retry, and recovery.

## Observability

Record operation IDs, latency, status, usage, cost or delivery counts, retries, and redacted errors. Do not log prompts, message bodies, tokens, or personal data by default.

## Tests and CI

Mock external services for routine tests. Keep live smoke tests opt-in, bounded, environment-specific, and non-destructive.

## Deployment

Verify environment variable names, callback or webhook URLs, persistence, budget or rate controls, and preview behavior before production.

## Report

State trust boundary, external target, credentials by name, retained data, idempotency, bounds, observability, checks, and rollback.
