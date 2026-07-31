---
name: 11ai-operator-javascript-es2026-setup
description: "Install and configure JavaScript from zero with a project-local toolchain, explicit runtime and module targets, source and output boundaries, baseline checks, and one verified example. Use when a project has no JavaScript setup or the user explicitly asks to initialize it."
---
# 11ai JavaScript ES2026 setup

Resolve the project root, package manager, target browser, server, worker, or embedded JavaScript runtimes, module format, source root, output policy, and existing checks before writing.

Version baseline: Target the stable ECMAScript 2026 edition. Prefer ES2026 APIs only after verifying native runtime support or an explicit transform and polyfill policy.

## Gather first

Confirm compatibility targets, strictness policy, public entry points, test runner, and whether generated files are committed. Never invent ECMAScript support, module format, runtime globals, bundler behavior, or error-handling policy.

## Install and configure

```bash
npm install --save-dev eslint
npx eslint --init
```

Use the repository package manager. Preview files and scripts before creating them, and extend rather than replace an active configuration.

Read [references/setup.md](references/setup.md) for the standalone walkthrough, configuration decisions, and verification sequence.

## Verify

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Exercise one narrow example in the real target and inspect emitted output. Do not weaken a check or patch generated files to make setup pass.

## Guardrails

Never print or commit tokens, cookies, personal data, full request bodies, or server-only environment values. Ask before changing package manager, module format, public exports, output directories, or dependency versions. Report files, versions, targets, scripts, checks, and rollback.
