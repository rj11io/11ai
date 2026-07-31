---
name: 11ai-operator-mui-v9-components-layout
description: "Build and refactor Material UI v9 component composition and responsive layout with Box, Container, Stack, Grid, breakpoints, spacing, display, semantic elements, and reusable shells. Use when the user asks to arrange MUI components or repair layout behavior across viewports."
---
# 11ai Material UI v9 components and layout

Version baseline: Material UI 9.2.0 (stable), verified 2026-07-31; use current Grid with `size`, exclude removed GridLegacy and deprecated direct system props, and keep MUI X components out of scope.

Resolve the component owner, semantic structure, content order, layout constraints, theme breakpoints, overflow behavior, supported viewports, and public props before editing.

## Inspect first

```bash
rg -n '@mui/material/(Box|Container|Stack|Grid)|<Box|<Container|<Stack|<Grid|GridLegacy|\b(xs|sm|md|lg|xl)=' COMPONENTS
rg -n 'breakpoints|spacing|components:.*Mui(Grid|Container|Stack)' THEME_FILES
```

Count consumers of shared shells and wrapper components. Inspect the rendered element, source order, landmarks, fixed dimensions, nested scroll containers, and whether responsive values come from the theme.

## Operate

Use semantic HTML through the component's `component` prop when a wrapper represents a real landmark or section. Prefer `Stack` for one-dimensional flow, `Grid` for responsive two-dimensional placement, `Container` for bounded page width, and `Box` for small generic composition.

Use current Grid v9 syntax such as `size={{ xs: 12, md: 6 }}`. Put removed direct system props inside `sx`. Never invent breakpoints, spacing, DOM order, container widths, or minimum touch targets. Avoid using CSS order to create a visual sequence that contradicts reading and focus order.

## Verify

Test narrow, boundary, and wide viewports; zoom and large text; keyboard focus order; overflow; empty and long content; right-to-left layout when supported; and the rendered semantics. Run type checking, visual tests, and the production build.

## Report

State components and consumers changed, semantic elements, responsive rules, theme values, overflow ownership, accessibility checks, files, and rollback. Preview and get approval before changing a shared shell, theme breakpoint, or broad Grid migration. Hand theme changes to `11ai-operator-mui-v9-theming-color-schemes`.
