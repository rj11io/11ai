---
name: 11ai-operator-tailwind-v4-theme-variables
description: "Manage Tailwind CSS v4 theme variable namespaces, tokens, default resets, static emission, shared theme packages, runtime CSS variable access, and responsive design values. Use when the user asks to customize or review the v4 CSS-first design system."
---
# 11ai Tailwind CSS v4 theme variables

Version baseline: Tailwind CSS 4.3.1 (stable), verified 2026-07-31; prefer CSS `@theme` variables over v3 JavaScript theme configuration.

Resolve the owned theme entry, imported theme files, namespace, token consumers, browser contract, and whether a change extends, overrides, or resets defaults before editing.

## Inspect first

```bash
rg -n '@theme|--color-|--font-|--text-|--spacing|--breakpoint-|--container-|--radius-|--shadow-|--ease-' --glob '*.css' --glob '!node_modules/**'
rg -n 'var\(--|theme\(' --glob '*.css' --glob '*.js' --glob '*.ts' --glob '!node_modules/**'
```

Count consumers of each changed variable. Inspect import order and note namespace resets such as `--color-*: initial`, which remove generated utilities as well as values.

## Operate

Add or override values in the narrowest owned `@theme` block. Use `@theme static` only when every variable must be emitted even without a class consumer. Share a theme as an imported CSS file rather than duplicating values.

Never invent brand colors, fonts, spacing, breakpoints, container sizes, shadows, or easing. Resetting an entire namespace or changing a breakpoint is a global destructive behavior change; preview missing utilities and affected consumers and get approval.

## Verify

Run the real v4 build, inspect generated utilities and `:root` variables, exercise runtime `var()` consumers, and test both sides of changed breakpoints. Compare visual snapshots and CSS size when available.

## Report

State theme files and import order, variables changed, extend or reset semantics, consumer count, generated utilities, runtime and browser impact, files, checks, and rollback. Hand source omissions to `11ai-operator-tailwind-v4-build-sources` and legacy config to `11ai-operator-tailwind-v4-plugins-compatibility`.
