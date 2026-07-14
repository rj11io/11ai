---
name: 11ai-blog-content-format
description: "Format, normalize, migrate, or audit generated/draft editorial content for an 11ai blog content model: publication/post metadata, author IDs, tags, excerpts, dates, slugs, and Markdown bodies with the expected leading H1, h2-h5 body headings, GFM tables/lists, fenced code, images, links, YouTube embeds, and renderer/TOC-safe structure. Use when converting raw prose, outlines, AI drafts, imported articles, or Markdown files into the exact format consumed by the 11ai blog builder."
---

# 11ai Blog Content Format

Format content according to [references/content-contract.md](references/content-contract.md). Read it before rewriting or generating content files.

## Workflow

1. Inspect the target repository's current content model, routes, author registry, publication registry, Markdown renderer, and tests. Preserve project-specific route prefixes and IDs.
2. Identify the target output: single post body, full post record, publication with nested posts, author records, or imported Markdown conversion.
3. Normalize metadata: stable slug, ISO `created`, optional ISO `updated`, `authorIds`, tags, `isNSFW`, `isNew`, excerpt, optional image, and publication context.
4. Normalize Markdown body:
   - include exactly one leading ATX H1 matching the post title when the project strips route-owned titles;
   - use `##`-`#####` for body sections;
   - avoid additional H1s in the body;
   - use supported GFM and custom extensions only.
5. Check renderer/TOC compatibility: heading IDs are deterministic, headings inside fences are not TOC entries, embeds use the documented convention, and links/images follow project policy.
6. Preserve meaning while improving structure, scannability, tags, and excerpts. Do not invent facts, citations, authors, dates, or external links unless requested.
7. Deliver formatted content plus any assumptions, unresolved metadata, and validation/check commands to run.

## Non-negotiable behavior

- Do not output raw HTML unless the target explicitly supports sanitized HTML.
- Do not use MDX/component syntax unless the user asks for MDX.
- Do not use H1s inside the rendered body except the single leading title H1 that the route strips.
- Do not reference unknown `authorIds`; either use existing authors or call out missing author records.
- Keep tags short, normalized, and useful for filtering.
- Keep code fences closed and labeled when a language is known.
- Keep YouTube embeds in the project convention: `@[youtube](VIDEO_ID)`.

## Delivery

Report the final content shape, changed/generated files, metadata decisions, Markdown features used, compatibility notes, and any missing inputs.
