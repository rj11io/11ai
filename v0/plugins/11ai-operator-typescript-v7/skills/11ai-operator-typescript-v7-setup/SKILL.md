---
name: 11ai-operator-typescript-v7-setup
description: "Install and configure TypeScript from zero with a project-local toolchain, explicit runtime and module targets, source and output boundaries, baseline checks, and one verified example. Use when a project has no TypeScript setup or the user explicitly asks to initialize it."
---
# 11ai TypeScript v7 setup

Resolve the project root, package manager, target configured JavaScript runtimes and package consumers, module format, source root, output policy, and existing checks before writing.

Version baseline: Target TypeScript 7.0 and its native compiler. It carries TypeScript 6 semantics and defaults, but 7.0 has no programmatic compiler API; retain TypeScript 6 side-by-side when tooling requires that API.

## Gather first

Confirm compatibility targets, strictness policy, public entry points, test runner, and whether generated files are committed. Never invent runtime target, module and resolver mode, strictness, library set, emitted output, or declaration consumers.

## Install and configure

```bash
npm install --save-dev typescript@^7.0.0
npx tsc --init
```

Use the repository package manager. Preview files and scripts before creating them, and extend rather than replace an active configuration.

Read [references/setup.md](references/setup.md) for the standalone walkthrough, configuration decisions, and verification sequence.

## Verify

```bash
npx tsc --noEmit
npm test --if-present
npm run build --if-present
```

Exercise one narrow example in the real target and inspect emitted output. Do not weaken a check or patch generated files to make setup pass.

## Guardrails

Never print or commit environment values, source-map source content, generated credentials, or user data embedded in fixtures. Ask before changing package manager, module format, public exports, output directories, or dependency versions. Report files, versions, targets, scripts, checks, and rollback.
