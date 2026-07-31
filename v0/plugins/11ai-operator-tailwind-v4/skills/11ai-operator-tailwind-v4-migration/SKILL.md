---
name: 11ai-operator-tailwind-v4-migration
description: "Plan, preview, execute, review, and verify Tailwind CSS v3-to-v4 migrations across packages, build adapters, CSS imports, configuration, utilities, variants, templates, browser requirements, and plugins. Use when the user explicitly asks to upgrade an existing v3 project to v4."
---
# 11ai Tailwind CSS v4 migration

Version baseline: Migrate from stable Tailwind CSS 3.4.19 to stable 4.3.1, verified 2026-07-31; the official upgrade tool requires Node.js 20 or newer.

Resolve the exact v3 baseline, runtime, package manager, browser contract, build adapter, config and plugin inventory, generated ownership, visual test coverage, and rollback branch before migration.

## Inspect and preview

```bash
node --version
npm ls tailwindcss postcss autoprefixer --depth=0
rg -n '@tailwind|content:|safelist:|corePlugins:|separator:|prefix:|important:|theme\(|@apply|plugins:' tailwind.config.* postcss.config.* package.json --glob '*.css'
git status --short
```

Count affected configuration keys, directives, deprecated or renamed utilities, template files, plugins, and browser targets. The v4 core floor is Chrome 111, Safari 16.4, and Firefox 128; stop if the product requires older browsers unless the user changes that contract.

## Migrate deliberately

```bash
npx @tailwindcss/upgrade
```

Run the official tool only on explicit request, from a clean dedicated branch, with Node.js 20 or newer. It updates dependencies, configuration, and templates, so capture the before state and review its full diff. Never accept a codemod wholesale or delete legacy files merely because the tool touched them.

Manually audit adapter packages, `@import "tailwindcss"`, CSS theme conversion, explicit sources, prefix and important syntax, Preflight changes, plugin compatibility, renamed utilities, variant stacking, arbitrary values, and separately bundled styles needing `@reference`.

## Verify and report

Run lint, tests, production build, representative visual and accessibility checks, both sides of breakpoints, and the supported browser matrix. Compare CSS size and warnings. Report versions, tool revision, files and dependency changes, unresolved compatibility items, browser decision, checks, visual differences, rollback branch, and cleanup. Hand plugin seams to `11ai-operator-tailwind-v4-plugins-compatibility`.
