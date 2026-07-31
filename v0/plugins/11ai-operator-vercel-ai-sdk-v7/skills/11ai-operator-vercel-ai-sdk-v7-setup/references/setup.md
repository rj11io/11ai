# Vercel AI SDK v7 setup reference

Use current AI SDK 7 documentation at <https://ai-sdk.dev/docs> and locally installed package types as the sources of truth. Keep all `ai` and `@ai-sdk/*` packages on compatible v7-era majors.

## Decisions

Confirm project, package manager, runtime, external environment, feature, credential source, persistence, data retention, request or delivery bounds, and production owner.

## Inspect

```bash
node -p "require('ai/package.json').version" 2>/dev/null
rg -n 'generateText|streamText|Output\.|ToolLoopAgent|WorkflowAgent|useRealtime|generateVideo|useChat|providerOptions' . --glob '*.{ts,tsx,js,jsx}' --glob '!node_modules' | head -120
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
```

List environment variable names only. Preserve existing adapters, providers, routes, persistence, and policy.

## Install

```bash
npm install ai@^7 zod@^4
node -e "import('ai').then(m => console.log(Object.keys(m).slice(0,12)))"
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

Never print or commit provider API keys, AI Gateway keys, OIDC tokens, prompts containing private data, tool credentials, or raw telemetry payloads. Keep server values out of client bundles, logs, fixtures, and error bodies.

## Report

List packages, versions, files, environment variable names, external targets, persistence, bounds, checks, cost, and rollback.
