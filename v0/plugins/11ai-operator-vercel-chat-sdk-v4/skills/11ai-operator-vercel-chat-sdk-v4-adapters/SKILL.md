---
name: 11ai-operator-vercel-chat-sdk-v4-adapters
description: "Configure and operate Chat SDK official, vendor, and custom adapters with capability checks, platform credentials, bot identity, and normalized contracts. Use when adding Slack, Teams, Discord, GitHub, Linear, WhatsApp, or another adapter, or fixing adapter-specific behavior."
---
# 11ai Vercel Chat SDK v4 adapters

Each adapter maps one common API onto different platform permissions and semantics Resolve the exact environment, external target, data boundary, cost or delivery impact, and acceptance check before acting.

Version baseline: Target Chat SDK 4, currently the 4.35 release line. Use chat/ai for AI utilities, current adapters, Vercel Connect helpers, distributed state, webhook deduplication, and current platform capability checks.

## Inspect first

```bash
rg -n 'create[A-Z].*Adapter|adapters:|userName:' TARGET
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//'
```

Identify adapter package version, support tier, feature matrix, credentials, scopes, bot identity, webhook path, and target workspace.

Confirm before changing:

- Exact platform and test workspace.
- Minimum OAuth or bot scopes.
- Supported versus partial capabilities.
- Platform-specific rate and content limits.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Add one adapter behind a stable key, pass credentials server-side, and handle unsupported capabilities explicitly rather than simulating them silently.

Never install or authorize a bot in a real workspace, request broad scopes, or replace an adapter without user approval Require explicit approval before that operation and preview target, count, cost, recipients, permissions, or rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Use adapter mocks or a test workspace to confirm initialization, identity, one inbound event, one bounded reply, and unsupported-feature behavior. Report environment, target, files, external actions, cost or delivery count, secret handling, checks, and rollback. Hand configuration failures to `11ai-operator-vercel-chat-sdk-v4-troubleshooting` and system seams to `11ai-operator-vercel-chat-sdk-v4-integrations`.
