# 11ai blog content format contract

## 1. Content model

Posts usually live inside publication registries and use this shape:

```ts
type Post = {
  postId: number;
  slug?: string;
  title: string;
  excerpt?: string;
  created: string; // YYYY-MM-DD
  updated?: string; // YYYY-MM-DD, not before created
  coverImage?: string;
  authorIds: string[];
  isNSFW: boolean;
  isNew: boolean;
  tags: string[];
  content?: string;
};
```

Publication metadata wraps posts:

```ts
type Publication = {
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
```

## 2. Markdown body shape

For 11ai-style post pages, the route renders the visual page H1 from `post.title` and strips a leading Markdown H1 from the content before rendering. Therefore content files should use this pattern:

```md
# Exact post title

Intro paragraph.

## First body section

Body copy.
```

Rules:

- Include exactly one leading `# Title` when the target project uses `stripLeadingH1`.
- Make the leading H1 match `post.title`.
- Do not use any other H1s inside the body.
- Use `##`, `###`, `####`, and `#####` for body headings.
- Keep heading text concise and meaningful; it becomes TOC text and heading IDs.
- Headings inside fenced code blocks are ignored by the TOC.

## 3. Supported Markdown components

Normal Markdown/GFM:

- paragraphs;
- `**bold**`;
- `_italic_`;
- `~~strikethrough~~`;
- inline code with backticks;
- blockquotes;
- unordered lists;
- ordered lists;
- nested lists;
- task lists (`- [x] Done`, `- [ ] Todo`);
- horizontal rules (`---`);
- tables;
- fenced code blocks with triple backticks or tildes;
- autolinks;
- Markdown links;
- Markdown images.

Custom extension:

```md
@[youtube](VIDEO_ID)
```

Use only 11-character YouTube video IDs.

## 4. Links and images

Internal same-site links:

```md
[Read more](/v1/blog?content=posts)
```

External links:

```md
[External reference](https://example.com)
```

Images:

```md
![Meaningful alt text](/static/path/image.png)
```

Use raw Markdown image syntax unless the target content model has a structured image manifest.

## 5. Code fences

Prefer language labels when known:

````md
```tsx
export function Example() {
  return <div>Hello</div>;
}
```

```bash
npm run typecheck
```
````

Rules:

- Always close fences.
- Preserve language metadata such as `ts`, `tsx`, `bash`, `json`, `md`, `css`.
- Do not rely on headings inside code fences for document structure.

## 6. Metadata normalization

Slugs:

- URL-safe;
- lowercase;
- stable once published;
- avoid changing public slugs without redirects.

Dates:

- use `YYYY-MM-DD`;
- use `created` for original publication/creation date;
- use optional `updated` only when the post/publication was materially revised;
- ensure `updated` is not earlier than `created`;
- ensure publication and post ordering are intentional.

Tags:

- short display strings;
- normalize capitalization inside a project;
- useful for filtering;
- avoid one-off noisy tags unless the content really needs them.

Authors:

- use existing `authorIds`;
- never duplicate full author objects in posts;
- if an author does not exist, add/ask for an author record rather than inventing one silently.

Excerpts:

- one concise sentence;
- avoid repeating the title verbatim;
- make list/card context clear.

## 7. Pre-delivery checklist

- [ ] Leading H1 is present only when the route strips it.
- [ ] Leading H1 matches `title`.
- [ ] Body headings use `##`-`#####`.
- [ ] No unsupported raw HTML or MDX syntax.
- [ ] Code fences are closed and language-tagged when possible.
- [ ] Internal links use same-site paths.
- [ ] External links are absolute HTTP(S) URLs.
- [ ] Images have useful alt text or `alt=""` for decorative images.
- [ ] YouTube embeds use `@[youtube](VIDEO_ID)`.
- [ ] Tags and author IDs exist in the target project.
