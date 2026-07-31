---
name: 11ai-operator-typescript-v7-cheatsheet
description: "Look up TypeScript commands, configuration, runtime patterns, and focused operations across compiler configuration, type modeling, narrowing and generics, modules and packages, migrations and declarations. Use when the user wants a concise reference instead of a guided workflow."
---
# 11ai TypeScript v7 cheatsheet

Use the installed project and target configured JavaScript runtimes and package consumers as the source of truth. This lookup stays standalone and hands multi-step work only to sibling skills in this plugin.

Version baseline: Target TypeScript 7.0 and its native compiler. It carries TypeScript 6 semantics and defaults, but 7.0 has no programmatic compiler API; retain TypeScript 6 side-by-side when tooling requires that API.

## Inspect

```bash
npx tsc --version
npx tsc --showConfig 2>/dev/null | head -120
rg --files -g 'tsconfig*.json' -g '*.ts' -g '*.tsx' -g '*.d.ts' | head -100
```

Confirm versions, entry points, module mode, generated ownership, and scripts before choosing a pattern. Never guess runtime target, module and resolver mode, strictness, library set, emitted output, or declaration consumers.

## Common commands

```bash
npm install --save-dev typescript@^7.0.0
npx tsc --noEmit
npm test --if-present
npm run build --if-present
```

Installation is a requested setup action, not part of a lookup. Preserve the package manager and lockfile, and do not upgrade unrelated dependencies.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-typescript-v7-compiler-config` | TSConfig target, libs, strictness, emit, paths, and project references |
| `11ai-operator-typescript-v7-type-modeling` | Unions, intersections, object types, immutability, and API contracts |
| `11ai-operator-typescript-v7-narrowing-generics` | Control-flow narrowing, predicates, generics, constraints, and inference |
| `11ai-operator-typescript-v7-modules-packages` | Resolution, exports, imports, ESM/CJS interop, and package types |
| `11ai-operator-typescript-v7-migrations-declarations` | JS-to-TS migration, declaration files, allowJs, checkJs, and library typing |

## Answer format

Lead with the smallest applicable command or typed source, JavaScript output, or declaration file pattern. Name the target, behavior, verification, and one risk. Redact secrets and stop before unrequested file, dependency, API, or runtime changes.
