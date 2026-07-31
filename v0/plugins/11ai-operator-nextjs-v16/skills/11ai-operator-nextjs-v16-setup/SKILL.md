---
name: 11ai-operator-nextjs-v16-setup
description: "Install and configure Next.js from zero with project-local dependencies, explicit rendering and runtime boundaries, source structure, baseline checks, and one verified feature. Use when a project has no Next.js setup or the user explicitly asks to initialize it."
---
# 11ai Next.js v16 setup

Resolve project root, package manager, target configured Node.js, Edge, build-time, and browser runtimes, renderer or router mode, source layout, styling, testing, and deployment expectations before writing.

Version baseline: Target the current Next.js 16 release with App Router, React 19.2, Turbopack by default, Cache Components and use cache, proxy.ts, async request APIs, and Node.js 20.9 or newer.

## Gather first

Confirm compatibility, public routes or component API, server and client boundaries, generated ownership, and existing build conventions. Never invent Next.js version, App or Pages Router, runtime, cache policy, rendering mode, deployment target, or environment ownership.

## Install and configure

```bash
npm install next@^16 react@^19.2 react-dom@^19.2
npx next info
```

Use the repository package manager and preview scaffolder output before accepting it. Do not replace an existing project or initialize Git implicitly.

Read [references/setup.md](references/setup.md) for the standalone walkthrough and decisions.

## Verify

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

Exercise one narrow path in development and production mode, inspect output, and test a failure state. Do not weaken lint, type, or hydration checks.

## Guardrails

Never print or commit server environment values, cookies, tokens, request bodies, signed URLs, or serialized private data. Ask before replacing entry points, changing rendering mode, upgrading dependencies, deleting build output, or creating a deployment. Report files, versions, boundaries, checks, and rollback.
