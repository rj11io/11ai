---
name: 11ai-operator-clerk-core-3-users
description: "Read and change Clerk user records from the server, covering user lookup and pagination, creating and updating users, the three metadata fields and which are user-writable, email and phone identifiers and verification, banning and locking versus deleting, session revocation as part of removing access, and mirroring users into a local table. Use when a user record must be inspected or corrected, when metadata must be set, when a user must be removed or suspended, or when local records must match Clerk."
---
# 11ai clerk users

Version baseline: Clerk Core 3 and Clerk API 2026-05-12; each Clerk SDK has its own compatible semver (for example @clerk/nextjs v7.5.2 or newer). Inspect the installed SDK and the API-version compatibility table before editing.

Every call here needs the secret key and must run server-side. The metadata distinction is the part to get right first: one of the three fields is writable by the user, so anything read for authorization must not live there.

## Inspect first

```ts
import "server-only"
import { clerkClient } from "@clerk/nextjs/server"

const client = await clerkClient()

const user = await client.users.getUser(userId)
console.log({
  id: user.id,
  email: user.emailAddresses.map((e) => ({ address: e.emailAddress, verified: e.verification?.status })),
  banned: user.banned,
  locked: user.locked,
  lastSignInAt: user.lastSignInAt,
  publicMetadata: user.publicMetadata,
})
```

```ts
async function listAllUsers() {
  const all = []
  let offset = 0
  for (;;) {
    const page = await client.users.getUserList({ limit: 100, offset })
    all.push(...page.data)
    if (all.length >= page.totalCount) break
    offset += 100
  }
  return all
}
```

Paginate. `getUserList` returns a small page by default, so code reading only the first one makes a large instance look nearly empty.

Read the verification status on each identifier. An unverified email address means the person has not proven they control it, so it should not be treated as an identity for anything that matters.

## Metadata: which field for what

| Field | Readable by | Writable by |
| --- | --- | --- |
| `publicMetadata` | anyone, including the browser | backend only |
| `privateMetadata` | backend only | backend only |
| `unsafeMetadata` | anyone | **the user, from the browser** |

```ts
await client.users.updateUserMetadata(userId, {
  publicMetadata: { plan: "pro", onboarded: true },
})

await client.users.updateUserMetadata(userId, {
  privateMetadata: { stripeCustomerId: "cus_..." },
})
```

Never read a role, plan, entitlement, or feature flag from `unsafeMetadata`. A user can set it to anything from the browser, so authorization based on it is self-granted. Use `publicMetadata` when the browser needs to read it and `privateMetadata` when it does not.

`updateUserMetadata` merges at the top level only. A nested object is replaced wholesale, so read the current value and spread it if you mean to merge:

```ts
const current = await client.users.getUser(userId)
await client.users.updateUserMetadata(userId, {
  publicMetadata: { ...current.publicMetadata, onboarded: true },
})
```

Two concurrent updates can still overwrite each other. Where that matters, keep the authoritative value in your own database and mirror it here for the session claim.

Metadata reaching a session claim only appears in tokens minted afterwards. Existing sessions keep the old value until they refresh, so code reading a new claim must tolerate its absence — and a downgrade needs the session revoked to take effect immediately.

## Create and update

```ts
await client.users.createUser({
  emailAddress: ["ada@example.com"],
  password: undefined,
  firstName: "Ada",
  skipPasswordRequirement: true,
})

await client.users.updateUser(userId, { firstName: "Ada", lastName: "Lovelace" })
```

Prefer an invitation over creating a user directly, so the person verifies their own address and sets their own credential:

```ts
await client.invitations.createInvitation({
  emailAddress: "ada@example.com",
  redirectUrl: "https://app.example.com/sign-up",
})
```

Creating a user with a password you chose means handling a credential you should never see. If a password must be set, have the user do it.

Sending an invitation emails a real person. Confirm the address and the intent before sending, and never send in bulk from an unreviewed list.

## Suspend or remove

Three different actions with different consequences:

```ts
await client.users.banUser(userId)
await client.users.unbanUser(userId)
await client.users.lockUser(userId)
await client.users.deleteUser(userId)
```

- **Ban** blocks sign-in and keeps the record. Reversible. This is usually what "remove access" should mean.
- **Lock** is a temporary block, typically after failed attempts. Reversible.
- **Delete** removes the user permanently. Irreversible, and it does not clean up rows in your own database.

Deletion needs explicit approval naming the user id, and a check of what references them locally first. Prefer banning where the person might return or where records must stay attributable.

Removing access is two steps, and the second is usually forgotten:

```ts
await client.users.banUser(userId)

const sessions = await client.sessions.getSessionList({ userId, status: "active" })
for (const session of sessions.data) {
  await client.sessions.revokeSession(session.id)
}
```

A banned user holding a valid session still has access until it expires. Revoke the sessions as part of the removal, and do the same after a role downgrade if the role is carried in a session claim.

## Mirror into a local table

```sql
create table public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text not null,
  state text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Key on `clerk_user_id`, never on email — email changes, and matching on a mutable value turns a rename into a duplicate account or a collision with someone else's row.

Keep it current with webhooks for speed and a scheduled reconciliation for correctness; events get missed, and a mirror without reconciliation drifts silently. See `11ai-operator-clerk-core-3-webhooks`.

Upsert rather than insert, since the same user arrives from a webhook, from a sign-in, and from a reconciliation pass, and all three must converge on one row.

## Verify and report

```ts
const after = await client.users.getUser(userId)
const sessions = await client.sessions.getSessionList({ userId, status: "active" })
```

After a change, read the user back and confirm the field you set, and confirm the active session count is what you expect. After a removal, confirm sign-in is actually blocked and no active session remains — not just that a flag is set.

Report the user id, which fields changed and in which metadata field, the total user count from a full paginated read where relevant, whether sessions were revoked, what was banned or deleted and whether it is reversible, and the verification evidence. Never print the secret key, a password, or personal data beyond what the task needs — report addresses redacted where possible. Flag any authorization value stored in `unsafeMetadata`, and any deletion that left local rows referencing a missing user.
