# Vercel AI Gateway setup reference

Use current hosted-product documentation at <https://vercel.com/docs/ai-gateway> plus installed package and CLI help. AI Gateway has no product version number.

## Decisions

Confirm project, team or account, environment, runtime, billing owner, feature, resource IDs, credential source, permissions, budgets, retention, and rollback owner.

## Inspect

```bash
npx vercel --version
npx vercel whoami 2>/dev/null
npx vercel ai-gateway --help 2>/dev/null | head -120
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
```

List credential names only. Preserve existing resources, routing, schedules, policies, and deployment ownership.

## Install

```bash
npm install ai
npx vercel --version
npx vercel ai-gateway --help 2>/dev/null || true
```

Preview help and scaffolder output. Stop started servers before editing. Do not initialize Git, create resources, call paid services, or deploy without approval.

## Verify

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Use local or test scope with one bounded operation, explicit cost or permission impact, and failure-path verification.

## Secrets

Never print or commit AI_GATEWAY_API_KEY, provider BYOK credentials, Vercel access and OIDC tokens, prompts, outputs, user tags, or reporting exports. Keep short-lived credentials preferred and server-side.

## Report

List versions, files, project and team, resources, variable names, permissions, budgets, checks, observability, and rollback.
