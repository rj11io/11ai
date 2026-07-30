---
name: 11ai-convex-schema
description: "Define and change Convex tables, covering field validators, optional and union types, typed document references, index design for the queries that exist, search indexes, schema validation against existing documents, migrating data when a field's shape changes, and the difference between a development push and a production deploy. Use when a table must be added or reshaped, when a schema push is rejected, when a query needs an index, or when a field must change type without losing data."
---
# 11ai convex schema

A schema push is validated against every document already in the table, so a change that is fine on an empty development deployment can be rejected on production. Read the existing documents before changing a field, and treat any reshape as a migration rather than an edit.

## Inspect first

```bash
cat convex/schema.ts
npx convex dashboard
npx convex run --help
```

```ts
// convex/inspect.ts — internal, for diagnosis
import { internalQuery } from "./_generated/server"

export const sample = internalQuery({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("messages").take(5)
    return { count: docs.length, keys: docs.map((d) => Object.keys(d)) }
  },
})
```

Before changing a field, find out what is actually stored: whether it is ever absent, whether it holds more than one type, and how many documents exist. A field added as required will reject every document that lacks it.

Read the indexes alongside the queries that use them. An index nobody queries costs write throughput; a query without one scans the table.

## Define tables and validators

```ts
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro")),
    settings: v.object({ theme: v.string(), notifications: v.boolean() }),
  }).index("by_external_id", ["externalId"]),

  messages: defineTable({
    body: v.string(),
    authorId: v.id("users"),
    channelId: v.id("channels"),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
  })
    .index("by_channel_and_time", ["channelId", "createdAt"])
    .index("by_author", ["authorId"])
    .searchIndex("search_body", { searchField: "body", filterFields: ["channelId"] }),
})
```

Points that decide how this behaves later:

- `v.id("users")` is a typed reference. It checks the target table at compile time, so a wrong id is a type error rather than a dangling pointer.
- `v.optional()` allows the field to be absent. A field that is sometimes missing must be optional, or existing documents fail validation.
- `v.union(v.literal(...))` gives a closed set that the compiler narrows, which is better than `v.string()` for a status or plan.
- `_id` and `_creationTime` are added automatically. Do not declare them, and prefer `_creationTime` over your own `createdAt` unless you need a value you control.
- Every table without a schema entry still accepts documents. A schema is what makes the data typed and the queries checked.

## Design indexes around real queries

An index is a sorted list over the fields named, in order, so it serves a query that filters on a prefix of those fields:

```ts
.index("by_channel_and_time", ["channelId", "createdAt"])
```

That one serves a filter on `channelId`, and a filter on `channelId` plus a range or sort on `createdAt`. It does **not** serve a filter on `createdAt` alone — field order is not interchangeable.

```ts
ctx.db
  .query("messages")
  .withIndex("by_channel_and_time", (q) => q.eq("channelId", id))
  .order("desc")
  .take(20)
```

```ts
ctx.db.query("messages").filter((q) => q.eq(q.field("channelId"), id)).take(20)
```

The second version reads every document in the table and discards most of them. It works at ten documents and fails at a hundred thousand with a read limit error. `withIndex` narrows in the database; `filter` narrows after reading.

Add an index for each query shape you actually have, not speculatively — each one costs work on every write. A search index is separate and is for text matching, with `filterFields` for the equality narrowing you want alongside the text.

## Change a field safely

Adding an optional field is safe and needs no migration:

```ts
editedAt: v.optional(v.number()),
```

Anything else is a migration in three steps, because a schema is validated against existing data:

1. **Widen.** Accept both the old and new shape, and deploy that.

   ```ts
   plan: v.union(v.literal("free"), v.literal("pro"), v.literal("basic")),
   ```

2. **Backfill.** Convert existing documents in batches, through an internal mutation.

   ```ts
   export const backfillPlan = internalMutation({
     args: { cursor: v.optional(v.string()) },
     handler: async (ctx, args) => {
       const page = await ctx.db.query("users").paginate({ numItems: 100, cursor: args.cursor ?? null })
       for (const user of page.page) {
         if (user.plan === "basic") await ctx.db.patch(user._id, { plan: "free" })
       }
       if (!page.isDone) {
         await ctx.scheduler.runAfter(0, internal.migrations.backfillPlan, { cursor: page.continueCursor })
       }
     },
   })
   ```

3. **Narrow.** Remove the old variant from the schema once no document uses it.

Never do all three at once. A schema that drops a variant while documents still hold it is rejected, and a schema that renames a field is a drop plus an add — which loses the data. Rename by adding the new field, copying, then removing the old one in a later deploy.

Batch and self-schedule the backfill as above. A single mutation over a large table exceeds its execution limits and leaves the work half done.

## Verify

```bash
npx convex dev --once
npx tsc --noEmit
npx convex run inspect:sample '{}'
```

A development push validates against your development data, which is usually small and clean. Before deploying, confirm the change is safe against **production** data: read a sample there, count documents missing the field, and only then deploy.

After a change, confirm the queries that use the affected indexes still run, and check `npx convex logs` for read-limit warnings that indicate a query fell back to a scan.

## Report

State the tables and fields changed, the validators used, the indexes added or removed and which query shapes each serves, whether the change was additive or required a migration, the batching and progress of any backfill, the document counts before and after, whether it has been validated against production data, and the typecheck result. Call out any field left as a union pending a later narrowing, any index with no query using it, and any query still relying on `filter` over a large table.
