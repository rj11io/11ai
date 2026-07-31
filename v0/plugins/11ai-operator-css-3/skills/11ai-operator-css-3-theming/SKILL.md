---
name: 11ai-operator-css-3-theming
description: "Design and operate CSS3 themes with custom-property tokens, color schemes, contrast, dark mode, forced colors, component overrides, and user preference handling. Use when adding a theme, changing design tokens, fixing contrast, or making components consistent across modes."
---
# 11ai CSS3 theming

Theme tokens are a shared public contract across every component that consumes them. Resolve the exact file, public contract, target supported browsers and user preference modes, and acceptance check before editing.

Version baseline: CSS3, represented by W3C CSS Snapshot 2025 plus current independently leveled modules, verified 31 July 2026. Use stable current module features within the CSS3 family and verify specification status and browser support per feature.

## Inspect first

```bash
rg -n ':root|--[a-z-]+:|prefers-color-scheme|forced-colors|color-scheme|@theme' TARGET
npx stylelint TARGET
```

Map semantic tokens to raw values and consumers before changing them. Verify whether the theme follows system preference, stored choice, or both.

Confirm before changing:

- Semantic token purpose and fallback.
- Text and non-text contrast.
- Forced-colors behavior.
- Flash-free initial theme selection.

## Operate

```bash
npm run lint --if-present
npm run build --if-present
```

Change semantic tokens at the narrowest shared scope and test overrides in every supported theme. Keep state colors distinguishable without color alone.

Never rename or delete global tokens, change default theme policy, or suppress forced colors without an approved migration. Require explicit approval for any broader or destructive form of that change, and preview the affected files or public surface first.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Review representative components in light, dark, high-contrast, forced-colors, hover, focus, disabled, and error states. Report the target, files changed, public behavior, compatibility or accessibility impact, checks run, and rollback. Hand configuration failures to `11ai-operator-css-3-troubleshooting` and cross-system seams to `11ai-operator-css-3-integrations`.
