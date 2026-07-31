---
name: 11ai-operator-vercel-chat-sdk-v4-cheatsheet
description: "Look up Vercel Chat SDK installation, inspection, core calls, operational limits, and focused patterns across adapters, events and handlers, messages and interactive ui, state and concurrency, webhooks and deployment. Use when the user wants a concise reference instead of a guided workflow."
---
# 11ai Vercel Chat SDK v4 cheatsheet

Use the installed SDK and official documentation for that version as the source of truth. This plugin is standalone; route multi-step work only to its sibling skills.

Version baseline: Target Chat SDK 4, currently the 4.35 release line. Use chat/ai for AI utilities, current adapters, Vercel Connect helpers, distributed state, webhook deduplication, and current platform capability checks.

## Inspect

```bash
node -p "require('chat/package.json').version" 2>/dev/null
rg -n 'new Chat|create.*Adapter|onNewMention|onSubscribedMessage|createChatTools|toAiMessages|webhooks\.|create.*State' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -140
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
```

Confirm package versions, runtime, framework boundary, configured adapters or providers, and existing scripts. Never guess Chat SDK version, platform adapter, bot identity, webhook route, credential source, state backend, overlap strategy, recipients, or delivery environment.

## Common commands

```bash
npm install chat@^4
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Installation changes the lockfile and belongs to requested setup. Inspect existing dependencies before adding packages or scaffolders.

Import `createChatTools` and `toAiMessages` from `chat/ai`, not their deprecated top-level re-exports. For Slack, GitHub, or Linear credentials managed by Vercel Connect, use the current `@vercel/connect/chat` adapter helpers.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-vercel-chat-sdk-v4-adapters` | Platform adapters, capabilities, credentials, and custom adapter contracts |
| `11ai-operator-vercel-chat-sdk-v4-events-handlers` | Mentions, messages, reactions, commands, actions, and handler routing |
| `11ai-operator-vercel-chat-sdk-v4-messages-ui` | Posts, streaming, edits, reactions, files, cards, modals, and ephemeral output |
| `11ai-operator-vercel-chat-sdk-v4-state-concurrency` | Persistent state, subscriptions, locks, overlap strategies, and deduplication |
| `11ai-operator-vercel-chat-sdk-v4-webhooks-deployment` | Webhook routes, verification, local tunnels, platform registration, and production rollout |

## Answer format

Lead with the smallest SDK call or command. State runtime, external effect or cost, secret boundary, verification, and whether approval is required before executing it.
