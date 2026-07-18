# 11ai blog content generation contract

## 1. Start from the user's requested outcome

Generate only the content type the user requested unless they ask for a broader seed set:

- single post;
- publication/series with multiple posts;
- author profile;
- content calendar;
- demo/reference post;
- rewrite/expansion of existing content.

If the user provides source material, preserve its facts and intent. If the user asks for original content, keep factual claims conservative or clearly placeholder-based.

## 2. Required output for a post

At minimum, generate:

```ts
{
  postId: 1,
  slug: "stable-url-slug",
  title: "Post title",
  excerpt: "One concise summary sentence.",
  created: "YYYY-MM-DD",
  updated: "YYYY-MM-DD", // optional; include only for material revisions
  authorIds: ["existing-author-id"],
  isNSFW: false,
  isNew: true,
  tags: ["Tag", "Another Tag"],
  content: `# Post title

Intro paragraph.

## First section

Body content.`
}
```

Use existing IDs and numbering conventions when editing a repo.

## 3. Markdown body pattern

Use this structure for 11ai-style post content:

```md
# Exact post title

Opening paragraph that frames the article.

## Specific section heading

Focused paragraphs.

### Optional subsection

More detail.

## Closing section

Practical summary or next step.
```

Guidelines:

- The leading H1 is for source clarity and may be stripped by the route.
- Do not add more H1s.
- Use `##`-`#####` for sections.
- Keep sections coherent; avoid filler headings like "Introduction" unless appropriate.
- Use tables, code, or lists only when they improve the content.

## 4. Voice and structure

Default voice:

- clear;
- practical;
- editorial;
- concrete;
- low-hype;
- compatible with file-backed knowledge/editorial blogs.

Structure:

- title should be specific and not clickbait;
- excerpt should state the useful promise;
- introduction should establish the problem or observation quickly;
- body sections should each advance one idea;
- ending should synthesize, not repeat.

## 5. Metadata choices

Slugs:

- lowercase words joined by hyphens;
- stable;
- short enough to read.

Tags:

- 2-5 tags for posts;
- reuse project tags where possible;
- avoid overly broad tags if a more useful filter exists.

Authors:

- use existing `authorIds` if available;
- if no author is specified, ask or use an explicit placeholder only when the project has placeholder authors.

Dates:

- use the user-provided date when given;
- map the original publication/creation date to `created`;
- include `updated` only for materially revised content;
- ensure `updated` is not earlier than `created`;
- otherwise use the project/editorial convention or leave as a clear placeholder if publication timing matters.

## 6. Supported rich components

Use the supported Markdown surface intentionally:

- tables for comparison or repeated fields;
- fenced code for executable/config examples;
- task lists for checklists;
- blockquotes for short highlighted principles;
- images only when a path/asset is known or a placeholder is acceptable;
- YouTube embeds only with a provided or intentionally selected video ID.

YouTube convention:

```md
@[youtube](VIDEO_ID)
```

## 7. Safety and factuality

- Do not fabricate real quotes, statistics, citations, biographies, or links.
- Mark placeholders clearly.
- Keep speculative content framed as ideas or examples.
- For user/company-specific content, use only supplied context unless asked to invent placeholders.

## 8. Finalization

Before returning or writing generated content:

1. Apply `$11ai-blog-content-format`.
2. Check Markdown structure and metadata.
3. If editing a repo, update imports/registries consistently.
4. Run relevant formatting/tests where available.
