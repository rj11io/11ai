---
name: 11ai-operator-reactjs-v19-performance-testing
description: "Measure and improve React rendering performance and test component behavior using Profiler evidence, memoization, Suspense boundaries, interaction tests, and bundle inspection. Use when renders are slow, memoization is proposed, Suspense behavior is wrong, or component tests need reliable coverage."
---
# 11ai React v19 performance and testing

Optimize measured user-visible work and test behavior rather than implementation trivia Resolve the exact route or component, execution boundary, public contract, target supported browser and server rendering environments, and acceptance check first.

Version baseline: Target React 19.2 within major 19, including Actions, Activity, useEffectEvent, cacheSignal, performance tracks, and current SSR streaming behavior. Avoid React 18 patterns where React 19 has a direct replacement.

## Inspect first

```bash
rg -n 'memo\(|useMemo|useCallback|Profiler|Suspense|Activity|cacheSignal|lazy\(' TARGET
npm test --if-present -- TARGET
```

Capture the interaction, React 19.2 performance track, commit profile, rerender cause, hidden `Activity` behavior, bundle contribution, and test environment before changing code.

Confirm before changing:

- Actual expensive render or calculation.
- Prop identity and state placement.
- Suspense fallback and recovery.
- User-observable assertions.

## Operate

```bash
npm test --if-present -- TARGET
npm run build --if-present
```

Fix state placement and unnecessary work before adding memoization. Test through roles, labels, and interactions with deterministic async control.

Never add deep comparison, blanket memoization, implementation-detail tests, or broad snapshot updates without evidence Require explicit approval for broader or destructive changes and preview every affected route, component, caller, or deployment.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Repeat the same profile and interaction, compare production bundle output, and prove tests fail when behavior is broken. Report target, files, boundaries, public behavior, accessibility and performance impact, checks, and rollback. Hand config failures to `11ai-operator-reactjs-v19-troubleshooting` and seams to `11ai-operator-reactjs-v19-integrations`.
