---
name: 11ai-operator-tailwind-v3-plugins
description: "Install, configure, author, inspect, and remove Tailwind CSS v3 official or custom plugins using the v3 plugin API and generated utility, component, base, and variant contracts. Use when a task involves typography, forms, container queries, or project-specific plugin behavior."
---
# 11ai Tailwind CSS v3 plugins

Version baseline: Tailwind CSS 3.4.19 (stable v3 family), verified 2026-07-31; require plugin releases compatible with v3 and do not assume v4 CSS APIs.

Resolve plugin provenance, installed release, v3 compatibility, generated surface, options, config ownership, and consumer count before changing dependencies or registration.

## Inspect first

```bash
npm ls tailwindcss @tailwindcss/typography @tailwindcss/forms @tailwindcss/container-queries --depth=0
rg -n 'plugins:|require\(|import .*@tailwindcss|plugin\(|addBase|addComponents|addUtilities|matchUtilities|addVariant' tailwind.config.* package.json
```

Review the plugin's publisher, changelog, peer requirements, package scripts, permissions, and generated selectors. Redact private registry credentials and never inspect shell history for them.

## Operate

```bash
npm install --save-dev PLUGIN@VERSION
```

Use the existing package manager and a v3-compatible release. Add only the requested plugin and explicit options. For custom plugins, bound `addBase`, `addComponents`, `addUtilities`, `matchUtilities`, and `addVariant` output to documented tokens and selectors.

Installing, updating, removing, reordering, or replacing a plugin changes dependencies and potentially global CSS; show the exact package, version, configuration, generated surface, and affected consumers before acting. Preview mass selector removal before uninstalling.

## Verify and report

Build to a disposable output, confirm representative selectors and variants, measure size, exercise affected pages and states, and run the production build. Report provenance, version compatibility, package and config changes, selector evidence, size impact, checks, and rollback. Hand content omissions to `11ai-operator-tailwind-v3-build-content`.
