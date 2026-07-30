# WorkOS setup reference

## Environments

Staging and production are fully separate: separate API keys, client ids, organizations, connections, directories, users, and webhook endpoints. Nothing crosses between them.

Key prefixes tell you which is which:

```text
sk_test_...   staging
sk_live_...   production
```

Check the prefix before diagnosing a missing object. "The organization does not exist" is almost always the wrong environment.

## Values

```bash
openssl rand -base64 32
```

```text
# .env.local  (ignored)
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=at-least-32-characters-of-random-data
WORKOS_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
```

```text
# .env.example  (committed, no values)
WORKOS_API_KEY=
WORKOS_CLIENT_ID=
WORKOS_COOKIE_PASSWORD=
WORKOS_REDIRECT_URI=
```

```bash
grep -q '^\.env' .gitignore || echo "env files are NOT ignored"
awk -F= '/^WORKOS_COOKIE_PASSWORD=/{print length($2) " characters"}' .env.local
```

A cookie password under 32 characters makes session encryption fail with an error that does not mention the length. Check it with `awk` so the value is never printed.

`WORKOS_API_KEY` and `WORKOS_COOKIE_PASSWORD` must never appear behind a client-exposed prefix. Verify:

```bash
grep -rn 'NEXT_PUBLIC.*WORKOS_API_KEY\|NEXT_PUBLIC.*COOKIE_PASSWORD' . --include='.env*' --include='*.ts' --include='*.tsx' 2>/dev/null
```

That should return nothing.

## Dashboard registration

Per environment, in the WorkOS dashboard:

1. **Redirect URI** — register the exact callback URL. Exact means scheme, host, port, and path, with no trailing-slash difference. `http://localhost:3000/callback` and `http://127.0.0.1:3000/callback` are different entries.
2. **Sign-out redirect** — where a user lands after signing out. Also an exact match.
3. **AuthKit** — enable it and choose which authentication methods are offered.
4. **Webhook endpoint** — only if the application consumes events, with its own signing secret per endpoint.

Register only the URIs that environment needs. A production environment should not carry a `localhost` redirect URI.

## Next.js App Router

```bash
npm install @workos-inc/authkit-nextjs
```

### Callback route

```ts
// app/callback/route.ts
import { handleAuth } from "@workos-inc/authkit-nextjs"

export const GET = handleAuth()
```

The file path must produce the URL in `WORKOS_REDIRECT_URI`. `app/callback/route.ts` serves `/callback`.

To send the user somewhere after sign-in:

```ts
export const GET = handleAuth({ returnPathname: "/dashboard" })
```

### Middleware

```ts
// middleware.ts
import { authkitMiddleware } from "@workos-inc/authkit-nextjs"

export default authkitMiddleware()

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
```

This is not optional. The access token is short-lived, and the middleware is what exchanges the refresh token for a new one. Without it, sign-in works and then the user is signed out minutes later — the symptom that looks like a broken session and is really a missing refresh.

To protect routes at the middleware level:

```ts
export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ["/", "/pricing", "/sign-in"],
  },
})
```

With `middlewareAuth` enabled, everything not listed requires a session. That default-deny shape is safer than listing protected paths, because a new page is protected automatically.

### Reading the user

```tsx
// app/dashboard/page.tsx
import { withAuth } from "@workos-inc/authkit-nextjs"

export default async function Dashboard() {
  const { user, organizationId, role, permissions } = await withAuth({ ensureSignedIn: true })

  return <p>{user.email}</p>
}
```

```ts
// in a route handler or server action
const { user } = await withAuth()
if (!user) return new Response("Unauthorized", { status: 401 })
```

`withAuth` verifies the session. Never decode the cookie yourself, and never accept a user id from the request body — both are authorization bypasses.

### Sign-in and sign-out

```tsx
import { getSignInUrl, getSignUpUrl, signOut } from "@workos-inc/authkit-nextjs"

export default async function SignInButtons() {
  const signInUrl = await getSignInUrl()
  const signUpUrl = await getSignUpUrl()

  return (
    <>
      <a href={signInUrl}>Sign in</a>
      <a href={signUpUrl}>Sign up</a>
      <form action={async () => { "use server"; await signOut() }}>
        <button type="submit">Sign out</button>
      </form>
    </>
  )
}
```

To send a user straight to one organization's connection, skipping the method chooser:

```ts
const url = await getSignInUrl({ organizationId: "org_..." })
```

### Provider for client components

```tsx
// app/layout.tsx
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthKitProvider>{children}</AuthKitProvider>
      </body>
    </html>
  )
}
```

```tsx
"use client"
import { useAuth } from "@workos-inc/authkit-nextjs/components"

export function UserBadge() {
  const { user, loading } = useAuth()
  if (loading) return null
  return <span>{user?.email}</span>
}
```

Client-side user data is for display. Every authorization decision belongs on the server, behind `withAuth`.

## A plain Node server

```bash
npm install @workos-inc/node
```

```ts
import { WorkOS } from "@workos-inc/node"

const workos = new WorkOS(process.env.WORKOS_API_KEY!, {
  clientId: process.env.WORKOS_CLIENT_ID,
})

// 1. send the user to AuthKit
const authorizationUrl = workos.userManagement.getAuthorizationUrl({
  clientId: process.env.WORKOS_CLIENT_ID!,
  redirectUri: process.env.WORKOS_REDIRECT_URI!,
  provider: "authkit",
  state: csrfToken,
})

// 2. handle the callback
const { user, accessToken, refreshToken, organizationId } =
  await workos.userManagement.authenticateWithCode({
    clientId: process.env.WORKOS_CLIENT_ID!,
    code: requestQuery.code,
  })
```

Two things this hand-rolled path must do that the SDK does for you. Generate a `state` value, store it in a cookie, and compare it on return — that is the cross-site request forgery protection for the flow. And store the tokens in an encrypted, `httpOnly`, `secure`, `sameSite=lax` cookie, then refresh the access token before it expires:

```ts
const refreshed = await workos.userManagement.authenticateWithRefreshToken({
  clientId: process.env.WORKOS_CLIENT_ID!,
  refreshToken,
})
```

Never put tokens in `localStorage`, where any script on the page can read them.

## Verify

```ts
// scripts/check-workos.ts — run server-side only
import { WorkOS } from "@workos-inc/node"

const workos = new WorkOS(process.env.WORKOS_API_KEY!)
const orgs = await workos.organizations.listOrganizations({ limit: 5 })
console.log(orgs.data.map((o) => ({ id: o.id, name: o.name })))
```

If the names are not the ones you expect, the key is for the other environment.

Then the browser loop, in order:

1. A protected page while signed out redirects to sign-in.
2. Sign-in returns to the callback and lands on the application with a session.
3. Reload and navigate both keep the session.
4. Past the access token lifetime, the session still works — proving the refresh path.
5. Sign-out returns to the configured redirect and the protected page redirects again.
6. A protected server route with no cookie returns 401 rather than rendering.

Step 4 is the one people skip, and it is the one that catches a missing middleware.
