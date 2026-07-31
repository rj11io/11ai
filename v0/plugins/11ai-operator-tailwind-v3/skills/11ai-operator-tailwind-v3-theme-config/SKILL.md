---
name: 11ai-operator-tailwind-v3-theme-config
description: "Manage Tailwind CSS v3 JavaScript configuration including theme extension, design tokens, presets, prefixes, important selectors, core plugins, and shared configuration. Use when the user asks to customize or review the v3 design system and configuration behavior."
---
# 11ai Tailwind CSS v3 theme configuration

Version baseline: Tailwind CSS 3.4.19 (stable v3 family), verified 2026-07-31; configure the theme in `tailwind.config.*`, not with v4 `@theme` variables.

Resolve config ownership, module format, preset chain, current token consumers, browser contract, and whether a value should extend or replace a default before editing.

## Inspect first

```bash
rg -n 'presets:|theme:|extend:|colors:|spacing:|fontFamily:|screens:|prefix:|important:|corePlugins:' tailwind.config.*
rg -n 'theme\(|config\(' --glob '*.css' --glob '*.js' --glob '*.ts' --glob '!node_modules/**'
```

Count uses of any token, breakpoint, prefix, or important selector that may change. Inspect resolved config with a small project-local script only when needed; do not quote secret-bearing plugin options.

## Operate

Prefer `theme.extend` for additive tokens. Replace a top-level theme scale only when the user intends to remove defaults and the affected classes have been counted. Match CommonJS or ESM and preserve presets and plugin order.

Use semantic token names that come from the project's design contract. Never invent colors, fonts, breakpoints, spacing, or container widths. Changing `prefix`, `important`, `corePlugins.preflight`, or a shared preset can rewrite behavior across the application; show the impact and get approval.

## Verify

```bash
npx tailwindcss -c CONFIG -i INPUT.css -o TEMP_OUTPUT.css
```

Compile a disposable artifact, check old and new representative selectors, run visual and build tests, and inspect the config diff. Do not overwrite production output during configuration verification.

## Report

State the config and preset chain, exact tokens or global settings changed, consumer count, generated selectors, visual impact, files, checks, and rollback. Hand missing classes to `11ai-operator-tailwind-v3-build-content` and plugin behavior to `11ai-operator-tailwind-v3-plugins`.
