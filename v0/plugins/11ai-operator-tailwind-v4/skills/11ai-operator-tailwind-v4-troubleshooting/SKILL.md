---
name: 11ai-operator-tailwind-v4-troubleshooting
description: "Diagnose Tailwind CSS v4 core and adapter mismatches, source detection, theme, plugin, compatibility, browser, watch, missing-style, and oversized-output failures from exact evidence. Use when a v4 build fails, classes are absent or ineffective, or generated CSS behaves unexpectedly."
---
# 11ai Tailwind CSS v4 troubleshooting

Version baseline: Tailwind CSS 4.3.1 (stable), verified 2026-07-31; exclude prerelease fixes and distinguish v3 advice from v4 behavior.

Separate observed facts from theories. Establish the original command, exact error and exit code, core and adapter versions, CSS entry, source owner, browser, output consumer, and smallest failing class.

## Evidence collection

```bash
npm ls tailwindcss @tailwindcss/vite @tailwindcss/postcss @tailwindcss/cli @tailwindcss/webpack --depth=0
rg -n 'tailwindcss|@import "tailwindcss"|@theme|@source|@utility|@variant|@plugin|@config|@reference' package.json --glob '*.css' --glob '*config*'
npm run build
```

Preserve exact stderr and exit code. Use a disposable CLI output only when the CLI adapter is installed. Redact tokens, private paths, source maps, and user data before quoting output.

## Classify the failure

- **Core or adapter mismatch:** v4 packages differ by major or the wrong adapter is registered.
- **Candidate absent:** ignore rules, source base, external package paths, or dynamic class construction hide the complete class name.
- **Definition unavailable:** separately bundled CSS lacks `@reference`, or theme, utility, variant, plugin, or config order is wrong.
- **CSS generated but ineffective:** import ownership, cascade, variant state, prefix, important modifier, Preflight, or browser support is the boundary.
- **Compatibility or migration drift:** v3 directives, unsupported JS config options, renamed utilities, or an incomplete upgrade remains.
- **Output too large or slow:** explicit sources, inline safelists, duplicate adapters, or broad watch scope is excessive.

## Remediation discipline

Propose one bounded change and state confidence. Ask before dependencies, adapter changes, source expansion, global theme changes, compatibility directives, browser-target changes, or output replacement. Re-run the original check and compare CSS size and browser rendering.

## Report

State the failing boundary, evidence, cause or uncertainty, proposed fix, browser and visual impact, files, rollback, and verification. If the environment is unclear, hand off to `11ai-operator-tailwind-v4-environment`.
