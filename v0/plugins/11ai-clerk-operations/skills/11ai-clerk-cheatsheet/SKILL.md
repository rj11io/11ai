---
name: 11ai-clerk-cheatsheet
description: "Answer quick Clerk questions with a compact reference for environment keys and their scope, prebuilt components, client and server hooks and helpers, middleware and route protection, the backend API for users and organizations, session claims and metadata, webhook verification, and the test versus live instance distinction. Use when someone asks which Clerk component, helper, or backend call to use, or wants a fast lookup rather than a guided workflow."
---
# 11ai Clerk cheatsheet

A lookup surface for Clerk. Give the call, name what it changes and whether it is server-only, and stop. For wiring flows, changing users, or diagnosing a failure, hand off to the matching operation skill.

## Keys and their scope

| Value | Scope |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser. Safe to expose |
| `CLERK_SECRET_KEY` | Server only. Full API access to the instance |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Server only. Verifies incoming events |

`pk_test` and `sk_test` are a development instance; `pk_live` and `sk_live` are production. They are separate instances with separate users, organizations, and webhook endpoints — an object in one does not exist in the other.

## Components

```tsx
import {
  ClerkProvider, SignedIn, SignedOut, SignIn, SignUp,
  UserButton, UserProfile, OrganizationSwitcher, OrganizationProfile, Protect,
} from "@clerk/nextjs"

<ClerkProvider>{children}</ClerkProvider>

<SignedIn><UserButton /></SignedIn>
<SignedOut><SignInButton /></SignedOut>

<Protect permission="org:billing:manage" fallback={<NoAccess />}>
  <BillingPanel />
</Protect>
```

`SignedIn`, `SignedOut`, and `Protect` control what renders. They are not access control — anything they hide is still reachable by calling the route directly.

## Middleware and route protection

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublic = createRouteMatcher(["/", "/pricing", "/sign-in(.*)", "/sign-up(.*)"])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublic(request)) await auth.protect()
})

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
}
```

Protecting everything except a listed set is safer than listing protected routes, because a new page is protected by default.

## Server helpers

```ts
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server"

const { userId, orgId, orgRole, sessionClaims, has } = await auth()
const { userId } = await auth.protect()
const user = await currentUser()

if (!has({ permission: "org:invoices:read" })) return forbidden()
```

`auth()` reads the verified session. `currentUser()` makes an API call, so prefer `auth()` when the id is enough.

## Client hooks

```tsx
"use client"
import { useAuth, useUser, useSession, useOrganization, useOrganizationList, useClerk } from "@clerk/nextjs"

const { isLoaded, isSignedIn, userId, orgId, getToken } = useAuth()
const { user } = useUser()
const { organization, membership } = useOrganization()
const { signOut, openSignIn } = useClerk()

const token = await getToken()
```

Check `isLoaded` before reading anything, or the first render sees a signed-out state for a signed-in user.

## Backend API

```ts
const client = await clerkClient()

await client.users.getUser(userId)
await client.users.getUserList({ emailAddress: ["a@example.com"], limit: 10 })
await client.users.updateUser(userId, { firstName: "Ada" })
await client.users.updateUserMetadata(userId, { publicMetadata: { plan: "pro" } })
await client.users.deleteUser(userId)
await client.users.banUser(userId)

await client.organizations.createOrganization({ name: "Acme", createdBy: userId })
await client.organizations.getOrganizationList({ limit: 10 })
await client.organizations.createOrganizationMembership({ organizationId, userId, role: "org:admin" })
await client.organizations.updateOrganizationMembership({ organizationId, userId, role: "org:member" })
await client.organizations.deleteOrganizationMembership({ organizationId, userId })
await client.organizations.deleteOrganization(organizationId)

await client.invitations.createInvitation({ emailAddress: "a@example.com" })
await client.sessions.revokeSession(sessionId)
```

Every one of these needs the secret key and must run server-side only.

## Metadata

| Field | Readable by | Writable by |
| --- | --- | --- |
| `publicMetadata` | anyone, including the browser | backend only |
| `privateMetadata` | backend only | backend only |
| `unsafeMetadata` | anyone | **the user** |

Never read a role, plan, or entitlement from `unsafeMetadata`. The user can set it to anything.

## Webhooks

```ts
import { verifyWebhook } from "@clerk/nextjs/webhooks"

const event = await verifyWebhook(request)
```

Verify against the raw body before parsing. Common types: `user.created`, `user.updated`, `user.deleted`, `session.created`, `organization.created`, `organizationMembership.created`, `organizationMembership.deleted`.

## Answer format

Lead with the call. Add one line on what it changes, whether it is server-only, and which instance it acts on. Name the operation skill when the task goes beyond a lookup: sign-in flows to `11ai-clerk-authentication`, route protection to `11ai-clerk-sessions`, user records to `11ai-clerk-users`, organizations to `11ai-clerk-organizations`, events to `11ai-clerk-webhooks`, and failures to `11ai-clerk-troubleshooting`.
