---
name: 11ai-operator-javascript-es2026-cheatsheet
description: "Look up JavaScript commands, configuration, runtime patterns, and focused operations across modules, async control flow, dom and events, data modeling, performance and security. Use when the user wants a concise reference instead of a guided workflow."
---
# 11ai JavaScript ES2026 cheatsheet

Use the installed project and target browser, server, worker, or embedded JavaScript runtimes as the source of truth. This lookup stays standalone and hands multi-step work only to sibling skills in this plugin.

Version baseline: Target the stable ECMAScript 2026 edition. Prefer ES2026 APIs only after verifying native runtime support or an explicit transform and polyfill policy.

## Inspect

```bash
node --version
node -p "require('./package.json').type || 'commonjs-default'" 2>/dev/null
rg --files -g '*.js' -g '*.mjs' -g '*.cjs' | head -80
```

Confirm versions, entry points, module mode, generated ownership, and scripts before choosing a pattern. Never guess ECMAScript support, module format, runtime globals, bundler behavior, or error-handling policy.

## Common commands

```bash
npm install --save-dev eslint
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Installation is a requested setup action, not part of a lookup. Preserve the package manager and lockfile, and do not upgrade unrelated dependencies.

ES2026 adds `Math.sumPrecise`, `Iterator.concat`, `Array.fromAsync`, `Error.isError`, `Map` and `WeakMap` get-or-insert methods, `Uint8Array` base64 and hex helpers, JSON source context and raw JSON, and related standard-library changes. Check the exact runtime before using any of them.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-javascript-es2026-modules` | ES modules, CommonJS, exports, imports, cycles, and loading |
| `11ai-operator-javascript-es2026-async-control-flow` | Promises, async iterables, cancellation, concurrency, and cleanup |
| `11ai-operator-javascript-es2026-dom-events` | DOM queries, events, delegation, observers, and lifecycle cleanup |
| `11ai-operator-javascript-es2026-data-modeling` | Objects, arrays, maps, sets, immutability, cloning, and serialization |
| `11ai-operator-javascript-es2026-performance-security` | Profiling, memory, code execution, prototype safety, and input boundaries |

## Answer format

Lead with the smallest applicable command or JavaScript module or bundle pattern. Name the target, behavior, verification, and one risk. Redact secrets and stop before unrequested file, dependency, API, or runtime changes.
