---
name: 11ai-operator-workos-integrations
description: "Connect WorkOS to the systems around it, covering framework SDKs and session middleware, mirroring users and organizations into a local database, scoping every query by the organization from the session, protecting an API boundary with a verified token, machine-to-machine access, tying billing to an organization, and staging versus production promotion. Use when WorkOS identity must reach a local user table, when an API or another service must trust a WorkOS session, or when tenant scoping must be enforced."
---
# 11ai WorkOS integrations

WorkOS owns identity; your database owns everything else. The integration is the seam between them, and two rules carry it: the local record is keyed on the WorkOS id, and every query is scoped by the organization taken from the verified session rather than from the request. Get the second one wrong and one tenant reads another's data.

## Name the seam

- **Framework SDK and middleware** — the session cookie, its refresh, and the server-side helper that verifies it.
- **Local mirror** — a users table and a tenants table keyed on WorkOS ids, kept current by webhooks and a reconciliation pass.
- **Tenant scoping** — the organization from the session applied to every read and write.
- **API boundary** — another service or a client trusting a WorkOS-issued token, verified rather than decoded.
- **Machine-to-machine** — a background job or another service acting without a user.
- **Billing** — a subscription attached to an organization rather than to a user.
- **Promotion** — staging and production as separate environments with separate ids.

## Wire one deliberately

1. Inspect first: which SDK and middleware exist, whether a local users or tenants table already mirrors WorkOS, how queries currently determine the tenant, and what the webhook endpoint handles.
2. Mirror rather than duplicate. Store the WorkOS user id and organization id as the keys and keep profile fields as a cache, not a second source of truth. Never key a local record on email — it changes.
3. Take `organizationId` from the verified session on every request and use it in the query. An organization id accepted from a body, a query string, or a header is a cross-tenant read waiting to happen.
4. Verify tokens at every boundary. A service receiving a token must validate its signature, issuer, audience, and expiry — decoding it to read claims is not verification.
5. Keep the mirror current with webhook events **and** a scheduled reconciliation, because events get missed. See `11ai-operator-workos-webhooks` and `11ai-operator-workos-directory-sync`.
6. Attach billing to the organization id, so a change of billing contact does not move the subscription. Read [references/integrations.md](references/integrations.md) for the framework wiring, the mirror schema and upsert, the tenant-scoping patterns, API boundary verification, and the promotion checklist.

## Verify end to end

- Sign in as a user in two organizations, switch between them, and confirm each shows only its own data.
- Craft a request carrying another organization's id and confirm it is refused rather than served.
- Delete a user in WorkOS and confirm the local mirror deactivates them and their sessions end.
- Call the API with an expired token, a token from the other environment, and a valid one, and confirm only the last succeeds.
- Run the reconciliation pass twice and confirm the second run reports no changes.
- Promote to staging and confirm every role slug, redirect URI, and webhook endpoint exists there too.

## Report

State the seam wired, which SDK and middleware handle the session, the local mirror schema and its keys, exactly where `organizationId` comes from in each query path, how tokens are verified at each boundary, what keeps the mirror current, the files changed, and the verification evidence including the cross-tenant and expired-token checks. Never print API keys, cookie passwords, webhook secrets, or tokens. Flag any query path that takes a tenant identifier from the request, and any object that exists in one environment but not the other.
