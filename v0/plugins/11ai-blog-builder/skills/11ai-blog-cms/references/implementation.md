# Blog CMS implementation contract

## Contents

1. Product and routes
2. Data model
3. Combined library
4. Publication and post pages
5. Layouts and accessibility
6. Validation and acceptance

## 1. Product and routes

Build a Git-managed blog in which publications are editorial channels/series and posts belong to one publication. The base library is a single browser with two independent choices:

- Content: `Posts` (default) or `Publications`.
- Layout: `List` (default) or `Cards`.

When `$11ai-blog-authors` is also used, extend the same content control to `Posts | Publications | Authors`; do not create a disconnected author browser.

Routes:

- `/blog` (or the project’s established library path): combined browser.
- `/publications/[pubId]`: publication metadata and its posts.
- `/publications/[pubId]/[postId]`: post reader.

Use alternate route vocabulary only when the target already has a coherent convention.

## 2. Data model

```ts
export type Post = {
  postId: number;
  slug?: string;
  title: string;
  excerpt?: string;
  created: string;
  updated?: string;
  coverImage?: string;
  isNSFW: boolean;
  isNew: boolean;
  tags: string[];
  content?: string;
};

export type Publication = {
  relId: number;
  pubId: string;
  title: string;
  description: string;
  created: string;
  updated?: string;
  isNSFW: boolean;
  isNew: boolean;
  tags: string[];
  synopsis?: string;
  editorNotes?: string;
  coverImage?: string;
  posts: Post[];
};

export type PostListItem = Post & {
  publicationId: string;
  publicationTitle: string;
  publicationHref: string;
  href: string;
  editorialIndex: number;
};
```

Derive all hrefs centrally. Flatten posts deterministically:

```ts
const allPosts = publications.flatMap((publication) =>
  publication.posts.map((post, editorialIndex) => ({
    ...post,
    publicationId: publication.pubId,
    publicationTitle: publication.title,
    publicationHref: publicationHref(publication.pubId),
    href: postHref(publication.pubId, post),
    editorialIndex,
  })),
);
```

Use one root publication registry, one post registry per publication, and one Markdown module per post.

When creating, importing, or rewriting content records, use `$11ai-blog-content-format` to normalize metadata and Markdown bodies. When the user asks for new editorial material, use `$11ai-blog-content-generation` first, then format the generated result before writing files.

## 3. Combined library

URL and state contract:

```ts
type ContentType = "posts" | "publications";
type ViewMode = "list" | "cards";
type SortOrder = "relevance" | "newest" | "oldest";

const contentParam = "content";
// missing, invalid, or unsupported values resolve to "posts";
// content=posts is allowed and should remain shareable.
const contentType = getContentTypeFromSearchParams(searchParams);
const [viewMode, setViewMode] = useState<ViewMode>("list");
```

With `$11ai-blog-authors`:

```ts
type ContentType = "posts" | "publications" | "authors";
```

Place a labeled content-type selector near the library heading or controls. The content selector should use links or router navigation so the selected type is reflected in the URL as `content=posts`, `content=publications`, or `content=authors` when authors are enabled. Place a separate labeled/icon layout toggle beside sorting. Do not combine the two concepts into one four-option control.

When content type changes:

- Update only the `content` query param and preserve unrelated query params where practical.
- Preserve query, sort order, and view mode.
- Recompute available tags.
- Intersect selected tags with available tags so hidden filters cannot force a false empty state.
- Update result count and empty-state nouns.
- Do not change the default on first render: missing `content` param resolves to posts/list, and `content=posts` also resolves to posts/list.

Search publications by title, description, synopsis, and tags. Search posts by title, excerpt, body-derived search text only if intentionally indexed, publication title, and tags. Do not send full post bodies to the client unless client-side body search is intentionally required.

AND-match selected tags. For relevance, publications use `relId`; posts use an explicit editorial rank when provided, otherwise newest-first is a defensible blog ordering. Label the behavior accurately. Date sorts use validated `created` dates.

## 4. Publication and post pages

Publication page: breadcrumb, title, state badges, description/date, posts-default tab, optional synopsis/editor-notes tabs, and a post browser with list/cards defaulting to list.

Post reader: exact param validation, breadcrumb back to combined library and publication, publication label, post metadata, title, safe Markdown, and adjacent posts by index. Strip one leading H1 if the route already renders the title. Use `$11ai-blog-markdown-components` for `react-markdown`/GFM rendering, prose component styles, custom embeds, and renderer/TOC heading parity. Use `$11ai-blog-content-format` to ensure content uses the expected leading-H1/body-heading pattern. Generate SEO metadata from post title/excerpt/image and static params from the registry.

Load and render `content` on the server. Omit `content` from client-side list and card preview payloads when it is not needed there.

Only when the user explicitly requests tiered access, replace `content` with the legacy fields `freeContent`, `authContent`, `memberContent`, and `subscriberContent`. Make the authorization decision on the server and never serialize unauthorized fields or derived text to the client.

## 5. Layouts and accessibility

Post results show publication context, post title, excerpt, created date, optional updated date, state/tag badges, and optional image. Publication results show title, description, post count, created date, optional updated date, state/tag badges, and optional image. Preserve these signals in list and card layouts.

Use a responsive card grid and full-width list rows. Every result has one semantic link surface, visible focus, and a meaningful accessible name. Give both single-select toggles labels; ignore empty selection callbacks. Announce result count changes through visible text (and an `aria-live="polite"` region when updates are otherwise unclear).

## 6. Validation and acceptance

Validate unique positive IDs, unique publication IDs, optional unique post slugs within each publication, real ISO `created` dates, optional real ISO `updated` dates that are not before `created`, non-empty copy, normalized tags, and non-empty `content` when a readable body is required. Derive URLs and adjacency rather than duplicating them.

- [ ] First render shows posts in list view.
- [ ] Content selector switches one result surface between posts/publications.
- [ ] Layout selector switches either type between list/cards.
- [ ] Query/sort/layout persist across type switches.
- [ ] Invalid selected tags are removed on type switch.
- [ ] Content switching is URL-backed: `/blog` defaults to posts, `?content=posts` keeps posts selected, `?content=publications` selects publications, and `?content=authors` selects authors when enabled.
- [ ] Flattened posts show correct publication context and routes.
- [ ] Search/filter/sort operate only on selected type.
- [ ] If Authors are enabled, the same library surface includes an Authors content mode with author cards, search, and tag filters.
- [ ] Publication pages browse nested posts.
- [ ] Post readers handle sparse IDs and content safely.
- [ ] Invalid metadata/params fail deterministically.
- [ ] Keyboard, mobile, dark mode, typecheck, lint, tests, and build pass.
