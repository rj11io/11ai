---
name: 11ai-operator-reactjs-v19-setup
description: "Install and configure React from zero with project-local dependencies, explicit rendering and runtime boundaries, source structure, baseline checks, and one verified feature. Use when a project has no React setup or the user explicitly asks to initialize it."
---
# 11ai React v19 setup

Resolve project root, package manager, target supported browser and server rendering environments, renderer or router mode, source layout, styling, testing, and deployment expectations before writing.

Version baseline: Target React 19.2 within major 19, including Actions, Activity, useEffectEvent, cacheSignal, performance tracks, and current SSR streaming behavior. Avoid React 18 patterns where React 19 has a direct replacement.

## Gather first

Confirm compatibility, public routes or component API, server and client boundaries, generated ownership, and existing build conventions. Never invent React version, renderer, server-component support, state ownership, styling, or test environment.

## Install and configure

```bash
npm install react@^19.2.0 react-dom@^19.2.0
npm install --save-dev @types/react@^19 @types/react-dom@^19 2>/dev/null || true
```

Use the repository package manager and preview scaffolder output before accepting it. Do not replace an existing project or initialize Git implicitly.

Read [references/setup.md](references/setup.md) for the standalone walkthrough and decisions.

## Verify

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Exercise one narrow path in development and production mode, inspect output, and test a failure state. Do not weaken lint, type, or hydration checks.

## Guardrails

Never print or commit tokens, session data, private server values, serialized personal data, or full production props. Ask before replacing entry points, changing rendering mode, upgrading dependencies, deleting build output, or creating a deployment. Report files, versions, boundaries, checks, and rollback.
