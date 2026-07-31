---
name: 11ai-operator-reactjs-v19-state-context
description: "Operate React state ownership, derived state, reducers, controlled and uncontrolled components, context, keys, and preservation or reset behavior. Use when state is duplicated, stale, unexpectedly reset, shared across components, or difficult to update."
---
# 11ai React v19 state and context

State belongs at the lowest common owner that can enforce one source of truth Resolve the exact route or component, execution boundary, public contract, target supported browser and server rendering environments, and acceptance check first.

Version baseline: Target React 19.2 within major 19, including Actions, Activity, useEffectEvent, cacheSignal, performance tracks, and current SSR streaming behavior. Avoid React 18 patterns where React 19 has a direct replacement.

## Inspect first

```bash
rg -n 'useState|useReducer|useContext|createContext|key=' TARGET
npm test --if-present -- TARGET
```

Trace every state value to its owner, initialization, events, derived values, persistence, and identity in the render tree.

Confirm before changing:

- Single source of truth.
- No redundant derived state.
- Stable keys from domain identity.
- Context scope and rerender reach.

## Operate

```bash
npm test --if-present -- TARGET
npm run lint --if-present
```

Lift state only as high as necessary, consolidate complex transitions in reducers, and split contexts by change frequency and ownership.

Never switch controlledness, reset state via unstable keys, or move sensitive state to a broader context without approval Require explicit approval for broader or destructive changes and preview every affected route, component, caller, or deployment.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Test transitions, rapid events, preservation and reset, remounts, and multiple component instances independently. Report target, files, boundaries, public behavior, accessibility and performance impact, checks, and rollback. Hand config failures to `11ai-operator-reactjs-v19-troubleshooting` and seams to `11ai-operator-reactjs-v19-integrations`.
