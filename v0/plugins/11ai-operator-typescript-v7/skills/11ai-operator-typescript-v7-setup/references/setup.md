# TypeScript v7 setup reference

Use the TypeScript 7 release guidance at <https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/> and current documentation at <https://www.typescriptlang.org/docs/>. Inspect the installed compiler and any tooling that requires the absent 7.0 programmatic API.

## Decisions

Confirm project root, package manager, target configured JavaScript runtimes and package consumers, module format, source and output roots, public exports, strictness, and test policy.

## Inspect

```bash
npx tsc --version
npx tsc --showConfig 2>/dev/null | head -120
rg --files -g 'tsconfig*.json' -g '*.ts' -g '*.tsx' -g '*.d.ts' | head -100
```

Preserve active configuration. Do not invent runtime target, module and resolver mode, strictness, library set, emitted output, or declaration consumers or replace existing scripts.

## Install

```bash
npm install --save-dev typescript@^7.0.0
npx tsc --init
```

Install locally with the repository package manager. Keep unrelated dependency and lockfile changes out of scope.

## Verify

```bash
npx tsc --noEmit
npm test --if-present
npm run build --if-present
```

Exercise one representative typed source, JavaScript output, or declaration file, inspect emitted output, and test the actual target. A zero exit code alone is not proof of correct runtime behavior.

## Secrets and output

Never print or commit environment values, source-map source content, generated credentials, or user data embedded in fixtures. Keep generated files only when repository policy requires them, and never patch generated output as the source fix.

## Report

List versions, files, scripts, module and runtime targets, checks, public contract, and rollback.
