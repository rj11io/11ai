---
name: 11ai-operator-nextjs-v16-mutations-handlers
description: "Build Next.js Server Functions, form actions, Route Handlers, request validation, authorization, cookies, redirects, revalidation, and error responses. Use when adding mutations or API endpoints, handling forms, setting cookies, or securing server actions and handlers."
---
# 11ai Next.js v16 mutations and route handlers

Every Server Function and Route Handler is an externally reachable security boundary Resolve the exact route or component, execution boundary, public contract, target configured Node.js, Edge, build-time, and browser runtimes, and acceptance check first.

Version baseline: Target the current Next.js 16 release with App Router, React 19.2, Turbopack by default, Cache Components and use cache, proxy.ts, async request APIs, and Node.js 20.9 or newer.

## Inspect first

```bash
rg -n 'use server|route\.(ts|js)|export async function (GET|POST|PUT|PATCH|DELETE)|cookies\(|revalidate' app src/app 2>/dev/null
npm test --if-present
```

Map method, input, authentication, authorization, side effects, idempotency, cache impact, and response contract.

Confirm before changing:

- Runtime validation of all input.
- Authorization at the mutation boundary.
- CSRF and origin expectations.
- Idempotency and targeted revalidation.

## Operate

```bash
npm test --if-present
npm run build
```

Validate before side effects, derive identity from trusted server context, return deliberate status and error shapes, and revalidate exact affected data.

Never trust client IDs for authorization, expose server errors, broaden allowed origins, or trigger destructive mutations without confirmation Require explicit approval for broader or destructive changes and preview every affected route, component, caller, or deployment.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

Test unauthenticated, unauthorized, invalid, duplicate, success, failure-after-write, cookie, and cache invalidation paths. Report target, files, boundaries, public behavior, accessibility and performance impact, checks, and rollback. Hand config failures to `11ai-operator-nextjs-v16-troubleshooting` and seams to `11ai-operator-nextjs-v16-integrations`.
