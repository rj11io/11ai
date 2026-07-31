---
name: 11ai-operator-css-3-responsive
description: "Implement responsive CSS3 with fluid sizing, media queries, container queries, logical properties, responsive typography, and input or preference queries. Use when a layout must adapt across viewports or containers, breakpoints are failing, or mobile and desktop behavior diverges."
---
# 11ai CSS3 responsive design

Responsive behavior belongs to content constraints, not named device models. Resolve the exact file, public contract, target supported browsers and user preference modes, and acceptance check before editing.

Version baseline: CSS3, represented by W3C CSS Snapshot 2025 plus current independently leveled modules, verified 31 July 2026. Use stable current module features within the CSS3 family and verify specification status and browser support per feature.

## Inspect first

```bash
rg -n '@media|@container|clamp\(|min\(|max\(|dvw|dvh|prefers-|hover:|pointer:' TARGET
npm run build --if-present
```

Identify the component's available container, content failure points, supported browsers, zoom behavior, and input modes before adding a breakpoint.

Confirm before changing:

- Content-driven breakpoints.
- Container versus viewport ownership.
- Touch targets and coarse pointers.
- Zoom, text reflow, and safe areas.

## Operate

```bash
npm run lint --if-present
npm run build --if-present
```

Start from a usable narrow layout, add a query only where content needs it, and prefer logical properties and fluid constraints.

Never remove content, disable zoom, or create separate inaccessible mobile markup to satisfy a visual breakpoint. Require explicit approval for any broader or destructive form of that change, and preview the affected files or public surface first.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Test representative widths, 200 percent zoom, text enlargement, portrait and landscape, coarse pointer, and reduced-data expectations where applicable. Report the target, files changed, public behavior, compatibility or accessibility impact, checks run, and rollback. Hand configuration failures to `11ai-operator-css-3-troubleshooting` and cross-system seams to `11ai-operator-css-3-integrations`.
