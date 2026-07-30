# Convex integrations reference

## React client

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

```tsx
import { useQuery, useMutation, usePaginatedQuery } from "convex/react"
import { api } from "../convex/_generated/api"

function Messages({ channelId }: { channelId: Id<"channels"> }) {
  const messages = useQuery(api.messages.list, { channelId })
  const send = useMutation(api.messages.send)

  if (messages === undefined) return <Spinner />
  if (messages.length === 0) return <Empty />

  return <List items={messages} onSend={(body) => send({ channelId, body })} />
}
```

`useQuery` returns `undefined` while loading, never `null` — distinguish loading from empty with a strict `=== undefined` check. It is also a live subscription, so a mutation's effect arrives without any refetch.

To hold a query back until its arguments exist:

```tsx
const messages = useQuery(api.messages.list, channelId ? { channelId } : "skip")
```

Passing `"skip"` is how you avoid calling a query with a missing argument. Conditionally calling the hook itself breaks React's rules.

For a snappier interface, give the mutation an optimistic update:

```tsx
const send = useMutation(api.messages.send).withOptimisticUpdate(
  (store, { channelId, body }) => {
    const existing = store.getQuery(api.messages.list, { channelId })
    if (existing === undefined) return
    store.setQuery(api.messages.list, { channelId }, [
      { _id: crypto.randomUUID() as Id<"messages">, body, channelId, _creationTime: Date.now() },
      ...existing,
    ])
  }
)
```

The optimistic value is replaced by the server's when the mutation lands, and rolled back if it fails.

## Next.js

```tsx
// app/ConvexClientProvider.tsx
"use client"

import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithAuth } from "convex/react"

const url = process.env.NEXT_PUBLIC_CONVEX_URL
if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set")

const convex = new ConvexReactClient(url)

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthFromYourProvider}>
      {children}
    </ConvexProviderWithAuth>
  )
}
```

Use the authenticated provider for your identity library rather than the plain `ConvexProvider`. A plain provider sends no token, so every function sees an anonymous caller even though the user is signed in — the usual cause of a null identity.

### Server-side rendering

```tsx
// app/channels/[id]/page.tsx
import { preloadQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { Messages } from "./Messages"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getAuthToken()

  const preloaded = await preloadQuery(
    api.messages.list,
    { channelId: id as Id<"channels"> },
    { token }
  )

  return <Messages preloaded={preloaded} />
}
```

```tsx
"use client"
import { usePreloadedQuery, type Preloaded } from "convex/react"

export function Messages({ preloaded }: { preloaded: Preloaded<typeof api.messages.list> }) {
  const messages = usePreloadedQuery(preloaded)
  return <ul>{messages.map((m) => <li key={m._id}>{m.body}</li>)}</ul>
}
```

The `{ token }` argument is required. Without it the server-side read runs unauthenticated and a function checking identity throws — a page that works in the browser and fails during rendering is almost always this.

For a one-off read with no subscription:

```ts
import { fetchQuery, fetchMutation } from "convex/nextjs"

const messages = await fetchQuery(api.messages.list, { channelId }, { token })
await fetchMutation(api.messages.send, { channelId, body }, { token })
```

## Identity provider

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
npx convex env set AUTH_ISSUER_DOMAIN https://issuer.example.com
npx convex env set AUTH_ISSUER_DOMAIN https://issuer.example.com --prod
```

`domain` must equal the token's issuer and `applicationID` its audience, exactly. A mismatch makes every token invalid and the symptom is a null identity with no error naming the cause.

Create the local user row from the provider's webhook rather than lazily, since a query cannot write:

```ts
// convex/users.ts
import { internalMutation } from "./_generated/server"
import { v } from "convex/values"

export const upsertFromProvider = internalMutation({
  args: { externalId: v.string(), email: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { email: args.email, name: args.name })
      return existing._id
    }

    return ctx.db.insert("users", { ...args, state: "active" })
  },
})
```

Key on `externalId`, never on email. Email changes, and matching on it turns a rename into a duplicate account.

## Outbound calls from an action

```ts
"use node"

import { internalAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { v } from "convex/values"

export const charge = internalAction({
  args: { orderId: v.id("orders"), attempt: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set on this deployment")

    const order = await ctx.runQuery(internal.orders.getInternal, { id: args.orderId })
    if (!order || order.chargeId) return { skipped: true }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)

    try {
      const response = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Idempotency-Key": `order-${args.orderId}`,
        },
        body: new URLSearchParams({ amount: String(order.total), currency: "eur" }),
        signal: controller.signal,
      })

      if (response.status >= 500) throw new Error(`upstream ${response.status}`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error?.message ?? "charge failed")

      await ctx.runMutation(internal.orders.finalize, {
        orderId: args.orderId,
        chargeId: body.id,
        status: "paid",
      })

      return { ok: true }
    } catch (error) {
      const attempt = args.attempt ?? 0
      if (attempt < 3) {
        await ctx.scheduler.runAfter(2 ** attempt * 1000, internal.orders.charge, {
          orderId: args.orderId,
          attempt: attempt + 1,
        })
        return { retrying: true }
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  },
})
```

Five things this gets right, each addressing a way actions go wrong:

- **`"use node"`** when a Node-only package or built-in is needed. Queries and mutations can never use it.
- **A timeout.** `fetch` has none by default, so a hung upstream holds the action until the platform kills it.
- **An idempotency key on the upstream call** and a local guard (`order.chargeId`) before acting. A retry must not charge twice.
- **One mutation for the result.** All the state that must land together goes in `finalize`; two separate `runMutation` calls can leave the first applied and the second not.
- **`internalAction`.** This spends money. No client should be able to call it.

Kick it off transactionally from a mutation:

```ts
await ctx.scheduler.runAfter(0, internal.orders.charge, { orderId })
```

Scheduling from a mutation is part of that transaction, so a rolled-back mutation never schedules the work.

## Inbound webhooks

```ts
// convex/http.ts
import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"

const http = httpRouter()

http.route({
  path: "/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const raw = await request.text()
    const signature = request.headers.get("stripe-signature")
    if (!signature) return new Response("missing signature", { status: 400 })

    let event
    try {
      event = await verifyStripeSignature(raw, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch {
      return new Response("invalid signature", { status: 401 })
    }

    const seen = await ctx.runQuery(internal.events.seen, { id: event.id })
    if (seen) return new Response(null, { status: 200 })

    await ctx.runMutation(internal.events.record, { id: event.id, type: event.type })
    await ctx.scheduler.runAfter(0, internal.events.process, { id: event.id })

    return new Response(null, { status: 200 })
  }),
})

export default http
```

An HTTP endpoint is public, so the signature is the only authentication. Verify over the raw text before parsing, return 401 rather than 500 on a bad signature so the sender stops retrying, record the event id before processing, acknowledge within a couple of seconds, and do the work in a scheduled job.

The endpoint URL differs between development and production. Register each with the provider separately, and remove a stale development endpoint when the tunnel dies or it accumulates retries.

## Mirrors and reconciliation

```ts
// convex/schema.ts
subscriptions: defineTable({
  externalId: v.string(),
  userId: v.id("users"),
  status: v.union(v.literal("active"), v.literal("past_due"), v.literal("canceled")),
  currentPeriodEnd: v.number(),
  updatedAt: v.number(),
})
  .index("by_external_id", ["externalId"])
  .index("by_user", ["userId"]),
```

```ts
export const reconcile = internalAction({
  args: {},
  handler: async (ctx) => {
    const remote = await listAllRemoteSubscriptions()

    for (const sub of remote) {
      await ctx.runMutation(internal.subscriptions.upsert, {
        externalId: sub.id,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end * 1000,
      })
    }

    await ctx.runMutation(internal.subscriptions.markMissingCanceled, {
      seen: remote.map((s) => s.id),
    })
  },
})
```

```ts
// convex/crons.ts
crons.daily("reconcile subscriptions", { hourUTC: 4, minuteUTC: 0 }, internal.subscriptions.reconcile)
```

The second mutation is the important half: it catches records that disappeared upstream while the webhook endpoint was down. A mirror fed only by webhooks drifts, and the drift is invisible until someone keeps access they should have lost.

Never treat the mirror as authoritative for a decision that must be right now. Read the upstream for that, and use the mirror for display and for queries.

## Pipeline

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npx convex dev --once
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEV_DEPLOY_KEY }}
      - run: git diff --exit-code convex/_generated/
      - run: npx tsc --noEmit
      - run: npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npx convex deploy --cmd 'npm run build'
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
```

Points that matter: `git diff --exit-code convex/_generated/` fails the build when someone changed a function and did not regenerate, `needs: test` and the branch condition stop any branch from deploying to production, and the deploy key can replace every function on that deployment — so scope it, never echo it, and rotate it when access changes.
