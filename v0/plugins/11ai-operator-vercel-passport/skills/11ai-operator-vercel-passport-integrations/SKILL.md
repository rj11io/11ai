---
name: 11ai-operator-vercel-passport-integrations
description: "Connect Vercel Passport to an identity provider, server-side application authorization, local user mapping, audit systems, CI previews, and deployment operations while preserving identity and secret boundaries. Use when Passport identity must cross into application or enterprise systems."
---
# 11ai Vercel Passport integrations

Name both systems, stable subject mapping, claims, trust boundary, session lifetimes, audit owner, and protected deployment scope before editing.

Version baseline: Use current Vercel Passport Enterprise public-beta behavior as of July 2026. The hosted product has no version number, so verify provider and dashboard behavior against current documentation.

## Inspect seams

```bash
npx vercel --version
npx vercel whoami 2>/dev/null
npx vercel project ls 2>/dev/null | head -80
rg -n 'x-vercel-oidc-passport-token|vercel_passport|external_sub|connect.vercel.com/callback' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -120
```

Find existing identity, authorization, and logging code. This standalone plugin records external contracts locally and does not depend on another plugin.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for identity mapping, authorization, audits, previews, and incident boundaries.

Use external_sub plus issuer as stable identity, enforce local permissions on the server, and retain only needed claims. Keep raw tokens out of clients and logs.

## Verify end to end

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test assigned, unassigned, unknown local user, forbidden local role, expired session, and direct deployment access in a pilot environment.

## Report

State systems, team and projects, stable key, claim handling, authorization, session ownership, audit redaction, tests, and rollback. Hand failures to `11ai-operator-vercel-passport-troubleshooting`.
