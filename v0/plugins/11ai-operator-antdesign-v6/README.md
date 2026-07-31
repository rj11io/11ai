# 11ai Ant Design v6 operator

Twelve standalone Ant Design 6 skills for common React work, native-skill compatibility, and diagnosis. The reviewed baseline is Ant Design 6.4.3 with React 18 or 19; prefer React 19 for new work.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-antdesign-v6-setup`](./skills/11ai-operator-antdesign-v6-setup/SKILL.md) | Verifying Ant Design installation, providers, client boundaries, styles, icons, and SSR setup |
| [`11ai-operator-antdesign-v6-native-skills`](./skills/11ai-operator-antdesign-v6-native-skills/SKILL.md) | Checking and installing Ant Design's first-party `antd` agent skill with an explicit v6 compatibility gate |
| [`11ai-operator-antdesign-v6-layout`](./skills/11ai-operator-antdesign-v6-layout/SKILL.md) | Building responsive shells, columns, spacing, scrolling, and breakpoints |
| [`11ai-operator-antdesign-v6-forms`](./skills/11ai-operator-antdesign-v6-forms/SKILL.md) | Building typed forms with validation, dynamic fields, async submit, and server errors |
| [`11ai-operator-antdesign-v6-tables`](./skills/11ai-operator-antdesign-v6-tables/SKILL.md) | Building typed tables with sorting, filtering, pagination, selection, and server data |
| [`11ai-operator-antdesign-v6-navigation`](./skills/11ai-operator-antdesign-v6-navigation/SKILL.md) | Wiring route-aware menus, breadcrumbs, tabs, steps, and dropdown navigation |
| [`11ai-operator-antdesign-v6-overlays`](./skills/11ai-operator-antdesign-v6-overlays/SKILL.md) | Adding modals, drawers, confirmations, alerts, messages, notifications, and loading feedback |
| [`11ai-operator-antdesign-v6-data-display`](./skills/11ai-operator-antdesign-v6-data-display/SKILL.md) | Choosing cards, lists, descriptions, statistics, status, empty, loading, and result states |
| [`11ai-operator-antdesign-v6-theming`](./skills/11ai-operator-antdesign-v6-theming/SKILL.md) | Establishing tokens, component overrides, dark mode, compact mode, and visual consistency |
| [`11ai-operator-antdesign-v6-integrations`](./skills/11ai-operator-antdesign-v6-integrations/SKILL.md) | Connecting Ant Design to a router, data library, date library, Tailwind or existing CSS, locale, and tests |
| [`11ai-operator-antdesign-v6-cheatsheet`](./skills/11ai-operator-antdesign-v6-cheatsheet/SKILL.md) | Answering quick component, prop, import, and state-model questions |
| [`11ai-operator-antdesign-v6-troubleshooting`](./skills/11ai-operator-antdesign-v6-troubleshooting/SKILL.md) | Diagnosing styles, hydration, providers, forms, tables, overlays, tokens, layout, and accessibility |

The skills are intentionally narrow and version-aware. Start with the cheatsheet for a lookup, use an operation skill for a focused change, and use troubleshooting when the symptom is not yet understood. Inspect the installed Ant Design version before applying version-specific API or SSR guidance.

## Boundaries

This v0 focuses on common React operations. It does not prescribe a data-fetching library, router, CSS framework, backend, or product design system. The skills should preserve the host application's conventions and avoid dependency upgrades unless the user requests them.
