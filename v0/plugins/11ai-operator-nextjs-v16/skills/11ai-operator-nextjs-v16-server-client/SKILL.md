---
name: 11ai-operator-nextjs-v16-server-client
description: "Design Next.js Server and Client Component boundaries, serialization, data access, interactivity, providers, browser APIs, and composition. Use when placing use client, fixing hydration, moving data access, or reducing client JavaScript."
---
# 11ai Next.js v16 server and client components

Layouts and pages are server components by default, while interactivity creates an explicit client boundary Resolve the exact route or component, execution boundary, public contract, target configured Node.js, Edge, build-time, and browser runtimes, and acceptance check first.

Version baseline: Target the current Next.js 16 release with App Router, React 19.2, Turbopack by default, Cache Components and use cache, proxy.ts, async request APIs, and Node.js 20.9 or newer.

## Inspect first

```bash
rg -n '^"use client"|^\x27use client\x27|useState|useEffect|window\.|process\.env' app src/app 2>/dev/null
npm run build
```

Trace imports from each client directive, serialized props, server-only modules, browser APIs, and bundle impact.

Confirm before changing:

- Smallest necessary client boundary.
- Serializable props only.
- Secrets and data access server-side.
- Interactive semantics and hydration stability.

## Operate

```bash
npm run build
npm test --if-present
```

Push client directives down to interactive leaves and compose server content through props or children. Keep server-only imports outside client graphs.

Never force a route client-side to silence hydration, pass secrets through props, or move trusted data access into the browser Require explicit approval for broader or destructive changes and preview every affected route, component, caller, or deployment.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

Inspect build output, client bundle reach, server HTML, hydration warnings, and interactive behavior. Report target, files, boundaries, public behavior, accessibility and performance impact, checks, and rollback. Hand config failures to `11ai-operator-nextjs-v16-troubleshooting` and seams to `11ai-operator-nextjs-v16-integrations`.
