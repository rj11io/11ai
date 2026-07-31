---
name: 11ai-operator-reactjs-v19-components-composition
description: "Create and refactor React function components, JSX, props, children, composition, context boundaries, and reusable component APIs. Use when building components, splitting or combining UI, repairing prop contracts, or reviewing composition."
---
# 11ai React v19 components and composition

A component API is a public contract and render must stay pure Resolve the exact route or component, execution boundary, public contract, target supported browser and server rendering environments, and acceptance check first.

Version baseline: Target React 19.2 within major 19, including Actions, Activity, useEffectEvent, cacheSignal, performance tracks, and current SSR streaming behavior. Avoid React 18 patterns where React 19 has a direct replacement.

## Inspect first

```bash
rg -n 'function [A-Z]|const [A-Z].*=>|export default|children|createContext' TARGET
npm test --if-present -- TARGET
```

Map callers, prop ownership, render environment, semantic output, and state placement before changing the component tree.

Confirm before changing:

- Pure render logic and stable output.
- Minimal explicit prop contract.
- Native semantics in returned markup.
- Server and client compatibility.

## Operate

```bash
npm test --if-present -- TARGET
npm run build --if-present
```

Compose focused components around stable responsibilities and keep side effects out of render. Prefer children and explicit props over hidden global coupling.

Never rename props, change keys, move a client boundary, or replace semantic elements without caller and accessibility review Require explicit approval for broader or destructive changes and preview every affected route, component, caller, or deployment.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Render representative variants, empty and error states, and verify callers, semantics, and production output. Report target, files, boundaries, public behavior, accessibility and performance impact, checks, and rollback. Hand config failures to `11ai-operator-reactjs-v19-troubleshooting` and seams to `11ai-operator-reactjs-v19-integrations`.
