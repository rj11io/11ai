---
name: 11ai-operator-typescript-v7-narrowing-generics
description: "Apply TypeScript control-flow narrowing, type predicates, assertion functions, generics, constraints, conditional types, mapped types, and inference without over-generalizing APIs. Use when a union is hard to use, an API needs reusable type relationships, or inference and constraints are incorrect."
---
# 11ai TypeScript v7 narrowing and generics

Generic relationships should encode real invariants, not make one function look abstract Resolve the exact module, public contract, target configured JavaScript runtimes and package consumers, and acceptance check before editing.

Version baseline: Target TypeScript 7.0 and its native compiler. It carries TypeScript 6 semantics and defaults, but 7.0 has no programmatic compiler API; retain TypeScript 6 side-by-side when tooling requires that API.

## Inspect first

```bash
rg -n ' is |asserts |<[^>]+>|extends keyof|infer | in keyof|typeof |instanceof' TARGET
npx tsc --noEmit
```

Inspect concrete call sites, runtime checks, variance, inference results, and error messages before introducing a generic.

Confirm before changing:

- Runtime evidence for every narrowing.
- Minimal type parameters with real relationships.
- Constraints that match operations.
- Readable errors for callers.

## Operate

```bash
npx tsc --noEmit
npm test --if-present -- TARGET
```

Prefer discriminated unions and built-in narrowing before custom predicates. Keep conditional and mapped types bounded and documented.

Never assert a predicate without performing its runtime check or publish a breaking generic constraint without consumer review Require approval for a broader or destructive change and preview affected files, exports, callers, or runtime behavior.

## Verify and report

```bash
npx tsc --noEmit
npm test --if-present
npm run build --if-present
```

Add positive and negative compile-time cases plus runtime tests for every custom guard or assertion. Report target, files, public behavior, compatibility or security impact, checks, and rollback. Hand configuration failures to `11ai-operator-typescript-v7-troubleshooting` and seams to `11ai-operator-typescript-v7-integrations`.
