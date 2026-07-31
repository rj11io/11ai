---
name: 11ai-operator-tailwind-v4-utilities-variants
description: "Author and refactor Tailwind CSS v4 utility compositions, arbitrary values, custom utility definitions, custom variants, responsive and container behavior, state modifiers, and apply usage. Use when the user asks to style an interface or define a reusable v4 utility or variant."
---
# 11ai Tailwind CSS v4 utilities and variants

Version baseline: Tailwind CSS 4.3.1 (stable), verified 2026-07-31; use v4 `@utility`, `@variant`, and `@custom-variant` behavior and current stacking order.

Resolve component ownership, complete class candidates, theme definitions, state source, DOM relationship, browser support, and visual acceptance criteria before editing.

## Inspect first

```bash
rg -n '@utility|@variant|@custom-variant|@apply|class(Name)?=|clsx|cva|classnames' SOURCE CSS_ENTRY
rg -n '@theme|--breakpoint-|--container-|@reference' --glob '*.css' --glob '!node_modules/**'
```

Count consumers of custom utilities and variants. Confirm whether an arbitrary value is a deliberate one-off or belongs in the theme and whether separately bundled styles can see definitions.

## Operate

Compose native utilities directly for local styling and keep conditional paths as complete class names. Define simple or functional custom utilities with bounded value and modifier contracts. Define custom variants from a real documented state rather than an incidental selector.

Do not invent tokens, breakpoints, container names, data attributes, or dark-mode ownership. Removing or renaming a custom utility or variant can erase styling across consumers; preview matches and get approval. Use `@reference` before `@apply` in separately processed styles, or prefer direct theme variables.

## Verify

Build with the real adapter. Test default, hover, focus-visible, disabled, error, dark, responsive, container, group, peer, and custom states that apply. Inspect generated selectors and run visual and accessibility checks across the declared browser floor.

## Report

State components, utilities, variants, source states, DOM requirements, affected consumers, selector evidence, browser and accessibility checks, files, and rollback. Hand theme-token changes to `11ai-operator-tailwind-v4-theme-variables`.
