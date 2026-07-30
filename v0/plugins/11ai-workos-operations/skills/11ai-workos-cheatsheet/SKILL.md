---
name: 11ai-workos-cheatsheet
description: "Answer quick WorkOS questions with a compact reference for AuthKit sign-in and callback calls, session helpers, single sign-on and directory sync APIs, organization and membership calls, user management, webhook verification, environment values and their scope, and the staging versus production distinction. Use when someone asks which WorkOS call or environment value to use, or wants a fast lookup rather than a guided workflow."
---
# 11ai WorkOS cheatsheet

A lookup surface for WorkOS. Give the call, name what it changes and which environment it touches, and stop. For wiring a flow, configuring a connection, or diagnosing a failure, hand off to the matching operation skill.

## Environment values

| Value | Scope |
| --- | --- |
| `WORKOS_API_KEY` | Server only. Full API access for the environment |
| `WORKOS_CLIENT_ID` | Safe in a browser redirect URL |
| `WORKOS_COOKIE_PASSWORD` | Server only. At least 32 characters, encrypts the session cookie |
| `WORKOS_REDIRECT_URI` | Must exactly match a URI registered in the dashboard |
| Webhook signing secret | Server only. Verifies incoming events |

Staging and production are separate environments with separate keys, connections, and organizations. An object created in one does not exist in the other.

## AuthKit sign-in

```ts
import { getSignInUrl, getSignUpUrl, signOut, withAuth } from "@workos-inc/authkit-nextjs"

const url = await getSignInUrl()
const url = await getSignInUrl({ organizationId: "org_..." })
const url = await getSignUpUrl()

const { user, organizationId, role, permissions } = await withAuth()
const { user } = await withAuth({ ensureSignedIn: true })

await signOut()
```

```ts
// app/callback/route.ts
import { handleAuth } from "@workos-inc/authkit-nextjs"

export const GET = handleAuth()
```

```ts
// middleware.ts
import { authkitMiddleware } from "@workos-inc/authkit-nextjs"

export default authkitMiddleware()
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
```

Without the middleware the session is never refreshed and the user is signed out when the access token expires.

## Direct API, server side

```ts
import { WorkOS } from "@workos-inc/node"

const workos = new WorkOS(process.env.WORKOS_API_KEY!, {
  clientId: process.env.WORKOS_CLIENT_ID,
})
```

```ts
await workos.userManagement.getAuthorizationUrl({ clientId, redirectUri, provider: "authkit" })
await workos.userManagement.authenticateWithCode({ clientId, code })
await workos.userManagement.getUser(userId)
await workos.userManagement.listUsers({ email, limit: 10 })
await workos.userManagement.updateUser({ userId, firstName })
await workos.userManagement.createOrganizationMembership({ userId, organizationId, roleSlug })
await workos.userManagement.listOrganizationMemberships({ userId })
```

## Organizations

```ts
await workos.organizations.listOrganizations({ limit: 10 })
await workos.organizations.getOrganization(organizationId)
await workos.organizations.createOrganization({
  name: "Acme",
  domainData: [{ domain: "acme.com", state: "verified" }],
})
await workos.organizations.updateOrganization({ organization: organizationId, name })
await workos.organizations.deleteOrganization(organizationId)
```

`deleteOrganization` removes its connections and memberships. It is irreversible.

## Single sign-on and directory sync

```ts
await workos.sso.listConnections({ organizationId })
await workos.sso.getConnection(connectionId)

await workos.directorySync.listDirectories({ organizationId })
await workos.directorySync.listUsers({ directory: directoryId, limit: 100 })
await workos.directorySync.listGroups({ directory: directoryId })
await workos.directorySync.getUser(directoryUserId)
```

Connections and directories are created by an administrator through the Admin Portal or the dashboard, not by an API call from your application.

```ts
const link = await workos.portal.generateLink({
  organization: organizationId,
  intent: "sso",
})
```

Portal links are short-lived and single-purpose. Intents include `sso`, `dsync`, `audit_logs`, and `domain_verification`.

## Webhooks

```ts
const event = await workos.webhooks.constructEvent({
  payload: rawBodyAsObject,
  sigHeader: request.headers.get("workos-signature")!,
  secret: process.env.WORKOS_WEBHOOK_SECRET!,
})
```

Verify against the **raw** body before parsing. A JSON body parser running first destroys the bytes the signature covers.

Common event types: `user.created`, `user.updated`, `user.deleted`, `dsync.user.created`, `dsync.user.updated`, `dsync.user.deleted`, `dsync.group.user_added`, `dsync.group.user_removed`, `connection.activated`.

## Pagination

```ts
let after: string | undefined
do {
  const page = await workos.directorySync.listUsers({ directory, limit: 100, after })
  after = page.listMetadata?.after
} while (after)
```

Lists are cursor-paginated and default to a small page. Code that reads only the first page silently ignores most of a large directory.

## Answer format

Lead with the call. Add one line on what it changes, whether it is server-only, and which environment it acts on. Name the operation skill when the task goes beyond a lookup: sign-in flows to `11ai-workos-authkit`, connections to `11ai-workos-sso`, directories to `11ai-workos-directory-sync`, events to `11ai-workos-webhooks`, and failures to `11ai-workos-troubleshooting`.
