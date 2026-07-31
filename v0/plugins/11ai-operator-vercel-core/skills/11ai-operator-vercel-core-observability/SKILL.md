---
name: 11ai-operator-vercel-core-observability
description: "Operate Vercel observability across runtime logs, metrics, traces, Web Analytics, Speed Insights, dashboards, alerts, drains, retention, and incident correlation. Use when adding telemetry, diagnosing production, configuring alerts, exporting data, or reviewing performance and reliability."
---
# 11ai Vercel Core observability

Observability must explain behavior without copying secrets, payloads, or personal data Resolve exact team, project, environment, deployment or domain, affected users, remote impact, and acceptance check before acting.

Version baseline: Use current Vercel platform and CLI documentation as of July 2026. The platform has no single major version, so confirm availability, plan limits, and rollout status for every feature.

## Inspect first

```bash
rg -n 'console\.|otel|instrumentation|analytics|speed-insights|log drain|trace|alert' . --glob '*.{ts,tsx,js,json}' | head -160
npx vercel logs --help
```

Resolve project and environment, signal owner, data classification, sampling, cardinality, retention, access, baseline, and incident window.

Confirm before changing:

- Stable deployment and request correlation.
- Structured low-cardinality fields.
- Redaction before export.
- Actionable thresholds based on baseline.

## Operate

```bash
npm test --if-present
npm run build --if-present
```

Instrument one boundary, record IDs and outcomes, sample deliberately, and route alerts to an owned response process.

Never stream or export raw payloads, tokens, personal data, or high-cardinality labels; change retention or alerting; or inspect production users without approval Require explicit approval and preview exact resources, traffic, users, costs, remote effects, and rollback.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Generate one synthetic success and failure, correlate logs, metrics and traces to deployment, verify redaction, alert routing, and retention. Report team, project, environment, resource IDs, settings, remote actions, user and cost impact, checks, observability, and rollback. Hand failures to `11ai-operator-vercel-core-troubleshooting` and seams to `11ai-operator-vercel-core-integrations`.
