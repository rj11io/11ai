---
name: 11ai-operator-nextjs-v16-integrations
description: "Connect Next.js to styling, data sources, tests, browser and server runtimes, build tools, CI, observability, and deployment while preserving component and execution boundaries. Use when Next.js crosses another subsystem or must behave consistently through production."
---
# 11ai Next.js v16 integrations

Name both sides of the seam, the data and code crossing it, execution environment, serialization contract, and ownership before editing.

Version baseline: Target the current Next.js 16 release with App Router, React 19.2, Turbopack by default, Cache Components and use cache, proxy.ts, async request APIs, and Node.js 20.9 or newer.

## Inspect the seams

```bash
npx next info
rg --files app pages src/app src/pages 2>/dev/null | head -120
rg -n 'use client|use server|use cache|generateStaticParams|revalidate|runtime' app src/app 2>/dev/null | head -120
rg -n "build|lint|test|deploy|instrument|hydrate|server|client" package.json .github . 2>/dev/null | head -100
```

Find existing adapters and providers before adding new ones. This plugin is standalone and does not reference another 11ai plugin.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for standalone build, test, runtime, and deployment patterns.

Change one seam, keep server environment values, cookies, tokens, request bodies, signed URLs, or serialized private data server-side, serialize only supported values, and preserve ownership of generated artifacts.

## Verify end to end

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

Run producer and consumer checks, production build, one runtime path, and one failure path. Inspect client output and hydration or routing behavior.

## Report

State systems connected, boundary, files and scripts, serialized contract, secret handling, checks, deployment impact, and rollback. Hand failures to `11ai-operator-nextjs-v16-troubleshooting`.
