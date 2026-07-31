---
name: 11ai-operator-vercel-workflows-v4-environment
description: "Inspect Vercel Workflows package and CLI versions, project and account context, configuration, environment variable names, resources or runs, persistence, limits, and safe checks without changing anything. Use before Vercel Workflows work, when the target is uncertain, or when the user asks what is configured."
---
# 11ai Vercel Workflows v4 environment

Resolve exact project, team, environment, installed version, runtime, and resource or run scope. Keep this pass read-only.

Version baseline: Target workflow 4.6 stable. Do not copy Workflow 5 beta APIs; use v4 directives, event-sourced runs, end-to-end encryption, custom serialization, framework plugins, and current observability.

## Inspect local context

```bash
node -p "require('workflow/package.json').version" 2>/dev/null
rg -n 'use workflow|use step|sleep|workflow|retry|hook|event' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -160
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//'
```

List environment variable names only. Require stable `workflow` major 4 and reject beta major 5 examples; record framework plugins and companion packages that must remain API-compatible.

## Inspect safe checks

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Do not create, start, resume, replay, cancel, stop, snapshot, expose, delete, deploy, or modify remote resources during inspection.

## Interpretation

- **Wrong scope** — distinguish local, preview, production, team, project, resource, and run.
- **Version drift** — use local types and help before examples.
- **Credential mismatch** — confirm mode and variable names without values.
- **Missing persistence or limits** — report the risk; do not invent a backend or quota.

## Report

State versions, scope, resources or runs, runtime, auth mode, persistence, limits, observability, and ambiguities. Hand missing setup to `11ai-operator-vercel-workflows-v4-setup` and failures to `11ai-operator-vercel-workflows-v4-troubleshooting`.
