---
name: 11ai-operator-vercel-workflows-v4-definitions-steps
description: "Author Vercel Workflow definitions and steps with directives, serializable inputs and outputs, deterministic orchestration, side-effect boundaries, and typed results. Use when creating a workflow, splitting work into steps, fixing serialization, or moving side effects into durable boundaries."
---
# 11ai Vercel Workflows v4 definitions and steps

Workflow code can replay, while step code owns side effects that must be durable and idempotent Resolve the exact project, environment, resource or run, state boundary, permissions, limits, and acceptance check before acting.

Version baseline: Target workflow 4.6 stable. Do not copy Workflow 5 beta APIs; use v4 directives, event-sourced runs, end-to-end encryption, custom serialization, framework plugins, and current observability.

## Inspect first

```bash
rg -n 'use workflow|use step|export async function|workflow' TARGET
npm run typecheck --if-present
```

Map workflow inputs, outputs, step boundaries, serialized values, side effects, version, and every external dependency.

Confirm before changing:

- Serializable stable inputs and results.
- Pure orchestration outside steps.
- Small named side-effect steps.
- Idempotency key at each write.

## Operate

```bash
npm run typecheck --if-present
npm test --if-present -- TARGET
```

Keep orchestration deterministic, isolate I/O in steps, return compact data, and version persisted schemas.

Never move non-idempotent writes outside steps, rename live workflow or step identity, or change serialized contracts without approval Require explicit approval and preview exact resources, commands or steps, counts, limits, cost, cleanup, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test deterministic replay, serialization failure, step error, duplicate invocation, and result compatibility. Report scope, IDs, state transitions, files, remote actions, usage, checks, cleanup, and rollback. Hand configuration failures to `11ai-operator-vercel-workflows-v4-troubleshooting` and seams to `11ai-operator-vercel-workflows-v4-integrations`.
