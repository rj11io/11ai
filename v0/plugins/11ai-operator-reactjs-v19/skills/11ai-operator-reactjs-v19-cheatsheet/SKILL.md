---
name: 11ai-operator-reactjs-v19-cheatsheet
description: "Look up React commands, project structure, rendering patterns, and focused operations across components and composition, state and context, effects and refs, forms and actions, performance and testing. Use when the user wants a concise reference instead of a guided workflow."
---
# 11ai React v19 cheatsheet

Use the installed versions, active framework mode, and project conventions as the source of truth. This standalone lookup hands multi-step work only to sibling skills.

Version baseline: Target React 19.2 within major 19, including Actions, Activity, useEffectEvent, cacheSignal, performance tracks, and current SSR streaming behavior. Avoid React 18 patterns where React 19 has a direct replacement.

## Inspect

```bash
node -p "require('react/package.json').version" 2>/dev/null
node -p "require('react-dom/package.json').version" 2>/dev/null
rg --files -g '*.{jsx,tsx,js,ts}' | head -100
```

Confirm versions, entry points, rendering mode, source ownership, and scripts. Never guess React version, renderer, server-component support, state ownership, styling, or test environment.

## Common commands

```bash
npm install react@^19.2.0 react-dom@^19.2.0
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Installation is setup, not lookup. Preserve package manager and lockfile; inspect scripts before commands that build or rewrite.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-reactjs-v19-components-composition` | Component APIs, JSX, children, context boundaries, and reuse |
| `11ai-operator-reactjs-v19-state-context` | State ownership, reducers, controlled inputs, context, and identity |
| `11ai-operator-reactjs-v19-effects-refs` | External synchronization, cleanup, dependencies, refs, and imperative APIs |
| `11ai-operator-reactjs-v19-forms-actions` | Controlled fields, native forms, validation, async actions, and optimistic UI |
| `11ai-operator-reactjs-v19-performance-testing` | Profiler evidence, memoization, Suspense, test behavior, and bundle impact |

## Answer format

Lead with the smallest command or React component tree and client bundle pattern, then name target, boundary, verification, and one risk. Stop before unrequested dependencies, codemods, public behavior changes, or deployments.
