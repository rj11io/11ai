# Material UI v9 migration checklist

Version baseline: migrate Material UI v7 to stable 9.2.0; researched 2026-07-31 from the [official v9 upgrade guide](https://mui.com/material-ui/migration/upgrade-to-v9/) and [v9 announcement](https://mui.com/blog/introducing-material-ui-v9/).

## Before any write

- Record every `@mui/*`, React, styling engine, framework adapter, and MUI X version.
- Confirm a clean dedicated branch and a reproducible install.
- Count deprecated props, classes, GridLegacy imports, direct system props, and custom theme overrides.
- Confirm the product accepts the v9 browser floor.
- Capture visual, accessibility, bundle, and production-build baselines.

## Package boundary

Align `@mui/material`, `@mui/system`, `@mui/icons-material`, `@mui/material-nextjs`, `@mui/styled-engine`, and `@mui/utils` to the v9 family only when installed and required. `@mui/lab` may remain beta and must be labeled. MUI X follows its own release and license line; migrate it through its own official guide.

React 17–19 remain valid peers. React 18 and earlier need a matching `react-is` resolution. Do not upgrade React merely to satisfy a guessed MUI requirement.

## High-risk source changes

- Replace removed GridLegacy with current Grid and `size` props.
- Move removed direct system props into `sx`.
- Replace deprecated component prop bags with `slots` and `slotProps` as documented per component.
- Replace removed `disableEscapeKeyDown` with `onClose` reason handling.
- Audit removed CSS classes and theme override keys; use documented compound selectors or variants.
- Audit Stepper, Tabs, Menu, and MenuList semantics and roving tabindex.
- Rename removed legacy icon aliases.

Run only the smallest documented codemod for each counted finding. Review imports, formatting, types, behavior, and comments after every codemod batch.

## Verification

Run the original test suite and production build, then exercise forms, menus, tabs, dialogs, portal content, responsive Grid, light and dark schemes, server hydration, keyboard focus, and the supported browser matrix. Compare screenshots and bundle output. Keep rollback available until the full diff and product behavior are approved.
