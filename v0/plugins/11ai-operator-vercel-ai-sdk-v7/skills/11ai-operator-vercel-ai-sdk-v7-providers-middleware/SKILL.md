---
name: 11ai-operator-vercel-ai-sdk-v7-providers-middleware
description: "Configure AI SDK providers, model registries, provider options, middleware, fallbacks, embeddings, telemetry, and shared model policy. Use when adding or switching providers, wrapping models, routing by task, enabling telemetry, or standardizing model configuration."
---
# 11ai Vercel AI SDK v7 providers and middleware

Provider choice changes capability, cost, latency, privacy, and failure behavior Resolve the exact environment, external target, data boundary, cost or delivery impact, and acceptance check before acting.

Version baseline: Target AI SDK 7 and matching companion packages. Use v7 agent context, approvals, WorkflowAgent durability, timeouts, sandbox support, telemetry, realtime voice, and video APIs instead of v6-era migration patterns.

## Inspect first

```bash
rg -n 'createProviderRegistry|wrapLanguageModel|providerOptions|@ai-sdk/otel|tracingChannel|embed|rerank' TARGET
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//'
```

Resolve allowed providers, exact models and modalities, credentials, data terms, fallback semantics, middleware order, `@ai-sdk/otel` configuration, Node.js tracing-channel consumers, and telemetry destination.

Confirm before changing:

- Stable model aliases and capability checks.
- No silent cross-provider behavior changes.
- Middleware order and content access.
- Usage, cost, and privacy metadata.

## Operate

```bash
npm test --if-present -- TARGET
npm run build --if-present
```

Centralize policy, pass provider-specific options narrowly, and record provider metadata without prompt bodies.

Never switch provider, enable fallback, export telemetry, or use request-scoped credentials without approval and disclosure review Require explicit approval before that operation and preview target, count, cost, recipients, permissions, or rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test primary, fallback, unsupported capability, credential failure, middleware order, and usage metadata. Report environment, target, files, external actions, cost or delivery count, secret handling, checks, and rollback. Hand configuration failures to `11ai-operator-vercel-ai-sdk-v7-troubleshooting` and system seams to `11ai-operator-vercel-ai-sdk-v7-integrations`.
