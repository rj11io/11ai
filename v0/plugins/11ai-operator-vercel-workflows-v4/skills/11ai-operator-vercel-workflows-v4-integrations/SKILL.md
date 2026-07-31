---
name: 11ai-operator-vercel-workflows-v4-integrations
description: "Connect Vercel Workflows to application runtimes, identity, storage, external events, observability, CI, and deployment while preserving isolation, durability, credential, and action boundaries. Use when Vercel Workflows crosses another system or must operate consistently through production."
---
# 11ai Vercel Workflows v4 integrations

Name both systems, trust boundary, state and events crossing it, credentials, idempotency, limits, and production owner before editing.

Version baseline: Target workflow 4.6 stable. Do not copy Workflow 5 beta APIs; use v4 directives, event-sourced runs, end-to-end encryption, custom serialization, framework plugins, and current observability.

## Inspect seams

```bash
node -p "require('workflow/package.json').version" 2>/dev/null
rg -n 'use workflow|use step|sleep|workflow|retry|hook|event' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -160
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//'
rg -n "workflow|sandbox|route|webhook|event|telemetry|deploy|storage" . --glob '!node_modules' | head -100
```

Find existing adapters and durable stores before adding another. This standalone plugin records external contracts locally.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for identity, storage, events, observability, tests, and deployment.

Change one seam, validate inputs, keep workflow payloads, event tokens, connector credentials, approval data, logs containing personal data, or production environment values server-side, enforce limits, and make retries idempotent and observable.

## Verify end to end

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test bounded success, denial, duplicate, timeout, interruption, resume or cleanup, and external failure in test scope.

## Report

State systems, scopes, trust boundary, credentials by name, persisted state, limits, remote actions, checks, cleanup, and rollback. Hand failures to `11ai-operator-vercel-workflows-v4-troubleshooting`.
