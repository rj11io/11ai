# 11ai Markdown components implementation

## 1. Dependencies and boundary

Use `react-markdown` for standard Markdown and `remark-gfm` for GitHub-flavored Markdown:

```bash
npm install react-markdown remark-gfm unified remark-parse mdast-util-to-string unist-util-visit
```

Keep the extension boundary small:

- normal Markdown and GFM go through `react-markdown`;
- custom embeds are explicit, documented conventions;
- no raw HTML unless the project has sanitization and a specific need;
- no half-MDX component language unless the user asks for MDX.

Pair this renderer contract with `$11ai-blog-content-format` so generated/imported Markdown uses the supported syntax and the correct leading-H1/body-heading pattern. Use `$11ai-blog-content-generation` only when the user asks to create new content for the renderer.

## 2. Shared heading contract

Renderer and TOC extraction must agree on:

- included levels, usually `h2` through `h5`;
- visible text label extraction;
- slug policy;
- duplicate suffixes;
- excluded content such as fenced code blocks;
- scroll margin/offset.

Use an AST extractor that matches Markdown parsing instead of regex line scanning:

```ts
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export type MarkdownHeading = {
  id: string;
  label: string;
  level: 2 | 3 | 4 | 5;
};

export function createHeadingIdFactory() {
  const occurrences = new Map<string, number>();

  return (label: string) => {
    const base =
      label
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "section";
    const count = occurrences.get(base) ?? 0;
    occurrences.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

export function extractMarkdownHeadings(content: string) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(content);
  const createId = createHeadingIdFactory();
  const headings: MarkdownHeading[] = [];

  visit(tree, "heading", (node) => {
    const depth = "depth" in node ? node.depth : undefined;
    if (depth !== 2 && depth !== 3 && depth !== 4 && depth !== 5) return;
    const label = toString(node).trim();
    if (!label) return;
    headings.push({ id: createId(label), label, level: depth });
  });

  return headings;
}
```

Render headings with the same ID factory in document order. Add `data-blog-heading` and the same scroll offset used by the TOC.

## 3. Renderer component map

Define explicit renderers/styles for:

- `h2`, `h3`, `h4`, `h5`;
- `p`;
- `strong`, `em`, `del`;
- inline `code`;
- fenced code blocks with `language-*` classes and `data-language`;
- `blockquote`;
- `ul`, `ol`, `li`, nested lists;
- `hr`;
- `table`, `thead`, `th`, `td`;
- task-list checkboxes;
- `a`;
- `img`.

Use the host's tokens/classes. For 11ai-style Tailwind:

```txt
text-foreground
text-muted-foreground
border-border
bg-muted/50
text-primary
focus-visible:ring-ring
rounded-2xl
```

## 4. Link policy

Same-site paths should use the host router/link component:

```ts
export function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}
```

For Next.js:

```tsx
if (isInternalHref(href)) return <Link href={href}>{children}</Link>;
```

External HTTP(S) links:

```tsx
<a href={href} target="_blank" rel="noopener noreferrer">
  {children}
</a>
```

Hash links can remain native anchors.

## 5. Images

Markdown images usually do not carry dimensions. Use raw `<img>` when width/height are unknown and style it with responsive layout defaults. Use `next/image` only when the content model provides dimensions, static imports, or a known image manifest.

Recommended defaults:

- preserve `alt`;
- responsive `width: 100%`;
- rounded bordered container;
- avoid layout-breaking fixed dimensions.

## 6. YouTube embeds

Use a clear convention:

```md
@[youtube](dQw4w9WgXcQ)
```

Optionally support standalone URL paragraphs:

```md
https://youtu.be/dQw4w9WgXcQ
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

Transform the paragraph through a small remark plugin that sets `data.hName = "youtube-embed"` and passes the video ID as a property. Render with `https://www.youtube-nocookie.com/embed/VIDEO_ID`, a 16:9 aspect ratio, lazy loading, and `allowFullScreen`.

## 7. Demo page/post

Add a dedicated Markdown demo page or demo post showing:

- heading levels;
- paragraphs, bold, italic, strikethrough, inline code;
- internal links and external links;
- unordered, ordered, nested, and task lists;
- blockquotes;
- horizontal rules;
- tables;
- fenced code blocks for `tsx`, `bash`, and another language if useful;
- images;
- YouTube embeds;
- edge cases such as duplicate headings and heading-looking text inside code fences.

If the demo is not real editorial content, keep it on a clear route such as `/blog/markdown-components` or mark it as demo content.

## 8. Tests

Unit tests:

- heading extraction with formatted headings;
- duplicate heading IDs;
- fenced code blocks do not create headings;
- `h5` inclusion if supported;
- internal/external link classification;
- YouTube ID parsing.

Browser/e2e tests:

- demo page renders;
- TOC links point to generated IDs;
- code blocks preserve language classes;
- external links have `target="_blank"` and `rel="noopener noreferrer"`;
- internal links have same-site hrefs;
- YouTube iframe renders;
- GFM table/task list renders.

Production verification:

- typecheck;
- lint;
- test;
- build.
