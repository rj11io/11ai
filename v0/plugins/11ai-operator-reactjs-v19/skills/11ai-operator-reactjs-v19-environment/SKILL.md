---
name: 11ai-operator-reactjs-v19-environment
description: "Inspect the installed React versions, package manager, renderer or router mode, source tree, build configuration, scripts, and target environments without changing anything. Use before React work, when conventions are unknown, or when the user asks what is configured."
---
# 11ai React v19 environment

Resolve the project, installed versions, entry points, renderer or router mode, source and output ownership, and target supported browser and server rendering environments. Keep this pass read-only.

Version baseline: Target React 19.2 within major 19, including Actions, Activity, useEffectEvent, cacheSignal, performance tracks, and current SSR streaming behavior. Avoid React 18 patterns where React 19 has a direct replacement.

## Inspect the project

```bash
node -p "require('react/package.json').version" 2>/dev/null
node -p "require('react-dom/package.json').version" 2>/dev/null
rg --files -g '*.{jsx,tsx,js,ts}' | head -100
```

List environment variable names only. Both packages must report major 19, with 19.2 expected for the documented Activity and effect APIs; stop before applying these patterns to another major or an older minor.

## Inspect checks

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Inspect script definitions first. Do not install, format, codemod, build, deploy, update snapshots, or clear caches during this read-only pass.

## Interpretation

- **Version mismatch** — read the local dependency graph before applying current examples.
- **Boundary mismatch** — confirm which code executes on client, server, build, or test runtime.
- **Generated mismatch** — trace output to source rather than patching it.
- **Target mismatch** — React version, renderer, server-component support, state ownership, styling, or test environment must be explicit.

## Report

State versions, package manager, rendering mode, source and output roots, target supported browser and server rendering environments, scripts, and ambiguity. Hand absent configuration to `11ai-operator-reactjs-v19-setup` and failures to `11ai-operator-reactjs-v19-troubleshooting`.
