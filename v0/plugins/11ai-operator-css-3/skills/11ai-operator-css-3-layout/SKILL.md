---
name: 11ai-operator-css-3-layout
description: "Build and repair CSS3 layout using normal flow, flexbox, grid, positioning, intrinsic sizing, overflow, aspect ratios, and containment. Use when creating page or component layout, fixing overflow and alignment, or removing brittle positioning."
---
# 11ai CSS3 layout

Choose layout from content relationships and intrinsic sizing rather than one screenshot. Resolve the exact file, public contract, target supported browsers and user preference modes, and acceptance check before editing.

Version baseline: CSS3, represented by W3C CSS Snapshot 2025 plus current independently leveled modules, verified 31 July 2026. Use stable current module features within the CSS3 family and verify specification status and browser support per feature.

## Inspect first

```bash
rg -n 'display:|grid-|flex-|position:|overflow:|min-width|max-width|contain:' TARGET
npm run build --if-present
```

Inspect containing blocks, formatting contexts, intrinsic sizes, writing mode, source order, and overflow at the failing element.

Confirm before changing:

- Content growth and localization.
- Minimum sizes in flex and grid children.
- Containing block for positioned elements.
- Scroll ownership and focus visibility.

## Operate

```bash
npm run lint --if-present
npm run build --if-present
```

Use normal flow first, then grid for two-dimensional relationships and flexbox for one-dimensional distribution. Keep DOM order meaningful.

Never hide overflow, add fixed heights, or absolutely position content merely to conceal a layout defect without approval. Require explicit approval for any broader or destructive form of that change, and preview the affected files or public surface first.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Test content extremes, zoom, keyboard focus, narrow and wide containers, and both left-to-right and supported alternate writing directions. Report the target, files changed, public behavior, compatibility or accessibility impact, checks run, and rollback. Hand configuration failures to `11ai-operator-css-3-troubleshooting` and cross-system seams to `11ai-operator-css-3-integrations`.
