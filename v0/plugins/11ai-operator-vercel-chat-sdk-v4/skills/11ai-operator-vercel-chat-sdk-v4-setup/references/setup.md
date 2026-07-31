# Vercel Chat SDK v4 setup reference

Use current Chat SDK 4 documentation at <https://chat-sdk.dev/docs> and locally installed package types as the sources of truth. Keep `chat` and `@chat-adapter/*` packages on compatible major 4 releases.

## Decisions

Confirm project, package manager, runtime, external environment, feature, credential source, persistence, data retention, request or delivery bounds, and production owner.

## Inspect

```bash
node -p "require('chat/package.json').version" 2>/dev/null
rg -n 'new Chat|create.*Adapter|onNewMention|onSubscribedMessage|webhooks\.|create.*State' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -140
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
```

List environment variable names only. Preserve existing adapters, providers, routes, persistence, and policy.

## Install

```bash
npm install chat@^4
npx create-chat-sdk@4 --help
```

Preview scaffold output and stop any started dev server before editing. Never initialize Git, create remote resources, or send live traffic without approval.

## Verify

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Use one bounded test operation or mock. State cost and external effects before any live call, and verify duplicate and failure behavior.

## Secrets

Never print or commit bot tokens, signing secrets, app passwords, webhook secrets, connector credentials, message content, or personal data. Keep server values out of client bundles, logs, fixtures, and error bodies.

## Report

List packages, versions, files, environment variable names, external targets, persistence, bounds, checks, cost, and rollback.
