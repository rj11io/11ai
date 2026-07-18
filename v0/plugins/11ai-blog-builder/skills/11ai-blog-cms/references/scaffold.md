# CMS scaffold snippets

Use these as a 11ai-style starting point. Adapt imports, route prefixes, and styling to the target.

## Routes

```ts
import type { Post } from "./types";

export const blogHref = "/v1/blog";

export function publicationHref(pubId: string) {
  return `${blogHref}/publications/${encodeURIComponent(pubId)}`;
}

export function postHref(pubId: string, post: Pick<Post, "postId" | "slug">) {
  return `${publicationHref(pubId)}/${encodeURIComponent(
    post.slug ?? String(post.postId),
  )}`;
}
```

## Core types

```ts
export type Post = {
  postId: number;
  slug?: string;
  title: string;
  excerpt?: string;
  created: string;
  updated?: string;
  coverImage?: string;
  authorIds?: string[]; // required when using 11ai-blog-authors
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

// Add `authors: AuthorPreview[]` with 11ai-blog-authors.

export type PostPreview = Omit<PostListItem, "content" | "authorIds">;

export type PublicationPreview = Omit<Publication, "posts"> & {
  href: string;
  postCount: number;
};
```

## Registry derivation

```ts
export const publications: Publication[] = [
  signalPath,
  materialCulture,
  localWeather,
];

validatePublications(publications);

export const allPosts: PostListItem[] = publications.flatMap((publication) =>
  publication.posts.map((post, editorialIndex) => ({
    ...post,
    publicationId: publication.pubId,
    publicationTitle: publication.title,
    publicationHref: publicationHref(publication.pubId),
    href: postHref(publication.pubId, post),
    editorialIndex,
  })),
);

export const publicationPreviews = publications.map(
  ({ posts, ...publication }) => ({
    ...publication,
    href: publicationHref(publication.pubId),
    postCount: posts.length,
  }),
);

export function getPublication(pubId: string) {
  return publications.find((publication) => publication.pubId === pubId);
}

export function getPost(pubId: string, postKey: string) {
  const publication = getPublication(pubId);
  if (!publication) return undefined;

  const postIndex = publication.posts.findIndex(
    (post) => post.slug === postKey || String(post.postId) === postKey,
  );
  if (postIndex === -1) return undefined;

  return {
    publication,
    post: publication.posts[postIndex],
    postIndex,
  };
}

export function getPostContent(post: Post) {
  return post.content?.trim() || null;
}

export function stripLeadingH1(markdown: string) {
  return markdown.replace(/^\s*#\s+[^\n]+\n+/, "");
}
```

When `$11ai-blog-authors` is active, `getPost` should also return resolved author previews, `PostListItem` should include `authors`, and `toPostPreview` should omit raw `authorIds` and `content` from client list payloads.

## Validation helpers

```ts
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertDate(value: string, label: string) {
  if (!isoDatePattern.test(value)) {
    throw new Error(`${label} must use YYYY-MM-DD format`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.valueOf()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`${label} must be a real ISO date`);
  }
}

function assertOptionalUpdatedDate(
  created: string,
  updated: string | undefined,
  label: string,
) {
  if (!updated) return;
  assertDate(updated, `${label}.updated`);

  if (updated < created) {
    throw new Error(`${label}.updated must not be before ${label}.created`);
  }
}
```

Validate publication IDs, post IDs, optional post slugs, `created`, optional `updated`, non-empty titles/descriptions, normalized tags, and non-empty `content` for public readable posts. When authors are enabled, also validate author records, links, non-empty `authorIds`, duplicate post authors, and unknown author references.

## Library state

```ts
type ContentType = "posts" | "publications"; // add "authors" with 11ai-blog-authors
type ViewMode = "list" | "cards";
type SortOrder = "relevance" | "newest" | "oldest";

const contentTypes = ["posts", "publications"] as const;
const contentParam = "content";

function getContentTypeFromParams(searchParams: URLSearchParams): ContentType {
  const value = searchParams.get(contentParam);
  return contentTypes.some((type) => type === value)
    ? (value as ContentType)
    : "posts";
}

function createContentHref(
  contentType: ContentType,
  searchParams: URLSearchParams,
) {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set(contentParam, contentType);
  return `?${nextParams.toString()}`;
}

const contentType = getContentTypeFromParams(searchParams);
const [viewMode, setViewMode] = React.useState<ViewMode>("list");
const [sortOrder, setSortOrder] = React.useState<SortOrder>("relevance");
const [query, setQuery] = React.useState("");
const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
```

When implementing in Next.js App Router, read the installed docs first. Use `useSearchParams` in the client library browser, wrap that browser in `Suspense` from the page when required by the framework, and render the content pills as links whose `href` updates `content`.

Add these browser rules:

- `content=posts` must be valid and shareable.
- Missing or unknown `content` values should render Posts selected without rewriting the URL.
- Date sorts compare `created`.
- Authors mode should hide date sorting unless there is a meaningful author date field.
- Selected tags should be intersected with the next content type's available tags so stale hidden filters cannot force a false empty state.

## Publication page shell

```tsx
export const dynamicParams = false;

export function generateStaticParams() {
  return publications.map((publication) => ({ pubId: publication.pubId }));
}

export async function generateMetadata({ params }: PublicationPageProps) {
  const { pubId } = await params;
  const publication = getPublication(pubId);
  if (!publication) return { title: "Publication not found" };

  return {
    title: publication.title,
    description: publication.description,
  };
}

export default async function PublicationPage({
  params,
}: PublicationPageProps) {
  const { pubId } = await params;
  const publication = getPublication(pubId);
  if (!publication) notFound();

  const previews = publication.posts.map((post) =>
    getPostPreview(publication, post),
  );

  // render breadcrumb, issue block, tags, title, description,
  // Created/Updated dates, post count, and PublicationBrowser.
}
```

## Post page shell

```tsx
export const dynamicParams = false;

export function generateStaticParams() {
  return allPosts.map((post) => ({
    pubId: post.publicationId,
    postId: post.slug ?? String(post.postId),
  }));
}

export default async function PostPage({ params }: PostPageProps) {
  const { pubId, postId } = await params;
  const result = getPost(pubId, postId);
  if (!result) notFound();

  const { publication, post, postIndex } = result;
  const content = getPostContent(post);
  const renderedContent = content ? stripLeadingH1(content) : null;
  const previous = publication.posts[postIndex - 1];
  const next = publication.posts[postIndex + 1];
  // extract headings from renderedContent, then render breadcrumb, title,
  // Created/Updated dates, metadata, Markdown, TOC, and adjacent posts.
}
```

For the Markdown renderer itself, use `$11ai-blog-markdown-components` rather than a custom line parser when the project needs GFM, fenced code blocks, tables, images, embeds, or TOC-aligned heading IDs.

For content files, use `$11ai-blog-content-format` to normalize titles, excerpts, dates, author IDs, tags, slugs, and Markdown body shape. Use `$11ai-blog-content-generation` only when the user asks to create new editorial content.

## Tests to copy

- Unit: registry flattens posts, omits raw `content` from previews, validates `created`/`updated`, and fails invalid slugs/tags/content.
- Browser: `/blog` defaults to Posts, `?content=posts` keeps Posts selected, `?content=publications` selects Publications, and unknown values fall back to Posts.
- Browser: publication pages render nested post browser tabs, search, tag filters, and created/updated metadata.
- Browser: post pages render content, adjacent links, and fail invalid params with the host's not-found behavior.
