---
name: 11ai-operator-shadcn-v4-cheatsheet
description: "Look up shadcn CLI v4 commands, project configuration fields, component and registry discovery, previews, presets, bases, aliases, docs, additions, charts, updates, and migration patterns. Use when the user wants a concise shadcn v4 reference instead of a guided workflow."
---
# 11ai shadcn v4 cheatsheet

Version baseline: shadcn CLI 4.14.1 (stable), verified 2026-07-31; use CLI v4 commands and current Base UI, Radix, or React Aria component documentation, excluding prerelease CLI behavior.

Use the project's package runner, `components.json`, CLI info, installed source files, framework, base, Tailwind family, and aliases as truth. Stop before unrequested writes.

## Inspect and discover

```bash
npx shadcn@4.14.1 info --json
npx shadcn@4.14.1 docs COMPONENT
npx shadcn@4.14.1 search QUERY
npx shadcn@4.14.1 view ITEM
```

Replace `npx` with the package runner recorded by the project. Read-only discovery still may access public registries; do not send private credentials unless that registry is in scope.

## Preview and operate

```bash
npx shadcn@4.14.1 add COMPONENT --dry-run
npx shadcn@4.14.1 add COMPONENT --diff
npx shadcn@4.14.1 add COMPONENT --view
npx shadcn@4.14.1 add COMPONENT
```

Preview first. `add` writes source and installs dependencies. Never re-add a customized component without reviewing the diff and getting approval for exact files.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-shadcn-v4-components` | Component discovery, addition, composition, customization, accessibility, and updates |
| `11ai-operator-shadcn-v4-charts` | Recharts v3 chart data, config, sizing, tooltip, legend, accessibility, and performance |
| `11ai-operator-shadcn-v4-registries` | Namespaces, search, local and private sources, auth, include, and validate |
| `11ai-operator-shadcn-v4-presets-themes` | Presets, bases, styles, icons, fonts, CSS variables, and schemes |
| `11ai-operator-shadcn-v4-forms-data` | Field, form state, validation, tables, and server data |
| `11ai-operator-shadcn-v4-blocks-composition` | Blocks, dashboards, pages, and chat composition |
| `11ai-operator-shadcn-v4-updates-migrations` | Component diffs, apply, eject, primitive changes, reports, and rollback |

## Answer format

Lead with the smallest v4-valid inspection or preview command, then name project base, component or item, files and dependencies affected, verification, and one risk. Stop before `init`, `add`, `apply`, `eject`, auth, or overwrites unless explicitly requested.
