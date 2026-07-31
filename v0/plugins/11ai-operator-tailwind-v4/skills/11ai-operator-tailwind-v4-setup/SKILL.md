---
name: 11ai-operator-tailwind-v4-setup
description: "Install and configure Tailwind CSS v4 with aligned version constraints, one deliberate Vite, PostCSS, CLI, or webpack adapter, a CSS import, source ownership, and one verified template. Use when a project has no Tailwind setup or the user explicitly asks to initialize v4."
---
# 11ai Tailwind CSS v4 setup

Version baseline: Tailwind CSS 4.3.1 (stable), verified 2026-07-31; constrain core and official adapter packages to `^4.3.1`.

Resolve project root, package manager, runtime, framework, existing CSS pipeline, stylesheet entry, source locations, browser targets, and generated-output ownership before writing.

## Gather first

```bash
node --version
rg -n 'packageManager|tailwindcss|@tailwindcss/|postcss|vite|webpack|build|dev' package.json
rg --files -g '*.css' -g 'vite.config.*' -g 'postcss.config.*' -g 'webpack.config.*' -g '!node_modules'
```

Never invent the adapter, source base, browser floor, output path, or whether generated CSS belongs in source control.

## Install and configure

```bash
npm install --save-dev tailwindcss@^4.3.1 @tailwindcss/vite@^4.3.1
```

Use the repository's package manager and replace the adapter package with `@tailwindcss/postcss`, `@tailwindcss/cli`, or `@tailwindcss/webpack` only when that is the actual build surface. Do not install duplicate adapters by default. Add `@import "tailwindcss";` to the owned CSS entry.

Read [references/setup.md](references/setup.md) for adapter decisions, browser requirements, and primary sources.

## Verify

Run the repository's development check and production build. For CLI projects, compile to a disposable output with the local `@tailwindcss/cli`. Exercise one utility, one state variant, and one responsive variant in an owned template, then inspect the browser-loaded stylesheet.

## Guardrails

Never print or commit secrets. Ask before replacing a CSS entry, switching adapters, changing source discovery, enabling global theme resets, editing many templates, or overwriting a production asset. Report versions, adapter, files, sources, browser floor, commands, checks, and rollback.
