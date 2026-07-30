---
name: 11ai-operator-stripe-webhooks
description: "Receive and handle Stripe webhook events safely, covering endpoint registration per mode, signature verification against the raw body, keeping the route public in middleware, the API version a payload carries, idempotency keyed on the event id, acknowledging before processing, out-of-order delivery and reading current state, retries and the retry window, local forwarding with the CLI, and replaying missed events. Use when billing state must follow Stripe, when events arrive but nothing happens, when verification fails, or when an event applied twice."
---
# 11ai stripe webhooks

This endpoint is where billing truth arrives, so three properties are non-negotiable: the route is public, verification runs over the raw body, and each event applies at most once. Miss the first and Stripe gets a redirect; miss the second and the endpoint is forgeable; miss the third and someone is charged once and provisioned twice.

## Inspect first

```bash
grep -rn 'constructEvent\|stripe-signature' --include='*.ts' app/ src/ 2>/dev/null
grep -rn 'api/webhooks' middleware.ts src/middleware.ts 2>/dev/null
grep -c 'STRIPE_WEBHOOK_SECRET' .env.local 2>/dev/null
grep -rn 'express.json\|bodyParser' --include='*.ts' src/ 2>/dev/null | head
```

```ts
const endpoints = await stripe.webhookEndpoints.list({ limit: 10 })
console.log(endpoints.data.map((e) => ({
  url: e.url,
  status: e.status,
  apiVersion: e.api_version,
  events: e.enabled_events,
})))
```

Four causes of "webhooks are not arriving", all visible in these checks: the route is protected by authentication middleware so Stripe receives a redirect; a body parser runs before verification; the endpoint is disabled; or the event type is not in `enabled_events`.

Note the endpoint's `api_version`. It is fixed when the endpoint is created and can differ from the version pinned in the client, which means payload shapes disagree and a field appears missing for no visible reason.

Secrets are per endpoint and per mode. The CLI's `stripe listen` prints its own, which is not any dashboard endpoint's secret.

## Verify against the raw body

```ts
// app/api/webhooks/stripe/route.ts
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")
  if (!signature) return Response.json({ error: "missing_signature" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return Response.json({ error: "invalid_signature" }, { status: 401 })
  }

  if (await alreadyProcessed(event.id)) {
    return Response.json({ received: true })
  }

  await recordEvent(event.id, event.type)

  try {
    await handleStripeEvent(event)
    await markProcessed(event.id)
  } catch (error) {
    console.error("stripe event failed", { id: event.id, type: event.type, error })
    return Response.json({ error: "processing_failed" }, { status: 500 })
  }

  return Response.json({ received: true })
}
```

The details that decide correctness:

- **`request.text()` before anything parses.** Verification is over the exact bytes Stripe signed; parsing and re-serializing produces a different string and every verification fails.
- **401 on a bad signature, 500 on a processing failure.** The distinction matters: a 401 stops Stripe retrying something that can never verify, and a 500 asks it to retry work that might succeed next time.
- **Record the id before processing, mark processed after.** That way a crash mid-handler leaves the event retryable rather than recorded as done.
- **Never disable verification.** An unverified endpoint accepts a forged `payment_intent.succeeded` from anyone who finds the URL — that is free product.

In Express, mount the raw parser on this route only, ahead of the global JSON parser:

```ts
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), handler)
app.use(express.json())
```

Keep the path public in middleware. Stripe has no session:

```ts
const isPublicRoute = createRouteMatcher(["/api/webhooks(.*)"])
```

A signature failure has three usual causes, in this order: a body parser ran first, the secret belongs to another endpoint or mode, or the server clock is outside the tolerance window.

## Be idempotent and acknowledge fast

```sql
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz default now(),
  processed_at timestamptz
);
```

Insert the id and let the primary key reject a duplicate. Stripe retries with backoff for up to about three days, so a handler that is not idempotent grants a plan twice, ships two orders, or emails two receipts.

Acknowledge within a few seconds. Anything slow belongs in a queue:

```ts
  await recordEvent(event.id, event.type)
  await queue.enqueue({ eventId: event.id })
  return Response.json({ received: true })
```

Return 200 only once the event is durably recorded. Returning 200 and losing it in memory means Stripe considers it delivered and never retries.

## Handle the events

```ts
export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await onSubscriptionChanged(event.data.object as Stripe.Subscription)
      break
    case "customer.subscription.deleted":
      await onSubscriptionEnded(event.data.object as Stripe.Subscription)
      break
    case "invoice.paid":
      await onInvoicePaid(event.data.object as Stripe.Invoice)
      break
    case "invoice.payment_failed":
      await onPaymentFailed(event.data.object as Stripe.Invoice)
      break
    case "payment_intent.succeeded":
      await onPaymentSucceeded(event.data.object as Stripe.PaymentIntent)
      break
    case "charge.dispute.created":
      await flagDisputeForHuman(event.data.object as Stripe.Dispute)
      break
    default:
      console.info("unhandled stripe event", event.type)
  }
}
```

Rules for the handlers:

- **Do not assume ordering.** Events can arrive out of order and a retry can deliver an old one late. Apply the state in the event rather than a delta, and for anything important re-read the current object from the API instead of trusting a possibly stale payload.
- **Compare timestamps before overwriting.** Store the event's `created` alongside the mirrored row and ignore an event older than the last one applied, or a late retry reverts a newer change.
- **Handle unknown types with 200.** New event types appear; erroring starts a retry loop over something you do not consume.
- **Subscribe to the whole lifecycle.** Handling only `checkout.session.completed` means a later cancellation or failed payment never revokes access.
- **Send disputes to a human.** They have deadlines and money already held.

## Develop locally and replay

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
stripe events list --limit 10
stripe events resend evt_...
```

Use the secret `stripe listen` prints, not a dashboard endpoint's.

When an outage means events were missed, `stripe events resend` replays specific ones — and because handlers are idempotent, replaying more than needed is safe. Still, resending is not a substitute for reconciliation: read the current subscription and payment state from the API and correct the mirror, because the retry window expires.

## Verify

1. A request with no signature or a tampered body returns 401 and changes nothing.
2. A valid event applies; the same event resent applies once.
3. An unknown event type returns 200 without erroring.
4. A handler that throws returns 500 and the event stays unprocessed, then succeeds on retry.
5. The route is reachable without a session.
6. A late, older event does not revert a newer state.
7. The dashboard's delivery log shows no failures you have not seen locally.

## Report

State the endpoint path, which mode it is registered in, its API version against the client's pinned version, that the route is public and verification runs over the raw body, the idempotency store and its key, whether processing is inline or queued, which event types are handled and which are ignored, how out-of-order delivery is handled, and the verification results including the tampered-signature, replay, and failure-retry checks. Never print the signing secret, the secret key, or full payloads containing customer details. Flag any route where a body parser runs before verification, and any billing state derived from a single event rather than the lifecycle.
