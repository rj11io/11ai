---
name: 11ai-clerk-environment
description: "Inspect which Clerk instance an application targets, which keys it holds and whether any secret is reachable from client code, the middleware and provider wiring, configured sign-in and sign-up paths and redirect URLs, whether organizations are enabled, session token claims, and which webhook endpoints exist, without changing anything. Use before a Clerk operation, when sign-in or route protection misbehaves, when a user seems missing, or when the user asks whether Clerk is set up."
---
# 11ai clerk environment

Development and production are separate Clerk instances with separate users, organizations, and webhook secrets, so a missing user is usually the wrong instance rather than a bug. Establish which one the application points at before concluding anything. Keep this pass read-only.

## Inspect what the application holds

```bash
ls -la .env .env.local .env.example 2>/dev/null
grep -o '^[A-Z_]*' .env.local 2>/dev/null | sort
grep -o 'pk_test\|pk_live\|sk_test\|sk_live' .env.local 2>/dev/null | sort -u
```

The key prefixes answer the instance question without printing anything sensitive. `pk_test` and `sk_test` are development; `pk_live` and `sk_live` are production. A mixed pair — a live publishable key with a test secret — is a real misconfiguration that produces confusing authentication failures.

```bash
grep -rn 'CLERK_SECRET_KEY\|WEBHOOK_SIGNING_SECRET' --include='*.tsx' app/ components/ src/ 2>/dev/null
grep -rn 'NEXT_PUBLIC_CLERK_SECRET\|NEXT_PUBLIC.*SIGNING_SECRET' . --include='.env*' --include='*.ts' --include='*.tsx' 2>/dev/null
```

Both should return nothing. `CLERK_SECRET_KEY` referenced from a client component, or behind a client-exposed prefix, puts full API access to the instance in the browser bundle. Report it as an exposure and treat the key as compromised.

List variable **names** only. Never `cat` an environment file.

## Check the wiring

```bash
ls -la middleware.ts src/middleware.ts 2>/dev/null
grep -rn 'clerkMiddleware\|createRouteMatcher\|auth.protect' --include='*.ts' middleware.ts src/middleware.ts 2>/dev/null
grep -rn 'ClerkProvider' --include='*.tsx' app/ src/ 2>/dev/null | head
grep -rn 'CLERK_SIGN_IN_URL\|CLERK_SIGN_UP_URL\|AFTER_SIGN_IN\|FALLBACK_REDIRECT' .env.local 2>/dev/null
```

Four things to establish, in this order:

- **Middleware exists.** Without it, `auth()` throws in server code and no route is protected.
- **Its matcher covers the routes users visit.** A matcher that excludes a section leaves it unprotected regardless of what the code inside does.
- **Protection is default-deny or opt-in.** Read whether the middleware protects everything except a public list, or only protects a named list. The second shape means a new page is public by default.
- **`ClerkProvider` wraps the application** at the root layout.

```bash
grep -rn 'SignedIn\|SignedOut\|Protect' --include='*.tsx' app/ components/ 2>/dev/null | wc -l
grep -rn 'await auth()\|auth.protect()\|has({' --include='*.ts' --include='*.tsx' app/ 2>/dev/null | wc -l
```

Compare the two counts. Components that hide interface elements are not access control; if the first number is large and the second is near zero, authorization is being done in the browser only and every route is reachable directly.

## Read the instance configuration

```ts
// scripts/check-clerk.ts — server-side only
import { createClerkClient } from "@clerk/backend"

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

const users = await clerk.users.getUserList({ limit: 5 })
console.log(users.data.map((u) => ({ id: u.id, email: u.emailAddresses[0]?.emailAddress })))

const orgs = await clerk.organizations.getOrganizationList({ limit: 5 })
console.log({ organizationsEnabled: orgs.data.length >= 0, count: orgs.totalCount })
```

Reading the user list back confirms which instance the secret key belongs to. If the addresses are unfamiliar, the key is for the other instance.

Whether organizations are enabled is an instance setting in the dashboard, not something code can turn on. A `orgId` that is always undefined usually means organizations are off, or the user has no active organization selected.

## Interpretation

- **A user or organization that "does not exist"** — the wrong instance. Check the key prefixes first.
- **`auth()` throwing, or `Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware`** — middleware is missing, or its matcher does not cover this route.
- **Sign-in working and protection not** — authorization is done with `SignedIn` or `Protect` in components only. Those hide elements; the route still serves.
- **A redirect loop between the application and sign-in** — the sign-in route itself is not in the public list, so protecting it redirects to itself.
- **`orgId` always undefined** — organizations are disabled for the instance, or no active organization is set on the session.
- **A custom claim missing from `sessionClaims`** — the session token customization in the dashboard does not include it. That is a dashboard setting, per instance.
- **Webhook events arriving but nothing happening** — the endpoint returns an error, or verification fails because a body parser ran before it.
- **A role or plan read from `unsafeMetadata`** — the user can write that field. Treat any authorization based on it as bypassed.

## Report

State which instance the keys target from their prefixes and whether the pair is consistent, the variable names present and any secret reachable from client code, whether middleware exists with its matcher and whether protection is default-deny, whether `ClerkProvider` wraps the root, the configured sign-in and redirect paths, whether organizations are enabled, the custom session claims available, and which webhook endpoints are configured. Report secrets as set or unset only. Flag any secret key in client-reachable code as requiring rotation, and any authorization done only in components. End with the smallest next safe step, and hand off to `11ai-clerk-setup` if wiring is missing or to `11ai-clerk-troubleshooting` if something is already failing.
