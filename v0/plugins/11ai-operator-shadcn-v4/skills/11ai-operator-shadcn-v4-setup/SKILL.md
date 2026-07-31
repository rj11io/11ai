---
name: 11ai-operator-shadcn-v4-setup
description: "Initialize shadcn CLI v4 projects with a pinned CLI, supported framework template, deliberate Base UI, Radix, or React Aria primitive base, style, icons, aliases, Tailwind configuration, CSS variables, RSC mode, and one verified component. Use when a project has no shadcn setup or the user explicitly asks to initialize v4."
---
# 11ai shadcn v4 setup

Version baseline: shadcn CLI 4.14.1 (stable), verified 2026-07-31; pin CLI operations to 4.14.1 and use stable framework, base, and registry paths.

Resolve project root, package runner, framework, React and Tailwind versions, monorepo ownership, base, style, icon library, font policy, aliases, CSS entry, RSC mode, and preset before writing.

## Gather first

```bash
node -p "require('./package.json').packageManager || ''"
rg -n 'react|tailwindcss|vite|next|react-router|astro|@tanstack|laravel' package.json
rg --files -g 'components.json' -g 'tailwind.config.*' -g '*.css' -g 'tsconfig.json' -g 'vite.config.*' -g 'next.config.*'
```

Never invent a preset code, base, style, alias, CSS destination, icon library, or whether an existing application may be reconfigured.

## Preview and initialize

```bash
npx shadcn@4.14.1 init --help
npx shadcn@4.14.1 init
```

Run `init` only after the user approves the selected answers and affected files. Use `--base base`, `--base radix`, or `--base aria` only when explicitly chosen. Base UI is the current default for new work, but never migrate an existing project by default.

Read [references/setup.md](references/setup.md) for templates, presets, bases, Tailwind versions, aliases, monorepos, and verification decisions.

## Verify

Run `info --json`, inspect `components.json` and the CSS diff, preview one component with `add --dry-run`, then add it only if requested. Run types, lint, tests, production build, keyboard checks, and both light and dark modes when configured.

## Guardrails

Ask before dependency installation, config replacement, preset use, CSS-variable changes, font changes, or Git initialization. Never print registry secrets. Report version, choices, files, dependencies, resolved paths, checks, and rollback.
