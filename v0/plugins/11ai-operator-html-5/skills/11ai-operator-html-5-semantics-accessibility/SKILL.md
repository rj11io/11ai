---
name: 11ai-operator-html-5-semantics-accessibility
description: "Apply native HTML5 semantics, accessible names, keyboard-operable controls, landmark structure, text alternatives, and data-table relationships. Use when a page uses generic interactive elements, lacks accessible names, or needs an HTML5 accessibility review."
---
# 11ai HTML5 semantics and accessibility

Native elements carry behavior and semantics that ARIA cannot safely recreate by accident. Resolve the exact file, public contract, target browsers and assistive technologies, and acceptance check before editing.

Version baseline: HTML5, represented by the current WHATWG HTML Living Standard (last updated 20 July 2026), verified 31 July 2026. Use current conforming HTML5 features; treat frozen W3C snapshots and obsolete elements as legacy, and verify browser and assistive-technology support per feature.

## Inspect first

```bash
rg -n '<div[^>]*(onclick|role=)|<img|aria-|tabindex|<table' TARGET
npx html-validate TARGET
```

Inspect the rendered role, name, state, focus order, and keyboard behavior rather than judging only the source tag.

Confirm before changing:

- Native element availability before ARIA.
- Accessible names and visible labels.
- Keyboard activation and focus order.
- Text alternatives and table associations.

## Operate

```bash
npm run lint --if-present
npm test --if-present
```

Replace scripted generic controls with buttons, links, inputs, and details elements where their native behavior matches the intent. Add ARIA only for semantics HTML cannot express.

Never hide focus, remove labels, add positive tabindex values, or use ARIA to override correct native semantics without a tested requirement. Require explicit approval for any broader or destructive form of that change, and preview the affected files or public surface first.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Test keyboard-only operation, focus visibility, roles, names, states, and source order at representative viewport sizes. Report the target, files changed, public behavior, compatibility or accessibility impact, checks run, and rollback. Hand configuration failures to `11ai-operator-html-5-troubleshooting` and cross-system seams to `11ai-operator-html-5-integrations`.
