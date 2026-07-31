---
name: 11ai-operator-typescript-v7-environment
description: "Inspect the installed TypeScript runtime, package manager, module mode, project configuration, entry points, generated output, target environments, and checks without changing anything. Use before TypeScript work, when conventions are unknown, or when the user asks what is configured."
---
# 11ai TypeScript v7 environment

Resolve the project root, installed version, active configuration, source graph, output ownership, and target configured JavaScript runtimes and package consumers before interpreting behavior. Keep this pass read-only.

Version baseline: Target TypeScript 7.0 and its native compiler. It carries TypeScript 6 semantics and defaults, but 7.0 has no programmatic compiler API; retain TypeScript 6 side-by-side when tooling requires that API.

## Inspect the project

```bash
npx tsc --version
npx tsc --showConfig 2>/dev/null | head -120
rg --files -g 'tsconfig*.json' -g '*.ts' -g '*.tsx' -g '*.d.ts' | head -100
```

List variable names rather than values. The local compiler must report major 7 for this plugin; if it does not, stop and treat the task as a migration or use documentation matching the installed major.

## Inspect checks

```bash
npx tsc --noEmit
npm test --if-present
npm run build --if-present
```

Inspect script definitions before execution. Do not run a formatter, codemod, build, deploy, snapshot update, or cache deletion during a read-only environment pass.

## Interpretation

- **Missing local dependency** — report it; do not use an unpinned global fallback.
- **Module mismatch** — confirm package type, file extension, resolver, and runtime together.
- **Generated mismatch** — trace output to source instead of patching generated files.
- **Target mismatch** — runtime target, module and resolver mode, strictness, library set, emitted output, or declaration consumers comes from configuration or the user.

## Report

State versions, package manager, module mode, configuration, source and output roots, target configured JavaScript runtimes and package consumers, and safe checks. Do not repair or install. Hand missing setup to `11ai-operator-typescript-v7-setup` and active failures to `11ai-operator-typescript-v7-troubleshooting`.
