---
name: 11ai-operator-javascript-es2026-environment
description: "Inspect the installed JavaScript runtime, package manager, module mode, project configuration, entry points, generated output, target environments, and checks without changing anything. Use before JavaScript work, when conventions are unknown, or when the user asks what is configured."
---
# 11ai JavaScript ES2026 environment

Resolve the project root, installed version, active configuration, source graph, output ownership, and target browser, server, worker, or embedded JavaScript runtimes before interpreting behavior. Keep this pass read-only.

Version baseline: Target the stable ECMAScript 2026 edition. Prefer ES2026 APIs only after verifying native runtime support or an explicit transform and polyfill policy.

## Inspect the project

```bash
node --version
node -e "console.log({sumPrecise:typeof Math.sumPrecise,arrayFromAsync:typeof Array.fromAsync,errorIsError:typeof Error.isError,rawJSON:typeof JSON.rawJSON})"
node -p "require('./package.json').type || 'commonjs-default'" 2>/dev/null
rg --files -g '*.js' -g '*.mjs' -g '*.cjs' | head -80
```

List variable names rather than values. Record which ES2026 probes are available in every supported runtime; a missing API requires a supported fallback or an explicit transform/polyfill decision.

## Inspect checks

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Inspect script definitions before execution. Do not run a formatter, codemod, build, deploy, snapshot update, or cache deletion during a read-only environment pass.

## Interpretation

- **Missing local dependency** — report it; do not use an unpinned global fallback.
- **Module mismatch** — confirm package type, file extension, resolver, and runtime together.
- **Generated mismatch** — trace output to source instead of patching generated files.
- **Target mismatch** — ECMAScript support, module format, runtime globals, bundler behavior, or error-handling policy comes from configuration or the user.

## Report

State versions, package manager, module mode, configuration, source and output roots, target browser, server, worker, or embedded JavaScript runtimes, and safe checks. Do not repair or install. Hand missing setup to `11ai-operator-javascript-es2026-setup` and active failures to `11ai-operator-javascript-es2026-troubleshooting`.
