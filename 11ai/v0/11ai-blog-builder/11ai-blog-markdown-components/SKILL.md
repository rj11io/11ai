---
name: 11ai-blog-markdown-components
description: "Build or retrofit a polished blog Markdown renderer using react-markdown, remark-gfm, deterministic heading IDs, TOC-aligned heading extraction, fenced code blocks with language metadata, internal/external link handling, images, tables, task lists, YouTube embeds, a Markdown components demo page, and tests. Use when adding, recreating, repairing, or auditing Markdown/MDX-like blog prose rendering, rich Markdown components, GFM support, custom embeds, or renderer/TOC parity in React, Next.js, or another web blog."
---

# 11ai Blog Markdown Components

Implement the Markdown renderer contract in [references/implementation.md](references/implementation.md). For a 11ai-style rebuild, also use [references/scaffold.md](references/scaffold.md). Read the relevant reference before changing application code.

## Workflow

1. Inspect the target's agent instructions, framework version, local framework docs, current Markdown/rich-text renderer, TOC extraction, content model, route conventions, image pipeline, styling tokens, and tests.
2. Replace fragile line parsers with `react-markdown` plus `remark-gfm` for normal Markdown. Add explicit custom extensions only for intentionally supported embed syntax.
3. Define one heading contract shared by renderer and TOC extraction: levels, visible labels, slug policy, duplicate handling, skipped levels, code-fence behavior, and scroll offset.
4. Use `$11ai-blog-content-format` to document and enforce the authoring shape expected by the renderer, including leading H1 handling and supported Markdown components.
5. Render polished components for headings, paragraphs, emphasis, inline code, blockquotes, lists, nested lists, horizontal rules, tables, fenced code blocks, links, images, and task lists.
6. Handle links intentionally: same-site paths use the host router/link component; external HTTP(S) links use normal anchors with `target="_blank"` and `rel="noopener noreferrer"`.
7. Add a clear YouTube convention. Prefer `@[youtube](VIDEO_ID)` and optionally support standalone YouTube URLs only when the product wants that behavior.
8. Add a Markdown components demo page or demo post that exercises every supported component and edge case.
9. Verify typecheck, lint, unit tests for helpers/extraction, browser tests for rendered output, TOC behavior, and production build.

## Non-negotiable behavior

- Renderer and TOC extraction must generate matching heading IDs.
- Fenced code blocks must not create TOC headings.
- Preserve fenced code language metadata such as `ts`, `tsx`, `bash`, `json`, and `md`.
- Keep normal Markdown authoring as Markdown; do not drift into ad-hoc MDX unless the user explicitly asks for component-rich authoring.
- Do not enable raw HTML unless the target has a sanitization policy and an explicit reason.
- Keep Markdown demo content clearly marked as demo/reference content.
- Do not make full blog pages client components solely for Markdown rendering.

## Adaptation rules

- For Next.js App Router, read the installed Next docs before changing routing, links, images, or server/client component boundaries.
- Use raw `<img>` for Markdown images when dimensions are unknown, or `next/image` only when the content model supplies width/height or static imports.
- If the host already has MDX, preserve MDX for custom components and use this skill to tighten the Markdown component map, tests, and TOC parity.
- If the host has syntax highlighting, integrate with it; otherwise render readable language-tagged code blocks without adding a large highlighter dependency unless requested.
- If the host has no browser test framework, add unit coverage and document manual acceptance steps for the demo page.

## Delivery

Report dependencies added, renderer files changed, heading/TOC parity strategy, supported Markdown syntax, custom extensions, demo route/post, link/image policy, tests added, checks run, and any unsupported Markdown or MDX behavior.
