---
name: 11ai-operator-vercel-chat-sdk-v4-events-handlers
description: "Implement Chat SDK handlers for mentions, subscribed messages, reactions, slash commands, buttons, selections, modals, and platform events with explicit routing and errors. Use when adding bot behavior, fixing duplicate or missing handlers, or normalizing events across platforms."
---
# 11ai Vercel Chat SDK v4 events and handlers

Inbound events are untrusted, retryable, and sometimes duplicated Resolve the exact environment, external target, data boundary, cost or delivery impact, and acceptance check before acting.

Version baseline: Target Chat SDK 4, currently the 4.35 release line. Use chat/ai for AI utilities, current adapters, Vercel Connect helpers, distributed state, webhook deduplication, and current platform capability checks.

## Inspect first

```bash
rg -n 'bot\.on|onNewMention|onSubscribedMessage|onReaction|onSlashCommand|onAction' TARGET
npm test --if-present -- TARGET
```

Map event type, adapter, verification, deduplication, thread identity, actor, authorization, and response deadline.

Confirm before changing:

- Verified and normalized event source.
- Idempotency key and retry behavior.
- Authorization before privileged actions.
- Fast acknowledgement and deferred work.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Keep handlers narrow, validate action payloads, acknowledge within platform deadlines, and queue slow idempotent work.

Never act on unverified events, trust display names for identity, or replay handlers that send messages or mutate systems Require explicit approval before that operation and preview target, count, cost, recipients, permissions, or rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test valid, forged, duplicate, out-of-order, unauthorized, unknown, and timeout events. Report environment, target, files, external actions, cost or delivery count, secret handling, checks, and rollback. Hand configuration failures to `11ai-operator-vercel-chat-sdk-v4-troubleshooting` and system seams to `11ai-operator-vercel-chat-sdk-v4-integrations`.
