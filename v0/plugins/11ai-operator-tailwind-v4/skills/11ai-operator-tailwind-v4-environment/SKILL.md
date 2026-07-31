---
name: 11ai-operator-tailwind-v4-environment
description: "Inspect Tailwind CSS v4 core and adapter versions, scripts, CSS entry, automatic and explicit sources, theme variables, compatibility directives, plugins, generated output, and browser requirements without changing them. Use when the user asks what v4 setup exists or needs a safe baseline."
---
# 11ai Tailwind CSS v4 environment

Version baseline: Tailwind CSS 4.3.1 (stable), verified 2026-07-31; classify v3 `@tailwind` directives and implicit JavaScript configs as legacy or migration state.

Establish project root, package manager, runtime, build tool, package alignment, CSS entry, source base, output path, and browser contract before interpreting behavior.

## Smallest useful checks

```bash
node --version
npm ls tailwindcss @tailwindcss/vite @tailwindcss/postcss @tailwindcss/cli @tailwindcss/webpack --depth=0
node -p "require('./package.json').scripts"
rg --files -g '*.css' -g '*config*' -g '!node_modules'
```

Use the repository's package-manager equivalent when needed. Do not read secret values or shell history.

## Inspect configuration and sources

```bash
rg -n '@import "tailwindcss"|@theme|@source|@utility|@variant|@custom-variant|@plugin|@config|@reference' --glob '*.css' --glob '!node_modules/**'
rg -n 'tailwindcss|@tailwindcss/' package.json vite.config.* postcss.config.* webpack.config.*
rg -n 'browserslist|Chrome|Safari|Firefox' package.json .browserslistrc* README.md
```

Identify the adapter that actually compiles CSS, source paths excluded by ignore rules, theme namespaces reset with `initial`, compatibility configuration, and whether output is committed or ephemeral.

## Interpret results

A native v4 setup uses `@import "tailwindcss"`, CSS-first customization, automatic detection, and one matching adapter where required. The core v4 browser floor is Chrome 111, Safari 16.4, and Firefox 128; older requirements may require staying on v3.4.

Do not install, repair, migrate, run watch mode, or switch adapters here. Hand missing setup to `11ai-operator-tailwind-v4-setup` and failures to `11ai-operator-tailwind-v4-troubleshooting`.

## Report

State exact versions, adapter, CSS entry, source base and additions, theme namespaces, compatibility directives, plugins, scripts, output ownership, browser floor, and uncertainties. Report environment variables as names or set/unset only.
