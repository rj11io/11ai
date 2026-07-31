---
name: 11ai-operator-clerk-core-3-troubleshooting
description: "Diagnose Clerk failures from reproducible evidence, covering wrong instance and mismatched key pairs, auth throwing because middleware is missing or its matcher excludes the route, sign-in redirect loops, flows that 404 partway through, undefined orgId, oversized session tokens, stale session claims, webhook signature failures and protected webhook routes, and authorization that exists only in components. Use when sign-in or protection misbehaves, when a user seems missing, when a flow breaks mid-step, or when events arrive but nothing happens."
---
# 11ai clerk troubleshooting

Version baseline: Clerk Core 3 and Clerk API 2026-05-12; each Clerk SDK has its own compatible semver (for example @clerk/nextjs v7.5.2 or newer). Inspect the installed SDK and the API-version compatibility table before editing.

Separate observed facts from theories. Two questions answer most Clerk reports before any code is read: which instance is this, and does middleware cover the failing route. Do not disable webhook verification, widen a middleware matcher to silence an error, or trust an unverified token to test an idea.

## Evidence collection

```bash
grep -o 'pk_test\|pk_live\|sk_test\|sk_live' .env.local 2>/dev/null | sort -u
ls -la middleware.ts src/middleware.ts 2>/dev/null
grep -rn 'clerkMiddleware\|createRouteMatcher\|auth.protect' middleware.ts src/middleware.ts 2>/dev/null
find app -path '*sign-in*' -name 'page.tsx' 2>/dev/null
grep -rn 'Show\|SignedIn\|SignedOut\|Protect' --include='*.tsx' app/ components/ 2>/dev/null | wc -l
grep -rn 'await auth()\|auth.protect()\|has({' --include='*.ts' --include='*.tsx' app/ 2>/dev/null | wc -l
date -u
```

The key prefixes, the middleware matcher, and the sign-in route shape answer most reports. `date -u` matters for webhook verification — a clock off by minutes breaks the signature timestamp check.

```bash
curl -i http://localhost:3000/api/protected
curl -i http://localhost:3000/dashboard
```

A protected route returning data with no cookie is the finding, not a symptom.

Print key prefixes and paths, never the keys themselves. Report secrets as set or unset.

## Classify the failure

- **A user or organization that "does not exist"** — the wrong instance. Development and production are separate, with separate users. Check prefixes first, then read the user list back with the secret key.
- **A mismatched key pair** — a `pk_live` with an `sk_test`, or the reverse. This produces authentication failures that look like nothing in particular.
- **`auth()` throws, mentioning `clerkMiddleware` not detected** — middleware is missing, or the matcher does not cover this route. The fix is the matcher, not the calling code.
- **Sign-in works but nothing is protected** — authorization is done with `Show` (or removed Core 2 components) in client components. Those decide what renders; the route still serves. Confirm with `curl` and add a server check.
- **A redirect loop between the application and sign-in** — the sign-in route is not in the public list, so protecting it redirects it to itself.
- **A flow 404s partway through** — the route is not an optional catch-all. Clerk serves verification, second-factor, and reset steps under the same path, so it must be `app/sign-in/[[...sign-in]]/page.tsx`.
- **Sign-in lands on the wrong page** — a forced redirect is set instead of a fallback, so it overrides where the user was going. Use the fallback variables.
- **`orgId` is always undefined** — organizations are disabled for the instance, or the user has no active organization. Both are normal states; treating undefined as unrestricted access is the dangerous part.
- **Authentication starts failing intermittently after adding a session claim** — the token exceeded its size limit. Keep claims to small scalars and read larger data from the API or your own database.
- **A new claim missing for some users** — claims appear only in tokens minted after the change. Existing sessions keep the old shape until they refresh, and a role downgrade needs the session revoked to take effect now.
- **A role or plan that a user can change** — it is stored in `unsafeMetadata`, which the user writes from the browser. Any authorization on it is self-granted; move it to `publicMetadata` or `privateMetadata`.
- **Webhook deliveries failing before reaching the handler** — the webhook route is not public in middleware, so Clerk gets a redirect. Check the middleware's public list first.
- **Webhook signature verification always failing** — a body parser ran before verification, the secret is from another endpoint or instance, or the server clock is outside the tolerance window. In that order.
- **A webhook event applied twice** — no idempotency store. Retries are normal; key on the event id.
- **A local user table drifting from Clerk** — events were missed and no reconciliation pass runs.
- **A banned or deleted user still has access** — their sessions were never revoked. A flag without revocation is not deprovisioning.
- **A custom role failing in production** — it exists in the development instance only. Roles are per instance.
- **`CLERK_SECRET_KEY` appearing in a client bundle** — full API access to the instance is in the browser. Treat the key as compromised and rotate it.

## Remediation discipline

1. Establish the instance and the middleware coverage before reading application code. Many reports end there.
2. Reproduce with `curl` against the failing route, with and without a session cookie. That separates "hidden interface" from "protected route" immediately.
3. Fix the cause, not the symptom. Narrowing a matcher to stop `auth()` throwing removes protection; disabling webhook verification makes the endpoint forgeable; adding a forced redirect to stop a loop breaks return destinations.
4. State confidence as high, medium, or low and name the evidence you are missing.
5. Make one bounded change, then rerun the full flow rather than the single call — sign in, navigate, reload, sign out.
6. After fixing a webhook or mirror problem, run a reconciliation pass; the outage that caused it probably dropped events too.
7. When a session claim or role changed, revoke the affected sessions or the old value persists.

Hand off when the cause is elsewhere: `11ai-operator-clerk-core-3-environment` for instance and wiring questions, `11ai-operator-clerk-core-3-setup` if the provider or middleware is missing, `11ai-operator-clerk-core-3-authentication` for flows and redirects, `11ai-operator-clerk-core-3-sessions` for protection and permissions, `11ai-operator-clerk-core-3-users` for records and metadata, `11ai-operator-clerk-core-3-organizations` for tenant scoping, and `11ai-operator-clerk-core-3-webhooks` for event delivery.

## Report

Conclude with: which instance and key pair were in play, the exact error and where it surfaced, the failing layer — instance, middleware, route shape, redirect, session claim, metadata, or webhook — the root cause or remaining uncertainty, the fix applied or proposed and why it addresses the cause rather than the symptom, its impact, how to undo it, and the verification result for the full flow including a `curl` check with no cookie. Flag any secret key reachable from client code, any cross-tenant exposure, and any authorization done only in components as requiring more than a fix.
