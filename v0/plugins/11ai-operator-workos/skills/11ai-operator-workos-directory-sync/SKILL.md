---
name: 11ai-operator-workos-directory-sync
description: "Set up and reconcile directory sync, covering the Admin Portal handoff for SCIM and directory providers, directory states, cursor-paginated listing of users and groups, mapping directory users and groups onto local records and roles, handling activate and deactivate events rather than deletions, group membership changes, and a full reconciliation pass when events were missed. Use when an enterprise customer must provision users automatically, when a directory shows fewer users than expected, or when deprovisioning has not taken effect in the application."
---
# 11ai WorkOS directory sync

Directory sync makes the customer's identity provider the source of truth for who exists and who belongs to what. That means two obligations: process events as they arrive, and be able to reconcile from scratch when events were missed. A system that only handles the event stream drifts, and the drift stays invisible until someone who was deprovisioned still has access.

## Inspect first

```ts
import { WorkOS } from "@workos-inc/node"

const workos = new WorkOS(process.env.WORKOS_API_KEY!)

const directories = await workos.directorySync.listDirectories({ limit: 20 })
console.log(directories.data.map((d) => ({
  id: d.id,
  org: d.organizationId,
  type: d.type,
  state: d.state,
  name: d.name,
})))
```

Read the `state`. A directory that is not `active` is not syncing, and finishing its configuration is a customer action rather than a code change.

```ts
async function listAllDirectoryUsers(directory: string) {
  const users = []
  let after: string | undefined

  do {
    const page = await workos.directorySync.listUsers({ directory, limit: 100, after })
    users.push(...page.data)
    after = page.listMetadata?.after
  } while (after)

  return users
}
```

Always paginate. These lists default to a small page, so code reading only the first one silently ignores most of a large directory — which looks like a sync problem and is really a loop that was never written.

## Hand over the portal link

```ts
const link = await workos.portal.generateLink({
  organization: organizationId,
  intent: "dsync",
  returnUrl: "https://app.example.com/settings/directory",
})
```

The customer's administrator configures their own directory through the portal and receives the SCIM endpoint and bearer token there. Do not collect a customer's SCIM token yourself, and never paste one into this conversation — it grants write access to their provisioning.

Portal links are short-lived. Generate one per request and send it over a channel the customer trusts.

## Map directory records onto local ones

Keep a local table keyed by the directory user's stable id:

```sql
create table public.directory_users (
  directory_user_id text primary key,
  organization_id text not null,
  user_id uuid references public.users (id),
  email text not null,
  state text not null,
  raw_groups text[] default '{}',
  updated_at timestamptz default now()
);
```

Three rules that keep this honest:

- **Key on `directory_user_id`, never on email.** Email addresses change in a directory, and matching on a mutable value turns a rename into a duplicate account or a collision with someone else's.
- **Store the state, do not delete the row.** Directory sync signals `active` and `inactive`; a deactivated user should lose access while their record and history remain.
- **Map groups to roles through configuration you control.** A group name is set by the customer's administrator, so trusting it directly lets them grant themselves any role in your application. Keep an explicit mapping and ignore unmapped groups.

```ts
const roleForGroup: Record<string, string> = {
  "Engineering-Admins": "admin",
  "Engineering": "member",
}
```

## Handle events, then reconcile

The event stream is the fast path. Handle these, and make every handler idempotent because providers redeliver:

- `dsync.user.created` — create or reactivate the local record.
- `dsync.user.updated` — update attributes, and read `state` for activation and deactivation.
- `dsync.user.deleted` — revoke access; keep the record.
- `dsync.group.user_added` and `dsync.group.user_removed` — recompute that user's role from their full group set.
- `dsync.activated` and `dsync.deactivated` — the directory itself came up or went away.

Recompute a role from the whole membership set rather than incrementally. Events do not always arrive in order, and an incremental update applied out of order leaves a user holding a role their groups no longer justify.

Verification, signatures, and idempotency for these events belong to `11ai-operator-workos-webhooks`.

Because events can be missed — an endpoint outage, a deploy, an expired retry — a reconciliation pass is required rather than optional:

```ts
async function reconcile(directory: string, organizationId: string) {
  const remote = await listAllDirectoryUsers(directory)
  const remoteById = new Map(remote.map((u) => [u.id, u]))
  const local = await loadDirectoryUsers(organizationId)

  for (const user of remote) {
    await upsertDirectoryUser(user, organizationId)
  }

  for (const row of local) {
    if (!remoteById.has(row.directory_user_id) && row.state === "active") {
      await deactivateDirectoryUser(row.directory_user_id)
    }
  }
}
```

Run it on a schedule and after any incident affecting the webhook endpoint. The second loop is the important half: it catches users who disappeared from the directory while the endpoint was down, which is exactly the deprovisioning failure that matters.

Deactivation must revoke access, not just flag a row. Ending the user's active sessions is part of deprovisioning — a user marked inactive who keeps a valid session has not been deprovisioned.

## Verify

- Count local active users against the paginated directory total and confirm they match.
- Add a user in the directory, confirm they appear locally with the right role, then remove them and confirm access is genuinely gone, including any live session.
- Move a user between groups and confirm the role recomputes from the full set.
- Replay the same event twice and confirm nothing double-applies.
- Run the reconciliation pass twice and confirm the second run reports no changes.
- Confirm a user in an unmapped group receives no role rather than a default one.

## Report

State the environment, the organization and directory with its type and state, the total user and group counts from a full paginated read, how directory records map to local users, the group-to-role mapping, which events are handled and whether handlers are idempotent, whether a reconciliation pass exists and when it runs, and the verification results including the deprovisioning and duplicate-event checks. Never print SCIM tokens, portal links, or the API key. Flag any role derived directly from a group name without an explicit mapping.
