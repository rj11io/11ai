# WorkOS integrations reference

## Framework wiring

### Next.js App Router

```bash
npm install @workos-inc/authkit-nextjs
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

```ts
// app/callback/route.ts
import { handleAuth } from "@workos-inc/authkit-nextjs"

export const GET = handleAuth({ returnPathname: "/dashboard" })
```

Default-deny is the shape to prefer. A new page added next month is protected without anyone remembering to protect it.

### Remix, Express, and others

```bash
npm install @workos-inc/authkit-remix
npm install @workos-inc/node
```

For a framework without an AuthKit package, the hand-rolled flow is: redirect to the authorization URL with a `state` value stored in a cookie, verify `state` on return, exchange the code, then store the tokens in an encrypted `httpOnly` `secure` `sameSite=lax` cookie and refresh before expiry.

```ts
const { user, accessToken, refreshToken, organizationId } =
  await workos.userManagement.authenticateWithCode({
    clientId: process.env.WORKOS_CLIENT_ID!,
    code,
  })
```

The `state` check is the cross-site request forgery protection for the flow; skipping it is a real vulnerability, not a shortcut. Never put tokens in `localStorage`.

## Local mirror

```sql
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  workos_organization_id text unique not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  workos_user_id text unique not null,
  email text not null,
  first_name text,
  last_name text,
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

The unique keys are the WorkOS ids. Keying on email breaks the moment someone's address changes in a directory, turning a rename into a duplicate account or a collision.

```ts
export async function upsertUserFromWorkOS(workosUser: {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}) {
  await db.query(
    `insert into public.users (workos_user_id, email, first_name, last_name)
     values ($1, $2, $3, $4)
     on conflict (workos_user_id) do update
       set email = excluded.email,
           first_name = excluded.first_name,
           last_name = excluded.last_name,
           updated_at = now()`,
    [workosUser.id, workosUser.email, workosUser.firstName, workosUser.lastName]
  )
}
```

Upsert rather than insert. The same user arrives from a webhook, from a sign-in, and from a reconciliation pass, and all three must converge on one row.

Deactivate rather than delete:

```ts
export async function deactivateUser(workosUserId: string) {
  await db.query(
    `update public.users set state = 'inactive', updated_at = now() where workos_user_id = $1`,
    [workosUserId]
  )
  await endSessionsForUser(workosUserId)
}
```

The `endSessionsForUser` call is the part that actually removes access. A row marked inactive while a valid session cookie persists has not deprovisioned anyone.

## Tenant scoping

Take the organization from the verified session, never from the request:

```ts
import { withAuth } from "@workos-inc/authkit-nextjs"

export async function listProjects() {
  const { user, organizationId } = await withAuth({ ensureSignedIn: true })
  if (!organizationId) throw new Error("no active organization")

  const tenant = await tenantByWorkosOrganizationId(organizationId)

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

The second version is a cross-tenant read. Any signed-in user can pass another organization's id. If a function must accept an organization id — a switcher, for example — verify the membership first:

```ts
const { user } = await withAuth({ ensureSignedIn: true })
const memberships = await workos.userManagement.listOrganizationMemberships({
  userId: user.id,
  limit: 100,
})
const allowed = memberships.data.some((m) => m.organizationId === requested)
if (!allowed) throw new Error("forbidden")
```

For a route that mutates, check the role too. Being a member is not being an administrator:

```ts
const { role, permissions } = await withAuth({ ensureSignedIn: true })
if (!permissions?.includes("projects:write")) {
  return Response.json({ error: "forbidden" }, { status: 403 })
}
```

## API boundary

A separate service receiving a WorkOS-issued token must verify it, not decode it:

```bash
npm install jose
```

```ts
import { createRemoteJWKSet, jwtVerify } from "jose"

const jwks = createRemoteJWKSet(
  new URL(`https://api.workos.com/sso/jwks/${process.env.WORKOS_CLIENT_ID}`),
  { cooldownDuration: 30_000, cacheMaxAge: 600_000 }
)

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: "https://api.workos.com",
  })

  return {
    userId: payload.sub as string,
    organizationId: payload.org_id as string | undefined,
    role: payload.role as string | undefined,
    permissions: (payload.permissions as string[] | undefined) ?? [],
  }
}
```

Four checks are mandatory: signature, issuer, expiry, and — where the token carries one — audience. Decoding the payload to read `sub` without verifying the signature accepts any token a caller invents.

The key set is cached and refetched when an unknown key id appears, which handles rotation without a network call per request.

Read `org_id` from the verified token, not from a header the caller also controls. Then scope every query by it, exactly as above.

## Machine-to-machine

For a background job with no user, use the API key server-side and scope the work explicitly:

```ts
import { WorkOS } from "@workos-inc/node"

const workos = new WorkOS(process.env.WORKOS_API_KEY!)

for (const tenant of await activeTenants()) {
  await processTenant(tenant.id)
}
```

There is no session here, so there is no automatic tenant scoping. Every query in a job must name its tenant, and a job that iterates tenants should fail closed if a tenant lookup returns nothing rather than falling through to an unscoped query.

Keep the API key in the job's own secret store. Never reuse a browser-facing deployment's environment for a job that needs elevated access.

## Billing tied to an organization

```sql
alter table public.tenants
  add column stripe_customer_id text unique,
  add column plan text not null default 'free';
```

Attach the subscription to the tenant, not to the user who signed up. Otherwise the subscription follows a person who may leave, and the organization loses its plan when their membership is removed.

When a user creates an organization, create the tenant and the billing customer in the same operation, and store both ids:

```ts
const org = await workos.organizations.createOrganization({ name })
const customer = await stripe.customers.create({
  name,
  metadata: { workos_organization_id: org.id },
})
await createTenant({ workosOrganizationId: org.id, name, stripeCustomerId: customer.id })
```

The `metadata` link in both directions is what makes reconciliation possible later. See `11ai-stripe-customers`.

## Staging to production promotion

Environments share no objects. Before promoting, confirm each of these exists in the target environment:

| Object | Where it is configured |
| --- | --- |
| API key and client id | dashboard, per environment |
| Redirect URI | dashboard, exact match |
| Sign-out redirect | dashboard, exact match |
| Role slugs | dashboard, same slugs as staging |
| Webhook endpoint and secret | dashboard, per endpoint |
| Organizations and connections | created per environment by the customer |

```ts
// scripts/check-environment.ts
const workos = new WorkOS(process.env.WORKOS_API_KEY!)
const orgs = await workos.organizations.listOrganizations({ limit: 5 })
console.log(orgs.data.map((o) => o.name))
```

Run this against the target environment and read the names. If they are the staging ones, the key is wrong.

A role slug missing in production is the classic promotion failure: membership creation fails on a slug that only ever existed in staging. Compare the lists before deploying, not after.

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
      - run: npm test
        env:
          WORKOS_API_KEY: ${{ secrets.WORKOS_STAGING_API_KEY }}
          WORKOS_CLIENT_ID: ${{ secrets.WORKOS_STAGING_CLIENT_ID }}
          WORKOS_COOKIE_PASSWORD: ${{ secrets.WORKOS_TEST_COOKIE_PASSWORD }}
          WORKOS_REDIRECT_URI: http://localhost:3000/callback
```

Use a staging key in a pipeline, never a production one. Better still, stub the WorkOS calls in tests and keep a small number of real integration checks in a separate job that runs against staging on a schedule rather than on every commit — a test suite hitting a live identity provider is slow and flaky.
