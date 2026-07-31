---
name: 11ai-operator-nextjs-v16-data-cache
description: "Operate Next.js server data fetching, request memoization, use cache, cache tags and lifetimes, revalidation, streaming, Suspense, and dynamic request APIs. Use when adding data access, fixing stale or uncached results, choosing rendering behavior, or invalidating cached output."
---
# 11ai Next.js v16 data and caching

Current Next.js fetches are not cached by default, so every cache decision must be explicit Resolve the exact route or component, execution boundary, public contract, target configured Node.js, Edge, build-time, and browser runtimes, and acceptance check first.

Version baseline: Target the current Next.js 16 release with App Router, React 19.2, Turbopack by default, Cache Components and use cache, proxy.ts, async request APIs, and Node.js 20.9 or newer.

## Inspect first

```bash
rg -n 'fetch\(|use cache|cacheTag|cacheLife|revalidate|Suspense|cookies\(|headers\(' app src/app 2>/dev/null
npm run build
```

Identify data owner, freshness requirement, request-time APIs, cache key inputs, invalidation event, and loading boundary.

Confirm before changing:

- Freshness and consistency requirement.
- Static, cached, or request-time rendering.
- Complete cache key and tag scope.
- Bounded invalidation and fallback.

## Operate

```bash
npm run build
npm test --if-present
```

Cache only deterministic work with explicit lifetime and invalidation. Stream uncached data behind meaningful Suspense boundaries.

Never add indefinite caching, invalidate broad tags, opt an entire route dynamic, or cache user-specific data without approval Require explicit approval for broader or destructive changes and preview every affected route, component, caller, or deployment.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

Test cold and warm reads, invalidation, concurrent requests, user separation, loading, and production rendering output. Report target, files, boundaries, public behavior, accessibility and performance impact, checks, and rollback. Hand config failures to `11ai-operator-nextjs-v16-troubleshooting` and seams to `11ai-operator-nextjs-v16-integrations`.
