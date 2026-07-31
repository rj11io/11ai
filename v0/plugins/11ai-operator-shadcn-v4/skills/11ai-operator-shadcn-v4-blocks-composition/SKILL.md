---
name: 11ai-operator-shadcn-v4-blocks-composition
description: "Discover, preview, install, adapt, and verify shadcn v4 blocks and multi-component page compositions for application shells, dashboards, authentication, commerce, and chat without surrendering routing, data, state, or dependency ownership. Use when the user asks for a shadcn block, full section, page composition, dashboard, shell, or chat interface."
---
# 11ai shadcn v4 blocks and composition

Version baseline: shadcn CLI 4.14.1 (stable), verified 2026-07-31; blocks are source bundles and examples, not opaque packages, and must be adapted to the host framework, aliases, dependencies, data boundaries, and primitive base.

Define the requested user journey, route, layout boundary, responsive behavior, real data contracts, permissions, interaction owners, and acceptance states before selecting a block.

## Discover and inspect candidates

```bash
npx shadcn@4.14.1 info --json
npx shadcn@4.14.1 search QUERY
npx shadcn@4.14.1 view ITEM
npx shadcn@4.14.1 add ITEM --dry-run
```

Inspect every file, component, image, font, dependency, registry dependency, alias, route assumption, and hard-coded path. Compare the candidate's base and style with the host, and verify provenance and license for non-official registries.

## Integrate by boundary

Add only after approval of the dry run. Preserve the existing app shell, routing, metadata, authorization, fetching, error handling, analytics, and design tokens. Prefer composing installed components and extracting repeated structure over retaining a monolithic demo page.

Replace placeholder data and links deliberately. Never overwrite an entire route, layout, provider, or shared UI folder just because the block includes one.

## Own dashboard and chat state

For dashboards, define query, filter, time range, refresh, loading, empty, error, and permission ownership; hand chart implementation to `11ai-operator-shadcn-v4-charts`. For chat, separate transcript, composer, streaming, tool status, attachments, retry, cancellation, and persistence from presentational components.

Keep secrets and private data server-side, sanitize rich content, constrain uploads, and preserve accessible landmarks, headings, live-region behavior, focus, and motion preferences.

## Verify and report

Test all routes and states at mobile and desktop widths, keyboard navigation, hydration, slow and failed data, long content, empty collections, reduced motion, and dark mode. Report block source and revision, files and dependencies, host seams preserved, demo assumptions removed, state owners, accessibility and security checks, and rollback.
