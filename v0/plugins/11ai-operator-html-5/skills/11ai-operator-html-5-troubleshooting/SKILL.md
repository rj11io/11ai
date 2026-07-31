---
name: 11ai-operator-html-5-troubleshooting
description: "Diagnose HTML5 failures involving configuration, parsing, compilation, runtime behavior, generated output, browser or server differences, tests, integrations, and performance without masking the original error. Use when HTML5 code fails a check, behaves differently across environments, or produces unexpected output."
---
# 11ai HTML5 troubleshooting

Separate observed facts from theories. Reproduce the smallest failing path and keep the original error, exit code, target browsers and assistive technologies, and relevant file names intact.

Version baseline: HTML5, represented by the current WHATWG HTML Living Standard (last updated 20 July 2026), verified 31 July 2026. Use current conforming HTML5 features; treat frozen W3C snapshots and obsolete elements as legacy, and verify browser and assistive-technology support per feature.

## Evidence collection

```bash
rg --files -g '*.html' -g '*.htm' -g '*.xhtml' | head -80
rg -n '<!doctype|<html|<main|<form|<video|<meta' . --glob '*.html' | head -120
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Redact form payloads, embedded tokens, private URLs, or server-only environment values and user data before quoting output. Inspect script definitions before running anything that can rewrite files, update snapshots, deploy, or delete generated output.

## Classify the failure

- **Parse or compile failure** — isolate the first diagnostic and the active configuration.
- **Runtime failure** — confirm the actual browsers and assistive technologies and entry point before changing source.
- **Environment-only behavior** — compare versions, flags, generated artifacts, and feature support.
- **Integration failure** — locate the boundary where the expected artifact or contract changes.
- **Performance regression** — measure a representative path before proposing optimization.

## Remediation discipline

State confidence as high, medium, or low and name missing evidence. Make one bounded change, request approval if it changes public behavior, dependencies, generated output, or deployment state, then rerun the original failing check. Never disable validation, broaden compatibility blindly, or delete caches as a first response.

## Report

Report the failing boundary, evidence, root cause or remaining uncertainty, fix applied or proposed, affected HTML document, compatibility impact, rollback, and verification. If the toolchain itself is unhealthy, hand off to `11ai-operator-html-5-environment`; use `11ai-operator-html-5-setup` only when configuration is genuinely absent.
