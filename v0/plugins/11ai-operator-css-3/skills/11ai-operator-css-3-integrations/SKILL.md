---
name: 11ai-operator-css-3-integrations
description: "Connect CSS3 to the surrounding build system, framework, tests, linting, formatting, CI, deployment target, and runtime boundaries while preserving ownership between layers. Use when CSS3 must work with another project subsystem or behave consistently from local development through production."
---
# 11ai CSS3 integrations

Name both sides of the integration, the data or artifact crossing the seam, and which side owns compilation, validation, caching, security, and deployment before editing.

Version baseline: CSS3, represented by W3C CSS Snapshot 2025 plus current independently leveled modules, verified 31 July 2026. Use stable current module features within the CSS3 family and verify specification status and browser support per feature.

## Inspect the seams

```bash
rg --files -g '*.css' -g '*.scss' -g '*.pcss' | head -80
rg -n '@layer|@scope|@media|@container|!important|:root|display:' . --glob '*.css' | head -120
rg -n "build|lint|test|deploy|ci|output|dist" package.json .github . 2>/dev/null | head -80
```

Identify the existing adapter or script before adding another. Keep CSS concerns inside this plugin and document external expectations without depending on another operator plugin.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for standalone patterns covering build tools, tests, CI, runtime loading, and deployment artifacts.

Change one seam at a time. Preserve public contracts, file ownership, and source maps; never copy secrets into client-visible output or commit generated credentials.

## Verify end to end

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Run the producer and consumer checks, inspect the built artifact, and exercise one representative path in the target supported browsers and user preference modes. Preview broad formatting, codemod, or generated-file changes before accepting them.

## Report

State the two systems connected, files and scripts changed, artifact or API contract, target supported browsers and user preference modes, secret boundary, local and CI checks, and rollback. Hand toolchain failures to `11ai-operator-css-3-environment` and product-specific work to the matching domain skill in this plugin.
