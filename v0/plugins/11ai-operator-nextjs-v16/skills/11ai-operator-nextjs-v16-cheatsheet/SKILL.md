---
name: 11ai-operator-nextjs-v16-cheatsheet
description: "Look up Next.js commands, project structure, rendering patterns, and focused operations across app router, server and client components, data and caching, mutations and route handlers, metadata and deployment. Use when the user wants a concise reference instead of a guided workflow."
---
# 11ai Next.js v16 cheatsheet

Use the installed versions, active framework mode, and project conventions as the source of truth. This standalone lookup hands multi-step work only to sibling skills.

Version baseline: Target the current Next.js 16 release with App Router, React 19.2, Turbopack by default, Cache Components and use cache, proxy.ts, async request APIs, and Node.js 20.9 or newer.

## Inspect

```bash
npx next info
rg --files app pages src/app src/pages 2>/dev/null | head -120
rg -n 'use client|use server|use cache|generateStaticParams|revalidate|runtime' app src/app 2>/dev/null | head -120
```

Confirm versions, entry points, rendering mode, source ownership, and scripts. Never guess Next.js version, App or Pages Router, runtime, cache policy, rendering mode, deployment target, or environment ownership.

## Common commands

```bash
npm install next@^16 react@^19.2 react-dom@^19.2
npm run lint --if-present
npm test --if-present
npm run build
```

Installation is setup, not lookup. Preserve package manager and lockfile; inspect scripts before commands that build or rewrite.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-nextjs-v16-app-router` | Layouts, pages, segments, loading, errors, not-found, and navigation |
| `11ai-operator-nextjs-v16-server-client` | Execution boundaries, serialization, interactivity, and composition |
| `11ai-operator-nextjs-v16-data-cache` | Server data fetching, use cache, revalidation, streaming, and invalidation |
| `11ai-operator-nextjs-v16-mutations-handlers` | Server Functions, forms, Route Handlers, validation, auth, and revalidation |
| `11ai-operator-nextjs-v16-metadata-deployment` | Metadata, images, assets, runtime configuration, builds, previews, and production |

## Answer format

Lead with the smallest command or Next.js route, server output, and client bundle pattern, then name target, boundary, verification, and one risk. Stop before unrequested dependencies, codemods, public behavior changes, or deployments.
