---
name: 11ai-operator-typescript-v7-integrations
description: "Connect TypeScript to build tools, tests, linting, formatting, CI, browser and server runtimes, package boundaries, and deployment artifacts while preserving ownership between layers. Use when TypeScript must cross another project subsystem or behave consistently from development through production."
---
# 11ai TypeScript v7 integrations

Name both sides of the seam, the value or artifact crossing it, and which side owns compilation, validation, security, and deployment.

Version baseline: Target TypeScript 7.0 and its native compiler. It carries TypeScript 6 semantics and defaults, but 7.0 has no programmatic compiler API; retain TypeScript 6 side-by-side when tooling requires that API.

## Inspect the seams

```bash
npx tsc --version
npx tsc --showConfig 2>/dev/null | head -120
rg --files -g 'tsconfig*.json' -g '*.ts' -g '*.tsx' -g '*.d.ts' | head -100
rg -n "build|lint|test|deploy|exports|types|module" package.json .github . 2>/dev/null | head -100
```

Find the existing adapter or script before adding another. Identify integrations that import the compiler API: TypeScript 7.0 does not expose it, so those tools may need `@typescript/typescript6` side-by-side. This skill remains standalone and refers only to sibling skills.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for build, test, CI, package, runtime, and deployment patterns.

Change one boundary at a time. Preserve public contracts and source maps, and keep environment values, source-map source content, generated credentials, or user data embedded in fixtures out of client output and logs.

## Verify end to end

```bash
npx tsc --noEmit
npm test --if-present
npm run build --if-present
```

Run producer and consumer checks, inspect the production artifact, and test one representative path in configured JavaScript runtimes and package consumers. Preview broad codemods and generated changes.

## Report

State systems connected, files and scripts changed, module or data contract, target, secret boundary, checks, and rollback. Use sibling domain skills for product work and `11ai-operator-typescript-v7-troubleshooting` for failures.
