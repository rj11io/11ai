---
name: 11ai-operator-vercel-ai-gateway-environment
description: "Inspect Vercel AI Gateway versions, local project structure, account or team context, environment variable names, configured resources, policies, observability, and safe checks without changing anything. Use before Vercel AI Gateway work, when the target is uncertain, or when the user asks what is configured."
---
# 11ai Vercel AI Gateway environment

Resolve exact project, account or team, environment, installed version, runtime, and remote target before interpreting state. Keep this pass read-only.

Version baseline: Use current generally available AI Gateway behavior as of July 2026, including AI SDK 7, multimodal and realtime models, routing, budgets, BYOK, regional inference, and data-retention controls.

## Inspect local context

```bash
npx vercel --version
npx vercel whoami 2>/dev/null
npx vercel ai-gateway --help 2>/dev/null | head -120
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
```

List environment variable names only. Inspect resource IDs, policies, and current configuration without printing credentials or content.

## Inspect safe checks

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Do not initialize, start schedules, call paid models, create keys or resources, change policies, deploy, promote, replay, cancel, or delete anything.

## Interpretation

- **Wrong scope** — distinguish personal account, team, project, preview, and production.
- **Version drift** — use local help, types, and bundled docs before examples.
- **Credential mismatch** — report names, issuer, or scope without revealing values.
- **Missing observability** — absence of evidence is not proof that an operation never ran.

## Report

State versions, project and team identifiers, environment, configured resources and policies, variable names, observability, and ambiguities. Hand missing setup to `11ai-operator-vercel-ai-gateway-setup` and failures to `11ai-operator-vercel-ai-gateway-troubleshooting`.
