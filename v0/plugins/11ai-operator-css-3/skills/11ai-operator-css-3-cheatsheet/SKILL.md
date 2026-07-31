---
name: 11ai-operator-css-3-cheatsheet
description: "Look up CSS3 inspection, setup, validation, and focused operation patterns across cascade and selectors, layout, responsive design, theming, motion. Use when the user wants a concise command or pattern reference instead of a guided workflow."
---
# 11ai CSS3 cheatsheet

Use the installed project conventions and target browsers or runtimes as the source of truth. This is a lookup surface; send multi-step work to the matching sibling skill in this plugin.

Version baseline: CSS3, represented by W3C CSS Snapshot 2025 plus current independently leveled modules, verified 31 July 2026. Use stable current module features within the CSS3 family and verify specification status and browser support per feature.

## Inspect

```bash
rg --files -g '*.css' -g '*.scss' -g '*.pcss' | head -80
rg -n '@layer|@scope|@media|@container|!important|:root|display:' . --glob '*.css' | head -120
```

Read versions, configuration, entry points, and generated output before choosing a command. Never assume browser support, design tokens, stylesheet order, preprocessor ownership, or breakpoint policy.

## Common commands

```bash
npm install --save-dev stylelint stylelint-config-standard
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

The install command is for requested setup only. Preserve the repository package manager and lockfile; do not upgrade unrelated packages or rewrite configuration during a lookup.

## Domain map

| Skill suffix | Use it for |
| --- | --- |
| `cascade-selectors` | Origins, layers, scope, specificity, inheritance, and selectors |
| `layout` | Normal flow, flexbox, grid, positioning, overflow, and containment |
| `responsive` | Fluid sizing, media and container queries, breakpoints, and input modes |
| `theming` | Tokens, color schemes, contrast, forced colors, and component overrides |
| `motion` | Transitions, keyframes, view transitions, and reduced motion |

For changes, use the exact sibling skill named `11ai-operator-css-3-AREA`. For environment inspection, setup, integrations, or diagnosis, use the corresponding required archetype in this plugin.

## Answer format

Lead with the smallest applicable command or stylesheet and rendered layout pattern. Add the target file or surface, what it reads or changes, the verification command, and one safety note. Keep secrets redacted and stop before an unrequested state change.
