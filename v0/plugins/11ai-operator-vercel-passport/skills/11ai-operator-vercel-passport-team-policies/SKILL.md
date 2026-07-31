---
name: 11ai-operator-vercel-passport-team-policies
description: "Manage Vercel Passport team-wide defaults, new-project inheritance, bulk assignment to existing projects, exceptions, administrator roles, rollout inventory, and rollback. Use when standardizing internal app protection, assigning Passport across projects, or auditing team coverage."
---
# 11ai Vercel Passport team policies

A team default affects future projects while bulk assignment changes existing projects immediately Resolve exact Enterprise team, project or provider, access impact, administrator, and acceptance check before acting.

Version baseline: Use current Vercel Passport Enterprise public-beta behavior as of July 2026. The hosted product has no version number, so verify provider and dashboard behavior against current documentation.

## Inspect first

```bash
npx vercel project ls 2>/dev/null
npx vercel whoami
```

Inventory every project, current Passport state, provider assignment, owner, exception reason, deployment criticality, and rollout group before changing team policy.

Confirm before changing:

- Default behavior for new projects.
- Explicit inventory for existing projects.
- Authorized owner or member roles.
- Documented exceptions and expiry.

## Operate

```bash
npm test --if-present
npm run build --if-present
```

Pilot on non-critical projects, verify access, then apply reviewed batches with exact counts and rollback records.

Never enable team defaults, bulk assign, remove exceptions, or change many projects without explicit approval and a complete preview Require explicit approval and preview projects, users, provider settings, session effects, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Confirm new-project inheritance separately from existing-project assignment and test samples from every rollout group. Report team, project and provider IDs, identities by role rather than personal data, settings changed, access impact, checks, and rollback. Hand failures to `11ai-operator-vercel-passport-troubleshooting` and seams to `11ai-operator-vercel-passport-integrations`.
