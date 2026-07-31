---
name: 11ai-operator-vercel-passport-setup
description: "Configure Vercel Passport from zero with an Enterprise team, reviewed OAuth or OpenID Connect provider application, exact callback, project or team policy, server-side visitor identity, and bounded access verification. Use when a team has no Passport setup or the user explicitly asks to protect deployments."
---
# 11ai Vercel Passport setup

Resolve team, role, project inventory, identity provider administrator, rollout scope, break-glass owner, and protected deployment types before changing either system.

Version baseline: Use current Vercel Passport Enterprise public-beta behavior as of July 2026. The hosted product has no version number, so verify provider and dashboard behavior against current documentation.

## Gather first

Confirm issuer and discovery, confidential client support, callback, openid scope, user assignments, provider secret owner, project list, and rollback. Never invent endpoints or credentials.

## Configure

```text
Register https://connect.vercel.com/callback
Select authorization_code and openid
Assign a test user and one pilot project
```

Use dashboard secret fields directly. Never paste a client secret into a terminal, file, transcript, or screenshot.

Read [references/setup.md](references/setup.md) for the standalone provider and Vercel sequence.

## Verify

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Use an assigned and unassigned test identity on a pilot deployment before broader rollout. Verify direct URLs and server identity separately.

## Guardrails

Ask before enabling defaults, assigning projects, changing protection methods, or rotating secrets. Report team, provider, pilot project, scopes, protected deployment types, identities tested, files, checks, and rollback.
