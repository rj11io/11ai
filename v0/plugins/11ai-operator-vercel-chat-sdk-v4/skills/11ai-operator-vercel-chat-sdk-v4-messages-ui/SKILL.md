---
name: 11ai-operator-vercel-chat-sdk-v4-messages-ui
description: "Create Chat SDK posts, streaming responses, edits, reactions, files, cards, modals, ephemeral messages, and cross-platform fallbacks with accessible content. Use when sending or updating messages, streaming AI output, building cards, or handling interactive forms."
---
# 11ai Vercel Chat SDK v4 messages and interactive UI

A send operation reaches real people and may notify or expose data Resolve the exact environment, external target, data boundary, cost or delivery impact, and acceptance check before acting.

Version baseline: Target Chat SDK 4, currently the 4.35 release line. Use chat/ai for AI utilities, current adapters, Vercel Connect helpers, distributed state, webhook deduplication, and current platform capability checks.

## Inspect first

```bash
rg -n '\.post\(|\.stream\(|\.edit\(|\.react\(|Modal|Card|callbackUrl|ephemeral|upload' TARGET
npm test --if-present -- TARGET
```

Resolve recipients, thread, visibility, mention behavior, platform capability, content classification, file size, callback URL ownership, and fallback. Chat SDK 4 callback URLs can resume durable approval flows, so validate actor identity and payload freshness before acting.

Confirm before changing:

- Exact recipient and visibility.
- No unintended mentions or notifications.
- Accessible text fallback for rich UI.
- Edit and partial-stream recovery.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Render platform-neutral content first, add bounded rich components, escape user text, and surface delivery failures.

Never send, edit, delete, react, DM, upload, or open a modal in a live workspace without explicit approval Require explicit approval before that operation and preview target, count, cost, recipients, permissions, or rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Use snapshots or a test workspace to inspect rendering, fallback, mentions, stream interruption, actions, and delivery IDs. Report environment, target, files, external actions, cost or delivery count, secret handling, checks, and rollback. Hand configuration failures to `11ai-operator-vercel-chat-sdk-v4-troubleshooting` and system seams to `11ai-operator-vercel-chat-sdk-v4-integrations`.
