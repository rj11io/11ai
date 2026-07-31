---
name: 11ai-operator-css-3-environment
description: "Inspect the installed CSS3 toolchain, project configuration, source entry points, generated output, target environments, and validation scripts without changing files or dependencies. Use before CSS3 work, when the project conventions are unknown, or when the user asks what is configured."
---
# 11ai CSS3 environment

Establish the exact project, package manager, source roots, generated directories, and target supported browsers and user preference modes before interpreting a symptom. Keep this pass read-only.

Version baseline: CSS3, represented by W3C CSS Snapshot 2025 plus current independently leveled modules, verified 31 July 2026. Use stable current module features within the CSS3 family and verify specification status and browser support per feature.

## Inspect the project

```bash
rg --files -g '*.css' -g '*.scss' -g '*.pcss' | head -80
rg -n '@layer|@scope|@media|@container|!important|:root|display:' . --glob '*.css' | head -120
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
- **Target mismatch** — browser support, design tokens, stylesheet order, preprocessor ownership, or breakpoint policy must come from repository configuration or the user, never a plausible default.

## Report

State the installed versions, package manager, active configuration, source and output roots, target supported browsers and user preference modes, available checks, and any ambiguity. Do not repair, install, delete, build, or switch configuration unless the user asks. Hand missing setup to `11ai-operator-css-3-setup` and active failures to `11ai-operator-css-3-troubleshooting`.
