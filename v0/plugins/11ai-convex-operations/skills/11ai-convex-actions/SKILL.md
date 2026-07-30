---
name: 11ai-convex-actions
description: "Write Convex actions and scheduled work, covering the Node runtime directive, calling external services with timeouts and bounded retries, reading secrets from deployment environment variables, the loss of transactional guarantees across runQuery and runMutation, idempotency for retried work, scheduler runAfter and runAt, cron definitions, HTTP endpoints for inbound webhooks, and keeping actions internal. Use when a function must call an external API, when work must run later or on a schedule, when an inbound webhook must be received, or when an action is partially applying its changes."
---
# 11ai convex actions

An action is the only place Convex can reach the outside world, and it is the one place with no transaction. Every `ctx.runMutation` inside it commits independently, so an action that fails halfway leaves earlier writes in place. Design for that before writing the external call.

## Inspect first

```bash
grep -rn '= action(\|= internalAction(\|"use node"' convex/*.ts | head
cat convex/crons.ts 2>/dev/null
cat convex/http.ts 2>/dev/null
npx convex env list
npx convex logs --limit 30
```

Read which actions are public. Every non-internal action is callable by any client that knows its name, so an action that spends money, sends email, or uses a secret should be `internalAction`.

Read `crons.ts` before changing anything scheduled — a job already running on production may be doing work you are about to duplicate.

## Write an action

```ts
"use node"

import { internalAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { v } from "convex/values"

export const notify = internalAction({
  args: { messageId: v.id("messages"), attempt: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const key = process.env.NOTIFY_API_KEY
    if (!key) throw new Error("NOTIFY_API_KEY is not set on this deployment")

    const message = await ctx.runQuery(internal.messages.getInternal, { id: args.messageId })
    if (!message || message.notifiedAt) return { skipped: true }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5_000)

    try {
      const response = await fetch("https://api.example.com/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ id: message._id, body: message.body }),
        signal: controller.signal,
      })

      if (!response.ok) throw new Error(`upstream ${response.status}`)

      await ctx.runMutation(internal.messages.markNotified, { id: args.messageId })
      return { ok: true }
    } catch (error) {
      const attempt = args.attempt ?? 0
      if (attempt < 3) {
        await ctx.scheduler.runAfter(
          2 ** attempt * 1000,
          internal.messages.notify,
          { messageId: args.messageId, attempt: attempt + 1 }
        )
        return { retrying: true }
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  },
})
```

The decisions in that code:

- **`"use node"` at the top of the file** when the action needs Node built-ins or a Node-only package. Without it the action runs in the restricted runtime and a Node import fails. Queries and mutations can never use it.
- **A timeout on the external call.** `fetch` has no default one, so a hung upstream holds the action until the platform kills it.
- **The idempotency check before acting.** `message.notifiedAt` is what stops a retry sending twice. Retried work must be safe to run again.
- **Bounded retries with backoff, scheduled rather than looped.** Rescheduling releases the action instead of sleeping inside it.
- **Secrets read from the deployment environment**, with a clear failure when absent. Never hard-code a key, and set it on both development and production.
- **`internalAction`, not `action`.** This spends an external quota and uses a secret; no client should be able to trigger it directly.

Where atomicity matters, do the database work in one mutation and let the action call it once:

```ts
await ctx.runMutation(internal.orders.finalize, { orderId, chargeId, total })
```

Two separate `runMutation` calls can leave the first applied and the second not. One mutation containing both writes cannot.

## Schedule work

```ts
await ctx.scheduler.runAfter(0, internal.messages.notify, { messageId })
await ctx.scheduler.runAfter(60_000, internal.messages.remind, { messageId })
await ctx.scheduler.runAt(sendAtMs, internal.digest.send, { userId })
```

Scheduling from a mutation is transactional: if the mutation rolls back, the job is never scheduled. That makes `runAfter(0, ...)` from a mutation the right way to kick off external work — the client gets a fast, consistent response and the slow part happens after.

```ts
const jobId = await ctx.scheduler.runAfter(3_600_000, internal.trials.expire, { userId })
await ctx.db.patch(userId, { expiryJobId: jobId })

await ctx.scheduler.cancel(jobId)
```

Store the job id if it may need cancelling, or a rescheduled reminder fires twice.

```ts
// convex/crons.ts
import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.daily("nightly digest", { hourUTC: 3, minuteUTC: 0 }, internal.digest.sendAll)
crons.interval("poll upstream", { minutes: 15 }, internal.sync.poll)

export default crons
```

Cron times are UTC. A job set for local overnight runs mid-afternoon somewhere. Keep each cron's work batched and idempotent — a cron whose run takes longer than its interval will overlap itself.

## Receive inbound webhooks

```ts
// convex/http.ts
import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"

const http = httpRouter()

http.route({
  path: "/webhooks/provider",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const raw = await request.text()
    const signature = request.headers.get("x-provider-signature")

    if (!signature || !(await verifySignature(raw, signature, process.env.WEBHOOK_SECRET!))) {
      return new Response("invalid signature", { status: 401 })
    }

    const event = JSON.parse(raw)

    const already = await ctx.runQuery(internal.events.seen, { id: event.id })
    if (already) return new Response(null, { status: 200 })

    await ctx.runMutation(internal.events.record, { id: event.id, type: event.type })
    await ctx.scheduler.runAfter(0, internal.events.process, { id: event.id })

    return new Response(null, { status: 200 })
  }),
})

export default http
```

An HTTP endpoint is public by definition, so the signature check is the only thing authenticating the caller. Verify over the **raw** text before parsing, reject with 401 rather than 500 so the sender does not retry forever, record the event id for idempotency, acknowledge fast, and do the work in a scheduled job.

The endpoint lives at the deployment's HTTP URL, which differs between development and production — register each with the provider separately.

## Verify

```bash
npx convex run messages:notify '{"messageId":"..."}'
npx convex logs --limit 30
npx convex env list
npx convex env list --prod
```

Check the paths that fail, since those are what actions get wrong:

1. Point the external call at an unreachable address and confirm it times out and retries rather than hanging.
2. Run the action twice on the same input and confirm the second run does nothing.
3. Fail the call after the first mutation and inspect what remains — then decide whether that partial state is acceptable or whether the writes belong in one mutation.
4. Confirm a missing secret produces a clear error naming the variable.
5. For a webhook, send a tampered body and confirm 401 with no state change, then a valid one twice and confirm it applies once.
6. Compare `env list` against `env list --prod`.

## Report

State the actions added or changed and whether each is internal, whether the file needs `"use node"` and why, the external services called with their timeouts and retry limits, which secrets are required and whether they are set on both deployments, what makes the work idempotent, which writes are grouped into a single mutation and which are not, any scheduled or cron work with its timing in UTC, and the verification results including the retry and duplicate checks. Never print a secret or a full webhook payload. Flag every public action and any sequence of mutations that can partially apply.
