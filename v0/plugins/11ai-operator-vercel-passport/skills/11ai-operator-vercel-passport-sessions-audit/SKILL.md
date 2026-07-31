---
name: 11ai-operator-vercel-passport-sessions-audit
description: "Operate Vercel Passport session and audit behavior including cookies, expiry, provider deprovisioning, access review, project coverage evidence, log redaction, incident response, and recovery. Use when investigating persistent access, reviewing who can enter deployments, handling deprovisioning, or responding to a protection incident."
---
# 11ai Vercel Passport sessions and audit

A provider assignment, Passport session, and application session can have different lifetimes Resolve exact Enterprise team, project or provider, access impact, administrator, and acceptance check before acting.

Version baseline: Use current Vercel Passport Enterprise public-beta behavior as of July 2026. The hosted product has no version number, so verify provider and dashboard behavior against current documentation.

## Inspect first

```bash
rg -n 'passport|session|cookie|external_sub|audit|logout|revoke' . --glob '*.{ts,tsx,js,md}' | head -140
npx vercel project ls 2>/dev/null | head -100
```

Resolve IdP assignment, Passport session lifetime, application session, deprovision time, project protection, audit source, and incident window.

Confirm before changing:

- Separation of provider and app sessions.
- Deprovisioning and session expiry expectation.
- Project-by-project coverage evidence.
- Token and personal-data redaction.

## Operate

```bash
npm test --if-present
npm run build --if-present
```

Correlate stable subject, project, deployment, and timestamps without storing raw tokens. Treat suspected exposure as an incident and preserve evidence.

Never clear user sessions, disable protection, alter retention, or disclose audit data without explicit approval and incident ownership Require explicit approval and preview projects, users, provider settings, session effects, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test sign-in, expiry, provider unassignment, application authorization, audit correlation, and recovery without relying on raw token logs. Report team, project and provider IDs, identities by role rather than personal data, settings changed, access impact, checks, and rollback. Hand failures to `11ai-operator-vercel-passport-troubleshooting` and seams to `11ai-operator-vercel-passport-integrations`.
