---
name: 11ai-operator-vercel-chat-sdk-v4-setup
description: "Install and configure Vercel Chat SDK from zero with project-local packages, explicit runtime and external targets, server-only credentials, baseline policy, one minimal example, and bounded verification. Use when a project has no Vercel Chat SDK wiring or the user explicitly asks to initialize it."
---
# 11ai Vercel Chat SDK v4 setup

Resolve project root, package manager, runtime, framework, external environment, persistence, budget or rate boundaries, and intended feature before writing.

Version baseline: Target Chat SDK 4, currently the 4.35 release line. Use chat/ai for AI utilities, current adapters, Vercel Connect helpers, distributed state, webhook deduplication, and current platform capability checks.

## Gather first

Confirm exact provider, adapter, model or platform, credential source, callback or route, data retention, and production ownership. Never invent Chat SDK version, platform adapter, bot identity, webhook route, credential source, state backend, overlap strategy, recipients, or delivery environment.

## Install and configure

```bash
npm install chat@^4
npx create-chat-sdk@4 --help
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

Never print or commit bot tokens, signing secrets, app passwords, webhook secrets, connector credentials, message content, or personal data. Ask before changing budgets, provider routing, public webhooks, persistent state, production deployment, or live external actions. Report files, packages, environment names, policies, checks, costs, and rollback.
