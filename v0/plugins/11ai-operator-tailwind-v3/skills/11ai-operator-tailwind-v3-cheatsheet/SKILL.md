---
name: 11ai-operator-tailwind-v3-cheatsheet
description: "Look up Tailwind CSS v3 commands, directives, content configuration, theme extension, utilities, variants, plugins, and build patterns. Use when the user wants a concise v3 reference instead of a guided workflow."
---
# 11ai Tailwind CSS v3 cheatsheet

Version baseline: Tailwind CSS 3.4.19 (stable v3 family), verified 2026-07-31; exclude Tailwind v4 CSS-first configuration, dedicated v4 packages, and upgrade-only APIs.

Use the installed package, active config, build tool, input stylesheet, and repository conventions as the source of truth. This lookup surface stops before unrequested installation or file changes.

## Inspect

```bash
npm ls tailwindcss postcss autoprefixer --depth=0
rg -n 'tailwindcss|@tailwind|content:|safelist:|darkMode:|plugins:' package.json tailwind.config.* postcss.config.* src app
```

Confirm the v3 major, package manager, configuration module format, stylesheet entry, scripts, and generated-output ownership before selecting a command.

## Common commands and directives

```bash
npx tailwindcss -i INPUT.css -o OUTPUT.css
npx tailwindcss -i INPUT.css -o OUTPUT.css --watch
npx tailwindcss -i INPUT.css -o OUTPUT.css --minify
```

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Do not use the Tailwind v4 `@import "tailwindcss"`, `@theme`, `@source`, `@utility`, or `@variant` APIs as v3 instructions.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-tailwind-v3-build-content` | CLI or PostCSS builds, content globs, safelists, watch mode, and output |
| `11ai-operator-tailwind-v3-theme-config` | JavaScript configuration, presets, tokens, and core settings |
| `11ai-operator-tailwind-v3-utilities-components` | Utilities, arbitrary values, layers, components, and apply |
| `11ai-operator-tailwind-v3-variants-responsive` | States, responsive behavior, dark mode, group, peer, data, and containers |
| `11ai-operator-tailwind-v3-plugins` | Official and custom plugins and their generated APIs |

## Answer format

Lead with the smallest v3-valid command or snippet, then name the inspected target, expected output, verification, and one risk. Stop before dependency changes, configuration replacement, broad template rewrites, or overwriting production CSS.
