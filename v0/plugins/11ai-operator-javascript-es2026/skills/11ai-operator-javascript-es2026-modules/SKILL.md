---
name: 11ai-operator-javascript-es2026-modules
description: "Operate JavaScript modules across ESM and CommonJS, including imports, exports, package type, file extensions, dynamic loading, cycles, and browser delivery. Use when adding modules, fixing import failures, publishing exports, or migrating module format."
---
# 11ai JavaScript ES2026 modules

Module format is a graph-wide runtime contract Resolve the exact module, public contract, target browser, server, worker, or embedded JavaScript runtimes, and acceptance check before editing.

Version baseline: Target the stable ECMAScript 2026 edition. Prefer ES2026 APIs only after verifying native runtime support or an explicit transform and polyfill policy.

## Inspect first

```bash
node -p "require('./package.json').type || 'commonjs-default'"
rg -n 'import |export |require\(|module\.exports|exports\.|with \{ *type:' . --glob '*.{js,mjs,cjs}' | head -120
```

Map entry points, package type, extensions, conditional exports, import attributes, JSON modules, runtime, and bundler before changing syntax.

Confirm before changing:

- Exact runtime resolver and loader.
- Default versus named export consumers.
- Cycles and side-effect imports.
- Browser MIME type and URL resolution.

## Operate

```bash
node --check TARGET
npm run build --if-present
```

Prefer one module system per published boundary and explicit exports. Break cycles by moving shared dependencies rather than delaying failure.

Never flip package type, rename extensions, or remove an export without enumerating all consumers Require approval for a broader or destructive change and preview affected files, exports, callers, or runtime behavior.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Load the entry point in each supported runtime and exercise static and dynamic import paths. Report target, files, public behavior, compatibility or security impact, checks, and rollback. Hand configuration failures to `11ai-operator-javascript-es2026-troubleshooting` and seams to `11ai-operator-javascript-es2026-integrations`.
