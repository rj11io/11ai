---
name: 11ai-operator-stripe-payments
description: "Take one-off payments and issue refunds, covering payment intents with idempotency keys, server-side amount calculation, automatic payment methods and authentication steps, confirming on the client, capture timing, reading the outcome from the webhook rather than the response, partial and full refunds, disputes and evidence, and reconciling amounts against local orders. Use when a one-off charge must be taken, when a payment needs confirming or capturing, when a refund must be issued, or when a charge and a local order disagree."
---
# 11ai stripe payments

Version baseline: Stripe API 2026-02-25.clover and the latest stable SDK for the project language. Preserve an existing account, endpoint, or SDK pin unless the user explicitly requests an upgrade, and validate the compatibility table before moving API versions.

Two rules govern everything here. The amount is calculated on the server, never accepted from the client. And every create that moves money carries an idempotency key derived from something stable, because a retry without one charges twice.

## Inspect first

```ts
import "server-only"
import { stripe } from "@/lib/stripe"

const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
  expand: ["latest_charge", "customer"],
})

console.log({
  id: intent.id,
  status: intent.status,
  amount: intent.amount,
  amountReceived: intent.amount_received,
  currency: intent.currency,
  lastError: intent.last_payment_error?.code,
})
```

```sql
select id, stripe_payment_intent_id, amount, currency, status from public.orders where id = $1;
```

Read `status` and `amount_received` together, and compare both against the local order. A payment intent that `succeeded` with an `amount_received` different from the order total is a reconciliation problem worth catching before a refund makes it worse.

Statuses: `requires_payment_method`, `requires_confirmation`, `requires_action`, `processing`, `requires_capture`, `succeeded`, `canceled`.

## Create a payment intent

```ts
export async function createPaymentIntent(order: { id: string; tenantId: string }) {
  const total = await calculateOrderTotal(order.id)
  const customer = await ensureCustomer(order.tenantId)

  return stripe.paymentIntents.create(
    {
      amount: total,
      currency: "eur",
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      metadata: { app_order_id: order.id, app_tenant_id: order.tenantId },
      description: `Order ${order.id}`,
    },
    { idempotencyKey: `order-${order.id}` }
  )
}
```

The decisions:

- **`calculateOrderTotal` runs on the server** from data you own. Never take an amount, currency, or line total from the request — a client that can send an amount can send `1`.
- **`amount` is an integer in the minor unit.** `2000` is 20.00 EUR; zero-decimal currencies such as JPY take the whole number. No floating point anywhere near money.
- **The idempotency key is the order id**, so a retried request returns the same intent rather than creating a second charge. A random or time-based key defeats the entire mechanism.
- **`automatic_payment_methods`** lets Stripe offer whatever is enabled and appropriate, rather than hard-coding card.
- **`metadata` links back to the order**, which is what the webhook and any later reconciliation use.

Return only the `client_secret` to the browser. It is scoped to that one intent and is safe to send; anything else about the intent is not needed there.

## Confirm and authenticate

```tsx
const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const { error } = await stripe.confirmPayment({
  elements,
  clientSecret,
  confirmParams: { return_url: `${window.location.origin}/orders/${orderId}/done` },
})
```

Some payments need a further step from the customer — a bank authentication screen, for example — which is the `requires_action` status. The client library handles it when given a `return_url`; a hand-rolled flow that ignores that status leaves the customer stuck with no error.

Do not treat the client's result as the source of truth. A network failure after a successful payment gives the browser an error for a charge that went through. The webhook is authoritative.

Never handle raw card numbers. Collect payment details through Elements or Checkout so they never reach your server.

## Capture later, when needed

```ts
await stripe.paymentIntents.create(
  { amount, currency: "eur", customer: customerId, capture_method: "manual" },
  { idempotencyKey: `order-${orderId}` }
)

await stripe.paymentIntents.capture(paymentIntentId)
await stripe.paymentIntents.capture(paymentIntentId, { amount_to_capture: 1500 })
await stripe.paymentIntents.cancel(paymentIntentId)
```

Manual capture authorizes now and takes the money later, which suits an order shipped after a delay. The authorization expires — typically in about a week — and an uncaptured one is released, so capture within that window or the payment is lost.

Capturing less than authorized is allowed; capturing more is not.

## Read the outcome from the webhook

```ts
case "payment_intent.succeeded": {
  const intent = event.data.object as Stripe.PaymentIntent
  const orderId = intent.metadata.app_order_id
  if (!orderId) throw new Error("payment intent with no order reference")

  await markOrderPaid({
    orderId,
    paymentIntentId: intent.id,
    amountReceived: intent.amount_received,
    currency: intent.currency,
  })
  break
}

case "payment_intent.payment_failed": {
  const intent = event.data.object as Stripe.PaymentIntent
  await markOrderFailed({
    orderId: intent.metadata.app_order_id!,
    code: intent.last_payment_error?.code ?? "unknown",
  })
  break
}
```

Make `markOrderPaid` idempotent — Stripe retries, and fulfilling twice ships two parcels. Compare `amount_received` against the order total and flag a mismatch rather than accepting it.

## Refund deliberately

```ts
const refund = await stripe.refunds.create(
  {
    payment_intent: paymentIntentId,
    amount: 500,
    reason: "requested_by_customer",
    metadata: { app_order_id: orderId },
  },
  { idempotencyKey: `refund-${orderId}-${refundRequestId}` }
)
```

A refund moves real money out and cannot be undone. Before issuing one:

1. Read the payment intent and confirm `status` is `succeeded` and what `amount_received` actually was.
2. Sum the refunds already issued against it, so a second request cannot exceed the charge.
3. State the exact amount and currency, and get explicit approval for that figure on that payment.
4. Use an idempotency key tied to the refund request, not the order, so a genuine second refund is possible while a retry is not.

Omitting `amount` refunds the whole charge. That is easy to do by accident when a partial refund was intended.

Payment processing fees are generally not returned on a refund, so a full refund still costs the business. Say so when the amount matters.

```ts
const existing = await stripe.refunds.list({ payment_intent: paymentIntentId, limit: 100 })
const alreadyRefunded = existing.data.reduce((sum, r) => sum + r.amount, 0)
```

## Handle disputes

```ts
case "charge.dispute.created": {
  const dispute = event.data.object as Stripe.Dispute
  await flagDispute({ chargeId: String(dispute.charge), amount: dispute.amount, reason: dispute.reason })
  break
}
```

A dispute has a response deadline and the money is already held. Notify a human immediately — this is not something to handle automatically. Do not refund a disputed charge, which can result in paying twice; respond through the dispute process instead.

## Verify

1. Pay with `4242 4242 4242 4242` and confirm the order is marked paid **by the webhook**.
2. Pay with `4000 0025 0000 3155` and complete the authentication step.
3. Pay with `4000 0000 0000 9995` and confirm the order is not fulfilled.
4. Retry the create with the same idempotency key and confirm one intent, not two.
5. Resend `payment_intent.succeeded` and confirm nothing double-fulfils.
6. Issue a partial refund and confirm the amount, then confirm a second request cannot exceed the charge.
7. Confirm `amount_received` equals the order total for a normal payment.

## Report

State the payment intent id and status, the amount and currency as integers and how the amount was calculated, the idempotency key used, where the outcome is recorded and that it is the webhook, what makes fulfilment idempotent, any refund with its exact amount and remaining refundable balance, and the verification results including the declined-card and replay checks. Flag any amount taken from the client, any create without an idempotency key, any money value held as a floating point number, and any disputed charge that was refunded.
