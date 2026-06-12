---
name: 11ai-workos-convex-integration
description: Add or maintain a combined WorkOS AuthKit and Convex integration for authenticated product applications, including Next.js AuthKit routes, protected pages, Convex provider/functions, env var setup across local/Vercel/GitHub/Convex, WorkOS application redirects, Convex deployment linking, optional WorkOS-to-Convex environment sharing, CI mock auth values, and end-to-end verification.
---

# WorkOS and Convex Integration

## Overview

Use this skill when an app needs WorkOS for authentication and Convex for the application database/backend.

Set up each integration independently, then join them through authenticated routes and shared deployment environments. Keep WorkOS secrets out of client code, keep Convex deployment keys out of source control, and use mock values only for CI tests that do not call hosted WorkOS.

## Workflow

1. Inspect the current repo.
   Read `package.json`, app router files, existing `proxy.ts` or `middleware.ts`, `convex/`, `.env.example`, `.env.local` shape, CI workflows, and tests.

2. Install packages.
   Add `@workos-inc/authkit-nextjs` and `convex`.

3. Wire WorkOS.
   Add `AuthKitProvider`, login/callback/logout routes, and route protection.
   Use a friendly signed-out page for protected pages that should show an error message instead of crashing or redirecting from a Server Component.

4. Wire Convex.
   Add `ConvexProvider` with `ConvexReactClient`.
   Add a basic Convex query or mutation.
   Prefer generated Convex API imports after `npx convex dev` has run.

5. Configure env vars and dashboards.
   Read [references/setup.md](./references/setup.md) for local `.env.local`, WorkOS application redirects, Convex dashboard/deployment setup, production env placement, and CI mock values.

6. Build an end-to-end demo.
   Provide a public page with a sign-in entry point.
   Provide a protected dashboard that shows the WorkOS user and reads a Convex status query.
   Make signed-out dashboard access render a helpful sign-in message.

7. Verify.
   Run typecheck, lint, build, unit tests, and E2E tests.
   Test the real hosted login manually after real WorkOS values are configured.

## Integration Rules

- WorkOS `WORKOS_API_KEY` and `WORKOS_COOKIE_PASSWORD` are server-only secrets.
- Convex `NEXT_PUBLIC_CONVEX_URL` is safe to expose to the browser.
- Convex `CONVEX_DEPLOY_KEY` is a secret.
- Do not use real WorkOS or Convex secrets as hardcoded GitHub Actions env literals.
- Scope mock WorkOS env values to the E2E test step when tests only verify local signed-out behavior.
- Configure WorkOS redirects on the application `Redirects` tab, not the old Admin Portal redirects page.

## Troubleshooting

- WorkOS missing redirect URI in CI: add `NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback` to the E2E step.
- WorkOS missing cookie password in CI: add a 32+ character mock `WORKOS_COOKIE_PASSWORD` to the E2E step.
- WorkOS cookie mutation error: avoid `withAuth({ ensureSignedIn: true })` in Server Components when it would redirect; link to `/login`.
- Convex deployment missing in dashboard: run `npx convex dashboard` from the repo and confirm the active account/team.
- Build without Convex env: guard Convex provider setup when `NEXT_PUBLIC_CONVEX_URL` is missing.

## References

Read [references/setup.md](./references/setup.md) for the joined setup and verification guide.
