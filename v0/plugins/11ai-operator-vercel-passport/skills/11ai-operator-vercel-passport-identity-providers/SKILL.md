---
name: 11ai-operator-vercel-passport-identity-providers
description: "Configure Vercel Passport identity provider applications with OAuth or OpenID Connect discovery, issuer and endpoints, confidential clients, redirect URI, scopes, assignments, and secret rotation. Use when connecting Okta, Auth0, Entra, or another provider, repairing discovery, or rotating the provider application secret."
---
# 11ai Vercel Passport identity providers

The identity provider application anchors every Passport sign-in Resolve exact Enterprise team, project or provider, access impact, administrator, and acceptance check before acting.

Version baseline: Use current Vercel Passport Enterprise public-beta behavior as of July 2026. The hosted product has no version number, so verify provider and dashboard behavior against current documentation.

## Inspect first

```bash
rg -n 'issuer|authorization_endpoint|token_endpoint|jwks_uri|openid|connect.vercel.com/callback' . --glob '*.{md,json,ts}' | head -120
npx vercel whoami
```

Inspect provider metadata in its administrator console and confirm issuer, authorization, token, user-info, and JWKS endpoints belong to one authorization server.

Confirm before changing:

- Exact redirect URI https://connect.vercel.com/callback.
- Confidential authorization-code client.
- OpenID scope and required profile claims.
- Assigned users and secret rotation owner.

## Operate

```bash
npm test --if-present
npm run build --if-present
```

Create or select one reviewed provider application in the Passport dashboard and copy secrets through the dashboard flow, never through the terminal or transcript.

Never create applications, change endpoints or scopes, rotate secrets, or reassign users without explicit approval Require explicit approval and preview projects, users, provider settings, session effects, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Use a test user to verify discovery, redirect, consent, callback, claims, denied user, and old-secret retirement. Report team, project and provider IDs, identities by role rather than personal data, settings changed, access impact, checks, and rollback. Hand failures to `11ai-operator-vercel-passport-troubleshooting` and seams to `11ai-operator-vercel-passport-integrations`.
