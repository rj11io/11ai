---
name: 11ai-operator-vercel-ai-sdk-v7-setup
description: "Install and configure Vercel AI SDK from zero with project-local packages, explicit runtime and external targets, server-only credentials, baseline policy, one minimal example, and bounded verification. Use when a project has no Vercel AI SDK wiring or the user explicitly asks to initialize it."
---
# 11ai Vercel AI SDK v7 setup

Resolve project root, package manager, runtime, framework, external environment, persistence, budget or rate boundaries, and intended feature before writing.

Version baseline: Target AI SDK 7 and matching companion packages. Use v7 agent context, approvals, WorkflowAgent durability, timeouts, sandbox support, telemetry, realtime voice, and video APIs instead of v6-era migration patterns.

## Gather first

Confirm exact provider, adapter, model or platform, credential source, callback or route, data retention, and production ownership. Never invent AI SDK version, model ID, provider, tool permissions, token budget, output schema, telemetry policy, or runtime.

## Install and configure

```bash
npm install ai@^7 zod@^4
node -e "import('ai').then(m => console.log(Object.keys(m).slice(0,12)))"
```

Use the repository package manager and preview scaffold output. Ask before commands that initialize Git, start a server, create remote resources, or send live requests.

Read [references/setup.md](references/setup.md) for the standalone walkthrough and secret-handling rules.

## Verify narrowly

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Use a bounded local or test-environment example. State any model cost, message delivery, resource creation, or external request before it happens; never use production as setup verification by default.

## Guardrails

Never print or commit provider API keys, AI Gateway keys, OIDC tokens, prompts containing private data, tool credentials, or raw telemetry payloads. Ask before changing budgets, provider routing, public webhooks, persistent state, production deployment, or live external actions. Report files, packages, environment names, policies, checks, costs, and rollback.
