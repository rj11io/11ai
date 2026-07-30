---
name: 11ai-operator-convex-cheatsheet
description: "Answer quick Convex questions with a compact reference for CLI commands, the three function types and when each applies, argument validators, schema and index definitions, database reader and writer methods, query and pagination hooks, scheduling and crons, file storage calls, environment variables, and generated API imports. Use when someone asks which Convex command, function type, or client call to use, or wants a fast lookup rather than a guided workflow."
---
# 11ai Convex cheatsheet

A lookup surface for Convex. Give the command or call, name what it changes and which deployment it touches, and stop. For writing functions, changing a schema, or diagnosing a failure, hand off to the matching operation skill.

## CLI

```bash
npx convex dev
npx convex dev --once
npx convex deploy
npx convex dashboard
npx convex logs
npx convex logs --success
npx convex env list
npx convex env set KEY value
npx convex run module:functionName '{"arg":1}'
npx convex import --table users data.jsonl
npx convex export --path ./snapshot
```

`npx convex dev` watches, pushes, and regenerates the API against your **development** deployment. `npx convex deploy` pushes to **production**. Those are different deployments with different data.

## The three function types

| Type | Reads | Writes | External calls | Runs on |
| --- | --- | --- | --- | --- |
| `query` | yes | no | no | transactional, cached, reactive |
| `mutation` | yes | yes | no | transactional |
| `action` | via functions only | via functions only | yes | not transactional |

An action cannot touch the database directly. It calls queries and mutations with `ctx.runQuery` and `ctx.runMutation`, and each of those is its own transaction — so an action is not atomic.

## Functions

```ts
import { query, mutation, action, internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { api, internal } from "./_generated/api"

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return ctx.db.query("messages").order("desc").take(args.limit ?? 20)
  },
})

export const send = mutation({
  args: { body: v.string(), channelId: v.id("channels") },
  handler: async (ctx, args) => {
    return ctx.db.insert("messages", { ...args, createdAt: Date.now() })
  },
})

export const notify = action({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.runQuery(api.messages.get, { id: args.messageId })
    await fetch("https://api.example.com/notify", { method: "POST", body: JSON.stringify(message) })
  },
})
```

`internalQuery`, `internalMutation`, and `internalAction` are not callable from a client. Anything not meant to be public should be internal.

## Validators

```ts
v.string()   v.number()   v.boolean()   v.null()   v.int64()
v.id("table")             v.array(v.string())
v.object({ a: v.string() })
v.optional(v.string())    v.union(v.literal("a"), v.literal("b"))
v.record(v.string(), v.number())
v.bytes()    v.any()
```

Declare `args` on every function. Without validators the function accepts whatever a caller sends.

## Schema and indexes

```ts
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  messages: defineTable({
    body: v.string(),
    channelId: v.id("channels"),
    authorId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_channel_and_time", ["channelId", "createdAt"])
    .searchIndex("search_body", { searchField: "body" }),
})
```

## Database methods

```ts
await ctx.db.get(id)
await ctx.db.insert("table", doc)
await ctx.db.patch(id, { field: value })
await ctx.db.replace(id, doc)
await ctx.db.delete(id)

ctx.db.query("messages").withIndex("by_channel", (q) => q.eq("channelId", id))
ctx.db.query("messages").filter((q) => q.eq(q.field("read"), false))
ctx.db.query("messages").order("desc").take(20)
await ctx.db.query("messages").first()
await ctx.db.query("messages").unique()
await ctx.db.query("messages").collect()
await ctx.db.query("messages").paginate(paginationOpts)
```

`withIndex` narrows in the database; `filter` runs over every document the query already scanned. Use an index for anything that must scale, and never `collect()` an unbounded table.

## Client hooks

```tsx
import { useQuery, useMutation, useAction, usePaginatedQuery } from "convex/react"
import { api } from "../convex/_generated/api"

const messages = useQuery(api.messages.list, { limit: 20 })
const send = useMutation(api.messages.send)
const notify = useAction(api.messages.notify)

const { results, status, loadMore } = usePaginatedQuery(
  api.messages.page,
  { channelId },
  { initialNumItems: 20 }
)
```

`useQuery` returns `undefined` while loading and is reactive — it re-renders when the underlying data changes. Pass `"skip"` instead of args to hold a query back.

## Scheduling and crons

```ts
await ctx.scheduler.runAfter(0, internal.messages.process, { id })
await ctx.scheduler.runAt(timestamp, internal.messages.remind, { id })
```

```ts
// convex/crons.ts
import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()
crons.daily("digest", { hourUTC: 3, minuteUTC: 0 }, internal.digest.send)
export default crons
```

## Files and HTTP

```ts
const url = await ctx.storage.generateUploadUrl()
const fileUrl = await ctx.storage.getUrl(storageId)
await ctx.storage.delete(storageId)
```

```ts
// convex/http.ts
import { httpRouter } from "convex/server"

const http = httpRouter()
http.route({ path: "/webhook", method: "POST", handler: webhookHandler })
export default http
```

## Answer format

Lead with the command or call. Add one line on what it changes, whether it targets development or production, and whether it must be internal. Name the operation skill when the task goes beyond a lookup: schema to `11ai-operator-convex-schema`, functions to `11ai-operator-convex-functions`, external calls to `11ai-operator-convex-actions`, deploys to `11ai-operator-convex-deployments`, and failures to `11ai-operator-convex-troubleshooting`.
