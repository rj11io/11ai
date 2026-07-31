---
name: 11ai-operator-typescript-v7-type-modeling
description: "Model TypeScript values and APIs with object types, interfaces, unions, intersections, literals, discriminants, readonly data, utility types, and exact boundary validation. Use when designing a type contract, replacing unsafe assertions, or aligning runtime data with compile-time types."
---
# 11ai TypeScript v7 type modeling

Types describe trusted knowledge; they do not validate untrusted runtime data Resolve the exact module, public contract, target configured JavaScript runtimes and package consumers, and acceptance check before editing.

Version baseline: Target TypeScript 7.0 and its native compiler. It carries TypeScript 6 semantics and defaults, but 7.0 has no programmatic compiler API; retain TypeScript 6 side-by-side when tooling requires that API.

## Inspect first

```bash
rg -n 'interface |type | as |unknown|any|satisfies|readonly|Record<' TARGET
npx tsc --noEmit
```

Locate the runtime source of each value, existing validators, mutation ownership, and all exported consumers before reshaping a type.

Confirm before changing:

- Discriminants for state variants.
- Unknown at untrusted boundaries.
- Readonly where mutation is not owned.
- Runtime validation separate from typing.

## Operate

```bash
npx tsc --noEmit
npm test --if-present -- TARGET
```

Model valid states directly, narrow unknown values with runtime evidence, and use satisfies to check without widening.

Never use any, double assertions, non-null assertions, or optional fields to conceal missing runtime guarantees Require approval for a broader or destructive change and preview affected files, exports, callers, or runtime behavior.

## Verify and report

```bash
npx tsc --noEmit
npm test --if-present
npm run build --if-present
```

Typecheck callers and test boundary validation for valid, invalid, missing, and future variant inputs. Report target, files, public behavior, compatibility or security impact, checks, and rollback. Hand configuration failures to `11ai-operator-typescript-v7-troubleshooting` and seams to `11ai-operator-typescript-v7-integrations`.
