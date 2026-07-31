---
name: 11ai-operator-mui-v9-environment
description: "Inspect Material UI v9 packages, React peers, styling engine, provider hierarchy, theme creation, CSS variables, framework adapters, icons, component imports, browser targets, and test setup without changing them. Use when the user asks what MUI setup exists or needs a safe baseline."
---
# 11ai Material UI v9 environment

Version baseline: Material UI 9.2.0 (stable), verified 2026-07-31; classify v7-era deprecated props, GridLegacy, and mismatched MUI X versions rather than treating them as v9 Core APIs.

Establish project root, package manager, React version, renderer, framework, styling engine, provider ownership, theme entry, server boundary, and browser contract before interpreting behavior.

## Smallest useful checks

```bash
node --version
npm ls @mui/material @mui/system @mui/icons-material @mui/material-nextjs @emotion/react @emotion/styled styled-components react react-dom react-is --depth=0
node -p "require('./package.json').scripts"
```

Use the repository's package-manager equivalent when needed. Do not read secrets, private form payloads, or shell history.

## Inspect providers and usage

```bash
rg -n 'ThemeProvider|createTheme|CssBaseline|StyledEngineProvider|CacheProvider|AppRouterCacheProvider|cssVariables|colorSchemes' src app pages
rg -n '@mui/material/(GridLegacy|[^"'"']+)|from ["'"']@mui/material["'"']|componentsProps|InputProps|TypographyProps' src app pages
rg -n 'browserslist|Chrome|Edge|Firefox|Safari' package.json .browserslistrc* README.md
```

Map provider order, duplicate themes, styling caches, import breadth, legacy APIs, portal targets, global baselines, and separately versioned MUI X packages. Report environment variables by name or set/unset only.

## Interpret results

Material UI v9 supports React and React DOM 17–19 and defaults to Emotion. React 18 or earlier requires `react-is` aligned to React. The v9 default browser targets include Chrome 117, Edge 121, Firefox 121, and Safari 17.

Do not install, upgrade, move providers, change styling engines, or repair anything here. Hand missing setup to `11ai-operator-mui-v9-setup` and failures to `11ai-operator-mui-v9-troubleshooting`.

## Report

State exact package and React versions, package manager, framework, styling engine, provider tree, theme mode, CSS-variable use, server integration, imports, icons, tests, browser targets, MUI X boundaries, and uncertainties.
