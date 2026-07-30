---
name: 11ai-operator-clerk-integrations
description: "Connect Clerk to the systems around it, covering framework SDKs beyond Next.js, mirroring users and organizations into a local database, scoping every query by the session's organization, protecting an API or another service with a verified token, tying billing to an organization, third-party token templates for a backend that validates independently, and pipeline test and deploy steps. Use when Clerk identity must reach a local table, when another service must trust a Clerk session, or when tenant scoping or billing must be wired."
---
# 11ai clerk integrations

Clerk owns identity; your database owns everything else. Two rules carry the seam: local records are keyed on the Clerk id, and every query is scoped by the `orgId` and `userId` taken from the verified session rather than from the request. Getting the second one wrong is a cross-tenant read, not a bug.

## Name the seam

- **Framework SDK** — the provider, the middleware or its equivalent, and the server helper that verifies a session.
- **Local mirror** — users, tenants, and memberships keyed on Clerk ids, kept current by webhooks plus a reconciliation pass.
- **Tenant scoping** — the organization from the session applied to every read and write.
- **API boundary** — another service or a mobile client presenting a token, verified rather than decoded.
- **Third-party validation** — a backend such as a database platform validating a Clerk token itself, through a token template.
- **Billing** — a subscription attached to an organization rather than to the user who signed up.
- **Pipelines** — tests that do not depend on a live instance, and a gated deploy.

## Wire one deliberately

1. Inspect first: which SDK and middleware exist, whether a local users or tenants table already mirrors Clerk, how queries determine the tenant today, and what the webhook endpoint handles.
2. Mirror rather than duplicate. Store `clerk_user_id` and `clerk_organization_id` as the keys and treat profile fields as a cache. Never key on email — it changes.
3. Take `userId` and `orgId` from the verified session on every request and pass them into the query. An identifier accepted from a body, query string, or header is a bypass with a validator in front of it.
4. Verify tokens at every boundary — signature, expiry, and authorized parties. Decoding a token to read `sub` accepts anything a caller invents.
5. Keep the mirror current with webhooks **and** a scheduled reconciliation, because events get missed and the drift shows up as someone keeping access they should have lost.
6. Attach billing to the organization id so a subscription does not follow a person who leaves. Read [references/integrations.md](references/integrations.md) for the framework wiring, the mirror schema and upsert, the scoping patterns, token verification, token templates, billing, and the pipeline.

## Verify end to end

- Sign in as a user in two organizations, switch between them, and confirm each shows only its own data.
- Send a request carrying another organization's id and confirm it is refused rather than served.
- `curl` a protected API route with no cookie and with an expired token, and confirm neither returns data.
- Delete a user in Clerk and confirm the mirror deactivates them and their sessions end.
- Run the reconciliation pass twice and confirm the second run reports no changes.
- Confirm every custom role and token template exists in both the development and production instances.

## Report

State the seam wired, which SDK and middleware handle the session, the mirror schema and its keys, exactly where `userId` and `orgId` come from in each query path, how tokens are verified at each boundary, what keeps the mirror current, how billing is attached, the files changed, and the verification evidence including the cross-tenant and expired-token checks. Never print the secret key, signing secrets, or tokens. Flag any query path taking a tenant identifier from the request, any authorization value in `unsafeMetadata`, and anything present in one instance and not the other.
