# Vercel eve v0 setup reference

Use <https://eve.dev/docs> plus the documentation bundled with eve 0.27.8 and its CLI help. Because eve remains preview software, pin the exact release used in production.

## Decisions

Confirm project, team or account, environment, runtime, billing owner, feature, resource IDs, credential source, permissions, budgets, retention, and rollback owner.

## Inspect

```bash
node -p "require('eve/package.json').version" 2>/dev/null
find agent -maxdepth 3 -type f 2>/dev/null | sort | head -160
npx eve --help 2>/dev/null | head -100
```

List credential names only. Preserve existing resources, routing, schedules, policies, and deployment ownership.

## Install

```bash
npm install eve@0.27.8
npx eve@0.27.8 init --help
npx eve --version 2>/dev/null || true
```

Preview help and scaffolder output. Stop started servers before editing. Do not initialize Git, create resources, call paid services, or deploy without approval.

## Verify

```bash
npm run typecheck --if-present
npm test --if-present
npx eve eval --help 2>/dev/null || true
```

Use local or test scope with one bounded operation, explicit cost or permission impact, and failure-path verification.

## Secrets

Never print or commit model credentials, channel tokens, connector tokens, tool secrets, session content, approval payloads, or external records. Keep short-lived credentials preferred and server-side.

## Report

List versions, files, project and team, resources, variable names, permissions, budgets, checks, observability, and rollback.
