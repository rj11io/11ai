# 11ai Blog Builder Plugin

This plugin rebuilds file-backed editorial blogs through composable skills. The core skills recreate behavior; `11ai-blog-ui` is an optional standalone visual add-on.

## Recommended execution order

1. `$11ai-blog-builder` — orchestrates the full build and points to the scaffold map.
2. `$11ai-blog-cms` — creates publications, posts, registry, validation, library browsing, publication pages, and post readers.
3. `$11ai-blog-authors` — adds author metadata/tags, post attribution, bylines, author pages, and Authors library browsing.
4. `$11ai-blog-markdown-components` — adds polished `react-markdown` rendering, GFM, code blocks, links, images, embeds, demo coverage, and renderer/TOC heading parity.
5. `$11ai-blog-content-format` — normalizes drafts/imports/generated copy into the metadata and Markdown body format the blog expects.
6. `$11ai-blog-content-generation` — generates requested posts, publications, author profiles, calendars, or seed content, then formats it for the blog.
7. `$11ai-blog-toc` — adds table of contents UI, active section behavior, and TOC tests over the shared Markdown heading contract.

Optional:

- `$11ai-blog-ui` — standalone add-on that applies the 11ai-style editorial visual system after the functional blog exists.

## Scope

The plugin is intended for React/Next.js-style blogs but keeps contracts white-label. It should preserve each target project's route prefix, framework version, style tokens, and existing conventions. Use `11ai-blog-ui` only when the user asks for the 11ai visual treatment or equivalent polish.

## Validation expectation

Run the target project's equivalent of:

```text
typecheck
lint
unit tests
browser/e2e tests
production build
```

For Next.js targets, read the installed `node_modules/next/dist/docs/` files before writing route or server/client component code.
