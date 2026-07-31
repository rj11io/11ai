---
name: 11ai-operator-css-3-cascade-selectors
description: "Inspect and control CSS3 origins, cascade layers, scope, specificity, inheritance, custom properties, selectors, and source order. Use when styles do not apply, overrides are fragile, specificity is escalating, or stylesheet ownership must be clarified."
---
# 11ai CSS3 cascade and selectors

The cascade chooses a winner before specificity can explain it. Resolve the exact file, public contract, target supported browsers and user preference modes, and acceptance check before editing.

Version baseline: CSS3, represented by W3C CSS Snapshot 2025 plus current independently leveled modules, verified 31 July 2026. Use stable current module features within the CSS3 family and verify specification status and browser support per feature.

## Inspect first

```bash
rg -n '@layer|@scope|!important|:where|:is|:has|--[a-z-]+:' TARGET
npx stylelint TARGET
```

Trace origin, importance, layer order, scope proximity, specificity, and source order in that order for the exact element and state.

Confirm before changing:

- Which stylesheet and layer owns the rule.
- Inherited and computed custom properties.
- Selector reach and unintended matches.
- User styles and forced preference modes.

## Operate

```bash
npx stylelint TARGET --fix
npm run build --if-present
```

Prefer layers, low-specificity component selectors, and scoped custom properties over escalating selectors. Use auto-fix only after previewing the exact file diff.

Never add !important, reorder global layers, or rename shared selectors as a shortcut without reviewing all matched elements. Require explicit approval for any broader or destructive form of that change, and preview the affected files or public surface first.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Compare computed styles before and after for the target plus representative consumers, states, and preference modes. Report the target, files changed, public behavior, compatibility or accessibility impact, checks run, and rollback. Hand configuration failures to `11ai-operator-css-3-troubleshooting` and cross-system seams to `11ai-operator-css-3-integrations`.
