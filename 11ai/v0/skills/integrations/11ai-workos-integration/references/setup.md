# WorkOS AuthKit Setup

## Required Values

Use separate values for local, preview, and production.

```env
WORKOS_CLIENT_ID=
WORKOS_API_KEY=
WORKOS_COOKIE_PASSWORD=
NEXT_PUBLIC_WORKOS_REDIRECT_URI=
```

Generate the cookie password locally:

```bash
openssl rand -base64 32
```

Never commit `WORKOS_API_KEY` or `WORKOS_COOKIE_PASSWORD`.

## Local `.env.local`

```env
WORKOS_CLIENT_ID=client_...
WORKOS_API_KEY=sk_test_...
WORKOS_COOKIE_PASSWORD=<32-or-more-character-secret>
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
```

## WorkOS Dashboard Redirects

Configure redirects on the WorkOS application that owns `WORKOS_CLIENT_ID`.

Open:

1. WorkOS Dashboard.
2. Select the right environment.
3. Open `Applications`.
4. Select the application.
5. Open the `Redirects` tab.

Set local development values:

- `Redirect URIs`: `http://localhost:3000/callback`
- `App homepage`: `http://localhost:3000`
- `Sign-in endpoint`: `http://localhost:3000/login`
- `Sign-out redirects`: `http://localhost:3000`

Leave these unset unless the product uses those flows:

- `Sign-up URL`
- `User invitation URL`
- `Password reset URL`

Set production values when the production domain exists:

- `Redirect URIs`: `https://your-domain.com/callback`
- `App homepage`: `https://your-domain.com`
- `Sign-in endpoint`: `https://your-domain.com/login`
- `Sign-out redirects`: `https://your-domain.com`

## Next.js App Router Shape

Callback route:

```ts
import { handleAuth } from "@workos-inc/authkit-nextjs"

export const GET = handleAuth({ returnPathname: "/dashboard" })
```

Login route:

```ts
import { getSignInUrl } from "@workos-inc/authkit-nextjs"
import { redirect } from "next/navigation"

export async function GET() {
  redirect(await getSignInUrl())
}
```

Logout route:

```ts
import { signOut } from "@workos-inc/authkit-nextjs"

export async function GET() {
  await signOut({ returnTo: "/" })
}
```

Next.js 16 route protection:

```ts
import { authkitProxy } from "@workos-inc/authkit-nextjs"

export default authkitProxy()

export const config = {
  matcher: ["/dashboard/:path*"],
}
```

Friendly signed-out page:

```ts
import { withAuth } from "@workos-inc/authkit-nextjs"

export default async function DashboardPage() {
  const { user } = await withAuth()

  if (!user) {
    return <a href="/login">Sign in with WorkOS</a>
  }

  return <div>{user.email}</div>
}
```

## CI Test Mocks

Use mock values only for tests that do not call hosted WorkOS APIs.
Add them directly to the GitHub Actions E2E test step, not at global workflow scope:

```yaml
- name: E2E tests
  env:
    WORKOS_CLIENT_ID: client_ci_mock
    WORKOS_API_KEY: sk_test_ci_mock
    WORKOS_COOKIE_PASSWORD: ci-only-authkit-cookie-password-32-chars
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: http://localhost:3000/callback
  run: npm run test:e2e
```

Use real values only through Vercel environment variables or GitHub secrets.

## Verification

- Start the app locally with `.env.local` present.
- Open `/dashboard` signed out and confirm a friendly sign-in message.
- Click `/login` and complete hosted WorkOS login.
- Confirm the callback returns to the expected authenticated route.
- Run typecheck, lint, build, and E2E tests.

## Official References

- WorkOS AuthKit Next.js: https://workos.com/docs/authkit/nextjs
- WorkOS Dashboard: https://dashboard.workos.com
