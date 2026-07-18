---
name: 11ai-publications-cms
description: "Build or retrofit a white-label, file-backed publications CMS with publications, nested chapters, typed metadata, Markdown reading pages, search, AND-tag filters, sorting, optional synopsis and author notes, previous/next navigation, and list/card display modes defaulting to list. Use for Next.js author libraries, serial publishing sites, publications-and-chapters catalogs, or requests to reproduce this exact Git-managed content workflow without a database."
---

# 11ai Publications CMS

Build the exact white-label content model and browsing flow defined in [references/implementation.md](references/implementation.md). Read that file before changing application code.

## Workflow

1. Inspect the target repository, framework, routing, styling system, and existing content. Preserve established conventions unless they conflict with required behavior.
2. Map existing fields and routes to the reference contract when retrofitting.
3. Implement one root publication registry, one chapter registry per publication, and one Markdown content module per chapter. Do not introduce a database or hosted CMS unless requested.
4. Add build-time validation for identifiers, ISO dates, unique slugs and IDs, derived routes, and chapter content.
5. Build publication library, publication detail, and chapter reader routes. Keep route resolution on the server and catalog controls in focused client components.
6. Implement query search, AND-tag filtering, relevance/newest/oldest sorting, clear filters, and empty states.
7. Add an accessible `list | cards` toggle to both browsers. Initialize it to `list`; never silently persist another default.
8. Render safe Markdown from the chapter's single `content` field with editorial typography and optional leading-H1 removal.
9. Derive previous/next chapters from array position rather than numeric ID arithmetic.
10. Generate route metadata/static params when supported.
11. Verify typecheck, lint, build, keyboard navigation, mobile layout, and both display modes.

## Non-negotiable behavior

- Keep the product white-label: use project configuration and user-provided copy, never source-project names, domains, authors, or prose.
- Treat this as a Git-managed publishing CMS.
- Use one filtering/sorting result set for both renderers.
- Keep one semantic navigation target per result; do not nest an anchor/button inside a separately clickable container.
- Default every chapter to one optional `content?: string` field. Use the legacy tiered fields only when the user explicitly requests tiered access; authorize that variant on the server.
- Preserve new/restriction/tag/count/description/date signals in both layouts.
- Prefer project-native primitives. With shadcn, compose Input, Select, ToggleGroup, Badge, Button, Empty, Tabs, Breadcrumb, Card, and Item.

## Delivery

Report implemented routes, content authoring path, validation rules, default view, and verification commands. Surface deliberately deferred authentication or hosted-editor work.
