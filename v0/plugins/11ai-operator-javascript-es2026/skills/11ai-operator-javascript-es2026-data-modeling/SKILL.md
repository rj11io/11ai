---
name: 11ai-operator-javascript-es2026-data-modeling
description: "Model JavaScript data with objects, arrays, maps, sets, iterables, immutability, cloning, equality, dates, numeric values, and JSON serialization. Use when choosing data structures, fixing mutation bugs, normalizing payloads, or preserving serialized contracts."
---
# 11ai JavaScript ES2026 data modeling

Choose structures from identity, ordering, lookup, mutation, and serialization requirements Resolve the exact module, public contract, target browser, server, worker, or embedded JavaScript runtimes, and acceptance check before editing.

Version baseline: Target the stable ECMAScript 2026 edition. Prefer ES2026 APIs only after verifying native runtime support or an explicit transform and polyfill policy.

## Inspect first

```bash
rg -n 'JSON\.|rawJSON|getOrInsert|Uint8Array|structuredClone|new Map|new Set|Object\.|\.sort\(|Date\(' TARGET
npm test --if-present -- TARGET
```

Inspect input and output shapes, ownership, mutation expectations, ordering, missing values, and serialization consumers. Treat ES2026 raw JSON, source context, get-or-insert methods, and binary text helpers as explicit compatibility decisions.

Confirm before changing:

- Identity and equality semantics.
- Mutation and copy boundaries.
- Stable ordering and deterministic output.
- Lossy JSON values such as dates and undefined.

## Operate

```bash
npm test --if-present -- TARGET
npm run lint --if-present
```

Normalize at boundaries, copy only when ownership changes, and make serialization explicit. Avoid clever coercion.

Never change persisted keys, sort order, date format, or nullability without migrating and verifying consumers Require approval for a broader or destructive change and preview affected files, exports, callers, or runtime behavior.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Test empty, duplicate, missing, large, cyclic, and serialization round-trip cases. Report target, files, public behavior, compatibility or security impact, checks, and rollback. Hand configuration failures to `11ai-operator-javascript-es2026-troubleshooting` and seams to `11ai-operator-javascript-es2026-integrations`.
