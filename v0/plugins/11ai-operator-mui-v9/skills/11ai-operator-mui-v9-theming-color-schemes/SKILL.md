---
name: 11ai-operator-mui-v9-theming-color-schemes
description: "Manage Material UI v9 themes, design tokens, palettes, typography, spacing, breakpoints, component defaults, CSS variables, color schemes, dark-mode persistence, TypeScript augmentation, and SSR initialization. Use when the user asks to customize or repair the MUI design system."
---
# 11ai Material UI v9 theming and color schemes

Version baseline: Material UI 9.2.0 (stable), verified 2026-07-31; use `ThemeProvider`, current `colorSchemes`, `cssVariables`, and generated `theme.vars`, and do not write directly to the reserved `vars` option.

Resolve the owned theme module, provider tree, brand tokens, color contrast contract, scheme persistence, server-render path, TypeScript declarations, and consumer count before editing.

## Inspect first

```bash
rg -n 'createTheme|ThemeProvider|colorSchemes|cssVariables|theme\.vars|palette:|typography:|spacing:|breakpoints:|components:' src app pages
rg -n 'InitColorSchemeScript|useColorScheme|modeStorageKey|colorSchemeSelector|module ["'"']@mui/material/styles' src app pages
```

Count consumers of changed tokens and component defaults. Inspect nested themes, reserved `vars`, SSR initialization, persistence keys, system preference, contrast, font loading, and flash behavior.

## Operate

Keep design tokens in one owned theme and use module augmentation for custom TypeScript fields. Enable `cssVariables` deliberately, reference generated values through `theme.vars`, and define light, dark, or named schemes from actual product requirements.

Never invent brand colors, typography, spacing, breakpoints, contrast thresholds, storage keys, or default scheme. Changing palette tokens, breakpoints, `Mui*` defaults, or `CssBaseline` has application-wide effects; preview consumers and visual diffs and get approval.

For server rendering, place the documented color-scheme initialization before themed content so server and client choose the same initial scheme. Do not read browser-only state during server render.

## Verify and report

Test every scheme, first load, reload, cross-tab behavior, system preference, no-JavaScript fallback, hydration, contrast, zoom, and representative component states. Report theme files, tokens and defaults changed, consumer count, persistence and SSR decisions, visual and accessibility checks, and rollback. Hand local styling to `11ai-operator-mui-v9-styling-slots`.
