---
name: 11ai-operator-tailwind-v3-setup
description: "Install and configure Tailwind CSS v3 with a version-constrained package, explicit content paths, layer directives, build scripts, and one verified template. Use when a project has no Tailwind setup or the user explicitly asks to initialize the v3 family."
---
# 11ai Tailwind CSS v3 setup

Version baseline: Tailwind CSS 3.4.19 (stable v3 family), verified 2026-07-31; constrain Tailwind to `^3.4.19` and do not substitute v4.

Resolve the project root, package manager, framework, module format, stylesheet entry, template locations, browser targets, and generated-output ownership before writing.

## Gather first

```bash
node --version
rg -n 'packageManager|tailwindcss|postcss|autoprefixer|build|dev' package.json
rg --files -g 'tailwind.config.*' -g 'postcss.config.*' -g '*.css' -g '!node_modules'
```

Never invent content globs, output paths, dark-mode strategy, theme tokens, or whether compiled CSS belongs in source control.

## Install and configure

```bash
npm install --save-dev tailwindcss@^3.4.19 postcss autoprefixer
npx tailwindcss init -p
```

Use the repository's package manager. Preview any init target and do not overwrite existing configuration. Add explicit `content` paths and the v3 `@tailwind base`, `components`, and `utilities` directives. Read [references/setup.md](references/setup.md) for the full walkthrough and primary sources.

## Verify

```bash
npx tailwindcss -i INPUT.css -o TEMP_OUTPUT.css --minify
```

Use a disposable output path first. Exercise one static utility and one variant in a real owned template, then run the repository's lint, test, and build scripts. Inspect the CSS link or import in the built application.

## Guardrails

Never print or commit secrets from environment or framework configuration. Ask before replacing config, enabling or disabling Preflight, changing a global prefix or important selector, editing many templates, or overwriting a production asset. Report installed versions, files, content paths, scripts, output ownership, checks, and rollback.
