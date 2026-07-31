---
name: 11ai-operator-vercel-workflows-v4-setup
description: "Install and configure Vercel Workflows from zero with project-local packages, exact account and environment scope, server-only authentication, baseline limits and persistence, one minimal operation, and bounded verification. Use when a project has no Vercel Workflows setup or the user explicitly asks to initialize it."
---
# 11ai Vercel Workflows v4 setup

Resolve project root, package manager, team and project, environment, runtime, auth mode, billing owner, limits, retention, and intended operation before writing or creating remote state.

Version baseline: Target workflow 4.6 stable. Do not copy Workflow 5 beta APIs; use v4 directives, event-sourced runs, end-to-end encryption, custom serialization, framework plugins, and current observability.

## Gather first

Confirm exact resource or run name, region or runtime, network and file permissions, retry and timeout policy, and rollback. Never invent Workflow SDK version, runtime, workflow and step IDs, retry and timeout policy, event schema, deployment version, persistence, or cancellation semantics.

## Install and configure

```bash
npm install workflow@^4.6.0
node -e "import('workflow').then(m => console.log(Object.keys(m).slice(0,20)))"
npx workflow@4 --help 2>/dev/null || true
```

Preview help and generated files. Ask before linking projects, pulling credentials, creating resources, starting runs, or deploying.

Read [references/setup.md](references/setup.md) for the standalone walkthrough and security boundaries.

## Verify narrowly

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Use local or test scope with one bounded operation. State duration, compute or storage use, external side effects, and cleanup before execution.

## Guardrails

Never print or commit workflow payloads, event tokens, connector credentials, approval data, logs containing personal data, or production environment values. Ask before remote creation, execution, replay, cancellation, exposure, snapshots, policy changes, or deployment. Report versions, scopes, limits, resources, checks, usage, cleanup, and rollback.
