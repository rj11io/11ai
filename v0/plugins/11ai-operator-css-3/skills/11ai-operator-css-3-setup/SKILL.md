---
name: 11ai-operator-css-3-setup
description: "Install and configure CSS3 from zero, including the project-local toolchain, source entry point, baseline configuration, validation scripts, ignored generated output, and a minimal verified example. Use when a project has no CSS3 setup or the user explicitly asks to initialize it."
---
# 11ai CSS3 setup

Resolve the project root, package manager, target supported browsers and user preference modes, module or rendering mode, and existing build conventions before writing. Setup is allowed to change the machine, but only inside the requested project.

Version baseline: CSS3, represented by W3C CSS Snapshot 2025 plus current independently leveled modules, verified 31 July 2026. Use stable current module features within the CSS3 family and verify specification status and browser support per feature.

## Gather first

Confirm the intended source directory, output directory, compatibility target, formatter or linter, test runner, and whether generated files are committed. Do not invent browser support, design tokens, stylesheet order, preprocessor ownership, or breakpoint policy.

## Install and configure

```bash
npm install --save-dev stylelint stylelint-config-standard
npx stylelint "**/*.css" --allow-empty-input
```

Use the repository package manager and pin behavior already used by its lockfile. Preview new files and scripts before creating them; do not replace an existing configuration with a minimal example.

Read [references/setup.md](references/setup.md) for the standalone walkthrough, configuration decisions, minimal example, and verification sequence.

## Verify

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Verify one narrow example, then inspect the diff. Do not treat a generated build artifact as source and do not weaken an existing check to make setup pass.

## Guardrails

Never print or commit private asset URLs, source-map contents, tokens derived from secrets, or server-only environment values. Ask before deleting generated directories, replacing public entry points, changing the project package manager, or upgrading existing dependencies. Report files and scripts added, versions selected, target supported browsers and user preference modes, checks run, and any follow-up left to a domain skill.
