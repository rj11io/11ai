# SEO Quality Bar

Use this reference to classify findings, choose route coverage, and decide when the iterative pass is complete. Re-check current official documentation when internet access is available; search and social platform behavior changes over time.

## Severity

### Critical

Treat an issue as critical when it can broadly prevent intended discovery, send crawlers to the wrong site, or expose private/non-production content:

- production-wide `noindex`, `nofollow`, or robots disallow on pages intended for search
- canonicals, Open Graph URLs, or sitemap URLs pointing to localhost, preview hosts, another product, or the wrong protocol/host
- important public routes returning error, redirect-loop, soft-404, or unusable client-only output to crawlers
- private, account, staging, or sensitive routes intentionally excluded by product requirements but currently indexable
- malformed shared metadata or framework configuration that breaks the production build or removes metadata across most routes

### Major

Treat an issue as major when it materially degrades search interpretation or link previews across an important route or route family:

- missing, empty, misleading, duplicated, or boilerplate titles on primary routes
- missing route-specific metadata for dynamic pages that all inherit unrelated defaults
- absent or contradictory canonical signals on important duplicate or parameterized routes
- missing or broken Open Graph image or incomplete core Open Graph fields on shareable routes
- invalid or misleading structured data, or missing high-value supported schema where the facts are already present
- incorrect sitemap membership, stale URLs, missing important public routes, noncanonical entries, or missing robots sitemap pointer
- broken locale alternates, conflicting robots directives, or indexable search/filter combinations that create uncontrolled duplication
- material internal-link or server-rendering problems that leave important content undiscoverable

### Moderate

Use moderate for meaningful but localized quality gaps: weak descriptions, missing image dimensions or alt, inconsistent site names, incomplete article dates, suboptimal social-card fallback, weak heading hierarchy, or missing low-risk schema enhancements.

### Minor

Use minor for polish with limited discovery impact: copy tightening, optional metadata, small asset compression gains, or formatting consistency.

Severity depends on reach. A defect in a root layout or large route family is more severe than the same defect on one low-value page.

## Route Matrix

For each representative route, record:

| Field | Verify |
| --- | --- |
| Purpose | User intent and whether search indexing is desirable |
| Response | Final URL, status, redirects, rendered content |
| Robots | Meta/header directive, robots.txt interaction |
| Title | Unique, descriptive, aligned with visible heading |
| Description | Useful summary, accurate, not templated filler |
| Canonical | Absolute production URL, normalized, self-consistent |
| Alternates | Valid locale/region URLs and reciprocal intent |
| Open Graph | Title, description, type, URL, site name, image, alt |
| Social card | Card type/fallback, title, description, image |
| Structured data | Supported type, valid JSON-LD, visible truthful facts |
| Sitemap | Included only if canonical and intended for indexing |
| Content signals | Main heading, semantic landmarks, links, image alt |

For dynamic routes, test at least one normal item and edge cases that change metadata, such as a long title, missing optional image, unpublished content, pagination, filters, or an unknown slug.

## Scorecard

Score verified rendered behavior, not implementation intent. Start each category at zero and award points only when representative routes pass. A critical or major issue prevents completion regardless of the numeric score.

| Category | Points | Full-credit standard |
| --- | ---: | --- |
| Crawlability and indexability | 20 | Intended pages are crawlable; excluded pages are deliberately controlled; statuses and redirects are correct |
| Titles, descriptions, and route identity | 18 | Important routes have accurate, distinct metadata derived from real content |
| Canonicals, origins, duplicates, and locales | 15 | All URL signals agree on normalized production URLs and valid alternates |
| Open Graph and social previews | 15 | Shareable routes render complete metadata and reachable, legible images |
| Structured data | 12 | Supported truthful JSON-LD validates and matches visible content |
| Sitemap and robots infrastructure | 10 | Generated files are valid, current, and contain the right canonical routes |
| Icons, manifest, semantics, and images | 5 | Supporting metadata and accessible content signals are correct |
| Verification and maintainability | 5 | Checks pass; shared defaults and route-specific data cannot easily drift |

High-quality completion requires at least 90/100, zero critical findings, zero unblocked major findings, and two consecutive clean critical/major passes.

Do not award full credit based on a single route when the project has multiple route archetypes. Do not deduct points for irrelevant features: for example, a single-language site does not need `hreflang`, and a tiny site may not need complex sitemap generation.

## Fix Principles

- Prefer one source of truth for site name, production origin, default description, locale, and default image.
- Prefer route content records for route-specific title, description, canonical path, image, and schema.
- Keep metadata accurate and readable; do not mechanically stuff keywords or force arbitrary character counts.
- Use canonicalization for real duplicates, redirects for retired URLs, and `noindex` only when the page should remain accessible but absent from search. Do not treat robots.txt as a privacy control.
- Include only canonical, indexable, successful URLs in sitemaps. Exclude auth, account, error, preview, filter, and internal utility routes unless the product explicitly needs them indexed.
- Add structured data only when its type is supported for the page and every asserted fact is backed by visible or authoritative project data.
- Keep structured-data URLs, Open Graph URLs, canonicals, sitemap URLs, and locale alternates on the same production-origin policy.
- Respect framework merging and override behavior. Verify nested route output because a child metadata object may replace a parent's nested fields.
- Avoid adding dependencies when the framework or a small local implementation already covers the requirement.

## Open Graph Image Quality

- Default canvas: 1200 × 630 pixels, landscape.
- Composition: one focal idea, strong silhouette or visual anchor, restrained text, generous safe area.
- Identity: use actual project colors, typography cues, logos, and product imagery only when available and authorized.
- Legibility: verify at small preview size and in both light and dark surrounding interfaces.
- Accuracy: keep page-specific text synchronized with the route; avoid screenshots with stale UI or private data.
- Delivery: use stable public paths, HTTPS absolute URLs, correct content type, explicit dimensions, descriptive alt, and conservative file sizes.
- Coverage: use a strong site default, then add route-specific cards only where content meaningfully differs.

## Primary Sources

Consult the relevant official sources when a rule is uncertain or current behavior matters:

- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google title links: https://developers.google.com/search/docs/appearance/title-link
- Google snippets and meta descriptions: https://developers.google.com/search/docs/appearance/snippet
- Google canonicalization: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google robots.txt: https://developers.google.com/search/docs/crawling-indexing/robots/intro
- Google sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- Google structured data policies: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Google supported structured data features: https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- Google localized versions: https://developers.google.com/search/docs/specialty/international/localized-versions
- Open Graph protocol: https://ogp.me/
- Schema.org vocabulary: https://schema.org/docs/schemas.html
- Next.js metadata API, when applicable: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Next.js Open Graph image conventions, when applicable: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image

Use framework documentation for the detected version, not copied examples from unrelated versions. Prefer primary platform and framework documentation over third-party SEO checklists.
