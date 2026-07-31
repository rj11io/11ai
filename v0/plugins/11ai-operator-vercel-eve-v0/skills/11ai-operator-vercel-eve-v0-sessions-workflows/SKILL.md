---
name: 11ai-operator-vercel-eve-v0-sessions-workflows
description: "Operate eve durable sessions and workflow-backed conversations including creation, streaming, continuation tokens, checkpoints, pause, resume, crash recovery, and version behavior. Use when starting or resuming sessions, fixing lost progress, consuming the session API, or validating durability."
---
# 11ai Vercel eve v0 sessions and workflows

A durable session can outlive a process and deployment, so identity and idempotency must persist with it Resolve the exact project, environment, remote target, permission and cost boundary, and acceptance check before acting.

Version baseline: Target the eve 0.27 preview line. Because APIs may change within major zero, inspect bundled docs and types and pin the exact minor and patch used in production.

## Inspect first

```bash
rg -n '/eve/v1/session|continuationToken|sessionId|stream|checkpoint|resume' . --glob '*.{ts,tsx,js}' --glob '!node_modules'
npx eve dev --help
```

Resolve session ID, deployment version, continuation token handling, client ownership, retained content, and recovery semantics.

Confirm before changing:

- Stable session and user binding.
- Single-use or replay-safe continuation handling.
- Checkpointed side effects.
- Stream disconnect and resume.

## Operate

```bash
npm test --if-present
npm run typecheck --if-present
```

Persist identifiers durably, attach to streams with cancellation, and make every resumable side effect idempotent.

Never replay or resume a session that can repeat writes, expose continuation tokens, or merge users without approval Require explicit approval and preview targets, permissions, counts, cost, remote effects, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npx eve eval --help 2>/dev/null || true
```

Test create, stream, follow-up, disconnect, crash, deploy, resume, duplicate continuation, expiry, and authorization. Report scope, target IDs, files, remote actions, permissions, cost, checks, observability, and rollback. Hand configuration failures to `11ai-operator-vercel-eve-v0-troubleshooting` and seams to `11ai-operator-vercel-eve-v0-integrations`.
