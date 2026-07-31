---
name: 11ai-operator-vercel-passport-cheatsheet
description: "Look up Vercel Passport account, identity provider, project protection, visitor identity, team policy, session, and verification patterns. Use when the user wants a concise Passport reference instead of a guided workflow."
---
# 11ai Vercel Passport cheatsheet

Use current Vercel Passport settings and official documentation as truth. Passport is an Enterprise deployment-protection feature, and this standalone plugin routes multi-step work only to sibling skills.

Version baseline: Use current Vercel Passport Enterprise public-beta behavior as of July 2026. The hosted product has no version number, so verify provider and dashboard behavior against current documentation.

## Inspect

```bash
npx vercel --version
npx vercel whoami 2>/dev/null
npx vercel project ls 2>/dev/null | head -80
rg -n 'x-vercel-oidc-passport-token|vercel_passport|external_sub|connect.vercel.com/callback' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -120
```

Confirm exact team, project, deployment, provider application, and current protection state. Never guess plan availability, provider endpoints, assignments, or session behavior.

## Fixed protocol values

```text
Redirect URI: https://connect.vercel.com/callback
Server header: x-vercel-oidc-passport-token
Stable identity claim: external_sub
```

Do not print provider secrets, raw Passport tokens, or cookies. Read identity only in server-side code.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-vercel-passport-identity-providers` | OAuth and OIDC applications, discovery, endpoints, clients, scopes, and secrets |
| `11ai-operator-vercel-passport-project-protection` | Per-project enablement, deployment coverage, methods, previews, and rollback |
| `11ai-operator-vercel-passport-team-policies` | Team defaults, new projects, bulk assignment, exceptions, roles, and rollout |
| `11ai-operator-vercel-passport-visitor-identity` | Injected token header, external subject, claims, server use, and authorization |
| `11ai-operator-vercel-passport-sessions-audit` | Session cookies, expiry, revocation expectations, access reviews, logs, and incidents |

## Answer format

Lead with the exact dashboard scope or server pattern. State team, project, provider, access impact, verification identities, and approval required before any setting change.
