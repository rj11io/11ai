# 11ai Material UI v9 operator

Thirteen standalone skills for Material UI v9 setup, components, layout, forms, inputs, data display, feedback, navigation, overlays, theming, styling, migration, integrations, first-party Agent Skills, and troubleshooting, with read-first checks around public component behavior and application-wide visual changes.

Version baseline: Material UI 9.2.0, stable, verified 2026-07-31 from the [official versions page](https://mui.com/material-ui/getting-started/versions/), [current changelog](https://mui.com/material-ui/discover-more/changelog/), [npm registry page](https://www.npmjs.com/package/@mui/material), and [v9 migration guide](https://mui.com/material-ui/migration/upgrade-to-v9/). This plugin covers Material UI Core; separately versioned MUI X products are out of scope.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-mui-v9-cheatsheet`](./skills/11ai-operator-mui-v9-cheatsheet/SKILL.md) | Quick imports, components, styling choices, and safe v9 patterns |
| [`11ai-operator-mui-v9-environment`](./skills/11ai-operator-mui-v9-environment/SKILL.md) | Read-only package, React, theme, provider, styling-engine, and browser inspection |
| [`11ai-operator-mui-v9-setup`](./skills/11ai-operator-mui-v9-setup/SKILL.md) | Version-pinned installation, styling engine, providers, fonts, icons, and smoke checks |
| [`11ai-operator-mui-v9-integrations`](./skills/11ai-operator-mui-v9-integrations/SKILL.md) | Next.js, routing, Tailwind, CSS modules, forms, testing, and CI seams |
| [`11ai-operator-mui-v9-troubleshooting`](./skills/11ai-operator-mui-v9-troubleshooting/SKILL.md) | Evidence-led diagnosis of styling, hydration, portal, focus, and dependency failures |
| [`11ai-operator-mui-v9-native-skills`](./skills/11ai-operator-mui-v9-native-skills/SKILL.md) | Compatibility-checking and installing MUI's first-party v9 Agent Skills |
| [`11ai-operator-mui-v9-components-layout`](./skills/11ai-operator-mui-v9-components-layout/SKILL.md) | Box, Container, Stack, Grid, responsive layout, composition, and semantics |
| [`11ai-operator-mui-v9-forms-inputs`](./skills/11ai-operator-mui-v9-forms-inputs/SKILL.md) | Text fields, selection, autocomplete, validation, controlled state, and accessibility |
| [`11ai-operator-mui-v9-data-display-feedback`](./skills/11ai-operator-mui-v9-data-display-feedback/SKILL.md) | Tables, lists, cards, chips, alerts, snackbars, progress, skeletons, and empty states |
| [`11ai-operator-mui-v9-navigation-overlays`](./skills/11ai-operator-mui-v9-navigation-overlays/SKILL.md) | App bars, drawers, tabs, menus, dialogs, popovers, tooltips, portals, and focus |
| [`11ai-operator-mui-v9-theming-color-schemes`](./skills/11ai-operator-mui-v9-theming-color-schemes/SKILL.md) | Theme tokens, CSS variables, light and dark schemes, TypeScript, and SSR flicker |
| [`11ai-operator-mui-v9-styling-slots`](./skills/11ai-operator-mui-v9-styling-slots/SKILL.md) | sx, styled, theme overrides, slots, slotProps, state classes, and global CSS |
| [`11ai-operator-mui-v9-migration-codemods`](./skills/11ai-operator-mui-v9-migration-codemods/SKILL.md) | Reviewed v7-to-v9 upgrades, removed APIs, codemods, package alignment, and rollback |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and never depends on another 11ai plugin. MUI's native skills are optional upstream guidance and are installed only when explicitly requested after their v9 compatibility metadata is checked.

## Safety contract

Inspect exact Material UI, React, React DOM, Emotion or styled-components, icons, System, framework integration, provider, theme, and browser versions before editing.

Never guess the styling engine, theme tokens, component state owner, route target, portal container, breakpoint, color-scheme persistence, SSR cache, or whether a component comes from Material UI Core or MUI X.

Ask before changing providers, global theme tokens, `CssBaseline`, injection order, component defaults, browser targets, public component props, dependencies, or running codemods. Preview consumer counts and full diffs before bulk slot, prop, class, or import changes.

Never quote private form values, tokens, server-rendered state, analytics payloads, or environment secrets. Test semantics, keyboard operation, focus restoration, hydration, responsive states, and rollback before reporting a broad UI change complete.
