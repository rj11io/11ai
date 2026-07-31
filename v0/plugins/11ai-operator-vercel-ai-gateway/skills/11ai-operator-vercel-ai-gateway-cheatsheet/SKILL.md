---
name: 11ai-operator-vercel-ai-gateway-cheatsheet
description: "Look up Vercel AI Gateway commands, configuration, policy, and focused operations across models and capabilities, routing and fallbacks, authentication and byok, budgets and usage, observability and security. Use when the user wants a concise reference instead of a guided workflow."
---
# 11ai Vercel AI Gateway cheatsheet

Use installed package and CLI versions plus the official documentation for that release. This plugin is standalone and routes multi-step work only to sibling skills.

Version baseline: Use current generally available AI Gateway behavior as of July 2026, including AI SDK 7, multimodal and realtime models, routing, budgets, BYOK, regional inference, and data-retention controls.

## Inspect

```bash
npx vercel --version
npx vercel whoami 2>/dev/null
npx vercel ai-gateway --help 2>/dev/null | head -120
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
```

Confirm project, team or account, environment, runtime, configured resources, and local version. Never guess Vercel team and project, environment, model ID, provider order, fallback, credential mode, budget, data-retention policy, or billing owner.

## Common commands

```bash
npm install ai
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Inspect help before running a command whose flags may change. Installation, model calls, resource creation, and deployment require explicit task scope.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-vercel-ai-gateway-models-capabilities` | Model discovery, IDs, modalities, context, pricing, and compatibility |
| `11ai-operator-vercel-ai-gateway-routing-fallbacks` | Provider order, filtering, timeouts, automatic caching, and model fallback |
| `11ai-operator-vercel-ai-gateway-authentication-byok` | OIDC, API keys, team credentials, request-scoped BYOK, rotation, and fallback |
| `11ai-operator-vercel-ai-gateway-budgets-usage` | Key budgets, quotas, refresh periods, credits, attribution, and cost controls |
| `11ai-operator-vercel-ai-gateway-observability-security` | Usage, latency, tokens, reporting, provider policy, ZDR, and redaction |

## Answer format

Lead with the smallest command or SDK pattern. State environment, account or project, external action, cost or access impact, verification, and approval gate.
