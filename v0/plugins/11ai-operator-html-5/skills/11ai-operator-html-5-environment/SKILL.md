---
name: 11ai-operator-html-5-environment
description: "Inspect the installed HTML5 toolchain, project configuration, source entry points, generated output, target environments, and validation scripts without changing files or dependencies. Use before HTML5 work, when the project conventions are unknown, or when the user asks what is configured."
---
# 11ai HTML5 environment

Establish the exact project, package manager, source roots, generated directories, and target browsers and assistive technologies before interpreting a symptom. Keep this pass read-only.

Version baseline: HTML5, represented by the current WHATWG HTML Living Standard (last updated 20 July 2026), verified 31 July 2026. Use current conforming HTML5 features; treat frozen W3C snapshots and obsolete elements as legacy, and verify browser and assistive-technology support per feature.

## Inspect the project

```bash
rg --files -g '*.html' -g '*.htm' -g '*.xhtml' | head -80
rg -n '<!doctype|<html|<main|<form|<video|<meta' . --glob '*.html' | head -120
```

Read package and configuration files without printing environment values. Identify the installed version, scripts, module or rendering mode, and any generated directories that must not be edited directly.

## Inspect validation and output

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Run only checks that already exist and are safe for the workspace. If a command can build, deploy, update snapshots, or rewrite files, inspect its script definition first and report that side effect before running it.

## Interpretation

- **Missing local tool** — report the absent dependency; do not fall back to an unpinned global install.
- **Multiple configurations** — determine which file the active command actually loads before diagnosing behavior.
- **Generated output differs** — trace it back to source; do not patch generated files as the fix.
- **Target mismatch** — document language, supported browsers, form submission behavior, or generated-template ownership must come from repository configuration or the user, never a plausible default.

## Report

State the installed versions, package manager, active configuration, source and output roots, target browsers and assistive technologies, available checks, and any ambiguity. Do not repair, install, delete, build, or switch configuration unless the user asks. Hand missing setup to `11ai-operator-html-5-setup` and active failures to `11ai-operator-html-5-troubleshooting`.
