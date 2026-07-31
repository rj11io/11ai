---
name: 11ai-operator-typescript-v7-migrations-declarations
description: "Migrate JavaScript to TypeScript and author or generate declaration files with allowJs, checkJs, JSDoc, ambient modules, declaration emit, and compatibility tests. Use when incrementally adopting TypeScript, typing an untyped dependency, or publishing declaration files."
---
# 11ai TypeScript v7 migrations and declarations

Migration should increase verified knowledge without freezing incorrect assumptions into public types Resolve the exact module, public contract, target configured JavaScript runtimes and package consumers, and acceptance check before editing.

Version baseline: Target TypeScript 7.0 and its native compiler. It carries TypeScript 6 semantics and defaults, but 7.0 has no programmatic compiler API; retain TypeScript 6 side-by-side when tooling requires that API.

## Inspect first

```bash
rg -n 'allowJs|checkJs|declaration|emitDeclarationOnly|skipLibCheck' tsconfig*.json
rg --files -g '*.d.ts' -g '*.js' -g '*.ts' | head -120
```

Inventory entry points, current runtime tests, untyped boundaries, consumers, and generated declaration ownership.

Confirm before changing:

- Incremental file boundary and check level.
- Runtime validation for external values.
- Generated versus hand-authored declarations.
- Public API compatibility.

## Operate

```bash
npx tsc --noEmit
npm pack --dry-run
```

Migrate a bounded module, keep runtime behavior unchanged, and replace temporary unknowns with evidence. Generate declarations when source can express them.

Never blanket-rename files, declare entire modules as any, or hand-edit generated declarations without approval Require approval for a broader or destructive change and preview affected files, exports, callers, or runtime behavior.

## Verify and report

```bash
npx tsc --noEmit
npm test --if-present
npm run build --if-present
```

Compare runtime tests before and after, inspect declaration output, and typecheck a representative external consumer. Report target, files, public behavior, compatibility or security impact, checks, and rollback. Hand configuration failures to `11ai-operator-typescript-v7-troubleshooting` and seams to `11ai-operator-typescript-v7-integrations`.
