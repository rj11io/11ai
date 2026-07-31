---
name: 11ai-operator-reactjs-v19-effects-refs
description: "Design and repair React effects, effect dependencies, cleanup, refs, imperative handles, subscriptions, timers, and external-system synchronization. Use when effects loop, run twice, leak, use stale values, or a component must coordinate with a non-React system."
---
# 11ai React v19 effects and refs

Effects synchronize with external systems; they are not a substitute for render calculations or events Resolve the exact route or component, execution boundary, public contract, target supported browser and server rendering environments, and acceptance check first.

Version baseline: Target React 19.2 within major 19, including Actions, Activity, useEffectEvent, cacheSignal, performance tracks, and current SSR streaming behavior. Avoid React 18 patterns where React 19 has a direct replacement.

## Inspect first

```bash
rg -n 'useEffect|useEffectEvent|useLayoutEffect|useRef|useImperativeHandle|setInterval|addEventListener' TARGET
npm test --if-present -- TARGET
```

Identify the external system, synchronization trigger, reactive dependencies, cleanup owner, and development Strict Mode behavior.

Confirm before changing:

- Whether an effect is needed at all.
- Complete dependency list.
- Symmetric setup and cleanup.
- Ref use without hiding reactive state.

## Operate

```bash
npm test --if-present -- TARGET
npm run build --if-present
```

Move user-triggered work to event handlers, derive render values directly, use `useEffectEvent` for non-reactive effect logic, and keep each effect focused on one external synchronization.

Never suppress dependency lint, use refs to conceal stale state, or disable Strict Mode to hide non-idempotent effects Require explicit approval for broader or destructive changes and preview every affected route, component, caller, or deployment.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Test repeated mount and cleanup, dependency changes, cancellation, failures, and development double invocation. Report target, files, boundaries, public behavior, accessibility and performance impact, checks, and rollback. Hand config failures to `11ai-operator-reactjs-v19-troubleshooting` and seams to `11ai-operator-reactjs-v19-integrations`.
