---
name: 11ai-operator-vercel-core-fluid-compute
description: "Operate Vercel Functions and Fluid Compute across runtimes, regions, concurrency, duration, memory, streaming, background work, connection reuse, and resource limits. Use when configuring compute, fixing timeouts or cold starts, scaling functions, or controlling runtime cost and behavior."
---
# 11ai Vercel Core Fluid Compute

Compute settings change latency, concurrency, isolation, cost, and downstream pressure Resolve exact team, project, environment, deployment or domain, affected users, remote impact, and acceptance check before acting.

Version baseline: Use current Vercel platform and CLI documentation as of July 2026. The platform has no single major version, so confirm availability, plan limits, and rollout status for every feature.

## Inspect first

```bash
rg -n 'runtime|regions|maxDuration|memory|fluid|waitUntil|after\(|preferredRegion' . --glob '*.{json,js,ts,tsx}' | head -160
npx vercel inspect --help
```

Resolve route or function, runtime, region, duration, memory, concurrency, external connections, streaming, traffic, and billing owner.

Confirm before changing:

- Runtime API compatibility.
- Regional data and service affinity.
- Bounded duration and downstream concurrency.
- Connection and background-work lifecycle.

## Operate

```bash
npm test --if-present
npm run build --if-present
```

Measure before tuning, reuse safe connections, bound fan-out, and move durable work out of request paths when required.

Never raise duration, memory, concurrency, or regional scope; switch runtime; or enable production compute features without approval and cost estimate Require explicit approval and preview exact resources, traffic, users, costs, remote effects, and rollback.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Load-test a representative bounded path, failure and timeout, connection reuse, stream completion, regional behavior, and usage metrics. Report team, project, environment, resource IDs, settings, remote actions, user and cost impact, checks, observability, and rollback. Hand failures to `11ai-operator-vercel-core-troubleshooting` and seams to `11ai-operator-vercel-core-integrations`.
