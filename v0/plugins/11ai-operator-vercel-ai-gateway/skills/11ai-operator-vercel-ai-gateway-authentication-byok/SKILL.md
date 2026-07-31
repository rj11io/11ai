---
name: 11ai-operator-vercel-ai-gateway-authentication-byok
description: "Operate AI Gateway authentication with Vercel OIDC, API keys, dashboard BYOK credentials, request-scoped BYOK, scopes, rotation, and system-credential fallback. Use when configuring credentials, migrating from provider keys, adding BYOK, rotating a key, or diagnosing authentication."
---
# 11ai Vercel AI Gateway authentication and BYOK

Credential mode determines who pays, which provider account handles data, and what fallback can occur Resolve the exact project, environment, remote target, permission and cost boundary, and acceptance check before acting.

Version baseline: Use current generally available AI Gateway behavior as of July 2026, including AI SDK 7, multimodal and realtime models, routing, budgets, BYOK, regional inference, and data-retention controls.

## Inspect first

```bash
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
rg -n 'AI_GATEWAY_API_KEY|VERCEL_OIDC_TOKEN|byok|Authorization' TARGET
```

Resolve team, project, environment, credential issuer, scope, storage, rotation owner, BYOK priority, and system fallback policy.

Confirm before changing:

- Short-lived OIDC where available.
- Server-only key storage.
- Team-wide versus request-scoped BYOK.
- Explicit fallback billing behavior.

## Operate

```bash
npx vercel ai-gateway api-keys --help 2>/dev/null || true
npm test --if-present -- TARGET
```

Prefer OIDC on Vercel, isolate static keys by environment and purpose, and rotate with overlap and verification.

Never print, paste into commands, create, rotate, revoke, add BYOK, or enable fallback credentials without explicit approval Require explicit approval and preview targets, permissions, counts, cost, remote effects, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Use a bounded non-content test to confirm issuer, scope, environment, BYOK selection, fallback policy, and old-key retirement. Report scope, target IDs, files, remote actions, permissions, cost, checks, observability, and rollback. Hand configuration failures to `11ai-operator-vercel-ai-gateway-troubleshooting` and seams to `11ai-operator-vercel-ai-gateway-integrations`.
