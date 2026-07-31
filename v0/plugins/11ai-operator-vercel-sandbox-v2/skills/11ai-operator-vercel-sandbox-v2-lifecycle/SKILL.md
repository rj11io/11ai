---
name: 11ai-operator-vercel-sandbox-v2-lifecycle
description: "Operate Vercel Sandbox v2 lifecycle including creation, lookup, persistence, timeout, reconnection, stop, exit, and deterministic cleanup. Use when creating or resuming a sandbox, changing lifetime, inspecting state, or cleaning up persistent remote compute."
---
# 11ai Vercel Sandbox v2 lifecycle

A sandbox is billable remote compute with a bounded lifetime and explicit owner Resolve the exact project, environment, resource or run, state boundary, permissions, limits, and acceptance check before acting.

Version baseline: Target @vercel/sandbox 2.9 within major 2 and the current Sandbox CLI. Use persistent-by-default sandboxes, current Node.js and Python images, custom VCR images, multi-user isolation, and v2 lifecycle semantics.

## Inspect first

```bash
rg -n 'Sandbox\.(create|get|connect)|sandbox\.(stop|close)|timeout|sandboxId' TARGET
npm test --if-present -- TARGET
```

Resolve project, environment, sandbox ID, state, creator, runtime, start time, timeout, cost owner, and cleanup path.

Confirm before changing:

- Exact sandbox and environment.
- Maximum lifetime and idle behavior.
- Owner of active processes.
- Guaranteed cleanup in finally.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Create only for a stated operation, capture the name and ID immediately, record that v2 sandboxes persist by default, bound active work, and stop only when the requested lifecycle or cleanup policy calls for it.

Never create, extend, reconnect, stop, or abandon a live sandbox without explicit approval and identity confirmation Require explicit approval and preview exact resources, commands or steps, counts, limits, cost, cleanup, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test create and cleanup with mocks or test scope, timeout, client interruption, process exit, duplicate stop, and orphan detection. Report scope, IDs, state transitions, files, remote actions, usage, checks, cleanup, and rollback. Hand configuration failures to `11ai-operator-vercel-sandbox-v2-troubleshooting` and seams to `11ai-operator-vercel-sandbox-v2-integrations`.
