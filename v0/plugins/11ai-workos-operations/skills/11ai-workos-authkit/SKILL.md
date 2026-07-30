---
name: 11ai-workos-authkit
description: "Wire and repair AuthKit sign-in, covering the hosted sign-in and sign-up URLs, organization-scoped sign-in, the callback exchange, encrypted session cookies, middleware refresh of short-lived access tokens, reading the user and role on the server, protecting routes by default, impersonation, and sign-out. Use when sign-in must be added or fixed, when users are unexpectedly signed out, when a callback fails, or when route protection must be added."
---
# 11ai WorkOS AuthKit

Two mechanisms carry the whole flow: the callback that exchanges a code for a session, and the middleware that refreshes a short-lived access token. Almost every AuthKit report — sign-in loops, random sign-outs, a callback error — traces to one of them. Establish both before changing anything else.

## Inspect the current wiring

```bash
ls -la middleware.ts app/callback/route.ts 2>/dev/null
grep -rn 'authkitMiddleware\|handleAuth\|withAuth' --include='*.ts' --include='*.tsx' app/ middleware.ts 2>/dev/null | head -20
grep -o 'WORKOS_REDIRECT_URI=.*' .env.local 2>/dev/null
awk -F= '/^WORKOS_COOKIE_PASSWORD=/{print length($2) " characters"}' .env.local 2>/dev/null
```

Check four things in order: the callback route exists at the exact path in `WORKOS_REDIRECT_URI`, middleware exists and matches the routes users visit, the cookie password is at least 32 characters, and the redirect URI is registered in the dashboard for this environment.

A missing middleware is the single most common defect and produces a symptom that looks unrelated: sign-in works, then the user is signed out a few minutes later when the access token expires.

## Wire the flow

```ts
// app/callback/route.ts
import { handleAuth } from "@workos-inc/authkit-nextjs"

export const GET = handleAuth({ returnPathname: "/dashboard" })
```

```ts
// middleware.ts
import { authkitMiddleware } from "@workos-inc/authkit-nextjs"

export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ["/", "/pricing", "/sign-in"],
  },
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

Enabling `middlewareAuth` with an explicit list of public paths is the shape to prefer: everything else requires a session, so a page added next week is protected without anyone remembering to protect it. Listing protected paths instead means a new page is public by default.

```tsx
import { getSignInUrl, getSignUpUrl, signOut } from "@workos-inc/authkit-nextjs"

const signInUrl = await getSignInUrl()
const orgSignInUrl = await getSignInUrl({ organizationId: "org_..." })
```

Passing `organizationId` sends the user straight to that organization's connection, skipping the method chooser. Use it when the organization is already known — from a subdomain or an invitation — and leave it off otherwise.

## Read the user and authorize on the server

```tsx
import { withAuth } from "@workos-inc/authkit-nextjs"

export default async function Dashboard() {
  const { user, organizationId, role, permissions } = await withAuth({ ensureSignedIn: true })
  return <p>{user.email}</p>
}
```

```ts
export async function POST(request: Request) {
  const { user, permissions } = await withAuth()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })
  if (!permissions?.includes("widgets:write")) {
    return Response.json({ error: "forbidden" }, { status: 403 })
  }
}
```

`withAuth` verifies the session. Never decode the session cookie yourself, never trust a user id or organization id from a request body or query string, and never make an authorization decision from a client-side hook — client state is for display only.

Check `permissions` or `role` on every route that needs it. Middleware proves the user is signed in; it does not prove they may perform this action. And read `organizationId` from the session, not the request, or a user can act inside an organization they do not belong to.

## Sessions and sign-out

The session cookie must be `httpOnly`, `secure` in production, and `sameSite=lax`, encrypted with the cookie password. The SDK sets this; a hand-rolled version must too, and must never place tokens in `localStorage` where any script on the page can read them.

```tsx
<form action={async () => { "use server"; await signOut() }}>
  <button type="submit">Sign out</button>
</form>
```

```ts
await signOut({ returnTo: "https://app.example.com/" })
```

The sign-out redirect must also be registered in the dashboard, or the redirect is rejected after the session is cleared — leaving the user signed out on an error page.

Impersonation, when enabled, lets an administrator act as a user. Treat it as sensitive: show a visible banner while it is active, exclude impersonated sessions from analytics, and never allow a destructive action under impersonation without a second confirmation. `withAuth` reports whether the session is impersonated; use it.

## Verify

Walk the whole loop, including the parts that only fail later:

1. Visit a protected page signed out — redirect to sign-in.
2. Sign in — the callback returns to the intended path with a session.
3. Reload, then navigate — the session survives both.
4. Wait past the access token lifetime, or delete the access token cookie leaving the refresh token — the session recovers. This is the middleware check.
5. Sign out — the protected page redirects again and the cookie is gone.
6. A protected server route with no cookie returns 401, not a rendered page.
7. A user without a required permission gets 403 on that route.

Steps 4 and 7 are the ones usually skipped, and they are the two that catch real defects.

## Report

State the callback path and whether it matches the registered redirect URI, whether middleware exists and its matcher, whether route protection is default-deny or opt-in, the cookie password length check, where authorization is enforced and on which permissions, whether impersonation is enabled and how it is surfaced, and the verification results including the refresh, signed-out, and forbidden checks. Never print keys, cookie passwords, or tokens. Hand configuration failures to `11ai-workos-troubleshooting` and connection-level problems to `11ai-workos-sso`.
