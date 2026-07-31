---
name: 11ai-operator-tailwind-v3-variants-responsive
description: "Manage Tailwind CSS v3 responsive, state, dark-mode, group, peer, data, supports, arbitrary, and container-query variants with explicit interaction checks. Use when styling depends on viewport, parent, sibling, attribute, feature, or color-scheme state."
---
# 11ai Tailwind CSS v3 variants and responsive behavior

Version baseline: Tailwind CSS 3.4.19 (stable v3 family), verified 2026-07-31; use v3 variant ordering, configured `screens`, and `darkMode` behavior.

Resolve the real state source, DOM relationship, configured breakpoints, dark-mode owner, input modality, and browser requirements before adding a modifier.

## Inspect first

```bash
rg -n 'darkMode:|screens:|container:|variants:' tailwind.config.*
rg -n 'dark:|group-|peer-|data-|aria-|supports-|@container' SOURCE
```

Inspect the parent and sibling structure for group and peer variants. Count consumers before changing a breakpoint or dark-mode strategy because those settings alter application-wide behavior.

## Operate

Use mobile-first responsive modifiers unless the product contract says otherwise. Prefer semantic `aria-*` or `data-*` states over incidental DOM selectors. Name groups and peers when multiple relationships would be ambiguous.

Do not invent breakpoints, state attributes, dark-mode storage, or container names. Changing `darkMode`, `theme.screens`, container settings, or variant order is a global state change and requires an impact preview and approval. Preserve focus-visible behavior and reduced-motion preferences.

## Verify

Exercise boundary widths on both sides of each breakpoint, keyboard and pointer states, dark and light ownership, group or peer transitions, and unsupported-feature fallbacks. Confirm relevant selectors in a disposable v3 build and run existing visual and accessibility tests.

## Report

State the variant and source state, DOM requirement, breakpoint or container boundaries, browser assumptions, affected consumers, selector evidence, tests, files, and rollback. Hand global token or breakpoint changes to `11ai-operator-tailwind-v3-theme-config`.
