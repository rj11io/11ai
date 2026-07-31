---
name: 11ai-operator-vercel-ai-gateway-observability-security
description: "Operate AI Gateway observability and security including request volume, tokens, TTFT, cost, reporting APIs, provider allowlists, zero-data-retention routing, no-training policy, and redaction. Use when investigating reliability or spend, exporting reports, enforcing provider policy, or reviewing prompt privacy."
---
# 11ai Vercel AI Gateway observability and security

Observability needs enough metadata to explain cost and routing without copying sensitive content Resolve the exact project, environment, remote target, permission and cost boundary, and acceptance check before acting.

Version baseline: Use current generally available AI Gateway behavior as of July 2026, including AI SDK 7, multimodal and realtime models, routing, budgets, BYOK, regional inference, and data-retention controls.

## Inspect first

```bash
rg -n 'telemetry|requestId|usage|token|TTFT|report|zero.data|provider' TARGET
npx vercel ai-gateway --help 2>/dev/null | head -100
```

Resolve team and project scope, retention, content logging, reporting dimensions, approved providers, and data policy.

Confirm before changing:

- Request IDs and actual provider metadata.
- Usage, latency, tokens, cached tokens, and cost.
- Low-cardinality attribution.
- Provider allowlist and retention guarantees.

## Operate

```bash
npm test --if-present -- TARGET
npm run build --if-present
```

Log metadata and redacted errors, enforce approved providers centrally, and aggregate reports before exposing user-level detail.

Never export prompts or outputs, weaken provider restrictions, disable ZDR policy, or widen retention without approval Require explicit approval and preview targets, permissions, counts, cost, remote effects, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Trace one synthetic request from application ID to gateway metrics, actual provider, usage, cost, and redacted logs. Report scope, target IDs, files, remote actions, permissions, cost, checks, observability, and rollback. Hand configuration failures to `11ai-operator-vercel-ai-gateway-troubleshooting` and seams to `11ai-operator-vercel-ai-gateway-integrations`.
