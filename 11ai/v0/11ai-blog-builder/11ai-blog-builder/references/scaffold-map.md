# 11ai blog scaffold map

Use this when rebuilding the full 11ai-style blog from the plugin skills. Treat file names as a recommended map, not a mandatory path, when the host project already has conventions.

## Route and component inventory

```text
app/v1/blog/page.tsx
app/v1/blog/publications/[pubId]/page.tsx
app/v1/blog/publications/[pubId]/[postId]/page.tsx
app/v1/blog/authors/[authorId]/page.tsx

app/v1/blog/components/library.tsx
app/v1/blog/components/publication-browser.tsx
app/v1/blog/components/markdown.tsx
app/v1/blog/components/markdown-headings.ts
app/v1/blog/components/markdown-utils.ts
app/v1/blog/components/content-index.tsx

app/v1/blog/content/types.ts
app/v1/blog/content/routes.ts
app/v1/blog/content/registry.ts
app/v1/blog/content/validation.ts
app/v1/blog/content/authors.ts
app/v1/blog/content/publications/<publication>/index.ts
app/v1/blog/content/publications/<publication>/posts/<post>.ts
```

## Data layer

- `types.ts`: define `Publication`, `Post`, `PostListItem`, `PostPreview`, `Author`, `AuthorPreview`, and `AuthorListItem`.
- `routes.ts`: centralize `blogHref`, `publicationHref`, `postHref`, and `authorHref`.
- `authors.ts`: seed author records with `id`, `name`, `displayName`, `bio`, `tags`, optional `avatar`, and optional `links`.
- publication `index.ts` files: define publication metadata and nested posts with `created`, optional `updated`, `authorIds`, tags, and imported Markdown content modules.
- post content: use `$11ai-blog-content-format` for metadata/body normalization and `$11ai-blog-content-generation` when creating new editorial material.
- `registry.ts`: import all publications and authors, validate them, derive `allPosts`, `postPreviews`, `publicationPreviews`, `authorPreviews`, lookup helpers, `getPostContent`, and `stripLeadingH1`.
- `validation.ts`: fail duplicate IDs/slugs, malformed `created`, `updated` before `created`, empty copy, bad tags, bad links, empty author arrays, duplicate post authors, unknown author references, and missing readable content.

## Functional UI layer

- Library page: hero card, stats, `Library` component, footer.
- Library component: URL-backed content selector with `Posts | Publications | Authors` using `content=posts | publications | authors` while `/blog` defaults to posts, search, AND-tag filters, sort for dated types, list/cards toggle, one semantic link surface per result, empty state.
- Markdown components: `react-markdown` + `remark-gfm` renderer, shared AST heading extraction, fenced code blocks, internal/external links, images, YouTube embeds, and a Markdown components demo route/post.
- Publication page: breadcrumb, publication summary, status/tag pills, created/updated dates, post count, `PublicationBrowser`.
- Publication browser: tabs for Posts/Synopsis/Editor notes, post search, tag filters, sort, list/cards.
- Post page: breadcrumb, publication pill, title, excerpt, linked author byline, created/updated dates, read time, tags, `ContentIndex`, Markdown body, adjacent posts.
- Author page: breadcrumb, avatar/initials, name, display name, bio, tags, external links, post count, attributed post list.
- TOC: desktop sticky nav and mobile `details` disclosure sharing the Markdown heading IDs and active state.

Use `$11ai-blog-ui` only as a standalone optional add-on when exact 11ai visual polish is requested.

## Test inventory

```text
tests/unit/blog-authors.unit.spec.ts
tests/unit/markdown-headings.unit.spec.ts
tests/e2e/blog-authors.spec.ts
tests/e2e/content-index.spec.ts
tests/e2e/homepage.spec.ts
tests/e2e/markdown-components.spec.ts
```

Minimum checks:

- content registry resolves authors and post previews;
- Markdown heading extraction handles formatted labels, duplicates, and fenced code;
- byline links drill down to author pages;
- library Authors mode renders, searches, and filters by author tags using rendered data rather than hard-coded seed-specific names or tags;
- URL-backed content selection supports no param, `content=posts`, `content=publications`, `content=authors`, and unknown fallback;
- TOC deep links initialize active state;
- TOC anchor navigation keeps the target active;
- mobile TOC disclosure remains open after section selection;
- Markdown demo renders code blocks, tables, internal/external links, images, and YouTube embeds;
- build statically generates publication, post, and author routes.
