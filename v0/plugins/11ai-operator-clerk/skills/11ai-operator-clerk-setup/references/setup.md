# Clerk setup reference

## Instances and keys

| Prefix | Instance |
| --- | --- |
| `pk_test` / `sk_test` | Development |
| `pk_live` / `sk_live` | Production |

Separate users, organizations, sessions, and webhook endpoints. Nothing crosses between them, so "the user does not exist" is usually the wrong instance.

```text
# .env.local  (ignored)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
```

```text
# .env.example  (committed, no values)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=
```

```bash
grep -q '^\.env' .gitignore || echo "env files are NOT ignored"
grep -rn 'NEXT_PUBLIC.*CLERK_SECRET\|NEXT_PUBLIC.*SIGNING_SECRET' . --include='.env*' --include='*.ts' --include='*.tsx' 2>/dev/null
```

The second command must return nothing. The publishable key is meant for the browser; the secret key grants full API access to the instance and must never go there.

The fallback redirect variables replace the older `AFTER_SIGN_IN_URL` names. They apply only when no redirect is already in the flow, so a user who was sent to sign-in from a protected page still returns to that page.

## Install

```bash
npm install @clerk/nextjs
```

## Provider

```tsx
// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

`ClerkProvider` goes outside `html` in the App Router. It reads the publishable key from the environment automatically.

## Middleware

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
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
```

Four things this gets right:

- **Default-deny.** Everything not in the public list requires a session, so a new page is protected without anyone remembering.
- **Sign-in and sign-up are public.** Protecting them redirects the sign-in page to itself, which is the redirect loop most first setups hit.
- **The webhook route is public.** An external sender has no session; its authentication is the signature.
- **The matcher covers API routes.** Excluding them leaves them unprotected regardless of the code inside.

The middleware also enables `auth()` in server code. Without it, `auth()` throws with a message about `clerkMiddleware` not being detected — that error means the matcher does not cover the route, not that the code is wrong.

## Sign-in and sign-up routes

```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs"

export default function Page() {
  return <SignIn />
}
```

```tsx
// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs"

export default function Page() {
  return <SignUp />
}
```

The optional catch-all segment `[[...sign-in]]` is required. Clerk routes multi-step flows — verification, factor two, reset — under the same path, and a plain `page.tsx` produces a 404 partway through sign-in.

## Header and a protected page

```tsx
// components/Header.tsx
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"

export function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton />
        <SignUpButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  )
}
```

```tsx
// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Dashboard() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const projects = await listProjectsForUser(userId)
  return <ProjectList projects={projects} />
}
```

The server check is the access control. `SignedIn` and `SignedOut` decide what renders; they do not stop a request. A page that fetches private data above a `SignedIn` boundary fetches it for everyone.

```ts
// app/api/projects/route.ts
import { auth } from "@clerk/nextjs/server"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 })

  return Response.json(await listProjectsForUser(userId))
}
```

## Server client for the backend API

```ts
// lib/clerk.ts
import "server-only"
import { clerkClient } from "@clerk/nextjs/server"

export async function getClerk() {
  return clerkClient()
}
```

The `server-only` import turns a mistaken client import into a build error rather than a leaked secret key.

## Other frameworks

### Vite or a single-page application

```bash
npm install @clerk/clerk-react
```

```tsx
import { ClerkProvider } from "@clerk/clerk-react"

const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!key) throw new Error("VITE_CLERK_PUBLISHABLE_KEY is not set")

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={key}>
    <App />
  </ClerkProvider>
)
```

There is no safe place for a secret key in a purely client-side build. Any privileged call belongs on a server that verifies the session token:

```tsx
const { getToken } = useAuth()
const token = await getToken()
await fetch("/api/projects", { headers: { Authorization: `Bearer ${token}` } })
```

### Express

```bash
npm install @clerk/express
```

```ts
import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express"

app.use(clerkMiddleware())

app.get("/api/projects", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req)
  res.json(await listProjectsForUser(userId!))
})
```

Mount `clerkMiddleware()` before any route that needs it, and use `requireAuth()` per route rather than trusting the presence of the middleware.

## Verify

```bash
npm run build
```

Then in the browser, in order:

1. A protected page while signed out redirects to sign-in.
2. Sign up completes through every step — this is where a missing catch-all segment shows up.
3. Sign in lands on the configured page.
4. Reload and navigate both keep the session.
5. `curl -i http://localhost:3000/api/projects` with no cookie returns 401, not data.
6. Sign out and the protected page redirects again.
7. A server component calling `auth()` does not throw.

Step 5 is the real protection check. Steps 2 and 7 catch the two most common wiring mistakes.
