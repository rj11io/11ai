# HTML5 setup reference

Use HTML5 as the requested version family, anchored to the WHATWG Living Standard at <https://html.spec.whatwg.org/> and its current authoring introduction at <https://html.spec.whatwg.org/dev/introduction.html#is-this-html5>. The standard was last updated 20 July 2026 and this baseline was verified 31 July 2026. Prefer current conforming HTML5 features, treat obsolete elements and frozen W3C snapshots as legacy, and verify browser and assistive-technology support per feature.

## Decisions

- Project root and package manager.
- Target browsers and assistive technologies and compatibility policy.
- Source, generated, and public output directories.
- Existing formatter, linter, test runner, and build command.
- Whether the project publishes a public API or only an application artifact.

## Inspect before install

```bash
rg --files -g '*.html' -g '*.htm' -g '*.xhtml' | head -80
rg -n '<!doctype|<html|<main|<form|<video|<meta' . --glob '*.html' | head -120
```

Do not replace files that already encode these decisions. Extend the active configuration and keep unrelated lockfile changes out of scope.

## Install

```bash
npm install --save-dev html-validate
npx html-validate --init
```

The command is a pattern, not permission to install globally or upgrade unrelated packages. document language, supported browsers, form submission behavior, or generated-template ownership must be explicit.

## Minimal verification

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Exercise one representative HTML document through the real local pipeline. Inspect emitted output or runtime behavior rather than relying only on a zero exit code.

## Secret and generated-file handling

Never print or commit form payloads, embedded tokens, private URLs, or server-only environment values. Keep generated artifacts in the repository only when its established policy requires them. Do not edit generated output to hide a source defect.

## Setup report

List installed versions, configuration files, source and output paths, scripts added, target browsers and assistive technologies, checks run, and any deliberate omission. Include the exact rollback for new files or dependencies without deleting pre-existing work.
