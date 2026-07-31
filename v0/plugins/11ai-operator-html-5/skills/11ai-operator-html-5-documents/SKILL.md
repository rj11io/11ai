---
name: 11ai-operator-html-5-documents
description: "Create and repair HTML5 document shells, landmarks, sections, headings, lists, links, tables, and source order. Use when building or reviewing page structure, fixing invalid nesting, or changing document hierarchy."
---
# 11ai HTML5 documents

HTML structure is a public accessibility and parsing contract. Resolve the exact file, public contract, target browsers and assistive technologies, and acceptance check before editing.

Version baseline: HTML5, represented by the current WHATWG HTML Living Standard (last updated 20 July 2026), verified 31 July 2026. Use current conforming HTML5 features; treat frozen W3C snapshots and obsolete elements as legacy, and verify browser and assistive-technology support per feature.

## Inspect first

```bash
rg -n '<html|<head|<body|<main|<section|<h[1-6]|<table' TARGET
npx html-validate TARGET
```

Confirm one doctype, one main landmark, logical heading order, valid parent-child relationships, and useful source order before styling concerns.

Confirm before changing:

- The document language and character encoding.
- Heading hierarchy and landmark labels.
- Link purpose and table headers.
- Whether a template engine owns the file.

## Operate

```bash
npx html-validate TARGET
npm run format --if-present -- TARGET
```

Use native elements before generic containers and preserve meaningful reading order. Change the smallest subtree that fixes the structural defect.

Never bulk-replace tags or remove landmark content without reviewing each consumer and rendered page. Require explicit approval for any broader or destructive form of that change, and preview the affected files or public surface first.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Validate markup and inspect the accessibility tree or rendered outline for the changed page. Report the target, files changed, public behavior, compatibility or accessibility impact, checks run, and rollback. Hand configuration failures to `11ai-operator-html-5-troubleshooting` and cross-system seams to `11ai-operator-html-5-integrations`.
