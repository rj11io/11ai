# WorkOS and Convex Setup

## Local Env Values

Create `.env.local`:

```env
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=

WORKOS_CLIENT_ID=
WORKOS_API_KEY=
WORKOS_COOKIE_PASSWORD=
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
```

`NEXT_PUBLIC_CONVEX_SITE_URL` is optional unless the app uses it.

Generate the WorkOS cookie password:

```bash
openssl rand -base64 32
```

Let Convex populate Convex values:

```bash
npx convex dev
```

## WorkOS Application Redirects

Configure the WorkOS application that owns `WORKOS_CLIENT_ID`.

Open:

1. WorkOS Dashboard.
2. Select the right environment.
3. Open `Applications`.
4. Select the application.
5. Open the `Redirects` tab.

Set local values:

- `Redirect URIs`: `http://localhost:3000/callback`
- `App homepage`: `http://localhost:3000`
- `Sign-in endpoint`: `http://localhost:3000/login`
- `Sign-out redirects`: `http://localhost:3000`

Leave these unset unless the product uses them:

- `Sign-up URL`
- `User invitation URL`
- `Password reset URL`

Set production values when the domain exists:

- `Redirect URIs`: `https://your-domain.com/callback`
- `App homepage`: `https://your-domain.com`
- `Sign-in endpoint`: `https://your-domain.com/login`
- `Sign-out redirects`: `https://your-domain.com`

## Convex Dashboard and Deployment

Run:

```bash
npx convex dev
npx convex dashboard
```

Convex shows the linked cloud deployment, not a local folder. If the dashboard opens the wrong team or project:

```bash
npx convex logout
npx convex dev
```

Then log in with the correct account/team.

## Next.js Demo Shape

Public page:

- Link to `/login`.
- Link to `/dashboard`.

WorkOS routes:

- `/login`: calls `getSignInUrl()`.
- `/callback`: uses `handleAuth({ returnPathname: "/dashboard" })`.
- `/logout`: calls `signOut({ returnTo: "/" })`.

Protected dashboard:

- Calls `withAuth()`.
- If `user` is missing, renders a friendly sign-in message and link to `/login`.
- If `user` exists, renders user email/id and a Convex status component.

Convex status:

- Uses `useQuery(api.demo.getStatus)` after generated API files exist.
- Temporarily uses `makeFunctionReference("demo:getStatus")` only when codegen is not available yet.

## Optional Convex WorkOS Link

If Convex functions need WorkOS server credentials, set them in the Convex deployment:

```bash
npx convex env set WORKOS_CLIENT_ID ...
npx convex env set WORKOS_API_KEY ...
```

If syncing WorkOS events into Convex later, also gather:

```env
WORKOS_WEBHOOK_SECRET=
```

## Production Env Placement

Vercel:

- `NEXT_PUBLIC_CONVEX_URL`
- `WORKOS_CLIENT_ID`
- `WORKOS_API_KEY`
- `WORKOS_COOKIE_PASSWORD`
- `NEXT_PUBLIC_WORKOS_REDIRECT_URI`

GitHub Actions:

- Use `CONVEX_DEPLOY_KEY` only if CI deploys Convex.
- Use WorkOS mock env values only for tests that do not call the WorkOS API.

Convex:

- `WORKOS_CLIENT_ID` and `WORKOS_API_KEY` only if backend functions need them.
- `WORKOS_WEBHOOK_SECRET` only if webhooks are used.

## CI Mock Values

Scope mock values to the E2E test step:

```yaml
- name: E2E tests
  env:
    WORKOS_CLIENT_ID: client_ci_mock
    WORKOS_API_KEY: sk_test_ci_mock
    WORKOS_COOKIE_PASSWORD: ci-only-authkit-cookie-password-32-chars
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: http://localhost:3000/callback
  run: npm run test:e2e
```

Do not reuse these in production or preview environments.

## Verification

Local:

1. Run `npx convex dev`.
2. Run `npm run dev`.
3. Open `http://localhost:3000`.
4. Open `/dashboard` signed out and confirm the sign-in message.
5. Click `Sign in with WorkOS`.
6. Complete hosted WorkOS login.
7. Confirm `/dashboard` shows WorkOS user data and Convex status.

CI:

- Run typecheck.
- Run lint.
- Run build.
- Run unit tests.
- Run E2E tests with mock WorkOS values.

## Official References

- WorkOS AuthKit Next.js: https://workos.com/docs/authkit/nextjs
- Convex Next.js quickstart: https://docs.convex.dev/quickstart/nextjs
- Convex AuthKit guide: https://docs.convex.dev/auth/authkit/
- WorkOS Dashboard: https://dashboard.workos.com
- Convex Dashboard: https://dashboard.convex.dev
