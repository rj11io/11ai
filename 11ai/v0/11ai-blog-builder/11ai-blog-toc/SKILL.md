---
name: 11ai-blog-toc
description: "Build or retrofit a white-label, responsive, accessible table of contents for Markdown, MDX, CMS, or rich-text blog articles, including deterministic heading IDs, duplicate handling, native hash deep links, sticky desktop and collapsible mobile navigation, scroll-aware active-section highlighting, fixed-header offsets, and tests. Use when adding, recreating, repairing, or auditing an article “On this page” index, scrollspy, heading anchors, or TOC in React, Next.js, or another web project."
---

# 11ai Blog TOC

Implement the table-of-contents contract in [references/implementation.md](references/implementation.md). For a 11ai-style limited Markdown implementation, also use [references/scaffold.md](references/scaffold.md). Read the relevant reference before changing application code.

## Workflow

1. Inspect the target's agent instructions, framework version, local framework documentation, article route, content source, Markdown/rich-text renderer, layout, fixed headers, styling conventions, and tests. For version-sensitive frameworks such as Next.js, read the installed version's relevant documentation before coding.
2. Choose one heading source of truth. Prefer `$11ai-blog-markdown-components` for `react-markdown`/GFM blogs so rendered IDs and TOC metadata share one Markdown AST contract. For a small line-based renderer, centralize heading parsing, label normalization, slugging, duplicate handling, and offsets in shared helpers.
3. Define the heading contract: included levels, visible-label extraction, duplicate IDs, Unicode policy, skipped levels, and one shared activation/scroll offset.
4. Use `$11ai-blog-content-format` when authoring/importing content that needs clean body heading levels and predictable TOC labels.
5. Keep content loading and parsing on the server or build path when the host permits it. Pass only serializable heading metadata to the smallest possible client island for browser interaction.
6. Implement native fragment links, initial hash selection from the current DOM, scroll-aware active state, final-section behavior, an explicit navigation-lock release policy, and cleanup.
7. Render a labeled sticky desktop index and a native collapsible mobile index that share links and state. Hide the component when no eligible headings exist.
8. Verify extractor-renderer ID parity, semantics, keyboard and touch behavior, deep links, history, manual scrolling, short final sections, responsive layout, typecheck, lint, tests, and production build.

## Non-negotiable behavior

- Every TOC `href` must resolve to exactly one rendered heading ID.
- Extraction and rendering must share heading parsing, label normalization, ordering, slugging, duplicate handling, and offset constants. If the renderer intentionally supports only a Markdown subset, document unsupported block syntax and test the supported subset.
- Use native `#fragment` anchors. Preserve browser history, copyable URLs, keyboard behavior, and no-JavaScript navigation.
- Initialize from a valid URL hash; otherwise select the geometry-derived section.
- While manually scrolling, activate the last heading that crossed the shared offset. At document bottom, activate the final heading.
- Prevent browser-managed anchor movement from flashing through intermediate active sections. Release that lock through a defined and tested policy.
- Apply the same offset to anchor landing and active detection. Centralize it in one token or derived value.
- Mark the active link with `aria-current="location"`, label each TOC `nav`, and keep visible focus styles.
- Preserve heading hierarchy semantically when the host content requires it; indentation alone is not a semantic tree.
- Keep copy, colors, breakpoints, route paths, and branding project-configured.
- Do not make the full article a client component solely to implement scroll tracking.
- Do not render untrusted heading HTML to obtain labels; derive plain text from the parsed content model.

## Adaptation rules

- Use an existing AST/renderer plugin API before a custom line scanner.
- If the target uses `react-markdown`, use the Markdown components skill's AST extraction contract. If the target intentionally uses a limited line renderer like 11ai, share the same heading helpers and decide the fence policy explicitly. The 11ai-style extractor ignores headings inside fenced code; if the renderer can receive fenced code, either implement matching fence handling in rendering or reject/document fences as unsupported content.
- Resolve DOM targets when selecting/updating active headings rather than only once on mount. This matches the latest 11ai implementation and avoids stale/missing targets during hydration, deep-link landing, and layout shifts.
- For long articles, bound layout work to one calculation per animation frame or use a verified observer design with a bottom sentinel.
- If there is a fixed or responsive header, prefer a shared CSS custom property readable by both heading styles and client logic.
- Preserve existing project conventions when they satisfy the contract; do not add a UI library for this component alone.

## Delivery

Report the files changed, content/heading contract, ID and duplicate policy, server/client boundary, responsive behavior, active-section algorithm, offset source, accessibility decisions, and verification performed. Call out any unsupported content syntax or checks that could not run.
