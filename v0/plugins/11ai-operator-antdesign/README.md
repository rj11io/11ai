# 11ai Ant Design operator

Eleven standalone skills for common Ant Design React work: setup, layout, data entry, tables, navigation, overlays, data display, theming, stack integrations, quick reference, and diagnosis.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-antdesign-setup`](./skills/11ai-operator-antdesign-setup/SKILL.md) | Verifying Ant Design installation, providers, client boundaries, styles, icons, and SSR setup |
| [`11ai-operator-antdesign-layout`](./skills/11ai-operator-antdesign-layout/SKILL.md) | Building responsive shells, columns, spacing, scrolling, and breakpoints |
| [`11ai-operator-antdesign-forms`](./skills/11ai-operator-antdesign-forms/SKILL.md) | Building typed forms with validation, dynamic fields, async submit, and server errors |
| [`11ai-operator-antdesign-tables`](./skills/11ai-operator-antdesign-tables/SKILL.md) | Building typed tables with sorting, filtering, pagination, selection, and server data |
| [`11ai-operator-antdesign-navigation`](./skills/11ai-operator-antdesign-navigation/SKILL.md) | Wiring route-aware menus, breadcrumbs, tabs, steps, and dropdown navigation |
| [`11ai-operator-antdesign-overlays`](./skills/11ai-operator-antdesign-overlays/SKILL.md) | Adding modals, drawers, confirmations, alerts, messages, notifications, and loading feedback |
| [`11ai-operator-antdesign-data-display`](./skills/11ai-operator-antdesign-data-display/SKILL.md) | Choosing cards, lists, descriptions, statistics, status, empty, loading, and result states |
| [`11ai-operator-antdesign-theming`](./skills/11ai-operator-antdesign-theming/SKILL.md) | Establishing tokens, component overrides, dark mode, compact mode, and visual consistency |
| [`11ai-operator-antdesign-integrations`](./skills/11ai-operator-antdesign-integrations/SKILL.md) | Connecting Ant Design to a router, data library, date library, Tailwind or existing CSS, locale, and tests |
| [`11ai-operator-antdesign-cheatsheet`](./skills/11ai-operator-antdesign-cheatsheet/SKILL.md) | Answering quick component, prop, import, and state-model questions |
| [`11ai-operator-antdesign-troubleshooting`](./skills/11ai-operator-antdesign-troubleshooting/SKILL.md) | Diagnosing styles, hydration, providers, forms, tables, overlays, tokens, layout, and accessibility |

The skills are intentionally narrow and version-aware. Start with the cheatsheet for a lookup, use an operation skill for a focused change, and use troubleshooting when the symptom is not yet understood. Inspect the installed Ant Design version before applying version-specific API or SSR guidance.

## Boundaries

This v0 focuses on common React operations. It does not prescribe a data-fetching library, router, CSS framework, backend, or product design system. The skills should preserve the host application's conventions and avoid dependency upgrades unless the user requests them.
