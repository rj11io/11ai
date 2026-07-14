# Blog author implementation contract

## Contents

1. Architecture and invariants
2. Data model
3. Registry and validation
4. Post attribution migration
5. Bylines and previews
6. Library authors browser
7. Author detail pages
8. Metadata, accessibility, and security
9. Testing and acceptance

## 1. Architecture and invariants

Build four cooperating pieces:

1. A canonical author registry or CMS author collection.
2. Post attribution by stable author ID/reference.
3. A data access layer that resolves full authors and lightweight author previews.
4. UI routes/components for post bylines and author detail pages.

The hard invariant is single-source authorship: author profile data lives once, post records only reference it, and every render surface consumes resolved authors from one registry/data layer.

Recommended flow for file-backed content:

```text
authors[] + publications/posts[] -> validate -> resolve post.authors
                                            `-> author profile route + author post index
```

Avoid this drift-prone flow:

```text
post.authorName + post.authorAvatar + separate author page data
```

## 2. Data model

Use stable URL-safe IDs for authors. Names and display names can change later; IDs should not change without redirects.

Use `$11ai-blog-content-format` to normalize author-facing copy fields such as `bio`, tags, links, and display names. Use `$11ai-blog-content-generation` only when the user asks to generate author profiles or placeholder contributor records, and clearly label placeholders.

```ts
export type AuthorLink = {
  label: string;
  url: string;
};

export type Author = {
  id: string;
  name: string;
  displayName: string;
  bio: string;
  tags: string[];
  avatar?: string;
  links?: AuthorLink[];
};

export type AuthorPreview = Pick<
  Author,
  "id" | "name" | "displayName" | "avatar"
>;

export type AuthorListItem = Pick<
  Author,
  "id" | "name" | "displayName" | "bio" | "avatar" | "tags"
> & {
  href: string;
  postCount: number;
};

export type Post = {
  title: string;
  slug?: string;
  created: string;
  updated?: string;
  authorIds: string[];
  // existing post fields...
};
```

Optional fields may include role, location, pronouns, organization, social handles, shortBio, longBio, or featured links. Keep the required core small unless the product needs more. Tags should describe author expertise or editorial areas and power author browsing/filtering when the host has a library surface.

For a CMS, represent `authorIds` as relationship fields or references, then normalize the fetched payload to the same view model before UI rendering.

## 3. Registry and validation

Resolve authors centrally:

```ts
const authorsById = new Map(authors.map((author) => [author.id, author]));

function toAuthorPreview(author: Author): AuthorPreview {
  return {
    id: author.id,
    name: author.name,
    displayName: author.displayName,
    avatar: author.avatar,
  };
}

function resolveAuthors(post: Post) {
  return post.authorIds.map((authorId) => {
    const author = authorsById.get(authorId);
    if (!author) {
      throw new Error(`${post.title} references unknown author ${authorId}`);
    }
    return toAuthorPreview(author);
  });
}

export function getAuthor(authorId: string) {
  return authorsById.get(authorId);
}

export function getPostsByAuthor(authorId: string) {
  return postPreviews.filter((post) =>
    post.authors.some((author) => author.id === authorId),
  );
}
```

Validation should run at startup/build for static content and before render for fetched content. Validate:

- author ID is URL-safe and unique;
- author name, display name, and bio are non-empty;
- author tags are non-empty, trimmed, and unique when tags are required by the browse surface;
- external links are absolute HTTP(S) URLs;
- every post has at least one author unless anonymous posts are an explicit product policy;
- no post has duplicate author IDs;
- every referenced author ID exists;
- route slugs do not collide with reserved segments;
- avatar paths conform to the host image/static asset policy.

Example URL-safe slug pattern:

```ts
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
```

## 4. Post attribution migration

For existing blogs:

1. Inventory current posts and any existing author/person metadata.
2. Create or normalize author records.
3. Add `authorIds` or equivalent references to each post.
4. Use mixed attribution deliberately so multi-author behavior is visible in development and tests.
5. Preserve existing public author URLs when possible.
6. Add redirects if changing author slugs in a public site.

For placeholder authors, make the placeholder status clear in the bio or development seed data. Do not ship fake identities as real contributors.

## 5. Bylines and previews

Render post-page bylines near the article title and excerpt. Each author should be independently linked:

```tsx
function AuthorByline({ authors }: { authors: AuthorPreview[] }) {
  return (
    <div aria-label="Authors">
      <p>Written by</p>
      <ul>
        {authors.map((author) => (
          <li key={author.id}>
            <Link href={authorHref(author.id)}>
              <AuthorAvatar author={author} />
              <span>{author.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Avatar behavior:

- Use the host image component when it provides optimization and layout stability.
- Use empty `alt=""` when the adjacent text names the author.
- Use initials/displayName fallback when no avatar exists.
- Keep image dimensions explicit when required by the framework.

For post list cards, include a compact "By Name" line. For search/filter surfaces, include author names and display names in searchable text. Avoid making author chips inside a fully clickable card unless nested interactive controls are valid in the host markup.

Name formatting should handle one, two, and three-or-more authors:

```ts
function formatAuthorNames(authors: AuthorPreview[]) {
  if (authors.length === 1) return authors[0].name;
  if (authors.length === 2) return `${authors[0].name} and ${authors[1].name}`;
  return `${authors
    .slice(0, -1)
    .map((author) => author.name)
    .join(", ")}, and ${authors.at(-1)?.name}`;
}
```

Localize this if the host site supports multiple languages.

## 6. Library authors browser

If the blog has a library or collection browser with content pills/tabs, add Authors as a peer content type rather than a disconnected section:

```text
Content: Posts | Publications | Authors
```

If the host library selector is URL-backed, extend the same `content` query-param contract instead of adding author-only state. The expected 11ai behavior is:

- `/blog` defaults to Posts.
- `/blog?content=posts` also selects Posts and is allowed.
- `/blog?content=publications` selects Publications.
- `/blog?content=authors` selects Authors.
- Unknown values fall back to Posts without blocking rendering.

The Authors mode should use resolved author list items:

```ts
export const authorPreviews: AuthorListItem[] = authors.map((author) => ({
  id: author.id,
  name: author.name,
  displayName: author.displayName,
  bio: author.bio,
  avatar: author.avatar,
  tags: author.tags,
  href: authorHref(author.id),
  postCount: getPostsByAuthor(author.id).length,
}));
```

Author browse behavior:

- Render author cards or rows with avatar/initials, name, display name, bio, tags, post count, and profile link.
- Search by name, display name, bio, and tags.
- Filter by author tags when tags exist.
- Preserve existing layout controls when they apply. Hide date sorting for authors unless the product has a meaningful author sort such as alphabetical, newest contributor, or most posts.
- Keep the result-count copy correct: "1 author" vs "N authors".
- Add browser coverage for direct load of `content=authors`, switching between Posts/Publications/Authors, and default `/blog` behavior.
- Ensure clicking an author result lands on the same canonical author detail route used by bylines.

Avoid nested interactive elements if the entire card is a link. If individual tag buttons are filters, keep them outside the card link or make the card itself non-linking.

## 7. Author detail pages

Author pages should show:

- avatar or initials fallback;
- name and display name;
- bio;
- tags;
- safe external profile links;
- count of attributed posts when useful;
- list of posts by that author with publication/category, date, title, excerpt, and canonical post URL.

Recommended route shapes:

```text
/blog/authors/[authorId]
/v1/blog/authors/[authorId]
/authors/[authorId]
```

Choose the route that matches the host blog's existing URL hierarchy.

For Next.js App Router, follow the installed documentation. A static file-backed implementation usually looks like:

```tsx
export const dynamicParams = false;

export function generateStaticParams() {
  return authors.map((author) => ({ authorId: author.id }));
}

export async function generateMetadata({ params }: AuthorPageProps) {
  const { authorId } = await params;
  const author = getAuthor(authorId);
  if (!author) return { title: "Author not found" };

  return {
    title: author.name,
    description: author.bio,
  };
}
```

Keep the page server-rendered unless it needs client-only interactions.

## 8. Metadata, accessibility, and security

Metadata:

- Add author names to post metadata when the framework supports it.
- Use author page title and bio for profile page metadata.
- If the site emits JSON-LD, model authors as `Person` or `Organization` according to the actual contributor.

Accessibility:

- Label the byline region or make its text self-explanatory.
- Keep author names as readable link text.
- Preserve visible focus styles.
- Use semantic lists for multiple authors and author-post collections.
- Use semantic controls for the Authors browse pill/tab and expose selected state with the host's existing tab/toggle pattern.
- Do not rely on avatar images alone to communicate identity.

Security:

- Validate external author links before rendering.
- Render external links with `rel="noreferrer"` or the host's standard external-link policy when using `target="_blank"`.
- Do not render unsanitized author bios as HTML unless the host has a proven sanitization pipeline.
- Avoid leaking private CMS/person fields into public author payloads.

## 9. Testing and acceptance

### Unit fixtures

Cover:

- author registry contains valid author records and any user-required identities;
- author tags validate and are exposed in author list items;
- duplicate author IDs fail validation;
- invalid author links fail validation;
- posts without authors fail validation;
- unknown author references fail validation;
- duplicate author IDs on one post fail validation;
- post previews resolve one author;
- post previews resolve multiple authors in order;
- `getPostsByAuthor` returns only posts attributed to that author;
- author name formatting handles one, two, and three-or-more authors.

### Integration/component checks

- Post page renders the byline near article metadata.
- Every byline author link points at the expected author route.
- Avatar rendering uses the image path when present and initials fallback when absent.
- Blog list/search includes author names if that surface was updated.
- Author page renders profile metadata, links, and attributed posts.
- Library/browse surface includes an Authors pill/tab next to Posts/Publications.
- Authors mode renders author cards/rows with tags and post counts.
- Author search includes name, display name, bio, and tags.
- Author tag filters activate selected state and every visible author result contains the selected tag. Only assert a reduced result count when the fixture deliberately includes at least one non-matching author for that selected tag.
- Missing author route returns the host's not-found behavior.

### Real-browser checks

- Navigate directly to an author page and see profile details.
- Open the library Authors tab and see author cards/rows.
- Filter Authors by a rendered author tag chosen at test time and verify the selected state plus visible author results. Avoid hard-coding a seed-specific tag or assuming the tag excludes a specific named author unless that is the explicit fixture under test.
- Click a post-page byline author and land on the correct author page.
- Multi-author posts show all authors and each link works.
- Return from an author page to a listed post and reach the canonical post URL.
- Keyboard focus can reach and activate byline links, external author links, and author-post links.
- Responsive layouts do not hide or overlap author metadata.

### Delivery gate

- [ ] Author data lives in one canonical registry or CMS collection.
- [ ] Posts support one or more authors through stable IDs/references.
- [ ] Broken, empty, duplicate, and malformed author data is validated.
- [ ] Post bylines are visible, accessible, and linked.
- [ ] Author profile pages are routable, refreshable, and shareable.
- [ ] Author pages list attributed posts through canonical URLs.
- [ ] Library/browse surface includes Authors next to Posts/Publications.
- [ ] Author tags render and filter correctly where browsing exists.
- [ ] Avatars have deterministic fallbacks.
- [ ] Metadata and external-link handling follow the host framework.
- [ ] Unit and browser tests cover one-author and multi-author posts.
- [ ] Browser tests derive author names, profile URLs, post titles, and tag names from rendered data unless the test is explicitly validating a fixed seed fixture.
- [ ] Typecheck, lint, tests, and production build pass.
