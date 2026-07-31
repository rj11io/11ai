# Vercel Workflows v4 setup reference

Use <https://useworkflow.dev/docs> plus `workflow` 4.x package types and CLI help. Do not copy examples marked for Workflow 5 beta.

## Decisions

Confirm project and team, environment, runtime, auth mode, resource or run, permissions, persistence, limits, retention, billing, cleanup, and rollback owner.

## Inspect

```bash
node -p "require('workflow/package.json').version" 2>/dev/null
rg -n 'use workflow|use step|sleep|workflow|retry|hook|event' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -160
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//'
```

List credential names only and preserve existing resources and policies.

## Install

```bash
npm install workflow@^4.6.0
node -e "import('workflow').then(m => console.log(Object.keys(m).slice(0,20)))"
npx workflow@4 --help 2>/dev/null || true
```

Preview help and generated files. Do not link, create, execute, deploy, or pull remote credentials without approval.

## Verify

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Use local or test scope with one bounded operation, explicit limits, external effects, and cleanup.

## Secrets

Never print or commit workflow payloads, event tokens, connector credentials, approval data, logs containing personal data, or production environment values. Prefer short-lived credentials and keep them server-side.

## Report

List versions, files, scope, resources, limits, permissions, checks, usage, cleanup, and rollback.
