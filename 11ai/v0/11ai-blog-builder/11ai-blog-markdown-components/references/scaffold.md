# Markdown components scaffold snippets

Use these as a 11ai-style starting point. Adapt imports, route prefixes, classes, and image policy to the target.

## Shared heading helpers

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

export function markdownHeadingLabel(node: unknown) {
  return toString(node).trim();
}

export function extractMarkdownHeadings(content: string): MarkdownHeading[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(content);
  const createId = createHeadingIdFactory();
  const headings: MarkdownHeading[] = [];

  visit(tree, "heading", (node) => {
    const depth = "depth" in node ? node.depth : undefined;
    if (depth !== 2 && depth !== 3 && depth !== 4 && depth !== 5) return;

    const label = markdownHeadingLabel(node);
    if (!label) return;

    headings.push({ id: createId(label), label, level: depth });
  });

  return headings;
}
```

## Link and YouTube helpers

```ts
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

type MarkdownNode = {
  type?: string;
  value?: string;
  url?: string;
  children?: MarkdownNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, string>;
  };
};

const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/;

export function isInternalHref(href: string) {
  return (
    href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/\\")
  );
}

export function getYouTubeVideoId(value: string) {
  const trimmed = value.trim();
  const shortcode = trimmed.match(/^@\[youtube\]\(([^)\s]+)\)$/i);
  if (shortcode) {
    return youtubeIdPattern.test(shortcode[1]) ? shortcode[1] : null;
  }

  const urlMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/,
  );
  return urlMatch?.[1] ?? null;
}

function markdownText(node: MarkdownNode): string {
  if (node.type === "text" || node.type === "inlineCode") {
    return node.value ?? "";
  }

  return node.children?.map(markdownText).join("") ?? "";
}

export const remarkYouTube: Plugin = () => (tree) => {
  visit(tree, "paragraph", (node) => {
    const paragraph = node as MarkdownNode;
    const videoId = getYouTubeVideoId(markdownText(paragraph));

    if (videoId) {
      paragraph.data = {
        hName: "youtube-embed",
        hProperties: { videoid: videoId, title: "YouTube video" },
      };
      paragraph.children = [];
      return;
    }

    const [prefix, link] = paragraph.children ?? [];
    if (
      prefix?.type === "text" &&
      prefix.value === "@" &&
      link?.type === "link" &&
      markdownText(link).toLocaleLowerCase() === "youtube" &&
      link.url &&
      youtubeIdPattern.test(link.url)
    ) {
      paragraph.data = {
        hName: "youtube-embed",
        hProperties: { videoid: link.url, title: "YouTube video" },
      };
      paragraph.children = [];
    }
  });
};
```

## Renderer shell

```tsx
import Link from "next/link";
import { isValidElement, type ComponentProps, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  CONTENT_HEADING_OFFSET,
  createHeadingIdFactory,
} from "./markdown-headings";
import { isInternalHref, remarkYouTube } from "./markdown-utils";

type MarkdownElementProps = {
  children?: ReactNode;
  href?: string;
  src?: string;
  alt?: string;
  className?: string;
  videoid?: string;
  title?: string;
};

function reactNodeText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) return value.map(reactNodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(value)) {
    return reactNodeText(value.props.children);
  }
  return "";
}

function createHeadingComponent(
  level: 2 | 3 | 4 | 5,
  createHeadingId: (label: string) => string,
) {
  const Tag = `h${level}` as const;

  function Heading({ children }: MarkdownElementProps) {
    const id = createHeadingId(reactNodeText(children));

    return (
      <Tag
        id={id}
        data-blog-heading
        style={{ scrollMarginTop: CONTENT_HEADING_OFFSET }}
      >
        {children}
      </Tag>
    );
  }

  return Heading;
}

function MarkdownLink({ href = "", children }: MarkdownElementProps) {
  if (href.startsWith("#")) return <a href={href}>{children}</a>;
  if (isInternalHref(href)) return <Link href={href}>{children}</Link>;

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

function MarkdownImage({ src, alt }: ComponentProps<"img">) {
  if (!src || typeof src !== "string") return null;
  return (
    <span className="my-8 block overflow-hidden rounded-2xl border border-border bg-muted/30">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt ?? ""} className="h-auto w-full object-cover" />
    </span>
  );
}

function MarkdownCode({
  className,
  children,
}: MarkdownElementProps & ComponentProps<"code">) {
  const language = className?.match(/language-([\w-]+)/)?.[1];
  if (language) {
    return (
      <code className={className} data-language={language}>
        {children}
      </code>
    );
  }
  return <code>{children}</code>;
}

function YouTubeEmbed({ videoid, title }: MarkdownElementProps) {
  if (!videoid) return null;

  return (
    <div className="my-10 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoid}`}
          title={title ?? "YouTube video"}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export function Markdown({ content }: { content: string }) {
  const createHeadingId = createHeadingIdFactory();

  const components = {
    h2: createHeadingComponent(2, createHeadingId),
    h3: createHeadingComponent(3, createHeadingId),
    h4: createHeadingComponent(4, createHeadingId),
    h5: createHeadingComponent(5, createHeadingId),
    a: MarkdownLink,
    img: MarkdownImage,
    code: MarkdownCode,
    "youtube-embed": YouTubeEmbed,
    // Add project-specific renderers for p, strong, em, blockquote, lists,
    // hr, table, pre, task-list inputs, and typography classes.
  } satisfies Partial<Components> & {
    "youtube-embed": (props: MarkdownElementProps) => ReactNode;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkYouTube]}
      components={components as Components}
    >
      {content}
    </ReactMarkdown>
  );
}
```

## Demo route

Create a demo page or demo post such as `/blog/markdown-components` that renders one Markdown string through both `extractMarkdownHeadings(demoContent)` and `<Markdown content={demoContent} />`.

The demo should include:

- `##`-`#####` headings, including duplicate headings;
- bold, italic, strikethrough, inline code;
- internal links such as `/blog?content=posts`;
- external HTTP(S) links;
- unordered, ordered, nested, and task lists;
- blockquotes, rules, tables, images;
- fenced code blocks with `tsx`, `bash`, and `md`;
- `@[youtube](VIDEO_ID)`;
- heading-looking text inside code fences.

## Tests to copy

- Unit: formatted heading labels, duplicate IDs, fenced-code exclusion, internal/external link classification, YouTube ID parsing.
- Browser: demo page renders, TOC links point to generated IDs, code blocks keep language classes, external links open safely, internal links keep same-site hrefs, image renders, table renders, YouTube iframe uses `youtube-nocookie.com`.
