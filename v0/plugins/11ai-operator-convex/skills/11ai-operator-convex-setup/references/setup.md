# Convex setup reference

## Install and initialize

```bash
npm install convex
npx convex dev
```

The first `npx convex dev` run does everything: login, project selection or creation, deployment creation, environment file writing, and code generation. Then it stays running and watches `convex/` for changes.

```bash
npx convex dev --once
```

Use `--once` in a script or pipeline — it pushes and generates, then exits.

What appears after the first run:

```text
convex/
  _generated/
    api.d.ts
    api.js
    dataModel.d.ts
    server.d.ts
    server.js
  schema.ts
convex.json
.env.local
```

```text
# .env.local
CONVEX_DEPLOYMENT=dev:happy-animal-123
NEXT_PUBLIC_CONVEX_URL=https://happy-animal-123.convex.cloud
```

Neither value is a secret. The `dev:` prefix is what tells you this is a personal development deployment rather than production.

## Deployments

| Deployment | Created by | Data |
| --- | --- | --- |
| Development | `npx convex dev`, one per developer | separate |
| Production | `npx convex deploy` | separate |
| Preview | a deploy from a branch, where configured | separate |

Each has its own database, its own environment variables, and its own deployed function versions. Data does not sync between them, and neither do environment variables — the usual cause of "works locally, fails in production".

## Client providers

### Next.js App Router

```tsx
// app/ConvexClientProvider.tsx
"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"

const url = process.env.NEXT_PUBLIC_CONVEX_URL
if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set")

const convex = new ConvexReactClient(url)

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
```

```tsx
// app/layout.tsx
import { ConvexClientProvider } from "./ConvexClientProvider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  )
}
```

Two details matter. The client is created at module scope, so one websocket serves the whole application — creating it inside the component opens a new connection on every render. And throwing on a missing URL at import time turns a silent non-reactive application into a clear build error.

### Vite

```tsx
// src/main.tsx
import { ConvexProvider, ConvexReactClient } from "convex/react"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

createRoot(document.getElementById("root")!).render(
  <ConvexProvider client={convex}>
    <App />
  </ConvexProvider>
)
```

```text
# .env.local
VITE_CONVEX_URL=https://happy-animal-123.convex.cloud
```

### Server-side reads in Next.js

```ts
import { preloadQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"

const preloaded = await preloadQuery(api.messages.list, { limit: 20 })
```

```tsx
"use client"
import { usePreloadedQuery, type Preloaded } from "convex/react"

export function Messages({ preloaded }: { preloaded: Preloaded<typeof api.messages.list> }) {
  const messages = usePreloadedQuery(preloaded)
  return <ul>{messages.map((m) => <li key={m._id}>{m.body}</li>)}</ul>
}
```

`preloadQuery` renders the first paint on the server and then hands off to a live subscription in the browser, so the page is not blank on load and still updates.

For a one-off server read with no reactivity:

```ts
import { fetchQuery } from "convex/nextjs"

const messages = await fetchQuery(api.messages.list, { limit: 20 })
```

## First schema

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  }).index("by_external_id", ["externalId"]),

  messages: defineTable({
    body: v.string(),
    authorId: v.id("users"),
    channelId: v.id("channels"),
    createdAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_channel_and_time", ["channelId", "createdAt"]),

  channels: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }),
})
```

Every field a query filters or sorts on wants an index. Without one, the query reads every document in the table and eventually hits a read limit.

`v.id("users")` is a typed reference, so a wrong id is a type error rather than a runtime surprise.

## First functions

```ts
// convex/messages.ts
import { query, mutation, internalMutation } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: { channelId: v.id("channels"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return ctx.db
      .query("messages")
      .withIndex("by_channel_and_time", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(args.limit ?? 20)
  },
})

export const send = mutation({
  args: { body: v.string(), channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
      .unique()
    if (!user) throw new Error("No user record")

    return ctx.db.insert("messages", {
      body: args.body,
      authorId: user._id,
      channelId: args.channelId,
      createdAt: Date.now(),
    })
  },
})

export const purgeOld = internalMutation({
  args: { before: v.number() },
  handler: async (ctx, args) => {
    const old = await ctx.db
      .query("messages")
      .withIndex("by_channel_and_time", (q) => q.lt("createdAt", args.before))
      .take(100)
    for (const doc of old) await ctx.db.delete(doc._id)
  },
})
```

Three rules visible there:

- **Argument validators on every function.** Without `args`, the function accepts whatever a caller sends.
- **Check identity inside the function.** Every non-internal function is callable by any client that knows its name, so authorization belongs in the handler, not in the calling component.
- **`internalMutation` for anything a client should not call.** `purgeOld` deletes data; exposing it publicly would let anyone trigger it.

## Environment variables on the deployment

Server-side secrets belong on the Convex deployment, not in the application's environment file:

```bash
npx convex env set STRIPE_SECRET_KEY sk_test_... 
npx convex env list
npx convex env set STRIPE_SECRET_KEY sk_live_... --prod
npx convex env list --prod
```

Read them in a function with `process.env`:

```ts
const key = process.env.STRIPE_SECRET_KEY
if (!key) throw new Error("STRIPE_SECRET_KEY is not set on this deployment")
```

`npx convex env list` prints values, so treat its output as sensitive and report names only.

Set the variable on **both** deployments. A value present in development and missing in production is the most common post-deploy failure, and the error usually names something else.

## Ignore rules

```text
.env.local
```

For `convex/_generated/`: either commit it or ignore it, consistently. Committing it means a fresh clone typechecks before anyone runs the watcher; ignoring it avoids merge noise. A stale committed copy is the worst of both, so if you commit it, regenerate it in the pipeline and fail on a diff:

```bash
npx convex dev --once
git diff --exit-code convex/_generated/
```

## Verify

```bash
npx convex dev --once
ls convex/_generated/
npx convex run messages:list '{"channelId":"..."}'
npx tsc --noEmit
```

Then in the running application:

1. A `useQuery` returns data rather than staying `undefined`.
2. A mutation's effect appears without a manual refresh — this is the reactivity check and it proves the provider and deployment agree.
3. An unauthenticated call to a function that requires identity is rejected.
4. `npx convex logs` shows the function calls you just made.

Step 3 is the one people skip. A function that returns data to an anonymous caller is public whether or not the interface offers a way to call it.
