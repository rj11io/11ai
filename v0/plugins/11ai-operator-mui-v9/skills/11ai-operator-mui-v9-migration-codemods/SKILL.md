---
name: 11ai-operator-mui-v9-migration-codemods
description: "Plan, preview, run, review, and verify Material UI v7-to-v9 migrations across Core packages, React peers, browser targets, Grid, system props, slots, deprecated component props, classes, semantics, themes, icons, tests, and codemods. Use when the user explicitly asks to upgrade an existing Material UI project to v9."
---
# 11ai Material UI v9 migration and codemods

Version baseline: Migrate stable Material UI v7 projects to stable 9.2.0, verified 2026-07-31; MUI intentionally skipped v8 and the official guide describes a v7-to-v9 path.

Resolve exact package versions, React and browser contracts, Core versus X inventory, framework adapter, styling engine, deprecated API count, test coverage, clean branch, and rollback before migration.

## Inspect and preview

```bash
npm ls @mui/material @mui/system @mui/icons-material @mui/material-nextjs @mui/x-data-grid react react-dom --depth=0
rg -n 'GridLegacy|componentsProps|InputProps|TypographyProps|disableEscapeKeyDown|\b(xs|sm|md|lg|xl)=|\b(mt|mr|mb|ml|mx|my|p|pt|pr|pb|pl|px|py)=' src app pages
git status --short
```

Count every deprecated prop, class, GridLegacy import, direct system prop, theme override, icon rename, and separately versioned MUI X dependency. Stop if browser targets are older than Chrome 117, Edge 121, Firefox 121, or Safari 17 until the product owner decides.

## Run codemods only on request

```bash
npx @mui/codemod@^9.2.0 v9.0.0/system-props TARGET
```

Use only the codemod documented for the exact finding, on a clean dedicated branch, with a previewed target. The tool rewrites source files; never run it across the repository root by default, never accept the diff wholesale, and never update MUI X by inference.

Read [references/migration-checklist.md](references/migration-checklist.md) before package changes. Align Material UI Core packages to v9, then manually audit slots, classes, Grid, focus and roving tabindex, Dialog close reasons, semantic markup, theme types, icons, and tests.

## Verify and report

Run types, lint, unit and integration tests, production build, visual regression, keyboard paths, hydration, and the supported browser matrix. Report before and after versions, codemods and targets, files and dependencies changed, remaining removals, MUI X decision, browser decision, visual differences, rollback branch, and cleanup.
