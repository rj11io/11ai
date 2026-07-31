---
name: 11ai-operator-vercel-ai-sdk-v7-streaming-ui
description: "Build AI SDK streaming user interfaces with UI messages, useChat, server stream responses, data parts, tool states, cancellation, reconnection, and persisted history. Use when creating chat UI, fixing stream parsing, restoring messages, or rendering tool and error states."
---
# 11ai Vercel AI SDK v7 streaming UI

The server stream and client UI message schema must evolve as one protocol Resolve the exact environment, external target, data boundary, cost or delivery impact, and acceptance check before acting.

Version baseline: Target AI SDK 7 and matching companion packages. Use v7 agent context, approvals, WorkflowAgent durability, timeouts, sandbox support, telemetry, realtime voice, and video APIs instead of v6-era migration patterns.

## Inspect first

```bash
rg -n 'useChat|UIMessage|toUIMessageStreamResponse|create.*UIStream|data-' TARGET
npm test --if-present -- TARGET
```

Map message validation, route runtime, transport, persisted schema, tool parts, abort behavior, and reconnect ownership.

Confirm before changing:

- Validated incoming UI messages.
- Stable message and part IDs.
- Explicit loading, tool, and error states.
- Disconnect and retry semantics.

## Operate

```bash
npm test --if-present -- TARGET
npm run build --if-present
```

Validate messages before model conversion, stream typed parts, persist only accepted states, and make cancellation visible.

Never trust client-supplied tool results, persist reasoning or secrets by default, or silently replay a message that can trigger tools Require explicit approval before that operation and preview target, count, cost, recipients, permissions, or rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test partial chunks, abort, reconnect, duplicate send, malformed parts, tool approval, and restored history. Report environment, target, files, external actions, cost or delivery count, secret handling, checks, and rollback. Hand configuration failures to `11ai-operator-vercel-ai-sdk-v7-troubleshooting` and system seams to `11ai-operator-vercel-ai-sdk-v7-integrations`.
