---
name: 11ai-operator-vercel-passport-visitor-identity
description: "Read and use Vercel Passport visitor identity from the injected token header with stable external subject claims, server-only handling, claim validation, authorization mapping, and spoofing resistance. Use when identifying authenticated visitors, mapping them to local users, protecting server routes, or debugging missing claims."
---
# 11ai Vercel Passport visitor identity

Passport authentication proves an external identity but application authorization still belongs to the server Resolve exact Enterprise team, project or provider, access impact, administrator, and acceptance check before acting.

Version baseline: Use current Vercel Passport Enterprise public-beta behavior as of July 2026. The hosted product has no version number, so verify provider and dashboard behavior against current documentation.

## Inspect first

```bash
rg -n 'x-vercel-oidc-passport-token|external_sub|vercel_passport|jwt|authorization' . --glob '*.{ts,tsx,js}'
npm test --if-present
```

Trace the header only in server code, claim source, stable external_sub mapping, optional profile fields, local authorization, and behavior outside Vercel.

Confirm before changing:

- Server-side header only.
- external_sub as stable provider identity.
- No authorization from optional email or name.
- Explicit behavior when header is absent.

## Operate

```bash
npm test --if-present
npm run typecheck --if-present
```

Map issuer and external subject to a local principal, enforce application permissions after authentication, and keep the raw token out of logs and clients.

Never trust a client-supplied copy, decode without checking trusted injection context, or authorize from mutable profile claims Require explicit approval and preview projects, users, provider settings, session effects, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test valid assigned visitor, no header, spoofed client header, unknown subject, missing optional claims, and forbidden local role. Report team, project and provider IDs, identities by role rather than personal data, settings changed, access impact, checks, and rollback. Hand failures to `11ai-operator-vercel-passport-troubleshooting` and seams to `11ai-operator-vercel-passport-integrations`.
