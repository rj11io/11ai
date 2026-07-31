---
name: 11ai-operator-typescript-v7-modules-packages
description: "Operate TypeScript module resolution, package exports and imports, ESM and CommonJS interop, file extensions, type-only imports, path aliases, and consumer compatibility. Use when imports fail, package types are missing, dual-package behavior diverges, or exports must be published."
---
# 11ai TypeScript v7 modules and packages

Compiler resolution must predict the loader that actually executes emitted JavaScript Resolve the exact module, public contract, target configured JavaScript runtimes and package consumers, and acceptance check before editing.

Version baseline: Target TypeScript 7.0 and its native compiler. It carries TypeScript 6 semantics and defaults, but 7.0 has no programmatic compiler API; retain TypeScript 6 side-by-side when tooling requires that API.

## Inspect first

```bash
npx tsc --traceResolution TARGET 2>&1 | head -160
node -p "require('./package.json').type || 'commonjs-default'"
```

Map source imports through TypeScript resolution, emit, package exports, and the target runtime loader.

Confirm before changing:

- module and moduleResolution compatibility.
- Runtime file extensions.
- Types condition and declaration paths.
- Type-only imports and side effects.

## Operate

```bash
npx tsc --noEmit
npm pack --dry-run
```

Publish explicit exports and types that point to files actually included in the package. Test from an external consumer fixture.

Never add broad paths aliases, flip package type, or ship mismatched runtime and declaration exports without approval Require approval for a broader or destructive change and preview affected files, exports, callers, or runtime behavior.

## Verify and report

```bash
npx tsc --noEmit
npm test --if-present
npm run build --if-present
```

Inspect the package dry run and import it from every supported module system and runtime. Report target, files, public behavior, compatibility or security impact, checks, and rollback. Hand configuration failures to `11ai-operator-typescript-v7-troubleshooting` and seams to `11ai-operator-typescript-v7-integrations`.
