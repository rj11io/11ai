---
name: 11ai-operator-vercel-ai-gateway-budgets-usage
description: "Inspect and manage AI Gateway key budgets, refresh periods, user quotas, credits, request attribution, usage exports, and cost guardrails. Use when setting spend caps, investigating usage, attributing cost, or preventing runaway agents."
---
# 11ai Vercel AI Gateway budgets and usage

A budget change can either prevent runaway spend or immediately stop production traffic Resolve the exact project, environment, remote target, permission and cost boundary, and acceptance check before acting.

Version baseline: Use current generally available AI Gateway behavior as of July 2026, including AI SDK 7, multimodal and realtime models, routing, budgets, BYOK, regional inference, and data-retention controls.

## Inspect first

```bash
npx vercel ai-gateway api-keys --help 2>/dev/null || true
rg -n 'budget|quota|user|customer|feature|AI_GATEWAY' TARGET
```

Resolve billing team, key, environment, current spend, reset period in UTC, traffic owner, and alerting before changing limits.

Confirm before changing:

- Exact key and environment.
- Budget amount and reset period.
- Per-user or workload attribution.
- Expected rejection behavior at cap.

## Operate

```bash
npx vercel ai-gateway api-keys create --help 2>/dev/null || true
npm test --if-present -- TARGET
```

Tag requests with low-cardinality identifiers, set caps from measured use and headroom, and handle budget rejection explicitly.

Never create keys, raise or remove budgets, change reset periods, top up credits, or export user-level usage without approval Require explicit approval and preview targets, permissions, counts, cost, remote effects, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Confirm displayed budget, reset time, test rejection in non-production, attribution, alerts, and rollback to prior limit. Report scope, target IDs, files, remote actions, permissions, cost, checks, observability, and rollback. Hand configuration failures to `11ai-operator-vercel-ai-gateway-troubleshooting` and seams to `11ai-operator-vercel-ai-gateway-integrations`.
