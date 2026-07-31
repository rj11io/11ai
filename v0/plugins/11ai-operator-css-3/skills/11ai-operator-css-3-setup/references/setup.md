# CSS3 setup reference

Use CSS3 as the requested version family, anchored to W3C CSS Snapshot 2025 at <https://www.w3.org/TR/css-2025/> and the CSS Working Group's current modules at <https://www.w3.org/Style/CSS/current-work>. This baseline was verified 31 July 2026. CSS beyond Level 2 is modular, so use stable current modules and verify specification status and browser support per feature rather than assuming one frozen CSS3 document.

## Decisions

- Project root and package manager.
- Target supported browsers and user preference modes and compatibility policy.
- Source, generated, and public output directories.
- Existing formatter, linter, test runner, and build command.
- Whether the project publishes a public API or only an application artifact.

## Inspect before install

```bash
rg --files -g '*.css' -g '*.scss' -g '*.pcss' | head -80
rg -n '@layer|@scope|@media|@container|!important|:root|display:' . --glob '*.css' | head -120
```

Do not replace files that already encode these decisions. Extend the active configuration and keep unrelated lockfile changes out of scope.

## Install

```bash
npm install --save-dev stylelint stylelint-config-standard
npx stylelint "**/*.css" --allow-empty-input
```

The command is a pattern, not permission to install globally or upgrade unrelated packages. browser support, design tokens, stylesheet order, preprocessor ownership, or breakpoint policy must be explicit.

## Minimal verification

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Exercise one representative stylesheet and rendered layout through the real local pipeline. Inspect emitted output or runtime behavior rather than relying only on a zero exit code.

## Secret and generated-file handling

Never print or commit private asset URLs, source-map contents, tokens derived from secrets, or server-only environment values. Keep generated artifacts in the repository only when its established policy requires them. Do not edit generated output to hide a source defect.

## Setup report

List installed versions, configuration files, source and output paths, scripts added, target supported browsers and user preference modes, checks run, and any deliberate omission. Include the exact rollback for new files or dependencies without deleting pre-existing work.
