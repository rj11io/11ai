---
name: 11ai-operator-typescript-v7-compiler-config
description: "Inspect and change TypeScript compiler configuration including target, lib, strictness, module, moduleResolution, paths, emit, incremental builds, and project references. Use when creating or repairing tsconfig files, changing compiler behavior, or resolving configuration inheritance."
---
# 11ai TypeScript v7 compiler configuration

TSConfig controls both the type universe and the JavaScript that reaches runtime Resolve the exact module, public contract, target configured JavaScript runtimes and package consumers, and acceptance check before editing.

Version baseline: Target TypeScript 7.0 and its native compiler. It carries TypeScript 6 semantics and defaults, but 7.0 has no programmatic compiler API; retain TypeScript 6 side-by-side when tooling requires that API.

## Inspect first

```bash
npx tsc --showConfig
rg -n 'extends|target|lib|strict|module|moduleResolution|paths|noEmit|composite|stableTypeOrdering' tsconfig*.json
```

Resolve the effective configuration, included files, inherited TypeScript 7 defaults, runtime, bundler, and output owner before editing. Use `stableTypeOrdering` only as a 6-to-7 migration diagnostic because it can materially slow checking.

Confirm before changing:

- Target versus available runtime APIs.
- Module and resolver pairing.
- Strictness changes and error count.
- Emit ownership and generated directories.

## Operate

```bash
npx tsc --noEmit
npx tsc --listFilesOnly | head -120
```

Change one compiler decision at a time and record why it matches the runtime. Prefer extending shared configs without shadowing options accidentally.

Never enable skipLibCheck, loosen strictness, change target, or rewrite paths solely to silence diagnostics without approval Require approval for a broader or destructive change and preview affected files, exports, callers, or runtime behavior.

## Verify and report

```bash
npx tsc --noEmit
npm test --if-present
npm run build --if-present
```

Inspect effective config, typecheck all referenced projects, build the real artifact, and run it in the target runtime. Report target, files, public behavior, compatibility or security impact, checks, and rollback. Hand configuration failures to `11ai-operator-typescript-v7-troubleshooting` and seams to `11ai-operator-typescript-v7-integrations`.
