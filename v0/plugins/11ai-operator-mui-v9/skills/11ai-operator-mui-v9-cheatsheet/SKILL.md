---
name: 11ai-operator-mui-v9-cheatsheet
description: "Look up Material UI v9 installation commands, imports, components, layout primitives, form controls, overlays, theme APIs, styling strategies, slots, and migration tools. Use when the user wants a concise v9 reference instead of a guided workflow."
---
# 11ai Material UI v9 cheatsheet

Version baseline: Material UI 9.2.0 (stable), verified 2026-07-31; use stable v9 APIs and exclude v10 previews, removed GridLegacy APIs, deprecated component props, and MUI X packages.

Use installed packages, React version, framework, styling engine, provider tree, theme, and repository conventions as the source of truth. Stop before unrequested dependency or UI changes.

## Inspect

```bash
npm ls @mui/material @mui/system @mui/icons-material @emotion/react @emotion/styled react react-dom --depth=0
rg -n '@mui/material|ThemeProvider|createTheme|CssBaseline|StyledEngineProvider|AppRouterCacheProvider' package.json src app pages
```

Confirm package major alignment, React peer compatibility, server and client boundaries, styling ownership, and whether a requested component belongs to Material UI Core.

## Common imports and setup

```tsx
import Button from "@mui/material/Button"
import Grid from "@mui/material/Grid"
import { createTheme, ThemeProvider } from "@mui/material/styles"
```

```bash
npm install @mui/material@^9.2.0 @emotion/react @emotion/styled
npm install @mui/icons-material@^9.2.0
```

Use the repository's package manager. Icons are optional. React 17, 18, and 19 are supported peers; React 18 or earlier needs the documented matching `react-is` resolution.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-mui-v9-components-layout` | Box, Container, Stack, Grid, composition, and responsive layout |
| `11ai-operator-mui-v9-forms-inputs` | Input state, validation, selection, autocomplete, and labels |
| `11ai-operator-mui-v9-data-display-feedback` | Tables, lists, cards, status, loading, alerts, and snackbars |
| `11ai-operator-mui-v9-navigation-overlays` | Navigation, portals, close reasons, focus, and layering |
| `11ai-operator-mui-v9-theming-color-schemes` | Theme tokens, CSS variables, color schemes, TypeScript, and SSR |
| `11ai-operator-mui-v9-styling-slots` | sx, styled, overrides, slots, slotProps, and state classes |
| `11ai-operator-mui-v9-migration-codemods` | Explicit v7-to-v9 migration work |

## Answer format

Lead with the smallest v9-valid import, component, or command, then name the target, state ownership, accessibility requirement, verification, and one risk. Stop before global theme changes, dependency updates, codemods, or public API rewrites.
