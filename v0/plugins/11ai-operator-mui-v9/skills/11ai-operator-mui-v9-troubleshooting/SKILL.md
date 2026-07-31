---
name: 11ai-operator-mui-v9-troubleshooting
description: "Diagnose Material UI v9 package, React peer, styling engine, injection order, provider, theme, hydration, portal, focus, controlled-state, browser, TypeScript, and test failures from exact evidence. Use when MUI components fail to render, style, hydrate, interact, or type-check as expected."
---
# 11ai Material UI v9 troubleshooting

Version baseline: Material UI 9.2.0 (stable), verified 2026-07-31; distinguish v7-era deprecated patterns, v10 previews, MUI X behavior, and third-party styling problems from MUI Core v9.

Separate observed facts from theories. Establish the original command or interaction, exact error, package graph, provider tree, component state, server boundary, styling order, browser, and smallest reproduction.

## Evidence collection

```bash
npm ls @mui/material @mui/system @mui/icons-material @mui/material-nextjs @emotion/react @emotion/styled react react-dom react-is --depth=0
rg -n 'ThemeProvider|CssBaseline|CacheProvider|AppRouterCacheProvider|StyledEngineProvider|createTheme|colorSchemes|cssVariables' src app pages
npm run build
```

Preserve exact stderr, console warnings, hydration diff, DOM semantics, focus sequence, and exit code. Redact private form values, server data, URLs, source maps, and secrets before quoting output.

## Classify the failure

- **Package or peer mismatch:** MUI Core packages differ by major, React peers are duplicated, or `react-is` mismatches React 18 or earlier.
- **Style boundary:** the styling engine, cache, insertion point, CSS layer, specificity, baseline, or server extraction is wrong.
- **Provider or hydration boundary:** providers are duplicated, client-only values differ on the server, or color-scheme initialization flashes.
- **Component state boundary:** controlled and uncontrolled props, identity comparison, open state, close reason, or validation ownership conflicts.
- **Portal or focus boundary:** the container, stacking context, anchor, transition, focus trap, roving tabindex, or restoration path is incorrect.
- **Removed API or product mismatch:** v9 removed the prop, class, system prop, or GridLegacy API, or the component actually belongs to MUI X.

## Remediation discipline

Propose one bounded change and state confidence. Ask before dependency changes, provider moves, cache replacement, global theme changes, baseline changes, codemods, or browser-target changes. Re-run the original check and repeat keyboard, hydration, visual, and type verification.

## Report

State the failing boundary, evidence, cause or uncertainty, proposed fix, public and accessibility impact, files, rollback, and verification. If the environment is unclear or unhealthy, hand off to `11ai-operator-mui-v9-environment`.
