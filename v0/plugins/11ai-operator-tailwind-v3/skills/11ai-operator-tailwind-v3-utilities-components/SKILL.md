---
name: 11ai-operator-tailwind-v3-utilities-components
description: "Author and refactor Tailwind CSS v3 utility compositions, arbitrary values, component classes, custom layer rules, apply directives, and reusable patterns. Use when the user asks to style or consolidate an interface without changing the theme or build boundary."
---
# 11ai Tailwind CSS v3 utilities and components

Version baseline: Tailwind CSS 3.4.19 (stable v3 family), verified 2026-07-31; use v3 utilities, arbitrary values, `@layer`, and `@apply`, not v4 `@utility` definitions.

Resolve the component owner, current class contract, supported states and breakpoints, stylesheet layer, and visual acceptance criteria before editing markup or CSS.

## Inspect first

```bash
rg -n '@layer|@apply|class(Name)?=|clsx|cva|classnames' COMPONENT CSS_ENTRY
rg -n 'prefix:|important:|corePlugins:|theme:' tailwind.config.*
```

Count consumers of shared component classes and exported class maps. Confirm whether arbitrary values represent a deliberate one-off or a missing theme token.

## Operate

Compose utilities directly for local styling. Keep conditional branches as complete class names so v3 content detection can see them. Use `@layer components` for genuinely shared selectors and `@layer utilities` for small single-purpose rules.

Use `@apply` only for owned static utilities supported by the installed build. Avoid circular application and do not hide interactive or responsive behavior in an opaque abstraction. Never invent design tokens or replace broad class sets without reviewing each state.

## Verify

Build to a disposable output, inspect representative selectors, and test default, hover, focus-visible, disabled, error, dark, and responsive states that apply. Compare screenshots or visual tests when available and run accessibility checks for semantics and focus behavior.

## Report

State components and consumers changed, utilities or layers chosen, generated selector evidence, visual and accessibility checks, files, and rollback. Preview and get approval before bulk class rewrites or removing shared component selectors. Hand token changes to `11ai-operator-tailwind-v3-theme-config`.
