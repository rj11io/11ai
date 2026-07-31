---
name: 11ai-operator-vercel-workflows-v4-sleep-events
description: "Operate durable workflow sleeps, timers, hooks, events, correlation identifiers, external callbacks, races, timeout paths, and resume validation. Use when pausing without compute, waiting for an external event, resuming from callbacks, or handling timeout races."
---
# 11ai Vercel Workflows v4 sleep and events

A durable wait exposes a long-lived external input boundary that must bind to the correct run Resolve the exact project, environment, resource or run, state boundary, permissions, limits, and acceptance check before acting.

Version baseline: Target workflow 4.6 stable. Do not copy Workflow 5 beta APIs; use v4 directives, event-sourced runs, end-to-end encryption, custom serialization, framework plugins, and current observability.

## Inspect first

```bash
rg -n 'sleep|event|hook|wait|resume|correlation|timeout' TARGET
npm test --if-present -- TARGET
```

Resolve run and event identity, event schema, verifier, correlation, expiry, duplicate behavior, race winner, and retained payload.

Confirm before changing:

- Authenticated event source.
- Opaque unguessable correlation.
- Explicit timeout and late-event policy.
- Deduplication and ordering.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Persist correlation before waiting, validate events, handle timeout as a first-class branch, and make late events harmless.

Never emit or replay production events, shorten or extend live waits, or resume a run from an unverified callback without approval Require explicit approval and preview exact resources, commands or steps, counts, limits, cost, cleanup, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test valid, forged, duplicate, early, late, out-of-order, timeout, cancellation, and deployment-across-wait cases. Report scope, IDs, state transitions, files, remote actions, usage, checks, cleanup, and rollback. Hand configuration failures to `11ai-operator-vercel-workflows-v4-troubleshooting` and seams to `11ai-operator-vercel-workflows-v4-integrations`.
