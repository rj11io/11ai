---
name: 11ai-operator-nextjs-v16-app-router
description: "Operate Next.js App Router layouts, pages, route segments, groups, dynamic parameters, loading, error, not-found, parallel routes, intercepting routes, and navigation. Use when adding or moving routes, fixing layouts or navigation, or implementing route-specific loading and errors."
---
# 11ai Next.js v16 App Router

The filesystem is a public URL and layout contract Resolve the exact route or component, execution boundary, public contract, target configured Node.js, Edge, build-time, and browser runtimes, and acceptance check first.

Version baseline: Target the current Next.js 16 release with App Router, React 19.2, Turbopack by default, Cache Components and use cache, proxy.ts, async request APIs, and Node.js 20.9 or newer.

## Inspect first

```bash
find app src/app -type f 2>/dev/null | sort | head -160
rg -n 'generateStaticParams|params:|searchParams:|notFound\(|redirect\(|<Link|useRouter' app src/app 2>/dev/null
```

Map the exact URL to segments, layouts, slots, dynamic params, loading, error, and not-found ownership before moving files. In Next.js 16, treat `params` and `searchParams` as async request APIs and await them at the owning boundary.

Confirm before changing:

- Public URL and parameter shape.
- Layout persistence and state.
- Static parameter bounds.
- Accessible navigation and focus.

## Operate

```bash
npm run build
npm test --if-present
```

Add the smallest segment and colocate route-specific files without making utility folders routable. Preserve existing URL and layout contracts.

Never move or rename route files, change dynamic parameter shape, or add broad redirects without consumer and SEO review Require explicit approval for broader or destructive changes and preview every affected route, component, caller, or deployment.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

Build and navigate direct loads, client transitions, invalid params, loading, error, and not-found paths. Report target, files, boundaries, public behavior, accessibility and performance impact, checks, and rollback. Hand config failures to `11ai-operator-nextjs-v16-troubleshooting` and seams to `11ai-operator-nextjs-v16-integrations`.
