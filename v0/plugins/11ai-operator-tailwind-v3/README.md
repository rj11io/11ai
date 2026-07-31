# 11ai Tailwind CSS v3 operator

Ten standalone skills for Tailwind CSS v3 installation, content scanning, builds, JavaScript configuration, theme extension, utilities, variants, plugins, integrations, and troubleshooting, with read-first checks around generated CSS and project-wide visual changes.

Version baseline: Tailwind CSS 3.4.19, the stable v3 family release verified 2026-07-31 from the [publisher release](https://github.com/tailwindlabs/tailwindcss/releases/tag/v3.4.19) and [v3 installation documentation](https://v3.tailwindcss.com/docs/installation).

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-tailwind-v3-cheatsheet`](./skills/11ai-operator-tailwind-v3-cheatsheet/SKILL.md) | Quick commands, directives, configuration, and safe patterns |
| [`11ai-operator-tailwind-v3-environment`](./skills/11ai-operator-tailwind-v3-environment/SKILL.md) | Read-only package, build, content, and configuration inspection |
| [`11ai-operator-tailwind-v3-setup`](./skills/11ai-operator-tailwind-v3-setup/SKILL.md) | Version-pinned installation and initial configuration |
| [`11ai-operator-tailwind-v3-integrations`](./skills/11ai-operator-tailwind-v3-integrations/SKILL.md) | Framework, PostCSS, editor, CI, and component-library seams |
| [`11ai-operator-tailwind-v3-troubleshooting`](./skills/11ai-operator-tailwind-v3-troubleshooting/SKILL.md) | Evidence-led diagnosis of missing, incorrect, or oversized CSS |
| [`11ai-operator-tailwind-v3-build-content`](./skills/11ai-operator-tailwind-v3-build-content/SKILL.md) | CLI and PostCSS builds, content globs, safelists, watch mode, and output |
| [`11ai-operator-tailwind-v3-theme-config`](./skills/11ai-operator-tailwind-v3-theme-config/SKILL.md) | JavaScript config, theme extension, presets, tokens, and core settings |
| [`11ai-operator-tailwind-v3-utilities-components`](./skills/11ai-operator-tailwind-v3-utilities-components/SKILL.md) | Utility composition, arbitrary values, layers, components, and apply |
| [`11ai-operator-tailwind-v3-variants-responsive`](./skills/11ai-operator-tailwind-v3-variants-responsive/SKILL.md) | States, breakpoints, dark mode, group, peer, data, and container variants |
| [`11ai-operator-tailwind-v3-plugins`](./skills/11ai-operator-tailwind-v3-plugins/SKILL.md) | Official and custom plugins, plugin configuration, and generated APIs |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and does not require another 11ai plugin. Tailwind Labs did not publish qualifying first-party Agent Skills in its documentation or publisher-owned repositories as of the research date, so no native-skills placeholder is included.

## Safety contract

Inspect the installed Tailwind family, package manager, config module format, input stylesheet, content ownership, scripts, generated output, and browser requirements before editing.

Never guess content globs, theme tokens, breakpoints, dark-mode strategy, output paths, prefixes, important selectors, plugin options, or framework ownership. Preserve the existing package manager and lockfile.

Ask before replacing configuration, changing Preflight or global theme behavior, widening content scans, overwriting compiled CSS, updating many templates, or upgrading to v4. Preview affected files and compare generated CSS before and after bulk changes.

Never quote secrets found in build configuration or environment files. Do not scan shell history for credentials. Count matches, inspect diffs, and use a disposable output path before any broad rewrite, formatter, codemod, or production asset replacement.
