---
name: 11ai-operator-nextjs-v16-environment
description: "Inspect the installed Next.js versions, package manager, renderer or router mode, source tree, build configuration, scripts, and target environments without changing anything. Use before Next.js work, when conventions are unknown, or when the user asks what is configured."
---
# 11ai Next.js v16 environment

Resolve the project, installed versions, entry points, renderer or router mode, source and output ownership, and target configured Node.js, Edge, build-time, and browser runtimes. Keep this pass read-only.

Version baseline: Target the current Next.js 16 release with App Router, React 19.2, Turbopack by default, Cache Components and use cache, proxy.ts, async request APIs, and Node.js 20.9 or newer.

## Inspect the project

```bash
npx next info
node -p "require('next/package.json').version" 2>/dev/null
node --version
rg --files app pages src/app src/pages 2>/dev/null | head -120
rg -n 'use client|use server|use cache|generateStaticParams|revalidate|runtime' app src/app 2>/dev/null | head -120
```

List environment variable names only. Require Next.js major 16 and Node.js 20.9 or newer for these workflows; otherwise stop and classify the work as an upgrade or use the installed major's documentation.

## Inspect checks

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

Inspect script definitions first. Do not install, format, codemod, build, deploy, update snapshots, or clear caches during this read-only pass.

## Interpretation

- **Version mismatch** — read the local dependency graph before applying current examples.
- **Boundary mismatch** — confirm which code executes on client, server, build, or test runtime.
- **Generated mismatch** — trace output to source rather than patching it.
- **Target mismatch** — Next.js version, App or Pages Router, runtime, cache policy, rendering mode, deployment target, or environment ownership must be explicit.

## Report

State versions, package manager, rendering mode, source and output roots, target configured Node.js, Edge, build-time, and browser runtimes, scripts, and ambiguity. Hand absent configuration to `11ai-operator-nextjs-v16-setup` and failures to `11ai-operator-nextjs-v16-troubleshooting`.
