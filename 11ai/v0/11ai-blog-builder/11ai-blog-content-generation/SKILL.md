---
name: 11ai-blog-content-generation
description: "Generate user-requested editorial blog content in the 11ai blog format: publication ideas, posts, series, author profiles, titles, excerpts, tags, slugs, Markdown bodies, code examples, tables, images/link placeholders, YouTube embeds, and metadata ready for the 11ai file-backed blog content model. Use when asked to draft, create, brainstorm, expand, rewrite, or seed blog content that should fit an 11ai blog."
---

# 11ai Blog Content Generation

Generate content using [references/generation-contract.md](references/generation-contract.md), then apply `$11ai-blog-content-format` before final delivery or file edits.

## Workflow

1. Clarify or infer the requested content type: single post, multi-post publication, author profile, editorial calendar, demo content, or replacement content.
2. Inspect the target blog's existing publications, authors, tags, tone, route prefix, Markdown renderer, and content files before generating repo-bound content.
3. Generate content that fits the user's brief and the target blog:
   - title and slug;
   - excerpt;
   - publication context;
   - author IDs from the existing registry when available;
   - `created` date when requested or clearly needed, plus optional `updated` only for material revisions;
   - normalized tags;
   - Markdown body in the expected 11ai format.
4. Use `$11ai-blog-content-format` to normalize the output before writing files or returning content.
5. If facts matter, ask for source material or clearly mark placeholders. Do not fabricate real-world claims, quotes, citations, author biographies, or external links.
6. If writing files, update registries/imports/tests in the smallest project-consistent way and run relevant checks.

## Generation constraints

- Match the existing blog voice unless the user requests a different voice.
- Prefer specific, useful section headings over generic filler.
- Use the single leading H1 pattern only when the target strips leading H1s from post content.
- Use `##`-`#####` for body structure.
- Use GFM tables/lists/code blocks only when they add clarity.
- Use placeholder image paths and links only when clearly labeled as placeholders.
- Use YouTube embeds only when the user requests video content or provides a video ID/URL.

## Delivery

Report the generated content type, metadata, author/tag assumptions, files changed if any, checks run, and any factual or editorial placeholders requiring user confirmation.
