---
name: 11ai-operator-clerk-core-3-authentication
description: "Wire and repair Clerk sign-in and sign-up flows, covering prebuilt components on catch-all routes versus hosted pages, custom flows with the sign-in and sign-up hooks, redirect configuration and returning a user to where they started, social connections, multi-factor and verification steps, email and password strategies, and an onboarding step after sign-up. Use when sign-in or sign-up must be added or customized, when a flow 404s partway through, or when redirects send users to the wrong place."
---
# 11ai clerk authentication

Version baseline: Clerk Core 3 and Clerk API 2026-05-12; each Clerk SDK has its own compatible semver (for example @clerk/nextjs v7.5.2 or newer). Inspect the installed SDK and the API-version compatibility table before editing.

Two things break most Clerk sign-in flows: a route that cannot serve the flow's later steps, and redirect configuration that discards where the user was going. Establish both before customizing anything.

## Inspect first

```bash
ls -la app/sign-in app/sign-up 2>/dev/null
find app -path '*sign-in*' -name 'page.tsx' 2>/dev/null
grep -rn 'SIGN_IN_URL\|SIGN_UP_URL\|FALLBACK_REDIRECT\|AFTER_SIGN' .env.local 2>/dev/null
grep -rn 'SignIn\|SignUp\|useSignIn\|useSignUp' --include='*.tsx' app/ components/ 2>/dev/null | head
```

Check the route shape first. Clerk runs multi-step flows — email verification, a second factor, a password reset — under the same path, so the route must be an optional catch-all:

```text
app/sign-in/[[...sign-in]]/page.tsx
app/sign-up/[[...sign-up]]/page.tsx
```

A plain `app/sign-in/page.tsx` renders the first screen and then 404s on the verification step. That is the "sign-up is broken halfway through" report, and it is a file path problem rather than a code problem.

## Choose the flow

Three options, in order of how much you take on:

- **Prebuilt components on your own routes.** `SignIn` and `SignUp` on catch-all routes. Handles every step, verification, and factor for you. Start here.
- **Hosted pages.** Clerk's own domain, configured in the dashboard. Least code, but the user leaves your application.
- **Custom flow with hooks.** `useSignIn` and `useSignUp`. Full control of the markup, and you must handle every status the flow can return.

A custom flow is a real commitment: you handle `needs_first_factor`, `needs_second_factor`, `needs_identifier`, `needs_new_password`, and `complete`, plus each verification strategy. Skipping a status leaves users stuck with no visible error. Only take it on when the prebuilt components genuinely cannot be styled to fit.

```tsx
import { SignIn } from "@clerk/nextjs"

export default function Page() {
  return <SignIn appearance={{ elements: { formButtonPrimary: "bg-black" } }} />
}
```

The `appearance` prop restyles the prebuilt components, which usually removes the reason for a custom flow.

## Configure redirects

```text
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
```

The word *fallback* is the important part. These apply only when nothing else in the flow says where to go — so a user sent to sign-in from a protected page still returns to that page afterwards. Setting a forced redirect instead sends everyone to the same place and loses their destination, which is the usual cause of "sign-in works but drops me on the dashboard".

Separate the two fallbacks. A new user should land on onboarding; a returning user should not.

For a one-off destination, pass it in rather than changing the global setting:

```tsx
<SignIn fallbackRedirectUrl="/billing" />
```

Never take a redirect target from an unvalidated query parameter. An open redirect after authentication sends a signed-in user to an attacker's page. Allow only relative paths, or match against a known list.

## Social connections and verification

Social connections are enabled per instance in the dashboard, and development instances use Clerk's shared credentials. Before production, register your own application with each provider and add real credentials — the shared ones show Clerk's name on the consent screen and are rate-limited.

Each provider's callback must be registered on the provider's side. A mismatch produces a generic provider error rather than anything naming the redirect.

Multi-factor authentication is also an instance setting. When it is on, both the prebuilt components and a custom flow must handle the second-factor step; a custom flow that ignores `needs_second_factor` silently strands every user who has it enabled.

## Add an onboarding step

A user is signed in the moment sign-up completes, so anything you still need from them has to be enforced rather than requested:

```ts
// middleware.ts
export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return

  const { userId, sessionClaims } = await auth.protect()

  const onboarded = (sessionClaims?.publicMetadata as { onboarded?: boolean })?.onboarded
  if (!onboarded && !request.nextUrl.pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", request.url))
  }
})
```

Set the flag in `publicMetadata` from the server after onboarding completes, and add it to the session token claims in the dashboard so the middleware can read it without an API call per request. Never store the flag in `unsafeMetadata` — the user can write that field and skip onboarding.

## Verify

1. Complete a full sign-up including email verification. This is where a missing catch-all segment appears.
2. Complete a sign-in, and a password reset.
3. Start from a protected page, sign in, and confirm you return to that page rather than the default.
4. Sign up as a new user and confirm you land on onboarding, and cannot leave it until it is done.
5. Sign in with each enabled social connection.
6. If multi-factor is enabled, complete a sign-in with it.
7. Try a crafted redirect parameter pointing off-site and confirm it is refused.

## Report

State the route shape and whether it is a catch-all, which flow style is in use, the sign-in and sign-up URLs and both fallback redirects, whether a user returns to their original destination, which social connections are enabled and whether they use real provider credentials, how multi-factor steps are handled, how onboarding is enforced and which metadata field holds the flag, and the verification results including the full sign-up and the redirect-parameter check. Never print keys. Flag any redirect target taken from an unvalidated parameter, and any flag read from `unsafeMetadata`.
