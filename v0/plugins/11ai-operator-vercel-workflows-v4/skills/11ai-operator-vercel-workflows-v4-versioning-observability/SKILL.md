---
name: 11ai-operator-vercel-workflows-v4-versioning-observability
description: "Operate workflow versioning and observability including atomic deployment versions, run history, step timelines, logs, traces, usage, schema migration, rollback, and incident review. Use when deploying workflow changes, inspecting runs, correlating failures, or rolling back without corrupting in-flight work."
---
# 11ai Vercel Workflows v4 versioning and observability

In-flight workflows remain tied to their original code version while new runs use new code Resolve the exact project, environment, resource or run, state boundary, permissions, limits, and acceptance check before acting.

Version baseline: Target workflow 4.6 stable. Do not copy Workflow 5 beta APIs; use v4 directives, event-sourced runs, end-to-end encryption, custom serialization, framework plugins, and current observability.

## Inspect first

```bash
rg -n 'workflow|version|event|encrypt|instrument|trace|log|runId|stepId|deploy' TARGET .github 2>/dev/null
npm run build --if-present
```

Resolve source commit, deployed version, run version, append-only event history, encrypted payload access, input schema, step timeline, run and step log filters, retention, redaction, and rollback behavior.

Confirm before changing:

- Run-to-code version correlation.
- In-flight compatibility with external schemas.
- Step-level status and attempt metrics.
- Redacted logs and retained payload policy.

## Operate

```bash
npm test --if-present
npm run build --if-present
```

Version contracts explicitly, deploy through reviewed artifacts, and compare new test runs before shifting triggers.

Never promote, roll back, cancel, replay, migrate, or delete run history without approval and an in-flight inventory Require explicit approval and preview exact resources, commands or steps, counts, limits, cost, cleanup, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Inspect representative old and new runs, version pinning, trace correlation, schema compatibility, rollback, and retention. Report scope, IDs, state transitions, files, remote actions, usage, checks, cleanup, and rollback. Hand configuration failures to `11ai-operator-vercel-workflows-v4-troubleshooting` and seams to `11ai-operator-vercel-workflows-v4-integrations`.
