---
name: 11ai-operator-shadcn-v4-components
description: "Discover, inspect, preview, add, compose, customize, test, and safely update shadcn v4 components across Base UI, Radix, and React Aria bases, preserving project aliases, semantic tokens, local source ownership, variants, slots, state, and accessibility. Use when the user asks for any shadcn component or a component-level UI change."
---
# 11ai shadcn v4 components

Version baseline: shadcn CLI 4.14.1 (stable), verified 2026-07-31; use the host project's Base UI, Radix, or React Aria implementation and its current component docs rather than mixing primitive APIs.

Resolve the requested behavior, installed component inventory, primitive base, style, icon library, aliases, source destination, local modifications, dependencies, consumer count, and accessibility contract before writing.

## Inspect and research first

```bash
npx shadcn@4.14.1 info --json
npx shadcn@4.14.1 docs COMPONENT
npx shadcn@4.14.1 search QUERY
rg -n 'COMPONENT|@/components/ui|data-slot|class-variance-authority' src app components packages
```

Fetch the resolved docs, examples, and underlying primitive API. Confirm whether the component is installed, stock, customized, or absent. Never infer props such as `asChild`, `render`, controlled state, or event detail across bases.

## Preview before adding or updating

```bash
npx shadcn@4.14.1 view @shadcn/COMPONENT
npx shadcn@4.14.1 add COMPONENT --dry-run
npx shadcn@4.14.1 add COMPONENT --diff
```

Review every file, dependency, import alias, CSS variable, and overwrite. `add` copies owned source into the project and may replace customized files; require approval for the exact diff before running it.

## Compose and customize

Prefer installed components and built-in variants before custom primitives. Compose behavior from the component's documented parts, keep state with one owner, and preserve semantic HTML and focus behavior. Use project semantic tokens and the configured icon library.

Read [references/component-workflows.md](references/component-workflows.md) for in-depth guidance across actions, forms, overlays, navigation, data display, layout, feedback, chat, base-specific APIs, source edits, and update strategy.

## Verify deeply

Test default, hover, focus-visible, active, selected, disabled, invalid, loading, empty, open, closed, light, dark, RTL, reduced-motion, zoom, long-content, and responsive states that apply. Exercise keyboard paths, accessible names, focus restoration, portals, and server hydration.

## Report

State component and base, docs and registry source, installed or updated files, dependencies, local customizations preserved, variants and state owner, accessibility and visual checks, consumers, and rollback. Hand chart-specific work to `11ai-operator-shadcn-v4-charts`.
