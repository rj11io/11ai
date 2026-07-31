---
name: 11ai-operator-tailwind-v3-troubleshooting
description: "Diagnose Tailwind CSS v3 installation, content detection, configuration, plugin, PostCSS, watch, specificity, missing-style, and oversized-output failures from exact evidence. Use when a v3 build fails, classes are absent or ineffective, or generated CSS behaves unexpectedly."
---
# 11ai Tailwind CSS v3 troubleshooting

Version baseline: Tailwind CSS 3.4.19 (stable v3 family), verified 2026-07-31; do not prescribe v4 packages or CSS-first directives as v3 fixes.

Separate observed facts from theories. Establish the original command, exact error and exit code, package versions, content owner, config, input stylesheet, output consumer, and smallest failing class.

## Evidence collection

```bash
npm ls tailwindcss postcss autoprefixer --depth=0
rg -n 'tailwindcss|@tailwind|content:|safelist:|plugins:|prefix:|important:' package.json tailwind.config.* postcss.config.* --glob '*.css'
npx tailwindcss -i INPUT.css -o TEMP_OUTPUT.css
```

Use a disposable output file. Preserve exact stderr and exit code, but redact tokens, private paths, source maps, and user data before quoting output.

## Classify the failure

- **Major or package mismatch:** v4 package layout or directives are mixed with v3 configuration.
- **Candidate absent:** content globs miss the file, the extension is omitted, or a class is dynamically constructed.
- **CSS generated but ineffective:** stylesheet import, cascade, specificity, prefix, important selector, variant state, or Preflight is the boundary.
- **Build or plugin failure:** module format, PostCSS order, plugin compatibility, config evaluation, or input path is wrong.
- **Output too large or slow:** content globs, safelist breadth, duplicate compilers, source maps, or watch scope is excessive.

## Remediation discipline

Propose one bounded change and state confidence. Ask before dependency changes, config replacement, content-scan expansion, safelist growth, Preflight changes, or output overwrite. Re-run the original failing check and compare selector presence and CSS size.

## Report

State the failing boundary, evidence, root cause or uncertainty, proposed fix, affected files, visual or build impact, rollback, and verification. If the environment itself is unclear or unhealthy, hand off to `11ai-operator-tailwind-v3-environment` before application styling work.
