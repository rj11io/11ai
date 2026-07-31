---
name: 11ai-operator-vercel-eve-v0-environment
description: "Inspect Vercel eve versions, local project structure, account or team context, environment variable names, configured resources, policies, observability, and safe checks without changing anything. Use before Vercel eve work, when the target is uncertain, or when the user asks what is configured."
---
# 11ai Vercel eve v0 environment

Resolve exact project, account or team, environment, installed version, runtime, and remote target before interpreting state. Keep this pass read-only.

Version baseline: Target the eve 0.27 preview line. Because APIs may change within major zero, inspect bundled docs and types and pin the exact minor and patch used in production.

## Inspect local context

```bash
node -p "require('eve/package.json').version" 2>/dev/null
find agent -maxdepth 3 -type f 2>/dev/null | sort | head -160
npx eve --help 2>/dev/null | head -100
```

List environment variable names only. Expect the 0.27 preview line; record the exact patch and stop before applying 0.27 examples to a different minor because eve v0 may break across minors.

## Inspect safe checks

```bash
npm run typecheck --if-present
npm test --if-present
npx eve eval --help 2>/dev/null || true
```

Do not initialize, start schedules, call paid models, create keys or resources, change policies, deploy, promote, replay, cancel, or delete anything.

## Interpretation

- **Wrong scope** — distinguish personal account, team, project, preview, and production.
- **Version drift** — use local help, types, and bundled docs before examples.
- **Credential mismatch** — report names, issuer, or scope without revealing values.
- **Missing observability** — absence of evidence is not proof that an operation never ran.

## Report

State versions, project and team identifiers, environment, configured resources and policies, variable names, observability, and ambiguities. Hand missing setup to `11ai-operator-vercel-eve-v0-setup` and failures to `11ai-operator-vercel-eve-v0-troubleshooting`.
