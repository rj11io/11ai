---
name: 11ai-super-metadata
description: "Audit, repair, and iteratively improve a web project's search metadata, technical SEO, social sharing metadata, structured data, indexability controls, sitemap, robots directives, canonical URLs, favicons, and Open Graph images, including generating or replacing social preview images when needed. Use when asked to review or fix SEO, metadata, search appearance, link previews, OG or Twitter images, canonicalization, robots.txt, sitemaps, JSON-LD, or route-level metadata in a website or web application. Continue until all critical and major findings are resolved and the project meets a high-confidence quality bar, always ending with a session summary. Stops and reports when the change set becomes unmanageable or troubleshooting outweighs progress."
---

# 11ai Super Metadata

## Goal

Take ownership of the full metadata and technical-SEO pass: discover the public surface, establish a baseline, fix every safe critical and major issue, generate missing social images, verify rendered output, then repeat the audit until no material high-confidence improvement remains.

Read [references/seo-quality-bar.md](./references/seo-quality-bar.md) before auditing. Use its severity definitions, route matrix, scorecard, and primary sources.

## Operating Rules

- Inspect the whole public route surface, not only the home page.
- Treat rendered or built HTML and actual public assets as truth. Source declarations alone are insufficient.
- Preserve the project's framework, conventions, voice, visual identity, and existing user work.
- Make focused metadata, content-structure, and technical-SEO edits. Do not redesign the product or rewrite substantive product claims without evidence.
- Never invent awards, ratings, authors, prices, addresses, social handles, locales, dates, or structured-data facts.
- Do not add `keywords` meta tags as filler or promise rankings.
- Never deploy, submit sitemaps, or change external search-console settings unless explicitly asked.
- Keep a session change manifest — every file this session creates, modifies, renames, or deletes — and reconcile it after every batch.
- Continue through verification and at least one fresh re-audit after the first fixes. Do not stop at a report when the request authorizes fixes.
- Always end with the session summary defined below, including when stopping early or aborting.

## Workflow

### 1. Discover the project and production origin

1. Read repository instructions, manifests, route definitions, layouts, metadata files, content sources, public assets, deployment config, and relevant tests.
2. Map public route archetypes: home, marketing, product or feature, listing, detail, article, legal, auth, account, search/filter, error, and localized variants. Sample dynamic routes with real fixture or content data.
3. Determine which routes should be indexed, excluded, canonicalized, redirected, or omitted from the sitemap.
4. When absolute URLs are needed, search README files first for a labeled production, live, project-site, demo, or deployed URL. Then corroborate it against existing metadata and deployment configuration. Prefer an explicit README production origin over guesses.
5. Never use `localhost`, a preview deployment, or an invented domain in final metadata. If README files contain multiple plausible production origins and the code cannot disambiguate them, avoid destructive URL changes and report the exact decision needed.

Useful discovery searches include:

```bash
rg -n -i "production|live site|project site|demo|deployed|https?://" --glob 'README*'
rg -n "metadata|generateMetadata|<title|canonical|openGraph|twitter|robots|sitemap|application/ld\\+json|schema.org" .
```

Adapt searches to the repository and exclude dependencies, build output, and generated files.

### 2. Establish the SEO baseline

1. Run the project's existing build and relevant checks when feasible. Do not install or replace major tooling solely to produce a score.
2. Inspect representative rendered pages with an available browser or local server. When browser execution is unavailable, inspect build output or server-rendered HTML.
3. Build a compact route matrix containing indexability, status, title, description, canonical, Open Graph, social image, structured data, and sitemap inclusion.
4. Classify findings as critical, major, moderate, or minor using the reference. Record evidence by route or shared layout and fix shared root causes before route-by-route symptoms.

### 3. Fix critical and major issues

Work in this order:

1. Crawlability and indexability contradictions, bad status or redirect behavior, accidental production `noindex`, and crawler-blocking mistakes.
2. Wrong-origin, malformed, missing, or conflicting canonical URLs; protocol or host inconsistencies; incorrect locale alternates.
3. Missing, duplicated, stale, misleading, or route-insensitive titles and descriptions.
4. Broken or incomplete Open Graph and social-card metadata, including image URLs, dimensions, MIME type, and alt text.
5. Invalid, misleading, duplicated, or missing high-value structured data supported by visible page content.
6. Incomplete or incorrect robots, sitemap, manifest, icon, and web-app metadata.
7. Material on-page discoverability issues such as absent main heading, weak internal linking, inaccessible informative images, or public pages hidden behind client-only rendering.

Use framework-native metadata APIs and file conventions where they are reliable. Centralize shared site identity and defaults; make route-specific titles, descriptions, canonicals, images, and schema derive from the same content record when possible. Ensure child metadata does not accidentally replace required parent fields.

After each logical batch, review the batch's complete set of changes. Update the session change manifest and confirm every changed path is necessary for the audit.

### 4. Generate Open Graph images when needed

Generate or replace an image when a public route lacks a usable social image, references a missing asset, uses an unreadable or badly cropped image, or needs a distinct preview to represent materially different content.

1. Inspect existing brand assets and representative pages before designing.
2. Use the available image-generation skill or image tool for raster artwork. Give it the brand palette, composition, subject, safe-area, and crop requirements. For image edits, inspect the source image first and follow the image tool's editing rules.
3. Prefer a framework-native generated-image route for text-heavy or highly dynamic per-page cards when that is easier to keep accurate than hundreds of static files.
4. Default to a 1200 × 630 landscape canvas unless the project's platform requirements say otherwise. Keep essential content away from edges, use high contrast, and avoid tiny copy, fake UI, fabricated logos, and unsupported claims.
5. Save static images in the project's public asset convention with stable names. Use broadly supported formats accepted by the framework and target social parsers, keep files comfortably below platform limits, and provide absolute HTTPS URLs in rendered metadata.
6. Add accurate image alt text and explicit dimensions where supported. Verify the final asset visually and confirm its URL returns the expected image content type.

If raster image generation is unavailable, use an existing framework-native OG image facility when appropriate. Otherwise fix the metadata that can be fixed and report the missing image capability as a blocker; do not ship a low-quality placeholder.

### 5. Verify rendered behavior

Re-run the relevant build, typecheck, lint, and tests. Then verify representative output for every route archetype:

- one unambiguous title and useful description
- intended robots behavior and HTTP status
- one self-consistent canonical on the production origin
- complete Open Graph identity and a reachable image
- appropriate social-card metadata with sensible fallbacks
- valid JSON-LD matching visible content and canonical URLs
- correct sitemap membership, only canonical indexable URLs, and valid robots sitemap reference
- working icons, manifest metadata, internal links, and image alt text
- no preview, development, placeholder, or stale brand values

Inspect the rendered `<head>` rather than assuming framework configuration combined as intended. Validate structured data and generated XML/JSON syntax with available local tools; use external validators only when access is available and no sensitive preview URL must be exposed.

### 6. Re-audit and improve until satisfied

Start a fresh pass from rendered output after the first fixes. Rebuild the route matrix and score the result with the reference rubric.

Continue iterating while any of these remain:

- a critical or major finding
- a broken validation or build caused by the changes
- a route archetype relying on an incorrect generic fallback
- a social image or absolute URL that is missing, unreachable, or visibly poor
- a high-confidence improvement worth at least two rubric points

Finish only when:

- critical findings are zero
- major findings are zero, or each is explicitly blocked by missing facts or authority
- the quality score is at least 90/100
- two consecutive audit passes reveal no new critical or major issue
- relevant checks pass and the complete change set is intentional, reviewable, and limited to the session manifest

Do not chase speculative keyword density, cosmetic score inflation, or changes that require inventing business facts. A documented blocker is preferable to false metadata.

### 7. Abort when work becomes unsafe

Abort instead of continuing when any of these occurs:

- the change set contains unexplained or unrelated paths, or grows too broad to review confidently
- files change outside the session manifest, suggesting concurrent work
- more than two focused attempts fail on the same problem
- the work turns into extended debugging of the framework, dependency graph, build system, deployment, or unrelated application behavior
- safe completion requires missing authority, an unapproved scope expansion, or guessing business facts

On abort:

1. Stop local servers and background processes started by the session, and capture the failure evidence and abort reason for the summary.
2. Compare the project's current state with the session change manifest. Preserve any path whose ownership is uncertain.
3. Stop the routine and return the required aborted-session summary, listing exactly which session changes remain in place. Do not immediately restart the entire operation.

## Required Session Summary

Always reply with a concise session summary containing:

- whether the operation completed, stopped early, or aborted
- production origin used and where it was found
- route archetypes audited
- critical and major issues fixed, grouped by shared root cause
- OG images generated or replaced, with paths and dimensions
- checks run and their results
- final score and remaining moderate or minor opportunities
- any blocked issue, the missing fact or authority, and its exact impact
- final state of the session's changes: the complete manifest of paths created, modified, or deleted
- for an abort: trigger, which session changes remain in place, and any path preserved because its ownership was uncertain

When the operation aborts, lead with the abort reason. Keep every claim evidence-based and distinguish verified rendered behavior from source-only inspection.
