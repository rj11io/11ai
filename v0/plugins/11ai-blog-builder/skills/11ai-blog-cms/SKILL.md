---
name: 11ai-blog-cms
description: "Build or retrofit a white-label, file-backed blog CMS organized as publications with nested posts, including a single combined library that switches between Posts and Publications (default Posts), list/card display modes (default List), typed Markdown content, search, AND-tag filters, sorting, publication detail pages, and post readers. Use for multi-publication blogs, journals, editorial sites, author blogs, or Git-managed Next.js content systems without a database. Pair with 11ai-blog-authors when the library should also include an Authors content type."
---

# 11ai Blog CMS

Build the publications-and-posts system defined in [references/implementation.md](references/implementation.md). For a 11ai-style rebuild, also use [references/scaffold.md](references/scaffold.md). Read the relevant reference before changing application code.

## Workflow

1. Inspect the target repository and preserve its routing, styling, and component conventions where compatible.
2. Implement typed, validated, file-backed publications and nested posts. Do not add a database or hosted editor unless requested.
3. When adding or migrating actual editorial content, use `$11ai-blog-content-format`; when generating new requested content, use `$11ai-blog-content-generation` before writing content records.
4. Build one library surface that flattens posts across publications and switches `posts | publications`. Derive the selected content type from a `content` URL param; missing or invalid params default to `posts`, and `content=posts` is also valid.
5. If `$11ai-blog-authors` is also in scope, leave the library state open to a third `authors` content type and pass author list items into the same browser.
6. Add a separate `list | cards` layout control. Initialize it to `list` for every content type.
7. Apply query, AND-tag filters, and relevance/newest/oldest sorting to the selected content type. Keep valid query/sort/view state when switching types; remove selected tags that do not exist in the new type.
8. Build publication detail pages with nested post browsers and individual post reading pages.
9. Render safe Markdown from the post's single `content` field. Use `$11ai-blog-markdown-components` when the renderer needs polished prose components, GFM, code fences, embeds, images, or TOC-aligned heading IDs. Derive adjacent posts by array position.
10. Generate metadata/static params, then verify typecheck, lint, build, keyboard behavior, mobile layout, Markdown rendering, and all content/layout combinations.

## Non-negotiable behavior

- Default content type: `posts`.
- The library content selection must be refreshable/shareable through the URL. Use `content=posts`, `content=publications`, and, when enabled, `content=authors`; no `content` param still means `posts`.
- Default result layout: `list`.
- Keep the content-type control visually and semantically distinct from the layout control.
- When Authors are enabled, the content selector becomes `posts | publications | authors`; Authors must be added through `$11ai-blog-authors`, not duplicated in the CMS contract.
- Flatten posts with enough parent context to show and link their publication.
- Use the same filtered result set for list and card renderers.
- Use one semantic navigation target per result; avoid nested interactive elements.
- Keep all copy, domains, authors, and branding project-configured and white-label.
- Default every post to one optional `content?: string` field. Use the legacy tiered content fields only when the user explicitly requests tiered access; in that variant, select authorized content on the server and never expose restricted tiers to clients.

## Delivery

Report the content authoring structure, routes, default selections, switching behavior, validation/access rules, and verification performed.
