# Publications CMS implementation contract

## Contents

1. Product behavior
2. Data contract
3. Architecture
4. Catalog state
5. Result layouts
6. Detail and reader
7. Validation and access
8. Acceptance checklist

## 1. Product behavior

Build a repository-managed library. A publication owns ordered chapters. Users browse publications, inspect one, browse its chapters, and read chapter Markdown. Editors publish by adding typed files and deploying.

Required screens:

- `/publications`: hero plus searchable/filterable/sortable results.
- `/publications/[pubId]`: breadcrumb, metadata, chapter browser, optional synopsis/author-notes tabs.
- `/publications/[pubId]/[chId]`: breadcrumb, chapter metadata, Markdown, previous/next controls.

## 2. Data contract

```ts
export type Chapter = {
  chId: number
  title: string
  description?: string
  releaseDate: string
  coverImage?: string
  isNSFW: boolean
  isNew: boolean
  tags: string[]
  content?: string
}

export type Publication = {
  relId: number
  pubId: string
  title: string
  description: string
  releaseDate: string
  isNSFW: boolean
  isNew: boolean
  tags: string[]
  synopsis?: string
  authorNotes?: string
  coverImage?: string
  chapters: Chapter[]
}
```

Derive routes with `publicationHref(pubId)` and `chapterHref(pubId, chId)`; do not repeat URLs in metadata.

```text
app/content/
  publications.ts
  <pub-id>/
    _chapters.ts
    chapter-1.ts
```

Each chapter module exports Markdown strings. Its index imports them and binds metadata. The root registry imports chapter indexes.

## 3. Architecture

- Server: load/validate registries, resolve params, load content, and generate metadata/static params.
- Client: search, filter disclosure, sort, view toggle, and result rendering.
- Pure utilities: routes, dates, filter/sort, adjacency, validation.

Recommended components: `publications-browser`, `publication-chapters-browser`, `catalog-controls`, publication/chapter result renderers, and `publication-markdown`. Share algorithms and controls before abstracting visually distinct result types.

## 4. Catalog state

```ts
type SortOrder = "relevance" | "newest" | "oldest"
type ViewMode = "list" | "cards"

const [query, setQuery] = useState("")
const [selectedTags, setSelectedTags] = useState<string[]>([])
const [sortOrder, setSortOrder] = useState<SortOrder>("relevance")
const [viewMode, setViewMode] = useState<ViewMode>("list")
```

Flatten, de-duplicate, and locale-sort tags. Search normalized title, description, synopsis where applicable, and tags. Require every selected tag. Relevance uses `relId` for publications and array order for chapters. Validate dates before date sorting.

Controls: search, sort, list/cards single-select toggle, filter disclosure, active tags/clear action, then collapsible tag choices. Ignore an empty single-toggle value so a layout always remains selected.

## 5. Result layouts

Default to list on every initial render. List results are full-width bordered rows. Cards use a responsive one/two/three-column grid. Both preserve title, description, release date, count or chapter number, restriction/new/tag badges, destination, and optional image. When an image is absent, retain a balanced text layout.

Render each result as one semantic `Link` surface, or a non-clickable container with one link. Ensure Enter activation and visible focus. Empty copy must identify publications versus chapters and suggest changing controls.

## 6. Detail and reader

Resolve exact `pubId` or 404. Show breadcrumb, title, badges, description, date, and a chapters-default tab set. Omit empty synopsis/author-notes tabs.

Validate the entire `chId` segment as a positive integer; reject `1-extra`. Resolve or 404. Determine adjacent chapters by array index. Show metadata, title, and Markdown. Remove only one leading H1 when already rendered. Use framework navigation for internal links and new-tab anchors for `http:`/`https:`. Keep raw HTML disabled unless sanitized. Require meaningful image alt text and validate schemes.

## 7. Validation and content

Validate positive unique `relId`/`chId`, unique lowercase URL-safe `pubId`, real ISO calendar dates, non-empty copy, trimmed/de-duplicated tags, and non-empty `content` when a readable body is required.

Default to the single `content?: string` field. Do not introduce access-tier fields unless the user explicitly requests tiered content.

For that explicitly requested legacy variant only, replace `content` with `freeContent`, `authContent`, `memberContent`, and `subscriberContent`. Select and combine authorized tiers on the server; never serialize unauthorized tier fields or derived text to the client.

## 8. Acceptance checklist

- [ ] Adding content requires only typed modules.
- [ ] Invalid/duplicate metadata fails before deployment.
- [ ] Both browsers search, AND-filter, and sort.
- [ ] Both offer list/cards and initialize to list.
- [ ] Layouts expose equivalent metadata and destinations.
- [ ] Optional tabs only appear with content.
- [ ] Invalid params 404; sparse IDs navigate correctly.
- [ ] Full content is omitted from catalog props unless intentionally required there.
- [ ] If tiered access was explicitly requested, unauthorized tiers are absent from HTML/props.
- [ ] Controls and links are keyboard accessible.
- [ ] Mobile, dark mode, typecheck, lint, tests, and build pass.
