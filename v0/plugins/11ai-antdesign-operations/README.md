# 11ai Ant Design operations

Ten standalone skills for common Ant Design React work: setup, layout, data entry, tables, navigation, overlays, data display, theming, quick reference, and diagnosis.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-antdesign-setup`](./skills/11ai-antdesign-setup/SKILL.md) | Verifying Ant Design installation, providers, client boundaries, styles, icons, and SSR setup |
| [`11ai-antdesign-layout`](./skills/11ai-antdesign-layout/SKILL.md) | Building responsive shells, columns, spacing, scrolling, and breakpoints |
| [`11ai-antdesign-forms`](./skills/11ai-antdesign-forms/SKILL.md) | Building typed forms with validation, dynamic fields, async submit, and server errors |
| [`11ai-antdesign-tables`](./skills/11ai-antdesign-tables/SKILL.md) | Building typed tables with sorting, filtering, pagination, selection, and server data |
| [`11ai-antdesign-navigation`](./skills/11ai-antdesign-navigation/SKILL.md) | Wiring route-aware menus, breadcrumbs, tabs, steps, and dropdown navigation |
| [`11ai-antdesign-overlays`](./skills/11ai-antdesign-overlays/SKILL.md) | Adding modals, drawers, confirmations, alerts, messages, notifications, and loading feedback |
| [`11ai-antdesign-data-display`](./skills/11ai-antdesign-data-display/SKILL.md) | Choosing cards, lists, descriptions, statistics, status, empty, loading, and result states |
| [`11ai-antdesign-theming`](./skills/11ai-antdesign-theming/SKILL.md) | Establishing tokens, component overrides, dark mode, compact mode, and visual consistency |
| [`11ai-antdesign-cheatsheet`](./skills/11ai-antdesign-cheatsheet/SKILL.md) | Answering quick component, prop, import, and state-model questions |
| [`11ai-antdesign-troubleshooting`](./skills/11ai-antdesign-troubleshooting/SKILL.md) | Diagnosing styles, hydration, providers, forms, tables, overlays, tokens, layout, and accessibility |

The skills are intentionally narrow and version-aware. Start with the cheatsheet for a lookup, use an operation skill for a focused change, and use troubleshooting when the symptom is not yet understood. Inspect the installed Ant Design version before applying version-specific API or SSR guidance.

## Boundaries

This v0 focuses on common React operations. It does not prescribe a data-fetching library, router, CSS framework, backend, or product design system. The skills should preserve the host application's conventions and avoid dependency upgrades unless the user requests them.
