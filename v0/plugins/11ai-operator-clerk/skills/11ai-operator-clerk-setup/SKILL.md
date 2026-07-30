---
name: 11ai-operator-clerk-setup
description: "Set up Clerk in an application from zero, covering the publishable and secret keys and their scope, the provider at the root, middleware with default-deny route protection, sign-in and sign-up routes, redirect configuration, a first protected page, and keeping the development instance separate from production. Use when an application has no Clerk wiring, when middleware or the provider is missing, or when the user asks how to add Clerk."
---
# 11ai clerk setup

Two pieces carry a Clerk setup: the provider at the root, and middleware that both enables server-side `auth()` and protects routes. Without the middleware, `auth()` throws and nothing is protected — that is the single most common broken setup.

## Check what exists

```bash
grep -o 'pk_test\|pk_live\|sk_test\|sk_live' .env.local 2>/dev/null | sort -u
ls -la middleware.ts src/middleware.ts 2>/dev/null
grep -rn 'ClerkProvider' --include='*.tsx' app/ src/ 2>/dev/null | head
```

Use `11ai-operator-clerk-environment` for the full inspection. If a provider and middleware already exist, this is not a fresh setup — change only what is missing.

Decide which instance this is. Development and production are separate instances with separate users and separate keys, so a `pk_test` with an `sk_live` is a misconfiguration, not a shortcut.

## Install and add keys

```bash
npm install @clerk/nextjs
```

Two keys, with different handling:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is designed to be in the browser and is safe to expose.
- `CLERK_SECRET_KEY` grants full API access to the instance. Server only, never behind a client-exposed prefix, never in a committed file.

Never take a secret key through the terminal — it lands in shell history and in this transcript. Have the user copy it from the dashboard into an ignored environment file themselves.

```bash
grep -q '^\.env' .gitignore || echo "env files are NOT ignored"
```

Read [references/setup.md](references/setup.md) for the environment file shapes, the provider and middleware code, the sign-in and sign-up routes, redirect configuration, and the framework variants.

## Add the provider and middleware

The provider wraps the root layout so every page can read the session. The middleware does two jobs at once, and both matter: it makes `auth()` available in server code, and it decides which routes require a session.

Write the middleware as default-deny — protect everything except an explicit public list:

```ts
const isPublic = createRouteMatcher(["/", "/pricing", "/sign-in(.*)", "/sign-up(.*)"])
```

That shape means a page added next month is protected without anyone remembering to protect it. Listing protected routes instead leaves every new route public.

Include the sign-in and sign-up routes in the public list. Protecting the sign-in page redirects it to itself, which is the redirect loop people hit first.

Make the matcher cover the routes users actually visit, including API routes. A matcher that excludes a section leaves it unprotected no matter what the code inside does.

## Add sign-in, sign-up, and a protected page

Use the prebuilt components on dedicated catch-all routes, and set the sign-in and sign-up URLs in the environment so redirects go to your pages rather than Clerk's hosted ones.

For the protected page, read the session on the **server**:

```ts
const { userId } = await auth()
if (!userId) redirect("/sign-in")
```

`SignedIn`, `SignedOut`, and `Protect` control what renders. They are not access control — anything they hide is still reachable by requesting the route directly, and any data fetched above them is still fetched. Every route that returns private data must check on the server.

## Verify

Walk the loop, including the parts that fail quietly:

1. Visit a protected page signed out — redirect to sign-in, not a rendered page with empty data.
2. Sign up, then sign in, and confirm each lands where configured.
3. Reload and navigate — the session survives both.
4. Request a protected API route with no cookie and confirm it returns 401 rather than data.
5. Sign out and confirm the protected page redirects again.
6. Confirm `auth()` works in a server component and does not throw, which proves the middleware matcher covers that route.

Step 4 is the one usually skipped, and it is what distinguishes real protection from hidden interface.

## Guardrails

- Never print the secret key, the webhook signing secret, or the contents of an environment file. Confirm a variable by name.
- Never expose `CLERK_SECRET_KEY` to the browser, including behind `NEXT_PUBLIC_`. A secret key in a client bundle grants full API access to the instance and must be rotated.
- Do not mix a test publishable key with a live secret key, or the reverse.
- Do not rely on `SignedIn` or `Protect` for access control. Check on the server.
- Do not skip the middleware, and do not narrow its matcher to make an error go away — that removes protection rather than fixing it.
- Do not create, modify, or delete users or organizations as part of setup. Those are separate operations with their own approval.
- Do not read a role or plan from `unsafeMetadata`; the user can write it.
- Report which instance was configured, the variable names written and to which files, whether those files are ignored, the middleware matcher and whether protection is default-deny, the routes added, and the verification results including the API-route and signed-out checks.
