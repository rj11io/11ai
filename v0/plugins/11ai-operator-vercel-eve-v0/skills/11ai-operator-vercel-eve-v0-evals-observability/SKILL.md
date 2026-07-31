---
name: 11ai-operator-vercel-eve-v0-evals-observability
description: "Author and operate eve eval suites, CI gates, Agent Runs, traces, token and tool accounting, redaction, retention, and regression review. Use when testing an agent, gating deployment, inspecting a failed run, or measuring prompt and tool changes."
---
# 11ai Vercel eve v0 evals and observability

Agent quality must be measured against stable cases without leaking the content being evaluated Resolve the exact project, environment, remote target, permission and cost boundary, and acceptance check before acting.

Version baseline: Target the eve 0.27 preview line. Because APIs may change within major zero, inspect bundled docs and types and pin the exact minor and patch used in production.

## Inspect first

```bash
find . -type f -path '*eval*' 2>/dev/null | sort | head -100
npx eve eval --help 2>/dev/null || true
rg -n 'instrumentation|telemetry|trace|eval' agent .github 2>/dev/null
```

Identify suite version, fixtures, scorer, thresholds, model, run environment, trace destination, retention, and redaction.

Confirm before changing:

- Representative fixed and adversarial cases.
- Deterministic tools and bounded cost.
- Threshold changes reviewed separately.
- Sensitive trace and prompt handling.

## Operate

```bash
npx eve eval --help
npm test --if-present
```

Run a bounded suite, compare to a recorded baseline, inspect failures individually, and make CI gates explicit.

Never lower thresholds, update expected outputs wholesale, export raw traces, or run a costly full suite without approval Require explicit approval and preview targets, permissions, counts, cost, remote effects, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npx eve eval --help 2>/dev/null || true
```

Repeat failed cases, compare model and prompt versions, account tokens and tools, and verify redaction and retention. Report scope, target IDs, files, remote actions, permissions, cost, checks, observability, and rollback. Hand configuration failures to `11ai-operator-vercel-eve-v0-troubleshooting` and seams to `11ai-operator-vercel-eve-v0-integrations`.
