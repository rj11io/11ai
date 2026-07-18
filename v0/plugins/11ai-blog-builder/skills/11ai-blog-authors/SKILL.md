---
name: 11ai-blog-authors
description: "Add or retrofit white-label blog author features: author metadata and tags, multi-author post attribution, resolved author previews, post-page bylines, clickable author profile/detail pages, author post indexes, library Authors browse tabs, avatar or initials fallbacks, metadata/SEO, validation, and tests. Use when creating, recreating, repairing, or auditing author profiles, contributor pages, author filtering, bylines, author slugs, or many-to-many author/post relationships in a file-backed, CMS-backed, Markdown, MDX, rich-text, React, Next.js, or other web blog."
---

# 11ai Blog Authors

Implement the author system contract in [references/implementation.md](references/implementation.md). For a 11ai-style rebuild, also use [references/scaffold.md](references/scaffold.md). Read the relevant reference before changing application code.

## Workflow

1. Inspect the target's agent instructions, framework version, local framework documentation, content source, blog routes, post model, list/card components, existing author images, styling conventions, and tests. For version-sensitive frameworks such as Next.js, read the installed version's relevant documentation before coding.
2. Identify the canonical post source and add author attribution there. Prefer stable `authorIds` on posts and a separate author registry over duplicating author objects across posts.
3. Define the author contract: ID/slug policy, name, display name or initials, bio, tags, avatar, links, optional role/location fields, and which fields appear in previews.
4. When creating or normalizing author profile copy, use `$11ai-blog-content-format`; when generating placeholder or requested author bios, use `$11ai-blog-content-generation` and clearly report placeholders.
5. Resolve authors centrally in the content registry or data access layer. Blog list cards, post pages, author pages, metadata, and tests should all consume the same resolved author view.
6. Add validation for author IDs, duplicate author records, missing required fields, malformed links, empty `authorIds`, duplicate post authors, and unknown author references.
7. Render accessible bylines on post pages. Support one or many authors, link each author to a profile page, and use an avatar with an initials fallback.
8. Add author detail routes/pages that show profile metadata, links, and the author's posts. Use static generation or cached data when the host blog is static/file-backed.
9. Add authors to the library/browse surface when the host has one. Provide an Authors content pill/tab next to Posts/Publications, author cards/list rows, author search, and tag filtering. If the library content selector is URL-backed, Authors must use the same query-param contract as the existing content types, e.g. `content=authors`.
10. Update post list/search surfaces where useful so author names can be seen and searched without opening a post.
11. Verify typecheck, lint, unit tests, browser/e2e tests, and production build.

## Non-negotiable behavior

- A post may have one or more authors; zero-author posts are invalid unless the target has an explicit anonymous/system-author policy.
- Author IDs must be stable URL-safe identifiers. Display names may change; IDs should not.
- Post attribution must reference authors by ID, not by duplicated profile data.
- Broken author references must fail validation before deployment or at least before rendering.
- Bylines must be visible on the post page and every author name in the byline must link to that author's detail page.
- Author profile pages must be routable, refreshable, and shareable. Direct navigation to an author URL must work.
- Author pages must list the posts attributed to that author using the same canonical post URLs as the rest of the blog.
- Author browse surfaces must expose author tags when tags exist and use those tags for filtering.
- When Authors are added to a URL-backed library selector, `/blog?content=authors` must deep-link directly to the Authors browse mode without breaking the default `/blog` posts view.
- Avatar rendering must have a deterministic fallback when an image is absent or intentionally omitted.
- External author links must be validated and rendered safely.
- Keep copy, profile fields, avatars, route segments, styling, and placeholder authors project-configured.
- Do not make full blog pages client components solely for author rendering.
- Do not copy personal names, images, or links from the source project unless the user explicitly asks for those identities.

## Adaptation rules

- For file-backed blogs, keep an `authors` module near the content registry and resolve author previews during post preview construction.
- For CMS-backed blogs, keep the same contract at the boundary: post payloads expose `authorIds` or CMS author references; UI receives resolved author previews.
- For Next.js App Router, keep pages as server components by default, use `generateStaticParams` for static author routes when possible, and follow the installed Next.js docs instead of relying on memory.
- If the blog already has authors, migrate in place: preserve existing author URLs when possible, add missing validation, and avoid changing public slugs without redirects.
- If posts already store one `author` object, migrate to `authorIds: string[]` or an equivalent many-to-many relation before adding multi-author UI.
- If author profile fields vary by project, keep the required core small and make extra fields optional.
- If the blog has a collection browser with content pills/tabs, add Authors as the peer of Posts and Publications rather than creating a disconnected author list.
- If there are existing author images, reuse them through the host's static asset or image pipeline. Do not invent assets unless asked.
- If the host has no test framework, add the smallest practical checks or document manual browser acceptance steps.

## Delivery

Report the files changed, author data contract, attribution strategy, route shape, validation rules, byline behavior, author-page behavior, search/list changes, accessibility decisions, and verification performed. Call out any placeholder authors, missing real profile data, unsupported fields, or checks that could not run.
