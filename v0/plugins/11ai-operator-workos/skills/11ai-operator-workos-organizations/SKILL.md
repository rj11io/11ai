---
name: 11ai-operator-workos-organizations
description: "Manage WorkOS organizations and their members, covering creating organizations, verified domains and domain-based joining, memberships and role slugs, invitations, listing and pagination, mapping an organization onto a local tenant record, switching the active organization in a session, and deleting an organization and what that removes. Use when a tenant must be created or renamed, when a domain must be added, when members or roles must change, or when a user belongs to more than one organization."
---
# 11ai WorkOS organizations

Version baseline: Current WorkOS platform APIs and current GA SDKs; for Node.js examples use @workos-inc/node v8 on Node.js 22.11 or newer. Inspect the installed SDK and its migration guide before applying language-specific patterns.

An organization is the tenant boundary: connections, directories, and memberships all hang off it, and a user's permissions are scoped to one at a time. Establish which environment and which organization before any change, and treat a domain claim as something to verify rather than accept.

## Inspect first

```ts
import { WorkOS } from "@workos-inc/node"

const workos = new WorkOS(process.env.WORKOS_API_KEY!)

async function listAllOrganizations() {
  const all = []
  let after: string | undefined
  do {
    const page = await workos.organizations.listOrganizations({ limit: 100, after })
    all.push(...page.data)
    after = page.listMetadata?.after
  } while (after)
  return all
}
```

```ts
const org = await workos.organizations.getOrganization(organizationId)
console.log({
  id: org.id,
  name: org.name,
  domains: org.domains.map((d) => ({ domain: d.domain, state: d.state })),
})

const memberships = await workos.userManagement.listOrganizationMemberships({
  organizationId,
  limit: 100,
})
```

Read the domain `state`. An unverified domain cannot route users by email address, and a verified one is a claim that anyone with an address at that domain belongs here — so it must be a domain the customer genuinely controls.

Paginate every list. The default page is small, and a first-page read of memberships makes a large tenant look nearly empty.

## Create and update

```ts
const org = await workos.organizations.createOrganization({
  name: "Acme Corporation",
  domainData: [{ domain: "acme.com", state: "verified" }],
})
```

```ts
await workos.organizations.updateOrganization({
  organization: organizationId,
  name: "Acme Inc",
})
```

Add only domains the customer controls. Never add a shared consumer email domain — `gmail.com` or similar — as a verified domain, because it would place every user with such an address inside that tenant.

Store the organization id on your own tenant record so the two stay linked:

```sql
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  workos_organization_id text unique not null,
  name text not null,
  created_at timestamptz default now()
);
```

Key on the WorkOS organization id, not the name. Names change; ids do not.

## Memberships and roles

```ts
await workos.userManagement.createOrganizationMembership({
  userId,
  organizationId,
  roleSlug: "member",
})

await workos.userManagement.updateOrganizationMembership({
  organizationMembershipId,
  roleSlug: "admin",
})

await workos.userManagement.deleteOrganizationMembership(organizationMembershipId)
```

Role slugs are defined per environment in the dashboard, so the same slug must exist in staging and production or a promotion breaks. Check the slug exists before assigning it rather than discovering it on a failed call.

Two rules that prevent privilege problems:

- **Authorize the actor, not just the target.** Only an administrator of that organization may change memberships in it. Read the caller's `organizationId` and `role` from the verified session, never from the request body — otherwise any user can grant themselves admin in any tenant.
- **Do not remove the last administrator.** Count remaining administrators before deleting or demoting a membership, or the tenant is left with nobody able to manage it.

Removing a membership takes away access to that organization. It does not delete the user, who may belong to others. Ending their active sessions for that organization is part of the removal; a membership deleted while a session persists has not taken effect yet.

## Invitations and joining by domain

```ts
await workos.userManagement.sendInvitation({
  email: "new@acme.com",
  organizationId,
  roleSlug: "member",
  inviterUserId: actingUserId,
})

await workos.userManagement.listInvitations({ organizationId, limit: 100 })
await workos.userManagement.revokeInvitation(invitationId)
```

Sending an invitation emails a real person, so confirm the address, the organization, and the role before sending, and never send in bulk from a list that has not been reviewed.

Domain-based joining lets anyone with a verified-domain address join automatically. That is convenient and it is also a decision with consequences — a former employee whose address still resolves, or a contractor at the same domain, joins without review. Decide deliberately between automatic joining and invitation-only, and say which is in force.

## Switch the active organization

A user in several organizations has one active at a time, and the session carries it:

```ts
const { user, organizationId, role, permissions } = await withAuth()
```

To switch, send the user through sign-in scoped to the target organization rather than mutating local state:

```ts
const url = await getSignInUrl({ organizationId: targetOrganizationId })
```

Before offering an organization as a switch target, confirm from the server that the user actually has a membership in it. Every query and mutation must then be scoped by the `organizationId` from the session — a request that carries its own organization id is how one tenant reads another's data.

## Delete deliberately

```ts
await workos.organizations.deleteOrganization(organizationId)
```

This removes the organization along with its connections, directories, and memberships. It is irreversible and it signs out that tenant's users.

Before running it: name the organization and its id in the confirmation, report how many members and connections it has, export anything worth keeping, and get explicit approval. Prefer deactivating your own tenant record over deleting the organization when the customer might return.

## Verify and report

```ts
const check = await workos.organizations.getOrganization(organizationId)
const members = await workos.userManagement.listOrganizationMemberships({ organizationId, limit: 100 })
```

After a change, read the organization and its memberships back, confirm at least one administrator remains, and confirm the affected user's session reflects the new role. Then check the negative case: a user without a membership cannot reach that organization's data, and a non-administrator cannot change memberships.

Report the environment, the organization id and name, its domains and their states, the membership count by role, exactly what changed, whether an invitation was sent and to whom, and the verification results including the administrator count and the cross-tenant check. Never print the API key. Flag domain-based joining where it is enabled, and any code path that reads an organization id from the request rather than the session.
