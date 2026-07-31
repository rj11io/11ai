---
name: 11ai-operator-vercel-passport-troubleshooting
description: "Diagnose Vercel Passport failures involving plan and roles, provider discovery, callback and endpoints, client credentials, scopes, assignments, project protection, visitor claims, sessions, and deployment access without weakening protection. Use when sign-in loops, access is denied or unexpectedly allowed, identity is missing, or rollout coverage is wrong."
---
# 11ai Vercel Passport troubleshooting

Separate facts from theories. Preserve exact error, redirect URL without sensitive query values, timestamp, team, project, deployment, provider, and test identity classification.

Version baseline: Use current Vercel Passport Enterprise public-beta behavior as of July 2026. The hosted product has no version number, so verify provider and dashboard behavior against current documentation.

## Evidence collection

```bash
npx vercel --version
npx vercel whoami 2>/dev/null
npx vercel project ls 2>/dev/null | head -80
rg -n 'x-vercel-oidc-passport-token|vercel_passport|external_sub|connect.vercel.com/callback' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -120
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Redact client secrets, authorization codes, raw tokens, cookies, email addresses, and personal claims. Do not disable protection to reproduce.

## Classify the failure

- **Plan or role failure** — confirm Enterprise team and an authorized administrator.
- **Discovery or callback failure** — compare issuer, endpoints, client type, redirect, and openid scope.
- **Assignment failure** — confirm user assignment and project-provider assignment independently.
- **Identity failure** — confirm trusted server ingress, injected header, external_sub, and local mapping.
- **Coverage failure** — compare team default, existing-project assignments, and deployment type.

## Remediation discipline

State confidence and missing evidence. Make one bounded change, request approval for provider, secret, project, team, or session changes, then rerun the original sign-in or access check. Never make a project public, disable verification, or broaden assignments speculatively.

## Report

Report boundary, evidence, cause or uncertainty, fix, access impact, affected projects and identities, rollback, and verification. If account context is unhealthy, hand off to `11ai-operator-vercel-passport-environment`.
