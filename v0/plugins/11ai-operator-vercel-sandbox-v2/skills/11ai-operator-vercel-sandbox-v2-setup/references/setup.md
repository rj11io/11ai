# Vercel Sandbox v2 setup reference

Use <https://vercel.com/docs/sandbox> plus `@vercel/sandbox` 2.x package types and current CLI help as version-specific sources.

## Decisions

Confirm project and team, environment, runtime, auth mode, resource or run, permissions, persistence, limits, retention, billing, cleanup, and rollback owner.

## Inspect

```bash
node -p "require('@vercel/sandbox/package.json').version" 2>/dev/null
rg -n 'Sandbox\.|@vercel/sandbox|VERCEL_OIDC_TOKEN|timeout|runtime|snapshot' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -140
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//'
```

List credential names only and preserve existing resources and policies.

## Install

```bash
npm install @vercel/sandbox@^2.9.0
node -e "import('@vercel/sandbox').then(m => console.log(Object.keys(m)))"
npx vercel --version
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

Never print or commit VERCEL_OIDC_TOKEN, access tokens, uploaded private files, command environment values, logs containing data, or preview URLs. Prefer short-lived credentials and keep them server-side.

## Report

List versions, files, scope, resources, limits, permissions, checks, usage, cleanup, and rollback.
