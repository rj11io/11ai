---
name: 11ai-operator-html-5-integrations
description: "Connect HTML5 to the surrounding build system, framework, tests, linting, formatting, CI, deployment target, and runtime boundaries while preserving ownership between layers. Use when HTML5 must work with another project subsystem or behave consistently from local development through production."
---
# 11ai HTML5 integrations

Name both sides of the integration, the data or artifact crossing the seam, and which side owns compilation, validation, caching, security, and deployment before editing.

Version baseline: HTML5, represented by the current WHATWG HTML Living Standard (last updated 20 July 2026), verified 31 July 2026. Use current conforming HTML5 features; treat frozen W3C snapshots and obsolete elements as legacy, and verify browser and assistive-technology support per feature.

## Inspect the seams

```bash
rg --files -g '*.html' -g '*.htm' -g '*.xhtml' | head -80
rg -n '<!doctype|<html|<main|<form|<video|<meta' . --glob '*.html' | head -120
rg -n "build|lint|test|deploy|ci|output|dist" package.json .github . 2>/dev/null | head -80
```

Identify the existing adapter or script before adding another. Keep HTML concerns inside this plugin and document external expectations without depending on another operator plugin.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for standalone patterns covering build tools, tests, CI, runtime loading, and deployment artifacts.

Change one seam at a time. Preserve public contracts, file ownership, and source maps; never copy secrets into client-visible output or commit generated credentials.

## Verify end to end

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Run the producer and consumer checks, inspect the built artifact, and exercise one representative path in the target browsers and assistive technologies. Preview broad formatting, codemod, or generated-file changes before accepting them.

## Report

State the two systems connected, files and scripts changed, artifact or API contract, target browsers and assistive technologies, secret boundary, local and CI checks, and rollback. Hand toolchain failures to `11ai-operator-html-5-environment` and product-specific work to the matching domain skill in this plugin.
