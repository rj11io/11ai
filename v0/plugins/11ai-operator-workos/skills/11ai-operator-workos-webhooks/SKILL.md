---
name: 11ai-operator-workos-webhooks
description: "Receive and handle WorkOS webhook events safely, covering endpoint registration per environment, signature verification against the raw request body, replay-window tolerance, idempotency keyed on the event id, acknowledging quickly and processing afterwards, ordering and out-of-order delivery, retries and failure handling, and local delivery for development. Use when an endpoint must consume WorkOS events, when events arrive but nothing happens, when signature verification fails, or when an event has been applied twice."
---
# 11ai WorkOS webhooks

Version baseline: Current WorkOS platform APIs and current GA SDKs; for Node.js examples use @workos-inc/node v8 on Node.js 22.11 or newer. Inspect the installed SDK and its migration guide before applying language-specific patterns.

Two things decide whether a webhook endpoint is correct: it verifies the signature over the raw body before parsing, and it applies each event at most once. Get either wrong and the endpoint is either forgeable or double-applying. Everything else is detail.

## Inspect first

```bash
grep -rn 'workos-signature\|constructEvent' --include='*.ts' app/ src/ 2>/dev/null
grep -c 'WORKOS_WEBHOOK_SECRET' .env.local 2>/dev/null
grep -rn 'express.json\|bodyParser' --include='*.ts' src/ 2>/dev/null | head
```

Check whether a global JSON body parser runs before the webhook route. That is the most common cause of a verification failure that looks like a wrong secret: the parser consumes and re-serializes the body, so the bytes the signature covers are gone.

Each endpoint in the WorkOS dashboard has its own signing secret, and secrets are per environment. A staging secret against production events fails every verification.

## Verify against the raw body

```ts
// app/api/webhooks/workos/route.ts
import { WorkOS } from "@workos-inc/node"

const workos = new WorkOS(process.env.WORKOS_API_KEY!)

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get("workos-signature")

  if (!signature) {
    return Response.json({ error: "missing_signature" }, { status: 400 })
  }

  let event
  try {
    event = await workos.webhooks.constructEvent({
      payload: JSON.parse(payload),
      sigHeader: signature,
      secret: process.env.WORKOS_WEBHOOK_SECRET!,
    })
  } catch {
    return Response.json({ error: "invalid_signature" }, { status: 401 })
  }

  if (await alreadyProcessed(event.id)) {
    return Response.json({ received: true })
  }

  await recordEvent(event.id, event.event)
  await handleEvent(event)

  return Response.json({ received: true })
}
```

The decisions that matter:

- **Read the raw text first.** `request.text()` before any parsing. In Express, mount `express.raw({ type: "application/json" })` on this route only, ahead of the global JSON parser.
- **Reject an unverified event outright.** Do not log it and continue, and never parse an unverified body and act on it — that is an unauthenticated write into your system.
- **Return 401 on a bad signature**, not 500. A 500 tells the sender to retry a request that will never verify.
- **Do not disable verification** to get past a failure. An unverified endpoint accepts a forged `dsync.user.created` from anyone who finds the URL.

The signature carries a timestamp and verification enforces a tolerance window, so a replayed old request is rejected. That also means a clock skew of more than a few minutes on your server breaks verification — check the clock before suspecting the secret.

## Be idempotent and acknowledge fast

```sql
create table public.webhook_events (
  id text primary key,
  type text not null,
  received_at timestamptz default now(),
  processed_at timestamptz
);
```

Insert the event id before doing the work and let the primary key reject a duplicate. WorkOS retries on failure and can deliver the same event more than once, so a handler that is not idempotent double-applies — a membership granted twice, an invitation sent twice, a charge triggered twice downstream.

Acknowledge quickly. The sender times out in seconds and retries, so anything slow should be queued rather than done inline:

```ts
  await recordEvent(event.id, event.event)
  await queue.enqueue({ eventId: event.id, payload: event })
  return Response.json({ received: true })
```

Return 200 only once the event is durably recorded. Returning 200 and then losing the event in memory means the sender considers it delivered and never retries.

## Handle the events

```ts
async function handleEvent(event: Awaited<ReturnType<typeof workos.webhooks.constructEvent>>) {
  switch (event.event) {
    case "user.created":
    case "user.updated":
      await upsertUser(event.data)
      break
    case "user.deleted":
      await revokeUserAccess(event.data.id)
      break
    case "dsync.user.created":
    case "dsync.user.updated":
      await upsertDirectoryUser(event.data)
      break
    case "dsync.user.deleted":
      await deactivateDirectoryUser(event.data.id)
      break
    case "dsync.group.user_added":
    case "dsync.group.user_removed":
      await recomputeRolesForUser(event.data.user.id)
      break
    case "connection.activated":
    case "connection.deactivated":
      await updateConnectionState(event.data)
      break
    default:
      console.info("unhandled workos event", event.event)
  }
}
```

Two rules for the handlers themselves:

- **Do not assume ordering.** Events can arrive out of order, so a handler should apply the state in the event rather than a delta. Recompute a user's roles from their full group set rather than adding or removing one.
- **Handle an unknown type without failing.** New event types appear; log and return 200 rather than erroring, or a retry loop starts over something you do not consume.

Deprovisioning must actually revoke access. Marking a row inactive while a valid session persists means the user still has access, so end their sessions as part of the handler.

Never trust an event as a substitute for the API when the decision is important. An event tells you something changed; reading the current state back is how you know what it is now.

## Develop locally and verify

An endpoint on `localhost` is unreachable from WorkOS, so use a tunnel and register the temporary URL as a development endpoint with its own secret. Remove it when finished — a stale endpoint pointing at a dead tunnel accumulates retries.

Verify the negative paths, which are the ones that matter:

1. A request with no signature returns 400.
2. A request with a tampered body or a wrong secret returns 401 and changes nothing.
3. The same valid event delivered twice applies once.
4. An unknown event type returns 200 without erroring.
5. A deprovisioning event actually removes access, including live sessions.
6. Reconcile afterwards through `11ai-operator-workos-directory-sync` and confirm no drift.

## Report

State the endpoint path and which environment it is registered in, that verification runs on the raw body before parsing, where the signing secret comes from, the idempotency store and its key, whether processing is inline or queued, which event types are handled and which are ignored, and the verification results including the tampered-signature and duplicate-delivery checks. Never print the signing secret, the API key, or full event payloads containing personal data. Flag any route where a body parser runs before verification.
