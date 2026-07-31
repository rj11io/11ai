# 11ai Vercel AI Gateway operator

Ten standalone skills for unified model access, model discovery, provider routing, fallbacks, authentication, BYOK, budgets, usage, observability, and security policy, with read-first checks around account scope, permissions, credentials, costs, remote actions, and production state.

Version baseline: Current generally available hosted product as of July 2026; no product version number.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-vercel-ai-gateway-cheatsheet`](./skills/11ai-operator-vercel-ai-gateway-cheatsheet/SKILL.md) | Quick commands and policy reminders |
| [`11ai-operator-vercel-ai-gateway-environment`](./skills/11ai-operator-vercel-ai-gateway-environment/SKILL.md) | Read-only local and remote context inspection |
| [`11ai-operator-vercel-ai-gateway-setup`](./skills/11ai-operator-vercel-ai-gateway-setup/SKILL.md) | Project-local setup with bounded remote effects |
| [`11ai-operator-vercel-ai-gateway-integrations`](./skills/11ai-operator-vercel-ai-gateway-integrations/SKILL.md) | Identity, runtime, persistence, observability, and deployment seams |
| [`11ai-operator-vercel-ai-gateway-troubleshooting`](./skills/11ai-operator-vercel-ai-gateway-troubleshooting/SKILL.md) | Evidence-led diagnosis with permission and cost controls |
| [`11ai-operator-vercel-ai-gateway-models-capabilities`](./skills/11ai-operator-vercel-ai-gateway-models-capabilities/SKILL.md) | Model discovery, IDs, modalities, context, pricing, and compatibility |
| [`11ai-operator-vercel-ai-gateway-routing-fallbacks`](./skills/11ai-operator-vercel-ai-gateway-routing-fallbacks/SKILL.md) | Provider order, filtering, timeouts, automatic caching, and model fallback |
| [`11ai-operator-vercel-ai-gateway-authentication-byok`](./skills/11ai-operator-vercel-ai-gateway-authentication-byok/SKILL.md) | OIDC, API keys, team credentials, request-scoped BYOK, rotation, and fallback |
| [`11ai-operator-vercel-ai-gateway-budgets-usage`](./skills/11ai-operator-vercel-ai-gateway-budgets-usage/SKILL.md) | Key budgets, quotas, refresh periods, credits, attribution, and cost controls |
| [`11ai-operator-vercel-ai-gateway-observability-security`](./skills/11ai-operator-vercel-ai-gateway-observability-security/SKILL.md) | Usage, latency, tokens, reporting, provider policy, ZDR, and redaction |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and does not require or reference another 11ai plugin.

## Safety contract

Inspect versions, team and project scope, environment, resources, permissions, and policies before changing anything.

Never guess Vercel team and project, environment, model ID, provider order, fallback, credential mode, budget, data-retention policy, or billing owner. Read exact identifiers from the repository, CLI, dashboard, or user.

Ask before creating, rotating, or revoking keys; changing provider routing or fallbacks; adding BYOK credentials; changing budgets or quotas; making paid requests; or deploying. Preview targets, counts, permissions, costs, recipients, and rollback.

Never print or commit AI_GATEWAY_API_KEY, provider BYOK credentials, Vercel access and OIDC tokens, prompts, outputs, user tags, or reporting exports. Redact user and external-system data. Bound concurrency, retries, tool calls, runs, and bulk operations; verify in test scope before production.
