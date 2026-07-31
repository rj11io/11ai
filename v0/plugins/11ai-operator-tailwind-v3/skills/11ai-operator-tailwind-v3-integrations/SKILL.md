---
name: 11ai-operator-tailwind-v3-integrations
description: "Connect Tailwind CSS v3 to framework build pipelines, PostCSS, editors, component libraries, monorepos, tests, and continuous integration with end-to-end verification. Use when the task concerns the seam between Tailwind v3 and another system."
---
# 11ai Tailwind CSS v3 integrations

Version baseline: Tailwind CSS 3.4.19 (stable v3 family), verified 2026-07-31; use the v3 PostCSS plugin and JavaScript configuration model.

Name both systems, their versions, the owned configuration files, stylesheet entry, content boundary, output consumer, and CI or deployment target before wiring them.

## Inspect the seam

```bash
npm ls tailwindcss postcss autoprefixer --depth=0
rg -n 'tailwindcss|postcss|autoprefixer|css|build|dev' package.json postcss.config.* vite.config.* webpack.config.* next.config.*
rg -n 'content:|presets:|plugins:' tailwind.config.*
```

Confirm which tool invokes PostCSS, which file imports the input stylesheet, and whether a monorepo package's templates fall outside current content paths.

## Wire one path deliberately

Use the framework's v3 guide or existing pipeline rather than layering a second compiler on top. Preserve plugin order, module format, package manager, lockfile, and output ownership. For component libraries, expose complete class strings or add only the exact package source path.

Read [references/integrations.md](references/integrations.md) for bounded PostCSS, monorepo, editor, test, and CI recipes.

## Verify end to end

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

Exercise one utility from each integrated source, one variant, and one production build. Inspect the browser-loaded stylesheet and compare generated size before and after content-boundary changes.

## Report

State systems and versions, configuration ownership, input and output, content paths, plugin order, files, commands, size change, checks, and rollback. Ask before changing framework build configuration, widening scans, replacing CSS assets, or updating deployment settings. Hand Tailwind failures to `11ai-operator-tailwind-v3-troubleshooting`.
