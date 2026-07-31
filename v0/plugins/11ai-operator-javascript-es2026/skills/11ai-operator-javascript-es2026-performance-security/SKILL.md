---
name: 11ai-operator-javascript-es2026-performance-security
description: "Measure and improve JavaScript runtime performance and security across hot paths, memory retention, parsing, dynamic code, prototype access, and untrusted input. Use when diagnosing slow or leaking code, reviewing injection risk, or hardening an input boundary."
---
# 11ai JavaScript ES2026 performance and security

Optimization and hardening require evidence from the exact runtime and threat boundary Resolve the exact module, public contract, target browser, server, worker, or embedded JavaScript runtimes, and acceptance check before editing.

Version baseline: Target the stable ECMAScript 2026 edition. Prefer ES2026 APIs only after verifying native runtime support or an explicit transform and polyfill policy.

## Inspect first

```bash
rg -n 'eval\(|new Function|innerHTML|__proto__|Object\.assign|performance\.|console\.time' TARGET
npm test --if-present -- TARGET
```

Capture a representative profile or concrete exploit path before changing implementation. Separate network, parse, execution, rendering, and retention costs.

Confirm before changing:

- Trusted and untrusted boundaries.
- Algorithmic complexity and allocation.
- Prototype and property-name handling.
- Dynamic code and HTML sinks.

## Operate

```bash
npm test --if-present -- TARGET
npm run build --if-present
```

Remove unsafe sinks, validate at boundaries, use own-property checks, and optimize measured hot paths without changing semantics.

Never add eval, disable validation, memoize unbounded user keys, or trade correctness for a microbenchmark Require approval for a broader or destructive change and preview affected files, exports, callers, or runtime behavior.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Repeat the same profile or security test, compare behavior and resources, and check representative adverse input. Report target, files, public behavior, compatibility or security impact, checks, and rollback. Hand configuration failures to `11ai-operator-javascript-es2026-troubleshooting` and seams to `11ai-operator-javascript-es2026-integrations`.
