---
name: 11ai-operator-vercel-eve-v0-setup
description: "Install and configure Vercel eve from zero with project-local tooling, exact account and project scope, server-only credentials, baseline policies, one minimal feature, and bounded verification. Use when a project has no Vercel eve setup or the user explicitly asks to initialize it."
---
# 11ai Vercel eve v0 setup

Resolve project root, package manager, account or team, project, environment, runtime, billing owner, permissions, and intended feature before writing or creating remote state.

Version baseline: Target the eve 0.27 preview line. Because APIs may change within major zero, inspect bundled docs and types and pin the exact minor and patch used in production.

## Gather first

Confirm exact resource names, provider or adapter, credential source, budgets, retention, deployment target, and rollback owner. Never invent eve version, agent directory, model, provider, tool authority, channel, schedule, sandbox adapter, deployment project, or approval policy.

## Install and configure

```bash
npm install eve@0.27.8
npx eve@0.27.8 init --help
npx eve --version 2>/dev/null || true
```

Preview scaffolder and CLI help. Ask before commands that initialize Git, start servers, make paid calls, create remote resources, or link and deploy projects.

Read [references/setup.md](references/setup.md) for the standalone setup path and credential boundaries.

## Verify narrowly

```bash
npm run typecheck --if-present
npm test --if-present
npx eve eval --help 2>/dev/null || true
```

Use local or test scope. State cost, permissions, and remote effects before any live check; verify one bounded path and its failure behavior.

## Guardrails

Never print or commit model credentials, channel tokens, connector tokens, tool secrets, session content, approval payloads, or external records. Ask before provider routing, key creation or rotation, budgets, schedules, public channels, remote resources, deployment, or production policy. Report versions, files, scopes, resources, checks, costs, and rollback.
