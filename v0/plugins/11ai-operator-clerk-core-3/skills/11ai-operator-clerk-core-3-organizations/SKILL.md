---
name: 11ai-operator-clerk-core-3-organizations
description: "Manage Clerk organizations and their members, covering enabling organizations for an instance, creating organizations and mapping them to a local tenant, memberships with roles and permissions, custom roles, invitations, the active organization on a session and switching it, scoping every query by orgId, and deleting an organization. Use when multi-tenancy must be added, when memberships or roles must change, when orgId is undefined, or when one tenant can see another's data."
---
# 11ai clerk organizations

Version baseline: Clerk Core 3 and Clerk API 2026-05-12; each Clerk SDK has its own compatible semver (for example @clerk/nextjs v7.5.2 or newer). Inspect the installed SDK and the API-version compatibility table before editing.

An organization is the tenant boundary, and the rule that matters is simple: take `orgId` from the verified session and use it in every query. An organization id accepted from a request is a cross-tenant read. Establish whether organizations are even enabled before anything else, because that is a dashboard setting rather than something code can turn on.

## Inspect first

```ts
import "server-only"
import { clerkClient } from "@clerk/nextjs/server"

const client = await clerkClient()

const orgs = await client.organizations.getOrganizationList({ limit: 100 })
console.log(orgs.data.map((o) => ({ id: o.id, name: o.name, slug: o.slug, members: o.membersCount })))

const members = await client.organizations.getOrganizationMembershipList({
  organizationId,
  limit: 100,
})
console.log(members.data.map((m) => ({ userId: m.publicUserData?.userId, role: m.role })))
```

```bash
grep -rn 'orgId\|useOrganization\|OrganizationSwitcher' --include='*.ts' --include='*.tsx' app/ components/ 2>/dev/null | head -20
```

Paginate both lists. A first-page read of memberships makes a large tenant look nearly empty.

Then read how queries determine the tenant. If any of them takes an organization id as a parameter from the client, that is the finding to report first.

## Enable and create

Organizations are enabled per instance in the dashboard. Until they are, `orgId` is always undefined and `OrganizationSwitcher` renders nothing — which reads as a broken component and is a setting.

```ts
const org = await client.organizations.createOrganization({
  name: "Acme Corporation",
  slug: "acme",
  createdBy: userId,
})
```

`createdBy` makes that user the first administrator. Without an administrator the organization cannot be managed by anyone.

Store the organization id on your own tenant record so the two stay linked:

```sql
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  clerk_organization_id text unique not null,
  name text not null,
  created_at timestamptz default now()
);
```

Key on the Clerk organization id, not the name or slug. Both of those change.

Decide deliberately whether users may create organizations themselves. Allowing it means anyone who signs up can create tenants, which affects billing and quotas; the instance setting controls it.

## Memberships, roles, and permissions

```ts
await client.organizations.createOrganizationMembership({
  organizationId,
  userId,
  role: "org:member",
})

await client.organizations.updateOrganizationMembership({
  organizationId,
  userId,
  role: "org:admin",
})

await client.organizations.deleteOrganizationMembership({ organizationId, userId })
```

Clerk ships `org:admin` and `org:member`, and custom roles with their own permissions are defined per instance in the dashboard. A custom role must exist in **both** the development and production instances, or a promotion fails on a role that only ever existed in one.

Two rules that prevent privilege problems:

- **Authorize the actor from the session.** Read `orgId` and check the permission with `has()` before changing any membership. Reading the organization from the request body lets any user grant themselves admin in any tenant.
- **Do not remove the last administrator.** Count remaining admins before deleting or demoting, or the tenant is left unmanageable.

```ts
const { orgId, has } = await auth()
if (!orgId) return forbidden()
if (!has({ permission: "org:sys_memberships:manage" })) return forbidden()
```

Removing a membership takes away access to that organization, not the user's account — they may belong to others. Revoke their sessions as part of it if the role or organization is carried in a session claim, or the old value persists until the session refreshes.

## Invitations

```ts
await client.organizations.createOrganizationInvitation({
  organizationId,
  emailAddress: "new@acme.com",
  role: "org:member",
  inviterUserId: actingUserId,
})

await client.organizations.getOrganizationInvitationList({ organizationId, limit: 100 })
await client.organizations.revokeOrganizationInvitation({
  organizationId,
  invitationId,
  requestingUserId: actingUserId,
})
```

Sending an invitation emails a real person. Confirm the address, the organization, and the role before sending, and never send in bulk from a list nobody reviewed.

## The active organization and scoping

A user in several organizations has one active at a time, carried on the session:

```ts
const { userId, orgId, orgRole, has } = await auth()
```

```tsx
import { OrganizationSwitcher } from "@clerk/nextjs"

<OrganizationSwitcher hidePersonal />
```

The switcher changes the active organization on the session, which is why switching is safe — the server sees the new `orgId` on the next request without trusting anything the client sent.

Scope every query by that value:

```ts
const { orgId } = await auth()
if (!orgId) redirect("/select-organization")

const tenant = await tenantByClerkOrganizationId(orgId)
const projects = await db.query(
  `select id, name from public.projects where tenant_id = $1`,
  [tenant.id]
)
```

```ts
// wrong: the caller chooses the tenant
export async function listProjects(organizationId: string) {
  return db.query(`select * from public.projects where tenant_id = $1`, [organizationId])
}
```

The second version is a cross-tenant read. If a function must accept an organization id, verify the membership first rather than trusting it.

Handle `orgId` being undefined explicitly — a signed-in user with no active organization is a normal state, and treating it as "show everything" is the worst possible default.

## Delete deliberately

```ts
await client.organizations.deleteOrganization(organizationId)
```

This removes the organization, its memberships, and its invitations, and it is irreversible. Before running it: name the organization and id in the confirmation, report the member count, deal with anything referencing it locally, and get explicit approval. Prefer deactivating your own tenant record where the customer might return.

## Verify and report

```ts
const after = await client.organizations.getOrganization({ organizationId })
const members = await client.organizations.getOrganizationMembershipList({ organizationId, limit: 100 })
```

Verify the negative cases, which are the ones that matter:

1. Sign in as a user in two organizations, switch, and confirm each shows only its own data.
2. Craft a request carrying another organization's id and confirm it is refused.
3. Confirm a non-administrator cannot change memberships.
4. Confirm at least one administrator remains after any demotion or removal.
5. Confirm a user with no active organization gets a selection prompt, not another tenant's data.
6. Confirm every custom role exists in both instances.

Report the instance, the organization id and name, the membership count by role, exactly what changed, whether an invitation was sent and to whom, whether sessions were revoked, and the verification results including the cross-tenant and last-administrator checks. Flag every query path that takes a tenant identifier from the request, any custom role missing from one instance, and any code treating an undefined `orgId` as unrestricted access.
