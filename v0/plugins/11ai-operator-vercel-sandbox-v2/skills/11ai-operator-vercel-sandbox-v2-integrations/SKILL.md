---
name: 11ai-operator-vercel-sandbox-v2-integrations
description: "Connect Vercel Sandbox to application runtimes, identity, storage, external events, observability, CI, and deployment while preserving isolation, durability, credential, and action boundaries. Use when Vercel Sandbox crosses another system or must operate consistently through production."
---
# 11ai Vercel Sandbox v2 integrations

Name both systems, trust boundary, state and events crossing it, credentials, idempotency, limits, and production owner before editing.

Version baseline: Target @vercel/sandbox 2.9 within major 2 and the current Sandbox CLI. Use persistent-by-default sandboxes, current Node.js and Python images, custom VCR images, multi-user isolation, and v2 lifecycle semantics.

## Inspect seams

```bash
node -p "require('@vercel/sandbox/package.json').version" 2>/dev/null
rg -n 'Sandbox\.|@vercel/sandbox|VERCEL_OIDC_TOKEN|timeout|runtime|snapshot' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -140
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//'
rg -n "workflow|sandbox|route|webhook|event|telemetry|deploy|storage" . --glob '!node_modules' | head -100
```

Find existing adapters and durable stores before adding another. This standalone plugin records external contracts locally.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for identity, storage, events, observability, tests, and deployment.

Change one seam, validate inputs, keep VERCEL_OIDC_TOKEN, access tokens, uploaded private files, command environment values, logs containing data, or preview URLs server-side, enforce limits, and make retries idempotent and observable.

## Verify end to end

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test bounded success, denial, duplicate, timeout, interruption, resume or cleanup, and external failure in test scope.

## Report

State systems, scopes, trust boundary, credentials by name, persisted state, limits, remote actions, checks, cleanup, and rollback. Hand failures to `11ai-operator-vercel-sandbox-v2-troubleshooting`.
