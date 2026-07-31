---
name: 11ai-operator-tailwind-v3-build-content
description: "Operate Tailwind CSS v3 CLI and PostCSS builds, explicit content globs, raw sources, safelists, watch mode, minification, and generated CSS outputs. Use when classes must be discovered reliably or a v3 build pipeline needs a focused change."
---
# 11ai Tailwind CSS v3 build and content

Version baseline: Tailwind CSS 3.4.19 (stable v3 family), verified 2026-07-31; use explicit JavaScript `content` configuration rather than v4 automatic detection and `@source`.

Resolve the config file, input stylesheet, content owners, command, output path, and whether output is disposable or committed before running or changing a build.

## Inspect first

```bash
npm ls tailwindcss --depth=0
rg -n 'tailwindcss|content:|safelist:|relative:|transform:|extract:' package.json tailwind.config.* postcss.config.*
rg -n '@tailwind' --glob '*.css' --glob '!node_modules/**'
```

Expand each content glob mentally or with a read-only file listing. Count matching authored templates, identify missing extensions, and distinguish sources from generated output and dependencies.

## Operate

```bash
npx tailwindcss -c CONFIG -i INPUT.css -o TEMP_OUTPUT.css
npx tailwindcss -c CONFIG -i INPUT.css -o TEMP_OUTPUT.css --minify
```

Compile to a new path before replacing output. Prefer complete, narrow content patterns. Use a safelist only for genuinely external or runtime-provided complete class names; preview its size and variants. Never fix dynamic fragments by scanning the whole repository.

Watch mode is a long-running state change to local processes; start it only when requested and stop the exact process when finished. Do not use v4's `@tailwindcss/cli` package in this v3 operator.

## Verify and report

Check representative base, utility, responsive, state, and safelisted selectors in the temporary CSS, run the application production build, and compare output bytes. Report paths, config, matched source count, command, exit code, selector evidence, size change, files changed, and rollback. Ask before overwriting committed or deployed CSS.
