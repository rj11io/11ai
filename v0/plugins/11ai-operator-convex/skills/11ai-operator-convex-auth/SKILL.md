---
name: 11ai-operator-convex-auth
description: "Wire authentication into Convex and enforce access inside functions, covering the auth configuration file and identity provider domain and application id, the authenticated client provider, reading identity with getUserIdentity, mapping the provider subject onto a local user row, per-document authorization checks, server-side rendering with a token, and why client-side gating is not access control. Use when functions must know who is calling, when identity is null despite a signed-in user, or when access must be scoped per document."
---
# 11ai convex auth

Every non-internal Convex function is a public endpoint. A client that knows a function name can call it with any arguments, so hiding a button changes nothing — authorization has to happen inside the handler. Establish how identity reaches the function before writing any check.

## Inspect first

```bash
cat convex/auth.config.ts 2>/dev/null || echo "no auth config"
grep -rn 'getUserIdentity' convex/*.ts | head -20
grep -rn 'ConvexProviderWith\|ConvexProvider' --include='*.tsx' app/ src/ 2>/dev/null | head
grep -c '= query(\|= mutation(' convex/*.ts
npx convex logs --limit 30
```

Two things to establish. Whether `convex/auth.config.ts` exists and names the right provider domain — without it Convex cannot validate a token and `getUserIdentity()` returns null for every call. And how many public functions call `getUserIdentity()` versus how many exist: the gap is the set of unauthenticated endpoints.

## Configure the provider

```ts
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.AUTH_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
}
```

```bash
npx convex env set AUTH_ISSUER_DOMAIN https://your-issuer.example.com
npx convex env set AUTH_ISSUER_DOMAIN https://your-issuer.example.com --prod
```

The `domain` must match the token's issuer exactly, and `applicationID` must match its audience. A mismatch in either makes every token invalid, and the symptom is a null identity rather than an error naming the cause.

Set the variable on both deployments. A value present in development and missing in production is the usual reason authentication works locally and fails after deploy.

The client provider must supply the token, which means using the authenticated provider for your identity library rather than the plain `ConvexProvider`. A plain provider sends no token, so every function sees an anonymous caller even though the user is signed in.

## Read identity and map it to a user

```ts
const identity = await ctx.auth.getUserIdentity()
if (!identity) throw new Error("Not authenticated")
```

`identity.subject` is the provider's stable identifier and is what a local row should key on. Do not key on email — it changes, and matching on a mutable value turns a rename into a duplicate account.

```ts
// convex/lib/auth.ts
import type { QueryCtx, MutationCtx } from "../_generated/server"

export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Not authenticated")
  return identity
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await requireIdentity(ctx)
  const user = await ctx.db
    .query("users")
    .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
    .unique()
  if (!user) throw new Error("No user record")
  return user
}
```

Create the user row from a webhook on the identity provider's side rather than lazily in a query — a query cannot write. If it must be created on demand, do it in a mutation and make it idempotent with the external id as the key.

## Authorize per document

Identity answers who is calling. It does not answer whether they may touch this document, and that second check is the one usually missing:

```ts
import { mutation } from "./_generated/server"
import { v } from "convex/values"
import { requireUser } from "./lib/auth"

export const updateMessage = mutation({
  args: { messageId: v.id("messages"), body: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)

    const message = await ctx.db.get(args.messageId)
    if (!message) throw new Error("Not found")
    if (message.authorId !== user._id) throw new Error("Forbidden")

    await ctx.db.patch(args.messageId, { body: args.body, editedAt: Date.now() })
  },
})
```

Three rules:

- **Load the document and compare its owner** to the caller's user id. A client sends any id it likes.
- **Never accept a user id or organization id as an argument** and trust it. Derive it from `identity.subject`. An argument-supplied identity is an authorization bypass with a validator in front of it.
- **Return the same error for missing and forbidden** where enumeration matters, so a caller cannot discover which ids exist.

For roles, read them from a local row or from a claim the provider controls — never from something the user can set on their own profile.

## Server-side rendering and internal calls

```ts
import { fetchQuery, preloadQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"

const token = await getAuthToken()
const messages = await fetchQuery(api.messages.list, { channelId }, { token })
```

A server-side read must pass the token explicitly, or the function runs unauthenticated and throws. This is the common cause of a page that works in the browser and fails during server rendering.

Internal functions have no identity at all — they are called by the scheduler, a cron, or another function. Pass the acting user id in as an argument and treat the caller as already authorized, because nothing else will check.

## Verify

Test the identities that should fail, not just your own:

1. Call each public function with no token and confirm it is rejected.
2. Call one as a second user against the first user's document and confirm it is refused rather than served.
3. Confirm `identity.subject` matches the local row's external id for a signed-in user.
4. Confirm server-side rendering works, which proves the token is being passed.
5. Sign out and confirm queries stop returning data rather than serving a cached result.
6. Count public functions without an identity check and confirm each one is genuinely meant to be public.

```bash
npx convex run messages:list '{"channelId":"..."}'
```

Running a function from the CLI is unauthenticated, which makes it a quick way to check step one.

## Report

State whether the auth config exists and which issuer domain and application id it names, whether the variable is set on both deployments, which provider the client uses and whether it sends a token, how `identity.subject` maps to a local user row, which functions check identity and which check per-document ownership, how server-side reads pass a token, and the verification results including the unauthenticated and wrong-user checks. List every public function with no identity check. Never print tokens or the issuer secret.
