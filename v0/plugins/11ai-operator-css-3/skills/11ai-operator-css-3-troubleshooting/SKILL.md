---
name: 11ai-operator-css-3-troubleshooting
description: "Diagnose CSS3 failures involving configuration, parsing, compilation, runtime behavior, generated output, browser or server differences, tests, integrations, and performance without masking the original error. Use when CSS3 code fails a check, behaves differently across environments, or produces unexpected output."
---
# 11ai CSS3 troubleshooting

Separate observed facts from theories. Reproduce the smallest failing path and keep the original error, exit code, target supported browsers and user preference modes, and relevant file names intact.

Version baseline: CSS3, represented by W3C CSS Snapshot 2025 plus current independently leveled modules, verified 31 July 2026. Use stable current module features within the CSS3 family and verify specification status and browser support per feature.

## Evidence collection

```bash
rg --files -g '*.css' -g '*.scss' -g '*.pcss' | head -80
rg -n '@layer|@scope|@media|@container|!important|:root|display:' . --glob '*.css' | head -120
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Redact private asset URLs, source-map contents, tokens derived from secrets, or server-only environment values and user data before quoting output. Inspect script definitions before running anything that can rewrite files, update snapshots, deploy, or delete generated output.

## Classify the failure

- **Parse or compile failure** — isolate the first diagnostic and the active configuration.
- **Runtime failure** — confirm the actual supported browsers and user preference modes and entry point before changing source.
- **Environment-only behavior** — compare versions, flags, generated artifacts, and feature support.
- **Integration failure** — locate the boundary where the expected artifact or contract changes.
- **Performance regression** — measure a representative path before proposing optimization.

## Remediation discipline

State confidence as high, medium, or low and name missing evidence. Make one bounded change, request approval if it changes public behavior, dependencies, generated output, or deployment state, then rerun the original failing check. Never disable validation, broaden compatibility blindly, or delete caches as a first response.

## Report

Report the failing boundary, evidence, root cause or remaining uncertainty, fix applied or proposed, affected stylesheet and rendered layout, compatibility impact, rollback, and verification. If the toolchain itself is unhealthy, hand off to `11ai-operator-css-3-environment`; use `11ai-operator-css-3-setup` only when configuration is genuinely absent.
