---
name: 11ai-operator-javascript-es2026-async-control-flow
description: "Design and repair JavaScript promises, async functions, async iterables, cancellation, timeouts, bounded concurrency, retries, and resource cleanup. Use when work races, hangs, leaks, retries incorrectly, or needs cancellation and concurrency limits."
---
# 11ai JavaScript ES2026 async control flow

Async correctness depends on ownership of completion, cancellation, errors, and cleanup Resolve the exact module, public contract, target browser, server, worker, or embedded JavaScript runtimes, and acceptance check before editing.

Version baseline: Target the stable ECMAScript 2026 edition. Prefer ES2026 APIs only after verifying native runtime support or an explicit transform and polyfill policy.

## Inspect first

```bash
rg -n 'async |await |Promise\.|AbortController|setTimeout|for await|allSettled|Array\.fromAsync' TARGET
npm test --if-present -- TARGET
```

Trace who starts, awaits, cancels, retries, and releases each operation; preserve the first rejection and input. Use `Array.fromAsync` only when ES2026 support is verified and materializing the source is bounded.

Confirm before changing:

- AbortSignal propagation.
- Bounded concurrency and backpressure.
- Retryable versus permanent errors.
- finally-based resource cleanup.

## Operate

```bash
npm test --if-present -- TARGET
npm run lint --if-present
```

Await every owned promise, propagate cancellation, and use explicit concurrency limits. Make retries finite and idempotent.

Never add sleeps, force completion, swallow rejections, or use unbounded Promise.all to hide a race Require approval for a broader or destructive change and preview affected files, exports, callers, or runtime behavior.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Test success, rejection, timeout, cancellation, partial completion, and cleanup under concurrent calls. Report target, files, public behavior, compatibility or security impact, checks, and rollback. Hand configuration failures to `11ai-operator-javascript-es2026-troubleshooting` and seams to `11ai-operator-javascript-es2026-integrations`.
