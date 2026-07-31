# 11ai Tailwind CSS v4 operator

Ten standalone skills for Tailwind CSS v4 installation, automatic source detection, Vite, PostCSS, CLI and webpack builds, CSS-first themes, utilities, variants, compatibility plugins, v3 migration, integrations, and troubleshooting, with read-first checks around generated CSS and project-wide visual changes.

Version baseline: Tailwind CSS 4.3.1, stable, verified 2026-07-31 from the [publisher release](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.1), [v4.3 announcement](https://tailwindcss.com/blog/tailwindcss-v4-3), and [installation documentation](https://tailwindcss.com/docs/installation/using-vite).

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-tailwind-v4-cheatsheet`](./skills/11ai-operator-tailwind-v4-cheatsheet/SKILL.md) | Quick commands, directives, CSS-first configuration, and safe patterns |
| [`11ai-operator-tailwind-v4-environment`](./skills/11ai-operator-tailwind-v4-environment/SKILL.md) | Read-only packages, build adapter, source, theme, and browser inspection |
| [`11ai-operator-tailwind-v4-setup`](./skills/11ai-operator-tailwind-v4-setup/SKILL.md) | Version-pinned installation with one deliberate build adapter |
| [`11ai-operator-tailwind-v4-integrations`](./skills/11ai-operator-tailwind-v4-integrations/SKILL.md) | Framework, CSS module, editor, monorepo, CI, and component-library seams |
| [`11ai-operator-tailwind-v4-troubleshooting`](./skills/11ai-operator-tailwind-v4-troubleshooting/SKILL.md) | Evidence-led diagnosis of missing, incorrect, incompatible, or oversized CSS |
| [`11ai-operator-tailwind-v4-build-sources`](./skills/11ai-operator-tailwind-v4-build-sources/SKILL.md) | Build adapters, automatic detection, source directives, watch mode, and output |
| [`11ai-operator-tailwind-v4-theme-variables`](./skills/11ai-operator-tailwind-v4-theme-variables/SKILL.md) | CSS theme variables, namespaces, defaults, sharing, and runtime consumption |
| [`11ai-operator-tailwind-v4-utilities-variants`](./skills/11ai-operator-tailwind-v4-utilities-variants/SKILL.md) | Utility composition, custom utilities, custom variants, states, and responsive behavior |
| [`11ai-operator-tailwind-v4-plugins-compatibility`](./skills/11ai-operator-tailwind-v4-plugins-compatibility/SKILL.md) | CSS plugins, JavaScript compatibility config, references, and legacy seams |
| [`11ai-operator-tailwind-v4-migration`](./skills/11ai-operator-tailwind-v4-migration/SKILL.md) | Audited v3-to-v4 upgrades, codemods, breaking changes, and rollback |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and does not require another 11ai plugin. Tailwind Labs did not publish qualifying first-party Agent Skills in its documentation or publisher-owned repositories as of the research date, so no native-skills placeholder is included.

## Safety contract

Inspect installed Tailwind and adapter versions, package manager, CSS entry, source ownership, theme variables, legacy compatibility directives, scripts, generated output, and browser targets before editing.

Never guess the build adapter, source base path, theme tokens, breakpoints, prefix, important policy, browser floor, compatibility needs, or output ownership. Preserve the existing package manager and lockfile.

Ask before changing global theme namespaces, Preflight, source discovery, build adapters, plugins, compatibility config, production assets, or running the upgrade tool. Preview affected files and compare generated CSS and browser rendering before and after bulk changes.

Never quote secrets found in build or framework configuration. Do not scan shell history for credentials. Count matches, inspect diffs, and use a disposable output path or separate branch before codemods, migration, broad rewrites, or asset replacement.
