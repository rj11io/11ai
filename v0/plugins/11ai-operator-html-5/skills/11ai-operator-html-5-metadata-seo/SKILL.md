---
name: 11ai-operator-html-5-metadata-seo
description: "Manage HTML5 head metadata including titles, descriptions, canonical URLs, robots directives, icons, language alternates, social cards, and structured data. Use when adding page metadata, fixing search or social previews, or changing indexing and canonicalization behavior."
---
# 11ai HTML5 metadata and SEO

Metadata controls how browsers, crawlers, and sharing platforms interpret a public page. Resolve the exact file, public contract, target browsers and assistive technologies, and acceptance check before editing.

Version baseline: HTML5, represented by the current WHATWG HTML Living Standard (last updated 20 July 2026), verified 31 July 2026. Use current conforming HTML5 features; treat frozen W3C snapshots and obsolete elements as legacy, and verify browser and assistive-technology support per feature.

## Inspect first

```bash
rg -n '<title|<meta|rel="canonical|hreflang|application/ld\+json|og:|twitter:' TARGET
npm run build --if-present
```

Resolve the deployed URL, indexing intent, locale set, content owner, and generator before changing canonical or robots directives.

Confirm before changing:

- Unique title and useful description.
- Absolute canonical and social URLs.
- Consistent robots and indexing intent.
- Valid structured data matching visible content.

## Operate

```bash
npm run build --if-present
npm test --if-present
```

Change metadata at its source template or framework owner, not emitted HTML. Keep structured data truthful and synchronized with visible content.

Never set noindex, change canonical hosts, claim unsupported structured-data properties, or replace site-wide metadata without approval. Require explicit approval for any broader or destructive form of that change, and preview the affected files or public surface first.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Inspect the built head for duplicates, validate absolute URLs and JSON syntax, and compare representative locale and route outputs. Report the target, files changed, public behavior, compatibility or accessibility impact, checks run, and rollback. Hand configuration failures to `11ai-operator-html-5-troubleshooting` and cross-system seams to `11ai-operator-html-5-integrations`.
