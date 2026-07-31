---
name: 11ai-operator-vercel-eve-v0-integrations
description: "Connect Vercel eve to application runtimes, identity, external services, persistence, observability, CI, and deployment while preserving account, credential, data, and action boundaries. Use when Vercel eve must cross another system or operate consistently through production."
---
# 11ai Vercel eve v0 integrations

Name both systems, project and team scope, trust boundary, data and actions, credential source, persistence, and production owner before editing.

Version baseline: Target the eve 0.27 preview line. Because APIs may change within major zero, inspect bundled docs and types and pin the exact minor and patch used in production.

## Inspect seams

```bash
node -p "require('eve/package.json').version" 2>/dev/null
find agent -maxdepth 3 -type f 2>/dev/null | sort | head -160
npx eve --help 2>/dev/null | head -100
rg -n "route|webhook|workflow|sandbox|telemetry|deploy|provider|connector" . --glob '!node_modules' | head -100
```

Find existing connections before adding another. This plugin remains standalone and records external contracts locally.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for standalone identity, runtime, persistence, observability, test, and deployment patterns.

Change one seam, enforce least privilege, validate external input, keep model credentials, channel tokens, connector tokens, tool secrets, session content, approval payloads, or external records server-side, and make every consequential action auditable.

## Verify end to end

```bash
npm run typecheck --if-present
npm test --if-present
npx eve eval --help 2>/dev/null || true
```

Use test scope for success, denial, duplicate, timeout, and recovery. Do not use production or real recipients as an integration test by default.

## Report

State systems, scopes, permissions, credentials by name, retained data, remote actions, budgets, observability, checks, and rollback. Hand failures to `11ai-operator-vercel-eve-v0-troubleshooting`.
