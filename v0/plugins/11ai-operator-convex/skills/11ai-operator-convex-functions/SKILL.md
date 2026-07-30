---
name: 11ai-operator-convex-functions
description: "Write and repair Convex queries and mutations, covering argument validators, public versus internal functions, authorization inside the handler, index-backed reads, pagination, transactional guarantees and read and write limits, helper functions shared between handlers, optimistic updates on the client, and errors surfaced to callers. Use when a function must be added or fixed, when a query is slow or hits a read limit, when a mutation must stay atomic, or when a function is callable by clients that should not reach it."
---
# 11ai convex functions

Two facts govern every function here. Each mutation runs in a transaction, so it either fully applies or not at all. And every non-internal function is callable by any client that knows its name — so authorization belongs in the handler, never in the component that calls it.

## Inspect first

```bash
ls convex/*.ts
grep -rn 'export const' convex/*.ts | head -30
grep -c '= mutation(\|= query(' convex/*.ts
grep -c 'internalMutation\|internalQuery' convex/*.ts
cat convex/schema.ts | grep -A2 'index('
npx convex logs --limit 30
```

Read the public surface first. Any `query` or `mutation` that is not `internal` is an endpoint, so a public mutation that deletes data or a public query that returns another user's rows is an exposure to fix before anything else.

Read the schema's indexes too — they determine which queries can be written efficiently.

## Write a query

```ts
import { query } from "./_generated/server"
import { v } from "convex/values"

export const listByChannel = query({
  args: {
    channelId: v.id("channels"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_and_channel", (q) =>
        q.eq("externalId", identity.subject).eq("channelId", args.channelId)
      )
      .unique()
    if (!membership) throw new Error("Not a member of this channel")

    return ctx.db
      .query("messages")
      .withIndex("by_channel_and_time", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(Math.min(args.limit ?? 20, 100))
  },
})
```

What each part is doing:

- **Validators on `args`.** Without them the function accepts anything a caller sends, including an id for a table it should not touch.
- **Identity and membership checked in the handler.** A client can call this with any `channelId`; the membership lookup is what stops it reading another team's messages.
- **`withIndex`, not `filter`.** `withIndex` narrows in the database. `filter` reads every document in the table first, which works in development and hits a read limit in production.
- **A bounded `take`.** Clamp a caller-supplied limit. An unbounded `collect()` on a growing table is a failure waiting for enough data.

For large result sets, paginate rather than raising the limit:

```ts
export const page = query({
  args: { channelId: v.id("channels"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return ctx.db
      .query("messages")
      .withIndex("by_channel_and_time", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .paginate(args.paginationOpts)
  },
})
```

Queries must be deterministic and side-effect free. No `Math.random()`, no `Date.now()`, no `fetch` — results are cached and reused, so a non-deterministic query returns stale nonsense. Generate values in a mutation and pass them in.

## Write a mutation

```ts
import { mutation, internalMutation } from "./_generated/server"
import { v } from "convex/values"

export const send = mutation({
  args: { channelId: v.id("channels"), body: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const body = args.body.trim()
    if (!body) throw new Error("Message cannot be empty")
    if (body.length > 4000) throw new Error("Message too long")

    const user = await requireUser(ctx, identity.subject)
    await requireMembership(ctx, user._id, args.channelId)

    const messageId = await ctx.db.insert("messages", {
      body,
      authorId: user._id,
      channelId: args.channelId,
      createdAt: Date.now(),
    })

    await ctx.db.patch(args.channelId, { lastMessageAt: Date.now() })

    return messageId
  },
})
```

The insert and the patch are one transaction: if the patch fails, the insert is rolled back too. That is the guarantee to rely on, and the reason to keep related writes in a single mutation rather than calling two from the client.

Validate the values as well as their types. A validator confirms `body` is a string; only the handler can say it must be non-empty and under a length.

Share logic with plain helper functions rather than by calling one mutation from another:

```ts
// convex/lib/access.ts
import type { MutationCtx, QueryCtx } from "../_generated/server"

export async function requireUser(ctx: QueryCtx | MutationCtx, externalId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
    .unique()
  if (!user) throw new Error("No user record")
  return user
}
```

A helper keeps the transaction intact. `ctx.runMutation` from a mutation is not available, and from an action each call is a separate transaction.

## Keep private things internal

```ts
export const purgeChannel = internalMutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("messages")
      .withIndex("by_channel_and_time", (q) => q.eq("channelId", args.channelId))
      .take(100)
    for (const doc of docs) await ctx.db.delete(doc._id)
    return { deleted: docs.length, done: docs.length < 100 }
  },
})
```

`internalMutation` is not callable from a client — only from another function, a scheduled job, or the CLI. Anything destructive, anything that touches another user's data, and anything using a secret belongs here.

Batch destructive work and report progress. A delete loop over an unbounded table exceeds the mutation's limits and stops partway, so return a count and reschedule until done.

## Verify

```bash
npx convex run messages:listByChannel '{"channelId":"..."}'
npx convex run messages:send '{"channelId":"...","body":"test"}'
npx convex logs --limit 20
npx tsc --noEmit
```

Test the negative paths, which are the ones that matter:

1. Call a public function with no authentication and confirm it is rejected.
2. Call it as a user who should not have access to that id and confirm it is refused, not served.
3. Send an invalid argument and confirm the validator rejects it.
4. Confirm an internal function is not callable from the client.
5. Confirm a mutation that fails partway leaves nothing behind.
6. Check the logs for read-limit warnings, which mean a query is scanning rather than using an index.

## Report

State the functions added or changed and whether each is public or internal, the argument validators, where identity and authorization are checked, which index each query uses, the pagination or limit applied, what the mutation writes in one transaction, and the verification results including the unauthenticated and wrong-user checks. Flag every public function that mutates data or reads records it does not scope to the caller, and every query still using `filter` on a table that will grow.
