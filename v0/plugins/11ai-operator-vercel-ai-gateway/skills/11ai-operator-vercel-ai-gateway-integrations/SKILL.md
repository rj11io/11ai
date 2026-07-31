---
name: 11ai-operator-vercel-ai-gateway-integrations
description: "Connect Vercel AI Gateway to application runtimes, identity, external services, persistence, observability, CI, and deployment while preserving account, credential, data, and action boundaries. Use when Vercel AI Gateway must cross another system or operate consistently through production."
---
# 11ai Vercel AI Gateway integrations

Name both systems, project and team scope, trust boundary, data and actions, credential source, persistence, and production owner before editing.

Version baseline: Use current generally available AI Gateway behavior as of July 2026, including AI SDK 7, multimodal and realtime models, routing, budgets, BYOK, regional inference, and data-retention controls.

## Inspect seams

```bash
npx vercel --version
npx vercel whoami 2>/dev/null
npx vercel ai-gateway --help 2>/dev/null | head -120
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
rg -n "route|webhook|workflow|sandbox|telemetry|deploy|provider|connector" . --glob '!node_modules' | head -100
```

Find existing connections before adding another. This plugin remains standalone and records external contracts locally.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for standalone identity, runtime, persistence, observability, test, and deployment patterns.

Change one seam, enforce least privilege, validate external input, keep AI_GATEWAY_API_KEY, provider BYOK credentials, Vercel access and OIDC tokens, prompts, outputs, user tags, or reporting exports server-side, and make every consequential action auditable.

## Verify end to end

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Use test scope for success, denial, duplicate, timeout, and recovery. Do not use production or real recipients as an integration test by default.

## Report

State systems, scopes, permissions, credentials by name, retained data, remote actions, budgets, observability, checks, and rollback. Hand failures to `11ai-operator-vercel-ai-gateway-troubleshooting`.
