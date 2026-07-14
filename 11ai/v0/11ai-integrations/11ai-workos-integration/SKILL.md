---
name: 11ai-workos-integration
description: "Add or maintain a standalone WorkOS AuthKit integration for Next.js applications, including package setup, AuthKit provider wiring, login/callback/logout routes, protected pages, proxy or middleware configuration, environment variables, WorkOS application redirect settings, CI test mocks, and troubleshooting signed-out or missing-env auth failures."
---

# WorkOS Integration

## Overview

Use this skill to integrate WorkOS AuthKit into a web app, especially a Next.js App Router codebase.

Prefer the official `@workos-inc/authkit-nextjs` package for Next.js. Keep auth routes explicit, protect only the routes that need auth, and avoid putting real secrets in source control or CI workflow literals.

## Workflow

1. Inspect the app shape.
   Check framework version, router type, `package.json`, existing auth routes, middleware/proxy files, and environment handling.

2. Install WorkOS AuthKit.
   Add `@workos-inc/authkit-nextjs`.
   For Next.js App Router, wrap the root layout in `AuthKitProvider` from `@workos-inc/authkit-nextjs/components`.

3. Add auth routes.
   Add a sign-in route that calls `getSignInUrl()` and redirects.
   Add a callback route using `handleAuth()`.
   Add a sign-out route using `signOut()`.

4. Add route protection.
   For Next.js 16+, prefer `proxy.ts` with `authkitProxy()`.
   For Next.js 15 and earlier, use `middleware.ts` with `authkitMiddleware()`.
   Match only protected routes, such as `/dashboard/:path*`.

5. Handle signed-out states deliberately.
   Do not call `withAuth({ ensureSignedIn: true })` from a Server Component when the fallback is a sign-in redirect, because PKCE cookie creation must happen in a Server Action or Route Handler.
   Use `withAuth()` and render a signed-out page with a link to the login route when a friendly error state is needed.

6. Configure environment variables and dashboard settings.
   Read [references/setup.md](./references/setup.md) for required env vars, local `.env.local`, Vercel/GitHub secret handling, and WorkOS application redirect settings.

7. Verify.
   Run typecheck, lint, build, and E2E tests.
   In CI, use mock WorkOS values only for tests that do not call the hosted WorkOS service.

## Troubleshooting

- Missing redirect URI: set `NEXT_PUBLIC_WORKOS_REDIRECT_URI` or pass `redirectUri` to AuthKit proxy/middleware.
- Invalid cookie password: set `WORKOS_COOKIE_PASSWORD` to at least 32 characters.
- Cookie mutation error on signed-out dashboard: avoid redirecting from `withAuth({ ensureSignedIn: true })` in a Server Component; send users to `/login`.
- Dashboard redirects not found: configure redirects inside the WorkOS application `Redirects` tab, not the old Admin Portal redirects page.

## References

Read [references/setup.md](./references/setup.md) for the step-by-step WorkOS setup guide.
