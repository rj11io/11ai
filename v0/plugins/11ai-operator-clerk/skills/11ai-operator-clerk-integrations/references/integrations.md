# Clerk integrations reference

## Framework SDKs

### Next.js

See `11ai-operator-clerk-setup` for the provider and middleware. The server helpers are `auth()`, `currentUser()`, and `clerkClient()`.

### Vite or a single-page application

```bash
npm install @clerk/clerk-react
```

```tsx
import { ClerkProvider, useAuth } from "@clerk/clerk-react"

const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!key) throw new Error("VITE_CLERK_PUBLISHABLE_KEY is not set")

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={key}>
    <App />
  </ClerkProvider>
)
```

```tsx
function useApi() {
  const { getToken } = useAuth()

  return async function call(path: string, init: RequestInit = {}) {
    const token = await getToken()
    return fetch(`${import.meta.env.VITE_API_URL}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    })
  }
}
```

There is no safe place for a secret key in a client build. Every privileged call goes to a server that verifies the token.

### Express

```bash
npm install @clerk/express
```

```ts
import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express"

app.use(clerkMiddleware())

app.get("/api/projects", requireAuth(), async (req, res) => {
  const { userId, orgId } = getAuth(req)
  res.json(await listProjects({ userId: userId!, orgId }))
})
```

Mount `clerkMiddleware()` before the routes, and use `requireAuth()` per route. The presence of the middleware does not by itself protect anything.

For the webhook route, mount the raw body parser ahead of any JSON parser:

```ts
app.post("/api/webhooks/clerk", express.raw({ type: "application/json" }), handler)
```

## Local mirror

```sql
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  clerk_organization_id text unique not null,
  name text not null,
  stripe_customer_id text unique,
  plan text not null default 'free',
  state text not null default 'active',
  created_at timestamptz default now()
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text not null,
  state text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.memberships (
  user_id uuid not null references public.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  role text not null,
  primary key (user_id, tenant_id)
);

create index memberships_tenant_idx on public.memberships (tenant_id);
```

The unique keys are the Clerk ids. Keying on email breaks the first time someone changes theirs, turning a rename into a duplicate row or a collision.

```ts
export async function upsertUserFromClerk(u: {
  id: string
  email_addresses?: { email_address: string }[]
}) {
  const email = u.email_addresses?.[0]?.email_address
  if (!email) return

  await db.query(
    `insert into public.users (clerk_user_id, email)
     values ($1, $2)
     on conflict (clerk_user_id) do update
       set email = excluded.email, updated_at = now()`,
    [u.id, email]
  )
}
```

Upsert, never plain insert. The same user arrives from a webhook, from a sign-in, and from a reconciliation pass, and all three must converge on one row — including the case where `user.updated` arrives before `user.created`.

```ts
export async function deactivateUser(clerkUserId: string) {
  await db.query(
    `update public.users set state = 'inactive', updated_at = now() where clerk_user_id = $1`,
    [clerkUserId]
  )

  const client = await clerkClient()
  const sessions = await client.sessions.getSessionList({ userId: clerkUserId, status: "active" })
  for (const session of sessions.data) {
    await client.sessions.revokeSession(session.id)
  }
}
```

The revocation loop is what actually removes access. A row marked inactive while a session cookie remains valid has deprovisioned nobody.

## Tenant scoping

```ts
import { auth } from "@clerk/nextjs/server"

export async function listProjects() {
  const { userId, orgId } = await auth()
  if (!userId) throw new Error("unauthorized")
  if (!orgId) throw new Error("no active organization")

  const tenant = await tenantByClerkOrganizationId(orgId)

  return db.query(
    `select id, name from public.projects where tenant_id = $1 order by created_at desc`,
    [tenant.id]
  )
}
```

```ts
// wrong: the caller chooses the tenant
export async function listProjectsUnsafe(organizationId: string) {
  return db.query(`select * from public.projects where tenant_id = $1`, [organizationId])
}
```

The second is a cross-tenant read; any signed-in user can pass another organization's id. Where a function genuinely must accept one — an organization switcher, say — verify the membership first:

```ts
const client = await clerkClient()
const memberships = await client.users.getOrganizationMembershipList({ userId, limit: 100 })
const allowed = memberships.data.some((m) => m.organization.id === requested)
if (!allowed) throw new Error("forbidden")
```

For mutations, check the permission too. Being a member is not being an administrator:

```ts
const { has } = await auth()
if (!has({ permission: "org:projects:write" })) {
  return Response.json({ error: "forbidden" }, { status: 403 })
}
```

Handle an undefined `orgId` explicitly. A signed-in user with no active organization is a normal state, and treating it as "no filter" returns everything to everyone.

## API boundary

```bash
npm install @clerk/backend
```

```ts
import { verifyToken } from "@clerk/backend"

export async function requireUser(request: Request) {
  const header = request.headers.get("Authorization")
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) throw new HttpError(401, "unauthorized")

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      authorizedParties: ["https://app.example.com"],
    })

    return {
      userId: payload.sub,
      orgId: payload.org_id as string | undefined,
      orgRole: payload.org_role as string | undefined,
    }
  } catch {
    throw new HttpError(401, "unauthorized")
  }
}
```

`authorizedParties` is the setting people skip. Without it, a token minted for a different origin can be replayed against your API. The signature and expiry checks come from `verifyToken` itself; decoding the payload without it accepts any token a caller writes.

Read `org_id` from the verified payload, never from a header the caller also controls, then scope the query by it as above.

## Third-party token templates

For a backend that validates Clerk tokens itself — a database platform, say — create a token template in the dashboard and request that token:

```tsx
const { getToken } = useAuth()
const token = await getToken({ template: "my-backend" })
```

The template's claims are what the receiving system's policies read, so the claim names must match what that system expects. A mismatch makes every policy silently deny, which reads as an authentication failure.

Templates are per instance. A template that exists in development and not in production is a promotion failure that appears only after deploy.

Keep the token small. The session token has a size limit, and a template stuffed with permissions or a profile object causes intermittent authentication failures rather than a clear error.

## Billing tied to an organization

```ts
const client = await clerkClient()

const org = await client.organizations.createOrganization({ name, createdBy: userId })

const customer = await stripe.customers.create({
  name,
  metadata: { clerk_organization_id: org.id },
})

await createTenant({
  clerkOrganizationId: org.id,
  name,
  stripeCustomerId: customer.id,
})
```

Attach the subscription to the organization, not to the person who signed up — otherwise the plan follows them out of the company and the tenant loses it when their membership ends.

Store the link in both directions: the customer id on your tenant row, and the organization id in the customer's metadata. That is what makes reconciliation possible later.

When a webhook reports a plan change, write it to your tenant row and, if the plan is read from a session claim, revoke affected sessions so the change takes effect immediately rather than at the next refresh.

## Pipeline

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
        env:
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_TEST_PUBLISHABLE_KEY }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_TEST_SECRET_KEY }}
      - run: npm run build
        env:
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_TEST_PUBLISHABLE_KEY }}
```

Use development instance keys in a pipeline, never production ones. Stub Clerk in unit tests rather than calling a live instance — a suite that authenticates for real is slow and flaky. Keep a small number of genuine integration checks in a separate job that runs against the development instance on a schedule.

The build step needs the publishable key because it is compiled into the bundle. A build without it produces an application that cannot authenticate at all, which is easy to miss until deploy.

Before promoting, confirm each of these exists in the production instance: custom roles and their permissions, token templates, session token claims, social connection credentials, redirect URLs, and webhook endpoints with their own secrets. Every one is configured per instance.
