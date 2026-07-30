---
name: 11ai-workos-troubleshooting
description: "Diagnose WorkOS failures from reproducible evidence, covering wrong environment and key mismatches, unregistered or mismatched redirect URIs, short cookie passwords, missing session refresh, inactive connections and directories, partial directory listings from unpaginated reads, webhook signature failures and duplicate delivery, missing role slugs after promotion, and cross-tenant scoping mistakes. Use when sign-in fails or loops, when users are unexpectedly signed out, when an object seems missing, or when events arrive but nothing happens."
---
# 11ai WorkOS troubleshooting

Separate observed facts from theories. The first question is always which environment and which key were in play, because staging and production share nothing and a missing object is usually a wrong key rather than a bug. Do not disable signature verification, widen a redirect allow list, or trust an unverified token to test an idea.

## Evidence collection

```bash
grep -o 'sk_test\|sk_live' .env.local 2>/dev/null | head -1
grep -o 'WORKOS_REDIRECT_URI=.*' .env.local 2>/dev/null
awk -F= '/^WORKOS_COOKIE_PASSWORD=/{print length($2) " characters"}' .env.local 2>/dev/null
ls -la middleware.ts app/callback/route.ts 2>/dev/null
grep -rn 'authkitMiddleware\|handleAuth\|withAuth\|getSession' --include='*.ts' --include='*.tsx' app/ middleware.ts 2>/dev/null | head -20
date -u
```

```ts
const workos = new WorkOS(process.env.WORKOS_API_KEY!)
const orgs = await workos.organizations.listOrganizations({ limit: 5 })
console.log(orgs.data.map((o) => ({ id: o.id, name: o.name })))
```

Read the key prefix, the redirect URI, the cookie password length, and whether middleware exists. Those four answer most reports before any code is read. `date -u` matters more than it looks: a server clock off by minutes breaks webhook signature verification.

Print the redirect URI, which is not secret. Never print the API key, cookie password, signing secret, or a token — report those as set or unset, and check lengths with `awk` rather than displaying values.

## Classify the failure

- **An organization, user, connection, or role slug that "does not exist"** — the wrong environment. Check the key prefix first, then list organizations and read the names back. This is the most common cause of every "missing object" report.
- **A redirect rejected immediately after sign-in** — the redirect URI is not registered for this environment, or does not match character for character. `localhost` and `127.0.0.1` are different hosts, a trailing slash is a difference, and `http` is not `https`.
- **Sign-in succeeds, then the user is signed out minutes later** — no middleware refreshing the session. The interval matches the access token lifetime. This is the defect behind most "it worked yesterday" reports.
- **Sign-in succeeds and the session never persists at all** — the cookie password is under 32 characters, or the cookie is not being set because the response was built before the cookies were written.
- **A sign-in loop between the application and AuthKit** — middleware protecting the callback path or the sign-in page itself. Exclude them from the matcher or list them as unauthenticated.
- **Authorization behaving oddly on the server** — code reading the session without verifying it, or taking a user id or organization id from the request. Read both from the verified session only.
- **A connection exists but nobody can sign in through it** — its state is not active, so configuration on the identity provider side is unfinished. That is a customer action; hand off to `11ai-workos-sso`.
- **A directory shows far fewer users than expected** — only the first page was read. These lists are cursor-paginated and default to a small page.
- **A user removed from the directory still has access** — deactivation updated a row but did not end their sessions, or the event was missed and no reconciliation pass runs. Hand off to `11ai-workos-directory-sync`.
- **Webhook signature verification always fails** — a body parser ran before verification and destroyed the raw bytes, the secret is from another environment or endpoint, or the server clock is outside the tolerance window. Check in that order.
- **Events arrive and nothing happens** — the handler returns an error, so the sender retries and gives up; or the event type is unhandled and falls through silently. Check the endpoint's delivery log.
- **An event applied twice** — no idempotency store. Retries are normal, so the handler must key on the event id.
- **Membership creation failing on a role** — the role slug exists in staging and not in production. Compare the lists rather than guessing.
- **One tenant seeing another's data** — a query scoped by an organization id taken from the request instead of the session. Treat this as a security incident, not a bug.
- **`401 Unauthorized` from every API call** — the key is for another environment, was truncated on paste, or has been revoked.

## Remediation discipline

1. Establish the environment and key before reading code. Most reports end here.
2. Reproduce with the smallest call: list organizations with the server key, or one sign-in attempt with the browser's network log open.
3. For a sign-in problem, check the three things that must match exactly — the environment value, the route that exists, and the registered URI — before looking at the SDK.
4. State confidence as high, medium, or low and name the evidence you are missing.
5. Make one bounded change, then rerun the original failing flow end to end rather than the single call.
6. Never weaken a protection to clear a symptom. Disabling webhook verification, adding a wildcard redirect URI, trusting an unverified token, or accepting an organization id from the request each trade a real safeguard for the error message.
7. After fixing a directory or webhook problem, run a reconciliation pass — the outage that caused it probably also dropped events.

Hand off when the cause is elsewhere: `11ai-workos-environment` for key and configuration questions, `11ai-workos-setup` if values or routes are missing, `11ai-workos-authkit` for session and route protection, `11ai-workos-sso` for connections, `11ai-workos-directory-sync` for provisioning, and `11ai-workos-webhooks` for event delivery.

## Report

Conclude with: which environment and key were in play, the exact error and where it surfaced, the failing layer — environment, redirect, session, connection, provisioning, or webhook — the root cause or remaining uncertainty, the fix applied or proposed and why it addresses the cause rather than the symptom, its impact, how to undo it, and the verification result for the full flow. Flag any cross-tenant exposure or any server key reachable from client code as requiring rotation and disclosure, not just a fix.
