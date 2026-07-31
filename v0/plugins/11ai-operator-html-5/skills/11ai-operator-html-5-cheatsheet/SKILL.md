---
name: 11ai-operator-html-5-cheatsheet
description: "Look up HTML5 inspection, setup, validation, and focused operation patterns across documents, semantics and accessibility, forms and validation, media and embeds, metadata and seo. Use when the user wants a concise command or pattern reference instead of a guided workflow."
---
# 11ai HTML5 cheatsheet

Use the installed project conventions and target browsers or runtimes as the source of truth. This is a lookup surface; send multi-step work to the matching sibling skill in this plugin.

Version baseline: HTML5, represented by the current WHATWG HTML Living Standard (last updated 20 July 2026), verified 31 July 2026. Use current conforming HTML5 features; treat frozen W3C snapshots and obsolete elements as legacy, and verify browser and assistive-technology support per feature.

## Inspect

```bash
rg --files -g '*.html' -g '*.htm' -g '*.xhtml' | head -80
rg -n '<!doctype|<html|<main|<form|<video|<meta' . --glob '*.html' | head -120
```

Read versions, configuration, entry points, and generated output before choosing a command. Never assume document language, supported browsers, form submission behavior, or generated-template ownership.

## Common commands

```bash
npm install --save-dev html-validate
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

The install command is for requested setup only. Preserve the repository package manager and lockfile; do not upgrade unrelated packages or rewrite configuration during a lookup.

## Domain map

| Skill suffix | Use it for |
| --- | --- |
| `documents` | Document shells, sections, headings, links, and source order |
| `semantics-accessibility` | Native semantics, keyboard access, names, landmarks, and tables |
| `forms-validation` | Labels, controls, constraints, submission, errors, and autofill |
| `media-embeds` | Images, audio, video, iframes, captions, loading, and privacy |
| `metadata-seo` | Titles, descriptions, canonical links, social cards, and structured data |

For changes, use the exact sibling skill named `11ai-operator-html-5-AREA`. For environment inspection, setup, integrations, or diagnosis, use the corresponding required archetype in this plugin.

## Answer format

Lead with the smallest applicable command or HTML document pattern. Add the target file or surface, what it reads or changes, the verification command, and one safety note. Keep secrets redacted and stop before an unrequested state change.
