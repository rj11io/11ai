---
name: 11ai-operator-vercel-workflows-v4-durability-retries
description: "Configure workflow durability, checkpoints, retries, backoff, timeouts, idempotency, crash recovery, compensation, and poison-step handling. Use when a workflow must survive failures, retries duplicate work, or recovery and compensation need design."
---
# 11ai Vercel Workflows v4 durability and retries

Durability guarantees resumption, not safe repeated side effects unless each step is idempotent Resolve the exact project, environment, resource or run, state boundary, permissions, limits, and acceptance check before acting.

Version baseline: Target workflow 4.6 stable. Do not copy Workflow 5 beta APIs; use v4 directives, event-sourced runs, end-to-end encryption, custom serialization, framework plugins, and current observability.

## Inspect first

```bash
rg -n 'retry|backoff|timeout|idempoten|compensat|attempt|step' TARGET
npm test --if-present -- TARGET
```

Resolve retryable errors, maximum attempts, total duration, idempotency key, checkpoint location, and compensation owner.

Confirm before changing:

- Finite retry classes and attempts.
- Stable idempotency per logical action.
- Timeout shorter than external lease.
- Compensation for partial completion.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Classify errors, add jittered bounded backoff, persist external IDs, and make compensation explicit rather than pretending rollback is automatic.

Never add unbounded retries, replay non-idempotent steps, skip failed steps, or run compensation on production without approval Require explicit approval and preview exact resources, commands or steps, counts, limits, cost, cleanup, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Inject failures before and after side effects, crash and resume, exhaust retries, deduplicate, and verify compensation. Report scope, IDs, state transitions, files, remote actions, usage, checks, cleanup, and rollback. Hand configuration failures to `11ai-operator-vercel-workflows-v4-troubleshooting` and seams to `11ai-operator-vercel-workflows-v4-integrations`.
