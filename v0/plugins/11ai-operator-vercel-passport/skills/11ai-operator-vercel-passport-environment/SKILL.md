---
name: 11ai-operator-vercel-passport-environment
description: "Inspect Vercel Passport plan access, team and project scope, provider applications, project assignments, team defaults, deployment protection, visitor-identity code, and safe checks without changing anything. Use before Passport work, when access behavior is uncertain, or when the user asks what is configured."
---
# 11ai Vercel Passport environment

Resolve the Enterprise team, current user role, exact projects, deployment classes, provider applications, and environment before interpreting access. Keep this pass read-only.

Version baseline: Use current Vercel Passport Enterprise public-beta behavior as of July 2026. The hosted product has no version number, so verify provider and dashboard behavior against current documentation.

## Inspect local and account context

```bash
npx vercel --version
npx vercel whoami 2>/dev/null
npx vercel project ls 2>/dev/null | head -80
rg -n 'x-vercel-oidc-passport-token|vercel_passport|external_sub|connect.vercel.com/callback' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -120
```

In the dashboard, record provider and project IDs, enabled state, defaults, and assignments without opening or copying secrets. Report raw tokens as present or absent only.

## Inspect checks

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Do not enable, disable, assign, discover, rotate, sign in as another user, clear sessions, or change protection settings.

## Interpretation

- **No Passport settings** — confirm Enterprise plan and role before calling it missing.
- **One project unprotected** — team defaults apply to new projects; existing projects need assignment.
- **Sign-in loop** — compare callback, endpoints, client type, scopes, and user assignment.
- **Missing identity** — confirm code runs behind protected Vercel ingress and on the server.

## Report

State team, role, projects, provider applications, defaults, assignments, deployment coverage, identity handling, and uncertainties. Hand missing setup to `11ai-operator-vercel-passport-setup` and failures to `11ai-operator-vercel-passport-troubleshooting`.
