---
name: 11ai-operator-clerk-sessions
description: "Protect routes and read Clerk sessions on the server, covering middleware default-deny protection, auth and auth.protect in server components and route handlers, permission and role checks with has, session token claims and their size limit, verifying a bearer token at an API boundary, session lifetime and revocation, and why component-level gating is not access control. Use when routes must be protected, when auth throws, when a permission check must be added, or when another service must trust a Clerk session."
---
# 11ai clerk sessions

The distinction that matters: `SignedIn`, `SignedOut`, and `Protect` decide what renders, and `auth()` decides what a request is allowed to do. Hiding a button changes nothing about whether the route serves data. Every route returning private data must check on the server.

## Inspect first

```bash
ls -la middleware.ts src/middleware.ts 2>/dev/null
grep -rn 'clerkMiddleware\|createRouteMatcher\|auth.protect' middleware.ts src/middleware.ts 2>/dev/null
grep -rn 'SignedIn\|Protect' --include='*.tsx' app/ components/ 2>/dev/null | wc -l
grep -rn 'await auth()\|auth.protect()\|has({' --include='*.ts' --include='*.tsx' app/ 2>/dev/null | wc -l
```

Compare the last two counts. A large number of component guards with almost no server checks means authorization lives in the browser, and every route is reachable directly with `curl`.

Read the middleware matcher too. A matcher that excludes a section leaves it unprotected regardless of what the code inside does, and it is also why `auth()` sometimes throws.

## Protect at the middleware, default-deny

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ["/((?!_next|[^?]*\\.[^?]*).*)", "/(api|trpc)(.*)"],
}
```

Protect everything except an explicit public list. A page added next month is then protected without anyone remembering, whereas listing protected routes leaves every new route open.

Keep sign-in, sign-up, and webhook routes public. Protecting sign-in redirects it to itself; a webhook sender has no session and authenticates by signature instead.

Middleware does a second job: it makes `auth()` available in server code. The error mentioning `clerkMiddleware` not being detected means the matcher does not cover that route, not that the calling code is wrong.

## Read the session on the server

```ts
import { auth, currentUser } from "@clerk/nextjs/server"

const { userId, orgId, orgRole, sessionClaims, has } = await auth()
if (!userId) redirect("/sign-in")
```

```ts
export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 })

  return Response.json(await listProjectsForUser(userId))
}
```

Prefer `auth()` over `currentUser()` when the id is enough — `currentUser()` makes an API call on every request. Use `auth.protect()` when you want it to throw and redirect rather than branching yourself.

Two rules that prevent real vulnerabilities:

- **Derive the user and organization from the session**, never from a request body, query string, or header. A caller-supplied `userId` is an authorization bypass with a validator in front of it.
- **Scope the query, do not filter afterwards.** Pass `userId` or `orgId` into the database query rather than fetching broadly and discarding rows in code.

## Check permissions, not just presence

```ts
const { has } = await auth()

if (!has({ permission: "org:invoices:read" })) {
  return Response.json({ error: "forbidden" }, { status: 403 })
}

if (!has({ role: "org:admin" })) return forbidden()
```

Being signed in is not being allowed. Middleware proves a session exists; the route still has to decide whether this user may perform this action, on this record.

Prefer permission checks over role checks. A permission survives a role rename and expresses the intent directly.

```ts
await auth.protect({ permission: "org:invoices:read" })
```

For per-record access, load the record and compare its owner to the session's `userId` or `orgId`. A permission grants a capability, not access to somebody else's row.

## Session claims and their limit

`sessionClaims` carries what the dashboard's session token customization includes, which lets middleware read a flag without an API call. The token has a size limit — roughly a few kilobytes — so keep claims to small scalars such as a plan name or an onboarding flag. Putting a list of permissions or a profile object in there makes the token oversized and authentication starts failing intermittently.

Read authorization data from `publicMetadata` or `privateMetadata`, never `unsafeMetadata`. The user can write `unsafeMetadata` from the browser, so a role read from it is self-granted.

A claim added in the dashboard appears only in tokens minted afterwards. Existing sessions keep the old shape until they refresh, so code reading a new claim must tolerate its absence.

## Verify a token at an API boundary

For a separate service or a mobile client:

```ts
import { verifyToken } from "@clerk/backend"

const payload = await verifyToken(token, {
  secretKey: process.env.CLERK_SECRET_KEY!,
  authorizedParties: ["https://app.example.com"],
})
```

Verify the signature, the expiry, and `authorizedParties`. Decoding the token to read `sub` without verifying accepts anything a caller invents. Setting `authorizedParties` is what stops a token minted for another origin being replayed against your API.

## Revoke and end sessions

```ts
const client = await clerkClient()
await client.sessions.revokeSession(sessionId)
await client.users.getUserList({ userId: [userId] })
```

Revocation matters for deprovisioning: a user removed from your database who still holds a valid session still has access. Revoke their sessions as part of removing access, and treat a role downgrade the same way if the role lives in a session claim — the old claim persists until the session refreshes.

## Verify

1. `curl -i` a protected route with no cookie — expect 401 or a redirect, never data.
2. Call it as a user without the required permission — expect 403.
3. Call it with another user's record id — expect a refusal, not their data.
4. Confirm `auth()` works in a server component without throwing, which proves the matcher covers it.
5. Sign out and confirm protected routes stop serving.
6. Revoke a session and confirm the next request is rejected.
7. Confirm the session token is not oversized by checking that authentication holds after adding a claim.

Steps 1 to 3 are the ones that distinguish real protection from hidden interface.

## Report

State the middleware matcher and whether protection is default-deny, which routes are public and why, where each protected route checks the session and on which permission or role, how records are scoped to the caller, which session claims are configured and their approximate size, how tokens are verified at any API boundary, and the verification results including the unauthenticated, forbidden, and wrong-record checks. Flag any authorization done only in components, any identity taken from the request, and any role read from `unsafeMetadata`.
