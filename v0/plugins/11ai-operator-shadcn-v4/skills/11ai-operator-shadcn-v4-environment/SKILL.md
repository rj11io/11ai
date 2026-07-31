---
name: 11ai-operator-shadcn-v4-environment
description: "Inspect shadcn CLI v4 availability, components.json, framework, package manager, primitive base, style, icon library, React Server Components mode, Tailwind family, CSS entry, aliases, resolved paths, installed components, registries, and local modifications without changing them. Use when the user asks what shadcn setup exists or needs a safe baseline."
---
# 11ai shadcn v4 environment

Version baseline: shadcn CLI 4.14.1 (stable), verified 2026-07-31; recognize Base UI as the current default while preserving existing Radix and React Aria projects.

Establish project root, package runner, CLI release, framework, base, style, aliases, CSS ownership, registry scope, and component customization before interpreting behavior.

## Smallest useful checks

```bash
node --version
node -p "require('./package.json').packageManager || ''"
test -f components.json && sed -n '1,240p' components.json
npx shadcn@4.14.1 info --json
```

Do not initialize a missing project in this read-only skill. Redact registry credentials and private URLs if the info output includes them.

## Inspect installed source

```bash
rg --files components src app packages | rg '/ui/|components.json|globals.css|tailwind.config'
rg -n 'shadcn|@base-ui|radix-ui|@radix-ui|recharts|@tanstack/react-table|react-hook-form' package.json components.json
git status --short
```

Map aliases to resolved paths, inventory components, identify local edits, note generated versus owned files, and distinguish Tailwind v3 configuration from v4 CSS-first tokens. Never assume the icon library or primitive API from filenames alone.

## Interpret results

`components.json` records base, style, RSC, TSX, aliases, icon library, Tailwind configuration, and registries. CLI `info --json` adds resolved paths and installed component context. Missing or divergent fields must be reported before running `add`.

Do not repair, initialize, add, update, apply a preset, authenticate, or switch bases here. Hand missing setup to `11ai-operator-shadcn-v4-setup` and failures to `11ai-operator-shadcn-v4-troubleshooting`.

## Report

State CLI and framework versions, package runner, base, style, icon library, RSC and TSX modes, Tailwind family and CSS file, aliases and paths, installed and modified components, registries, chart and form dependencies, Git state, and uncertainties.
