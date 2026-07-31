---
name: 11ai-operator-vercel-chat-sdk-v4-state-concurrency
description: "Operate Chat SDK state adapters, thread subscriptions, distributed locks, overlapping-message strategies, deduplication, and cold-start recovery. Use when deploying beyond one process, messages overlap, subscriptions disappear, or duplicate replies occur."
---
# 11ai Vercel Chat SDK v4 state and concurrency

Bot state must survive cold starts and coordinate every instance serving the same thread Resolve the exact environment, external target, data boundary, cost or delivery impact, and acceptance check before acting.

Version baseline: Target Chat SDK 4, currently the 4.35 release line. Use chat/ai for AI utilities, current adapters, Vercel Connect helpers, distributed state, webhook deduplication, and current platform capability checks.

## Inspect first

```bash
rg -n 'create.*State|state:|overlap|queue|drop|debounce|subscribe\(|LockError' TARGET
npm test --if-present -- TARGET
```

Identify state backend, key namespace, retention, lock scope, overlap strategy, duplicate key, and multi-instance topology.

Confirm before changing:

- Durable shared backend in production.
- Per-thread locking and timeout.
- Explicit overlap behavior.
- Idempotent outbound delivery.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Choose overlap strategy from product requirements, namespace state by environment, and recover stale locks with bounds.

Never switch persistence, clear state, alter overlap semantics, or replay queued messages without a count and approval Require explicit approval before that operation and preview target, count, cost, recipients, permissions, or rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test concurrent events, cold starts, lock timeout, duplicate delivery, backend outage, and recovery across two instances. Report environment, target, files, external actions, cost or delivery count, secret handling, checks, and rollback. Hand configuration failures to `11ai-operator-vercel-chat-sdk-v4-troubleshooting` and system seams to `11ai-operator-vercel-chat-sdk-v4-integrations`.
