---
name: 11ai-operator-vercel-core-troubleshooting
description: "Diagnose Vercel Core Platform failures involving account and project scope, builds, deployments, environments, domains, CDN caching, functions, security policy, observability, and CI/CD without masking the original error. Use when a build or deployment fails, traffic is wrong, production differs from preview, or platform behavior is unexpected."
---
# 11ai Vercel Core troubleshooting

Separate facts from theories. Preserve exact error, status, deployment and request IDs, timestamp, team, project, environment, domain, region, source commit, and CLI version.

Version baseline: Use current Vercel platform and CLI documentation as of July 2026. The platform has no single major version, so confirm availability, plan limits, and rollout status for every feature.

## Evidence collection

```bash
npx vercel --version
npx vercel whoami 2>/dev/null
npx vercel project ls 2>/dev/null | head -100
npx vercel env ls 2>/dev/null | head -100
npx vercel ls 2>/dev/null | head -100
npx vercel domains ls 2>/dev/null | head -100
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Redact tokens, environment values, request bodies, personal data, private logs, and signed URLs. Do not redeploy or promote to reproduce.

## Classify the failure

- **Scope failure** — confirm account, team, linked project, environment, and source commit.
- **Build failure** — isolate first diagnostic and compare local and remote configuration.
- **Traffic failure** — inspect domain, alias, DNS, TLS, cache, redirect, firewall, and production target.
- **Compute failure** — inspect runtime, region, duration, memory, concurrency, and downstreams.
- **Observability gap** — correlate deployment, request, logs, metrics, traces, and retention.

## Remediation discipline

State confidence and missing evidence. Make one bounded change, request approval for remote resources, variables, traffic, security, compute, cache, or deployment state, then rerun the original check. Never redeploy blindly, clear global caches, weaken security, or promote a speculative fix.

## Report

Report boundary, evidence, cause or uncertainty, fix, affected users and resources, cost and security impact, rollback, and verification. If account context is unhealthy, hand off to `11ai-operator-vercel-core-environment`.
