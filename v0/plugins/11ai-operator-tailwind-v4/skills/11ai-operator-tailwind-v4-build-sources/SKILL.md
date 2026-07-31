---
name: 11ai-operator-tailwind-v4-build-sources
description: "Operate Tailwind CSS v4 Vite, PostCSS, CLI, and webpack builds, automatic detection, source base paths, explicit and inline sources, exclusions, watch mode, minification, and output. Use when classes must be discovered reliably or a v4 build boundary needs a focused change."
---
# 11ai Tailwind CSS v4 builds and sources

Version baseline: Tailwind CSS 4.3.1 (stable), verified 2026-07-31; align official adapters to v4.3 and use v4 source directives.

Resolve the active adapter, CSS entry, automatic source base, ignored paths, explicit sources, command, output owner, and browser target before running or changing a build.

## Inspect first

```bash
npm ls tailwindcss @tailwindcss/vite @tailwindcss/postcss @tailwindcss/cli @tailwindcss/webpack --depth=0
rg -n 'tailwindcss|@tailwindcss/|@import "tailwindcss"|@source' package.json --glob '*.css' --glob '*config*'
git check-ignore -v SOURCE_FILE
```

Count authored files added by each explicit source. Distinguish source trees from generated output, dependencies, binary files, and package-manager stores.

## Operate

Use the existing adapter. Adjust `source()` on the import or add a narrow `@source` only when automatic detection demonstrably misses an owned source. Use `@source not` for a known over-broad subtree and `@source inline()` only for bounded external class contracts.

```bash
npx @tailwindcss/cli -i INPUT.css -o TEMP_OUTPUT.css --minify
```

Run this only when the aligned CLI adapter is installed. Compile to a disposable path before replacing output. Watch mode creates a long-running process; start and stop it only on request.

## Verify and report

Confirm representative base, utility, custom, responsive, state, and explicitly sourced selectors, run the production build, and compare output bytes and build time. Report adapter, paths, source counts, ignore evidence, command, exit code, selector evidence, size change, browser assumptions, files, and rollback. Ask before overwriting committed or deployed CSS.
