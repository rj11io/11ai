---
name: 11ai-operator-html-5-setup
description: "Install and configure HTML5 from zero, including the project-local toolchain, source entry point, baseline configuration, validation scripts, ignored generated output, and a minimal verified example. Use when a project has no HTML5 setup or the user explicitly asks to initialize it."
---
# 11ai HTML5 setup

Resolve the project root, package manager, target browsers and assistive technologies, module or rendering mode, and existing build conventions before writing. Setup is allowed to change the machine, but only inside the requested project.

Version baseline: HTML5, represented by the current WHATWG HTML Living Standard (last updated 20 July 2026), verified 31 July 2026. Use current conforming HTML5 features; treat frozen W3C snapshots and obsolete elements as legacy, and verify browser and assistive-technology support per feature.

## Gather first

Confirm the intended source directory, output directory, compatibility target, formatter or linter, test runner, and whether generated files are committed. Do not invent document language, supported browsers, form submission behavior, or generated-template ownership.

## Install and configure

```bash
npm install --save-dev html-validate
npx html-validate --init
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

Never print or commit form payloads, embedded tokens, private URLs, or server-only environment values. Ask before deleting generated directories, replacing public entry points, changing the project package manager, or upgrading existing dependencies. Report files and scripts added, versions selected, target browsers and assistive technologies, checks run, and any follow-up left to a domain skill.
