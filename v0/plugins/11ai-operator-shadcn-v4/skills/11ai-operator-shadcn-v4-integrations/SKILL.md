---
name: 11ai-operator-shadcn-v4-integrations
description: "Connect shadcn CLI v4 source components to Next.js, Vite, React Router, TanStack Start, Astro, Laravel, Tailwind v3 or v4, monorepos, form and data libraries, Recharts, testing tools, continuous integration, and private registries. Use when the task concerns the seam between shadcn and another system."
---
# 11ai shadcn v4 integrations

Version baseline: shadcn CLI 4.14.1 (stable), verified 2026-07-31; inspect the host framework, component base, Tailwind family, and third-party package releases independently.

Name both systems, versions, package owner, aliases, CSS owner, server and client boundary, state owner, registry trust boundary, and test environment before wiring them.

## Inspect the seam

```bash
npx shadcn@4.14.1 info --json
rg -n 'next|vite|react-router|@tanstack|astro|laravel|tailwindcss|react-hook-form|recharts|@tanstack/react-table' package.json components.json
rg -n 'use client|ThemeProvider|FormProvider|QueryClientProvider|ChartContainer' src app packages components
```

Confirm which package owns generated source and dependencies, which CSS file owns tokens, and whether stateful components cross a server boundary.

## Wire one path deliberately

Preserve framework conventions and resolved aliases. Keep client directives at the smallest interactive boundary. Let form, query, table, and chart libraries own their state while shadcn components render and compose that state.

Read [references/integrations.md](references/integrations.md) for framework, Tailwind, monorepo, form, table, chart, test, and registry recipes. Do not add a new library when the repository already has an equivalent owner.

## Verify end to end

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

Exercise server render and hydration where relevant, keyboard and focus paths, theme tokens, alias resolution, responsive states, charts, portals, and a clean production build. Query tests by accessible semantics, not styling classes.

## Report

State systems and versions, source and dependency owners, aliases, client boundaries, CSS and state ownership, registry provenance, files, checks, bundle impact, and rollback. Ask before provider, workspace, registry-auth, or deployment changes. Hand failures to `11ai-operator-shadcn-v4-troubleshooting`.
