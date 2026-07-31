---
name: 11ai-operator-vercel-eve-v0-subagents-approvals
description: "Design eve built-in and declared subagents plus durable human approvals with scoped delegation, isolated context, permission boundaries, decision payloads, and resume behavior. Use when adding specialists, delegating parallel work, or requiring a person to approve consequential agent actions."
---
# 11ai Vercel eve v0 subagents and approvals

A subagent gets a fresh context and an approval grants authority, so both must be explicit and auditable Resolve the exact project, environment, remote target, permission and cost boundary, and acceptance check before acting.

Version baseline: Target the eve 0.27 preview line. Because APIs may change within major zero, inspect bundled docs and types and pin the exact minor and patch used in production.

## Inspect first

```bash
find agent/subagents -maxdepth 3 -type f 2>/dev/null | sort
rg -n 'subagent|approval|approve|permission|agent tool' agent 2>/dev/null
```

Map delegation trigger, child model, inherited tools, data passed, output contract, approval owner, exact action, expiry, and denial path.

Confirm before changing:

- Narrow specialist description and task.
- Minimum delegated tools and data.
- Exact approval target and consequences.
- Durable decision and resume semantics.

## Operate

```bash
npm test --if-present
npx eve eval --help 2>/dev/null || true
```

Delegate bounded tasks with explicit output, keep sensitive context minimal, and bind approvals to immutable action details.

Never let subagents inherit broad tools by accident, self-approve, reuse approval for changed input, or fan out without bounds Require explicit approval and preview targets, permissions, counts, cost, remote effects, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npx eve eval --help 2>/dev/null || true
```

Test correct and incorrect delegation, denied and expired approval, changed payload, child failure, concurrency bound, and audit trail. Report scope, target IDs, files, remote actions, permissions, cost, checks, observability, and rollback. Hand configuration failures to `11ai-operator-vercel-eve-v0-troubleshooting` and seams to `11ai-operator-vercel-eve-v0-integrations`.
