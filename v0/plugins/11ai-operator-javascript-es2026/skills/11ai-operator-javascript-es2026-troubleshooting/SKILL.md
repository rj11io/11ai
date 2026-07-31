---
name: 11ai-operator-javascript-es2026-troubleshooting
description: "Diagnose JavaScript failures involving parsing, types, modules, configuration, async behavior, runtime differences, generated output, tests, integrations, security, and performance without masking the original error. Use when JavaScript code fails a check, behaves differently across environments, or produces unexpected output."
---
# 11ai JavaScript ES2026 troubleshooting

Separate facts from theories. Reproduce the smallest failure and preserve the first diagnostic, stack, exit code, runtime, module mode, and target browser, server, worker, or embedded JavaScript runtimes.

Version baseline: Target the stable ECMAScript 2026 edition. Prefer ES2026 APIs only after verifying native runtime support or an explicit transform and polyfill policy.

## Evidence collection

```bash
node --version
node -p "require('./package.json').type || 'commonjs-default'" 2>/dev/null
rg --files -g '*.js' -g '*.mjs' -g '*.cjs' | head -80
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Redact tokens, cookies, personal data, full request bodies, or server-only environment values and user data. Inspect scripts before running anything that rewrites files, upgrades packages, deploys, or deletes caches.

## Classify the failure

- **Parse or type failure** — isolate the first diagnostic under the active configuration.
- **Module failure** — align file extension, package type, resolver, and runtime.
- **Runtime failure** — capture inputs, stack, async boundary, and environment.
- **Integration failure** — find where the expected contract changes.
- **Performance or security issue** — measure or demonstrate the exact path before fixing.

## Remediation discipline

State confidence and missing evidence. Make one bounded change, request approval for public, dependency, generated, or deployment changes, and rerun the original check. Never disable validation, add any, swallow errors, or clear caches blindly.

## Report

Report boundary, evidence, cause or uncertainty, fix, affected JavaScript module or bundle, compatibility and security impact, rollback, and verification. If the toolchain is unhealthy, hand off to `11ai-operator-javascript-es2026-environment`.
