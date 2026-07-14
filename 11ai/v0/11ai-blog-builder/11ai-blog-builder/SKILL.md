---
name: 11ai-blog-builder
description: Orchestrate the complete 11ai blog-builder plugin to recreate a file-backed editorial blog with publications, posts, author profiles, library browsing, and responsive article table of contents. Use when a user asks to build, recreate, migrate, or audit an entire blog experience rather than only one subsystem. Treat 11ai-blog-ui as an optional standalone visual add-on only when requested.
---

# 11ai Blog Builder

Use this as the coordinator for the plugin. Read [references/scaffold-map.md](references/scaffold-map.md), then invoke the subsystem skills in order.

## Build order

1. Use `$11ai-blog-cms` for content types, routes, registry, validation, library browsing, publication pages, and post readers.
2. Use `$11ai-blog-authors` after the CMS shape exists. Add author metadata/tags, post `authorIds`, bylines, author routes, and the Authors library mode.
3. Use `$11ai-blog-markdown-components` after post readers exist. Add `react-markdown`, GFM, fenced code, prose components, link/image/embed handling, a demo page/post, and shared heading extraction.
4. Use `$11ai-blog-content-format` when migrating, importing, or normalizing post/publication/author content into the expected 11ai metadata and Markdown shape.
5. Use `$11ai-blog-content-generation` when the user asks to create new editorial content, seed posts, demo material, publications, or author profiles.
6. Use `$11ai-blog-toc` after Markdown heading IDs and extraction exist. Add sticky/collapsible TOC UI, active section logic, and tests.
7. Optional: use `$11ai-blog-ui` only when the user asks for 11ai-style visual polish or a reusable editorial UI pass. It must not change the data contracts.

## Rules

- Read the target repository's agent instructions and relevant framework docs before writing code.
- Keep the blog file-backed unless the user explicitly asks for a database or hosted CMS.
- Preserve host route prefixes, theme tokens, Tailwind/shadcn conventions, and image pipeline where possible.
- Keep server-rendered pages as server components; isolate client state in browser controls and TOC components.
- Validate after each major layer: typecheck, lint, unit tests, browser tests, and production build when available.
- If the user asks for exact 11ai recreation, use the scaffold map as the default route/component inventory.

## Delivery

Report which subsystem skills were used, files changed, route map, content model, UI variants, tests added, checks run, and any intentional deviations from the scaffold.
