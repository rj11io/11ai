---
name: 11ai-operator-vercel-chat-sdk-v4-webhooks-deployment
description: "Configure Chat SDK webhook routes, signature or token verification, local tunnels, platform registration, environment separation, deployment, and delivery diagnostics. Use when exposing bot webhooks, registering callbacks, deploying a bot, or diagnosing delivery failures."
---
# 11ai Vercel Chat SDK v4 webhooks and deployment

A public webhook is an authenticated production ingress and registration changes remote state Resolve the exact environment, external target, data boundary, cost or delivery impact, and acceptance check before acting.

Version baseline: Target Chat SDK 4, currently the 4.35 release line. Use chat/ai for AI utilities, current adapters, Vercel Connect helpers, distributed state, webhook deduplication, and current platform capability checks.

## Inspect first

```bash
rg -n 'webhooks\.|route\.(ts|js)|signing|verify|tunnel|callback' TARGET
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//'
```

Resolve exact platform app, environment, public HTTPS URL, route, verification mechanism, events, retries, and deployment owner.

Confirm before changing:

- Raw-body or platform-specific verification.
- Separate test and production apps.
- Idempotent delivery handling.
- Temporary tunnel lifecycle.

## Operate

```bash
npm test --if-present -- TARGET
npm run build --if-present
```

Verify before parsing or acting, return deliberate statuses, register only required events, and remove stale development tunnels.

Never register or replace live webhook URLs, disable verification, deploy, or rotate signing secrets without explicit approval Require explicit approval before that operation and preview target, count, cost, recipients, permissions, or rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test missing and invalid signatures, valid event, duplicate retry, unknown type, route timeout, and test-environment delivery logs. Report environment, target, files, external actions, cost or delivery count, secret handling, checks, and rollback. Hand configuration failures to `11ai-operator-vercel-chat-sdk-v4-troubleshooting` and system seams to `11ai-operator-vercel-chat-sdk-v4-integrations`.
