# TOC scaffold from latest 11ai

Use these snippets when recreating the current 11ai implementation. Adapt class names and paths to the host.

## Shared AST heading helpers

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

export const CONTENT_HEADING_OFFSET = 96;

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

export function extractMarkdownHeadings(content: string): MarkdownHeading[] {
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

For a deliberately line-oriented renderer, use the fence-aware fallback from [implementation.md](implementation.md). For current 11ai-style `react-markdown` blogs, prefer this AST helper so renderer IDs and TOC extraction share Markdown/GFM parsing.

## Client TOC behavior

Key implementation details:

- render native `<a href="#id">` links;
- set `aria-current="location"` on the active link;
- lock immediately to a clicked/hash target;
- re-resolve heading DOM elements inside update/select functions;
- keep hash lock until wheel, touch, or scroll-navigation key input;
- select the final heading when the viewport reaches document bottom;
- render desktop sticky nav and mobile `details`/`summary` from shared links;
- hide the whole component for zero headings.

```ts
function getHeadingElements(headings: MarkdownHeading[]) {
  return headings
    .map((heading) => document.getElementById(heading.id))
    .filter((element): element is HTMLElement => element !== null);
}

function calculateActiveId(elements: HTMLElement[]) {
  const isAtPageBottom =
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 2;

  let nextActiveId = elements[0]?.id ?? null;
  if (isAtPageBottom) return elements.at(-1)?.id ?? nextActiveId;

  for (const element of elements) {
    if (element.getBoundingClientRect().top > CONTENT_HEADING_OFFSET + 1) break;
    nextActiveId = element.id;
  }

  return nextActiveId;
}
```

## Tests to copy

- formatted headings produce stable IDs;
- duplicate headings get numeric suffixes;
- fenced-code heading-looking lines are ignored by extraction;
- deep-link load marks the hash target active;
- clicking the final TOC link keeps it active at page bottom;
- mobile `details` remains open after selecting a section.
