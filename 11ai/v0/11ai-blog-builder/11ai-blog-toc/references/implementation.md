# Blog table-of-contents implementation contract

## Contents

1. Architecture and invariants
2. Heading model and transform
3. Article integration
4. Active-section behavior
5. Responsive UI and accessibility
6. Performance and lifecycle
7. Testing and acceptance

## 1. Architecture and invariants

Build four cooperating pieces:

1. A content transform that recognizes eligible headings in document order.
2. A renderer that emits deterministic, unique heading IDs.
3. A server/build integration that gives the interactive component a small serializable heading list.
4. A client scrollspy that renders native fragment links and tracks the current section.

The hard invariant is heading parity: the TOC and rendered article must share heading recognition, label normalization, slugging, duplicate handling, ordering, and offsets. For `react-markdown`/GFM blogs, use `$11ai-blog-markdown-components` to define the shared AST heading contract. Prefer one AST traversal that both assigns IDs and collects metadata. If the host exposes renderer heading components but not an AST, centralize helpers and prove parity with tests.

Use `$11ai-blog-content-format` for imported/generated articles so body content avoids extra H1s, uses meaningful `h2`-`h5` section headings, and does not rely on headings inside fenced code blocks.

```ts
export type TocHeading = {
  id: string;
  label: string;
  level: 2 | 3 | 4 | 5;
};
```

Adjust eligible levels only when the target content model requires it. Do not include the route-owned article H1 by default. If the source body begins with a duplicated H1, remove it before both extraction and rendering.

Recommended flow:

```text
source -> parse once -> assign heading IDs -> render article
                         `-> collect TocHeading[] -> client TOC
```

For a deliberately small line renderer, this split flow is acceptable only when helper functions are shared and the supported Markdown subset is documented:

```text
source -> shared line extractor -> TOC
source -> line renderer using the same heading helpers -> heading IDs
```

## 2. Heading model and transform

### Label extraction

The label must match the heading's visible plain text. With an AST, collect text descendants and define how code, images, links, entities, and inline HTML contribute. Never inject heading HTML into a temporary DOM solely to recover text.

For a deliberately limited Markdown dialect like 11ai, a small normalizer is acceptable when the renderer supports the same inline syntax for headings:

```ts
export function headingLabel(source: string) {
  return source
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[*_~]/g, "")
    .trim();
}
```

### IDs and duplicates

Choose an explicit slug policy. The following policy is readable for Latin text, deterministic across server and browser environments, and collision-safe within one document:

```ts
export function createHeadingIdFactory() {
  const occurrences = new Map<string, number>();

  return (label: string) => {
    const base =
      label
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "section";

    const count = occurrences.get(base) ?? 0;
    occurrences.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}
```

If non-Latin content is common, replace the ASCII policy with a Unicode-aware slugger, transliteration, or stable opaque IDs. Pin the behavior with fixtures. Do not use locale-sensitive lowercasing without a fixed locale.

Start a fresh factory for each document and visit headings in the same order during metadata collection and rendering. IDs must remain stable for unchanged source; inserting an earlier duplicate may necessarily renumber later duplicates.

### Limited line-parser fallback

If the host is intentionally line-oriented, define fence behavior explicitly. The latest 11ai extractor is fence-aware and ignores heading-like text inside fenced code. If the renderer can receive fenced code, it should either render/skip fenced blocks consistently or the content contract must state that fenced blocks are unsupported.

Track the opening marker character and length; close only with the same marker and at least the opening length.

```ts
type Fence = { marker: "`" | "~"; length: number };

function updateFence(
  line: string,
  fence: Fence | null,
): Fence | null | undefined {
  const match = line.trim().match(/^(`{3,}|~{3,})/);
  if (!match) return undefined;
  const marker = match[1][0] as Fence["marker"];
  if (!fence) return { marker, length: match[1].length };
  if (fence.marker === marker && match[1].length >= fence.length) return null;
  return fence;
}
```

Also decide whether to support closing hashes, indented code, escaped markers, setext headings, HTML blocks, and multiline constructs. A partial Markdown parser is acceptable only when its limitations are intentional, documented, and tested.

### Hierarchy

Use a flat heading array for active tracking. For presentation, either render it flat when the content contract is intentionally shallow or derive a nested tree. When nesting, define skipped-level behavior; attach a deeper heading to the nearest preceding shallower heading rather than inventing unlabeled nodes unless the design explicitly requires them.

## 3. Article integration

Keep server-rendered routes as server components. Parse/load the article there and pass only `TocHeading[]` into the interactive leaf.

```tsx
export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticle(await params);
  const { content, headings } = renderArticleWithHeadings(article.body);

  return (
    <main className="article-layout">
      <ArticleToc headings={headings} />
      <article>{content}</article>
    </main>
  );
}
```

For Next.js, follow the installed version's documentation. Pages are server components by default; keep the `"use client"` boundary in the TOC file because it needs state, effects, event handlers, and browser APIs. Props crossing that boundary must remain serializable. Do not copy route APIs from another Next.js version.

Each rendered heading needs its ID and a scroll offset:

```tsx
<h2 id={id} style={{ scrollMarginTop: "var(--article-heading-offset)" }}>
  {children}
</h2>
```

Prefer one CSS custom property for responsive fixed-header layouts:

```css
:root {
  --article-heading-offset: 6rem;
}

@media (min-width: 64rem) {
  :root {
    --article-heading-offset: 5rem;
  }
}
```

Read the resolved pixel value in the client when active detection needs it, or set a matching data/config value from the same layout module. Avoid unrelated magic numbers in CSS and TypeScript.

Recommended large-screen layout:

```css
.article-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

@media (min-width: 64rem) {
  .article-layout {
    grid-template-columns: 15rem minmax(0, 1fr);
    gap: 4rem;
  }
}
```

`minmax(0, 1fr)` and `min-width: 0` prevent long article content from forcing horizontal overflow.

## 4. Active-section behavior

### Selection rule

Resolve the elements named by `headings` at selection/update time. Ignore missing elements without throwing, but report the parity violation in development. Re-resolving on every update matches the latest 11ai implementation and prevents stale targets when hydration or layout changes happen around a deep link. On every update:

1. If anchor navigation is locked, retain the target.
2. If the viewport is at document bottom within a small rounding tolerance, select the final resolved heading.
3. Otherwise select the last heading whose top is at or above `offset + epsilon`.
4. Before the first heading crosses the line, select the first heading unless the product intentionally wants no active item.
5. Avoid a state update when the ID has not changed.

```ts
function calculateActiveId(elements: HTMLElement[], offset: number) {
  let next = elements[0]?.id ?? null;
  const atBottom =
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 2;

  if (atBottom) return elements.at(-1)?.id ?? next;

  for (const element of elements) {
    if (element.getBoundingClientRect().top > offset + 1) break;
    next = element.id;
  }
  return next;
}
```

The bottom override is required: a short final section may never reach the activation line.

### Hash initialization and native navigation

Links must be native anchors:

```tsx
<a
  href={`#${heading.id}`}
  aria-current={activeId === heading.id ? "location" : undefined}
  onClick={() => lockToHeading(heading.id)}
>
  {heading.label}
</a>
```

After mount, schedule one animation frame. If `location.hash` names a resolved heading, lock/select it; otherwise calculate from geometry. Listen for `hashchange` so history and external hash changes update the active target. Do not immediately release the hash lock during browser-managed anchor movement; keep it until user navigation input unless the product implements a tested `scrollend` release.

Decode a hash only if the slug policy can emit encoded characters. Guard malformed percent sequences. ASCII slugs can compare `location.hash.slice(1)` directly.

### Navigation lock

Anchor scrolling can emit scroll events for intermediate headings. Lock to the activated target immediately, then release through an explicit policy. At minimum, release on:

- wheel input;
- touch start;
- scroll-navigation keys: arrows, Page Up/Down, Home, End, and Space.

For programmatic scrolling or smooth scrolling, consider `scrollend` with a tested timer fallback. Do not release on the first scroll event, which defeats the lock. Document whether a deep-link hash remains locked until user input.

### Scheduling and cleanup

For long articles, bound geometry work to one animation frame:

```ts
let frame = 0;

function scheduleUpdate() {
  if (frame || navigationLock.current) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    updateActiveHeading();
  });
}
```

For short/medium 11ai-style posts, direct update on passive scroll is acceptable. For long articles, schedule as above. Use passive scroll, wheel, and touch listeners. Listen to resize because both viewport geometry and responsive offsets can change. Remove every listener and cancel pending animation frames in effect cleanup.

`IntersectionObserver` is a valid alternative only after testing upward scrolling, initial deep links, short final sections, responsive offsets, and dynamically inserted headings. It still usually needs an explicit bottom rule.

## 5. Responsive UI and accessibility

Render shared link content into two presentation shells:

- Desktop: visible at the project breakpoint, sticky below the top inset.
- Mobile: native `details`/`summary`, hidden at the desktop breakpoint.

Keep the mobile disclosure open after selecting a section unless the product explicitly requires auto-close. Auto-closing can remove useful orientation and must be tested for focus behavior.

Semantic requirements:

- Wrap links in `nav aria-label="Table of contents"`.
- Use a list; use nested lists if representing actual heading hierarchy.
- Set `aria-current="location"` only on the active fragment link.
- Keep links in document order and preserve native keyboard activation.
- Provide visible focus styles independent of hover and active styles.
- Ensure active/inactive text and borders meet contrast requirements.
- Keep article heading levels logical; do not change content semantics merely for TOC styling.
- Hide the whole TOC for an empty heading list.

The desktop TOC should appear before the article in source order only if that order is appropriate on mobile and for assistive technology. Otherwise use layout composition rather than CSS visual reordering that makes focus order confusing.

## 6. Performance and lifecycle

- Parse headings once per article whenever possible.
- Serialize only ID, label, level, and any required hierarchy data—not the full body—to the client component.
- Resolve DOM targets once per stable headings array. Re-resolve through a mutation/content lifecycle only when headings can change after hydration.
- Schedule layout reads; do not scan every heading on every raw scroll event.
- Keep the TOC client boundary small. Static article rendering, content fetching, and sanitization belong outside it.
- Preserve TOC failure isolation: missing targets should not prevent article reading.
- Avoid custom smooth-scroll animation by default. Native behavior plus `scroll-margin-top` is more robust and respects platform preferences.

## 7. Testing and acceptance

### Unit fixtures

Cover:

- level inclusion/exclusion;
- formatted visible labels;
- duplicate labels and fallback IDs;
- accents and the chosen non-Latin policy;
- CRLF and LF input when using a line parser;
- both fence marker types, longer closing fences, unmatched/mismatched fences for extraction; renderer fence behavior must be either implemented or documented as unsupported;
- skipped heading levels and nested-tree behavior;
- empty and single-heading documents.

### Integration/component checks

- Every TOC ID resolves to exactly one rendered heading.
- Rendered heading IDs exactly equal extracted IDs in order.
- Empty headings render no TOC.
- Active link alone has `aria-current="location"`.
- Both navigation variants have accessible labels and visible focus styles.
- Effect cleanup removes listeners and cancels frames.

### Real-browser checks

- Direct navigation to a deep hash selects and positions the target.
- Clicking a TOC link changes the URL hash and keeps the target active during native scrolling.
- Back/forward hash history updates active state.
- Manual wheel, touch, and keyboard scrolling release the lock and update active state.
- The final heading becomes active at document bottom even when its section is short.
- Resize across the breakpoint preserves correct active state and offset.
- The mobile disclosure remains usable and follows the chosen open/close policy.
- A long synthetic article does not cause visible scroll jank.
- No-JavaScript fragment navigation still reaches headings.

### Delivery gate

- [ ] One heading interpretation drives metadata and rendered IDs.
- [ ] Duplicate and Unicode policies are documented and tested.
- [ ] Native fragments, deep links, and history work.
- [ ] Shared offset handles fixed/responsive headers.
- [ ] Bottom-of-page logic selects the final section.
- [ ] Navigation lock and release policy are explicit.
- [ ] Desktop and mobile variants are accessible and responsive.
- [ ] Client boundary contains only interaction code and serializable props.
- [ ] Unit, integration, and browser tests pass.
- [ ] Typecheck, lint, and production build pass.
