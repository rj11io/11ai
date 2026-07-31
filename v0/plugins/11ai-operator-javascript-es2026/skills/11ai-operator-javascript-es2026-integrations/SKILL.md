---
name: 11ai-operator-javascript-es2026-integrations
description: "Connect JavaScript to build tools, tests, linting, formatting, CI, browser and server runtimes, package boundaries, and deployment artifacts while preserving ownership between layers. Use when JavaScript must cross another project subsystem or behave consistently from development through production."
---
# 11ai JavaScript ES2026 integrations

Name both sides of the seam, the value or artifact crossing it, and which side owns compilation, validation, security, and deployment.

Version baseline: Target the stable ECMAScript 2026 edition. Prefer ES2026 APIs only after verifying native runtime support or an explicit transform and polyfill policy.

## Inspect the seams

```bash
node --version
node -p "require('./package.json').type || 'commonjs-default'" 2>/dev/null
rg --files -g '*.js' -g '*.mjs' -g '*.cjs' | head -80
rg -n "build|lint|test|deploy|exports|types|module" package.json .github . 2>/dev/null | head -100
```

Find the existing adapter or script before adding another. This skill remains standalone and does not refer to another 11ai plugin.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for build, test, CI, package, runtime, and deployment patterns.

Change one boundary at a time. Preserve public contracts and source maps, and keep tokens, cookies, personal data, full request bodies, or server-only environment values out of client output and logs.

## Verify end to end

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Run producer and consumer checks, inspect the production artifact, and test one representative path in browser, server, worker, or embedded JavaScript runtimes. Preview broad codemods and generated changes.

## Report

State systems connected, files and scripts changed, module or data contract, target, secret boundary, checks, and rollback. Use sibling domain skills for product work and `11ai-operator-javascript-es2026-troubleshooting` for failures.
