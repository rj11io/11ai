---
name: 11ai-operator-typescript-v7-troubleshooting
description: "Diagnose TypeScript failures involving parsing, types, modules, configuration, async behavior, runtime differences, generated output, tests, integrations, security, and performance without masking the original error. Use when TypeScript code fails a check, behaves differently across environments, or produces unexpected output."
---
# 11ai TypeScript v7 troubleshooting

Separate facts from theories. Reproduce the smallest failure and preserve the first diagnostic, stack, exit code, runtime, module mode, and target configured JavaScript runtimes and package consumers.

Version baseline: Target TypeScript 7.0 and its native compiler. It carries TypeScript 6 semantics and defaults, but 7.0 has no programmatic compiler API; retain TypeScript 6 side-by-side when tooling requires that API.

## Evidence collection

```bash
npx tsc --version
npx tsc --showConfig 2>/dev/null | head -120
rg --files -g 'tsconfig*.json' -g '*.ts' -g '*.tsx' -g '*.d.ts' | head -100
npx tsc --noEmit
npm test --if-present
npm run build --if-present
```

Redact environment values, source-map source content, generated credentials, or user data embedded in fixtures and user data. Inspect scripts before running anything that rewrites files, upgrades packages, deploys, or deletes caches.

## Classify the failure

- **Parse or type failure** — isolate the first diagnostic under the active configuration.
- **Module failure** — align file extension, package type, resolver, and runtime.
- **Runtime failure** — capture inputs, stack, async boundary, and environment.
- **Integration failure** — find where the expected contract changes.
- **Performance or security issue** — measure or demonstrate the exact path before fixing.

## Remediation discipline

State confidence and missing evidence. Make one bounded change, request approval for public, dependency, generated, or deployment changes, and rerun the original check. Never disable validation, add any, swallow errors, or clear caches blindly.

## Report

Report boundary, evidence, cause or uncertainty, fix, affected typed source, JavaScript output, or declaration file, compatibility and security impact, rollback, and verification. If the toolchain is unhealthy, hand off to `11ai-operator-typescript-v7-environment`.
