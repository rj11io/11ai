---
name: 11ai-operator-vercel-ai-gateway-setup
description: "Install and configure Vercel AI Gateway from zero with project-local tooling, exact account and project scope, server-only credentials, baseline policies, one minimal feature, and bounded verification. Use when a project has no Vercel AI Gateway setup or the user explicitly asks to initialize it."
---
# 11ai Vercel AI Gateway setup

Resolve project root, package manager, account or team, project, environment, runtime, billing owner, permissions, and intended feature before writing or creating remote state.

Version baseline: Use current generally available AI Gateway behavior as of July 2026, including AI SDK 7, multimodal and realtime models, routing, budgets, BYOK, regional inference, and data-retention controls.

## Gather first

Confirm exact resource names, provider or adapter, credential source, budgets, retention, deployment target, and rollback owner. Never invent Vercel team and project, environment, model ID, provider order, fallback, credential mode, budget, data-retention policy, or billing owner.

## Install and configure

```bash
npm install ai
npx vercel --version
npx vercel ai-gateway --help 2>/dev/null || true
```

Preview scaffolder and CLI help. Ask before commands that initialize Git, start servers, make paid calls, create remote resources, or link and deploy projects.

Read [references/setup.md](references/setup.md) for the standalone setup path and credential boundaries.

## Verify narrowly

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Use local or test scope. State cost, permissions, and remote effects before any live check; verify one bounded path and its failure behavior.

## Guardrails

Never print or commit AI_GATEWAY_API_KEY, provider BYOK credentials, Vercel access and OIDC tokens, prompts, outputs, user tags, or reporting exports. Ask before provider routing, key creation or rotation, budgets, schedules, public channels, remote resources, deployment, or production policy. Report versions, files, scopes, resources, checks, costs, and rollback.
