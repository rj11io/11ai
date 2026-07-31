---
name: 11ai-operator-tailwind-v3-environment
description: "Inspect Tailwind CSS v3 versions, package manager, scripts, JavaScript configuration, PostCSS integration, content sources, input stylesheets, plugins, and output ownership without changing them. Use when the user asks what Tailwind setup exists or needs a safe baseline before other work."
---
# 11ai Tailwind CSS v3 environment

Version baseline: Tailwind CSS 3.4.19 (stable v3 family), verified 2026-07-31; treat v4 packages and CSS-first directives as a different major.

Establish the project root, package manager, build tool, configured v3 version, stylesheet entry, template ownership, and output path before interpreting behavior.

## Smallest useful checks

```bash
node --version
npm ls tailwindcss postcss autoprefixer --depth=0
node -p "require('./package.json').scripts"
rg --files -g 'tailwind.config.*' -g 'postcss.config.*' -g '*.css' -g '!node_modules'
```

Use the repository's package-manager equivalent when it is not npm. Do not read credential values or shell history.

## Inspect configuration and sources

```bash
rg -n 'content:|safelist:|theme:|extend:|darkMode:|prefix:|important:|corePlugins:|plugins:' tailwind.config.*
rg -n '@tailwind|@layer|@apply' --glob '*.css' --glob '!node_modules/**'
rg -n 'tailwindcss|postcss|autoprefixer' package.json postcss.config.*
```

Map every content glob to real directories and note generated files, dependencies, and missing template extensions. Identify whether compiled CSS is committed, ignored, or created only by the build.

## Interpret results

A v3 project normally owns `tailwind.config.*`, explicit `content` entries, and three `@tailwind` layer directives. The v4-only `@theme`, `@source`, or dedicated `@tailwindcss/cli` package signals a mixed or migrated setup that must be classified before work continues.

Do not install, initialize, rewrite configuration, run watch mode, or repair anything in this skill. Hand missing setup to `11ai-operator-tailwind-v3-setup` and failures to `11ai-operator-tailwind-v3-troubleshooting`.

## Report

State the exact versions, stability family, package manager, module format, build integration, scripts, input and output paths, content coverage, plugins, global settings, generated ownership, and uncertainties. Redact secret values and report environment variables as names or set/unset only.
