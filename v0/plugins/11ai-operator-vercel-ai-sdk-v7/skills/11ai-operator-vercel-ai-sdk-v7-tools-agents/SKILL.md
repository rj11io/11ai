---
name: 11ai-operator-vercel-ai-sdk-v7-tools-agents
description: "Design and operate AI SDK 7 tools and agents with runtime context, input schemas, execution boundaries, result contracts, WorkflowAgent durability, timeouts, approvals, and observability. Use when adding model-callable tools, building an agent, requiring human approval, or preventing runaway loops."
---
# 11ai Vercel AI SDK v7 tools and agents

A model selecting a tool is untrusted input to a real capability Resolve the exact environment, external target, data boundary, cost or delivery impact, and acceptance check before acting.

Version baseline: Target AI SDK 7 and matching companion packages. Use v7 agent context, approvals, WorkflowAgent durability, timeouts, sandbox support, telemetry, realtime voice, and video APIs instead of v6-era migration patterns.

## Inspect first

```bash
rg -n 'tool\(|tools:|execute:|ToolLoopAgent|WorkflowAgent|runtimeContext|timeout|stopWhen|needsApproval|onStepFinish' TARGET
npm test --if-present -- TARGET
```

Inventory each tool's read or write authority, credential scope, runtime context, input validation, idempotency, timeout, cost, durability boundary, and approval rule.

Confirm before changing:

- Least-privilege tool surface.
- Runtime validation before execute.
- Explicit step and cost bounds.
- Approval for consequential writes.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Separate read and write tools, return compact typed results, make writes idempotent, and stop loops on clear completion or bounded limits.

Never expose arbitrary shell, SQL, URL, filesystem, or destructive APIs without isolation and explicit approval Require explicit approval before that operation and preview target, count, cost, recipients, permissions, or rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test invalid input, denied approval, duplicate execution, timeout, tool error, maximum steps, and redacted tracing. Report environment, target, files, external actions, cost or delivery count, secret handling, checks, and rollback. Hand configuration failures to `11ai-operator-vercel-ai-sdk-v7-troubleshooting` and system seams to `11ai-operator-vercel-ai-sdk-v7-integrations`.
