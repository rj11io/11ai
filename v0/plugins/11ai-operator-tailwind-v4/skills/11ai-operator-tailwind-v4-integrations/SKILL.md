---
name: 11ai-operator-tailwind-v4-integrations
description: "Connect Tailwind CSS v4 to framework build pipelines, CSS modules and component styles, editors, monorepos, component libraries, tests, continuous integration, and deployment with end-to-end checks. Use when the task concerns the seam between Tailwind v4 and another system."
---
# 11ai Tailwind CSS v4 integrations

Version baseline: Tailwind CSS 4.3.1 (stable), verified 2026-07-31; align every official build adapter to the same v4 family.

Name both systems, versions, build adapter, CSS entry, source boundary, browser contract, output consumer, and CI or deployment target before wiring them.

## Inspect the seam

```bash
npm ls tailwindcss @tailwindcss/vite @tailwindcss/postcss @tailwindcss/cli @tailwindcss/webpack --depth=0
rg -n 'tailwindcss|@tailwindcss/|css|build|dev' package.json vite.config.* postcss.config.* webpack.config.*
rg -n '@source|@reference|@config|@plugin' --glob '*.css' --glob '!node_modules/**'
```

Confirm which adapter compiles the CSS, which file imports the entry, and whether separately bundled component styles can see the main theme and custom definitions.

## Wire one path deliberately

Preserve module format, package manager, lockfile, plugin ordering, and output ownership. Use `@reference` for separately processed CSS modules or component style blocks that need theme variables and custom utilities without duplicating CSS. Add only exact external source directories.

Read [references/integrations.md](references/integrations.md) for bounded framework, monorepo, component-style, editor, and CI recipes.

## Verify end to end

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

Exercise one utility from each integrated source, one custom definition, and one variant. Inspect the browser-loaded stylesheet, adapter warnings, and CSS size before and after source changes.

## Report

State systems and versions, adapter and configuration ownership, CSS entry, source paths, reference paths, browser floor, files, commands, size change, checks, and rollback. Ask before switching adapters, changing source discovery, or deployment settings. Hand failures to `11ai-operator-tailwind-v4-troubleshooting`.
