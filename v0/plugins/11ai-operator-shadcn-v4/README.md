# 11ai shadcn v4 operator

Thirteen standalone skills for shadcn CLI v4 setup, component source ownership, charts, forms, data tables, blocks, composition, registries, presets, themes, updates, migrations, integrations, first-party Agent Skills, and troubleshooting, with preview-first checks around files the CLI adds or overwrites.

Version baseline: shadcn CLI 4.14.1, stable, verified 2026-07-31 from the [npm registry](https://www.npmjs.com/package/shadcn), [official CLI v4 announcement](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4), [current changelog](https://ui.shadcn.com/docs/changelog), and [publisher repository](https://github.com/shadcn-ui/ui). Components are copied into and owned by the host project; this is not a conventional runtime component package.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-shadcn-v4-cheatsheet`](./skills/11ai-operator-shadcn-v4-cheatsheet/SKILL.md) | Quick CLI v4 commands, project fields, previews, and decision rules |
| [`11ai-operator-shadcn-v4-environment`](./skills/11ai-operator-shadcn-v4-environment/SKILL.md) | Read-only CLI, components.json, framework, base, style, alias, Tailwind, and registry inspection |
| [`11ai-operator-shadcn-v4-setup`](./skills/11ai-operator-shadcn-v4-setup/SKILL.md) | Version-pinned initialization, templates, bases, aliases, CSS variables, and smoke checks |
| [`11ai-operator-shadcn-v4-integrations`](./skills/11ai-operator-shadcn-v4-integrations/SKILL.md) | Framework, Tailwind, monorepo, forms, data, charts, testing, and registry seams |
| [`11ai-operator-shadcn-v4-troubleshooting`](./skills/11ai-operator-shadcn-v4-troubleshooting/SKILL.md) | Evidence-led diagnosis of config, imports, styles, primitives, registry, and chart failures |
| [`11ai-operator-shadcn-v4-native-skills`](./skills/11ai-operator-shadcn-v4-native-skills/SKILL.md) | Compatibility-checking and installing shadcn's first-party Agent Skill |
| [`11ai-operator-shadcn-v4-components`](./skills/11ai-operator-shadcn-v4-components/SKILL.md) | In-depth component discovery, addition, composition, customization, accessibility, and safe updates |
| [`11ai-operator-shadcn-v4-charts`](./skills/11ai-operator-shadcn-v4-charts/SKILL.md) | In-depth Recharts v3 chart installation, data contracts, config, tooltips, legends, accessibility, and performance |
| [`11ai-operator-shadcn-v4-registries`](./skills/11ai-operator-shadcn-v4-registries/SKILL.md) | Namespaced, local, GitHub, community, and private registry discovery and installation |
| [`11ai-operator-shadcn-v4-presets-themes`](./skills/11ai-operator-shadcn-v4-presets-themes/SKILL.md) | Preset resolution and apply, styles, bases, icons, fonts, tokens, and color schemes |
| [`11ai-operator-shadcn-v4-forms-data`](./skills/11ai-operator-shadcn-v4-forms-data/SKILL.md) | Fields, validation, form libraries, tables, server data, loading, and error states |
| [`11ai-operator-shadcn-v4-blocks-composition`](./skills/11ai-operator-shadcn-v4-blocks-composition/SKILL.md) | Blocks, page composition, dashboards, chat interfaces, and dependency ownership |
| [`11ai-operator-shadcn-v4-updates-migrations`](./skills/11ai-operator-shadcn-v4-updates-migrations/SKILL.md) | Diff-led component updates, preset changes, eject, primitive migrations, reports, and rollback |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and never depends on another 11ai plugin. The native `shadcn` skill is optional upstream guidance and is installed only when explicitly requested after its current instructions are checked against CLI v4.14.1 and the host project's base, framework, and Tailwind family.

## Safety contract

Inspect the exact CLI release, `components.json`, framework, package manager, primitive base, style, icon library, aliases, resolved paths, Tailwind family, CSS entry, installed component source, registries, and local modifications before writing.

Never guess a component API, base, alias, registry namespace, preset, theme token, chart data key, dependency, source destination, or whether an existing component is stock or customized. Fetch current component docs and examples before implementation.

Ask before `init`, `add`, `apply`, `eject`, dependency installation, component replacement, preset switching, base migration, registry authentication, or bulk composition changes. Use `--dry-run`, `--diff`, and `--view` where supported and inspect every target before overwriting owned source.

Never print registry tokens, authorization headers, private URLs, customer data, form payloads, or chart source data. Count files and consumers, preserve custom code, test keyboard and screen-reader behavior, and keep a reviewed rollback diff for every broad change.
