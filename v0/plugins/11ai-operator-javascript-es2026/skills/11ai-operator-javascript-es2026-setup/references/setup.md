# JavaScript ES2026 setup reference

Use the stable ECMAScript 2026 specification at <https://tc39.es/ecma262/2026/> and current MDN guidance at <https://developer.mozilla.org/en-US/docs/Web/JavaScript>. Inspect every target runtime before using new ES2026 APIs.

## Decisions

Confirm project root, package manager, target browser, server, worker, or embedded JavaScript runtimes, module format, source and output roots, public exports, strictness, and test policy.

## Inspect

```bash
node --version
node -p "require('./package.json').type || 'commonjs-default'" 2>/dev/null
rg --files -g '*.js' -g '*.mjs' -g '*.cjs' | head -80
```

Preserve active configuration. Do not invent ECMAScript support, module format, runtime globals, bundler behavior, or error-handling policy or replace existing scripts.

## Install

```bash
npm install --save-dev eslint
npx eslint --init
```

Install locally with the repository package manager. Keep unrelated dependency and lockfile changes out of scope.

## Verify

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Exercise one representative JavaScript module or bundle, inspect emitted output, and test the actual target. A zero exit code alone is not proof of correct runtime behavior.

## Secrets and output

Never print or commit tokens, cookies, personal data, full request bodies, or server-only environment values. Keep generated files only when repository policy requires them, and never patch generated output as the source fix.

## Report

List versions, files, scripts, module and runtime targets, checks, public contract, and rollback.
