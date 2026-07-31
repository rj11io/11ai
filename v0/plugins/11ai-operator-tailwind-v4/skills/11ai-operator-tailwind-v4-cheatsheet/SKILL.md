---
name: 11ai-operator-tailwind-v4-cheatsheet
description: "Look up Tailwind CSS v4 commands, build adapters, source detection, CSS-first themes, custom utilities, variants, compatibility directives, and migration patterns. Use when the user wants a concise v4 reference instead of a guided workflow."
---
# 11ai Tailwind CSS v4 cheatsheet

Version baseline: Tailwind CSS 4.3.1 (stable), verified 2026-07-31; exclude prerelease APIs and do not present v3 configuration as the v4 default.

Use installed packages, the active CSS entry, framework build adapter, source ownership, browser contract, and repository conventions as the source of truth. Stop before unrequested installation or writes.

## Inspect

```bash
npm ls tailwindcss @tailwindcss/vite @tailwindcss/postcss @tailwindcss/cli @tailwindcss/webpack --depth=0
rg -n 'tailwindcss|@import "tailwindcss"|@theme|@source|@utility|@variant|@plugin|@config|@reference' package.json --glob '*.css' --glob '*config*'
```

Confirm v4 package alignment, the single intended adapter, input stylesheet, source base, output owner, legacy seams, and browser floor.

## Common packages and directives

```bash
npm install --save-dev tailwindcss@^4.3.1 @tailwindcss/vite@^4.3.1
npm install --save-dev tailwindcss@^4.3.1 @tailwindcss/postcss@^4.3.1
npm install --save-dev tailwindcss@^4.3.1 @tailwindcss/cli@^4.3.1
```

Choose one adapter that matches the existing build, not all three.

```css
@import "tailwindcss";
@source "../shared-ui";
@theme { --color-brand-500: oklch(0.62 0.19 255); }
```

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-tailwind-v4-build-sources` | Build adapters, automatic source detection, source directives, and output |
| `11ai-operator-tailwind-v4-theme-variables` | CSS theme variables, namespaces, sharing, and runtime use |
| `11ai-operator-tailwind-v4-utilities-variants` | Utilities, custom definitions, states, responsive behavior, and variants |
| `11ai-operator-tailwind-v4-plugins-compatibility` | CSS plugins, JavaScript compatibility config, and references |
| `11ai-operator-tailwind-v4-migration` | Reviewed v3-to-v4 upgrade work |

## Answer format

Lead with the smallest v4-valid command or snippet, then name target, expected output, browser assumption, verification, and one risk. Stop before dependencies, migration, global source or theme changes, and production output replacement.
