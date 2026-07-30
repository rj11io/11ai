---
name: 11ai-operator-stripe-cheatsheet
description: "Answer quick Stripe questions with a compact reference for keys and their scope, CLI commands and webhook forwarding, customers, products and prices, Checkout sessions, subscriptions, payment intents and refunds, idempotency keys, expanding and listing objects, amounts in minor units, test cards, and common event types. Use when someone asks which Stripe API call, CLI command, or test card to use, or wants a fast lookup rather than a guided workflow."
---
# 11ai stripe cheatsheet

A lookup surface for Stripe. Give the call, name what it changes and whether it moves money, and stop. For building a flow or diagnosing a failure, hand off to the matching operation skill.

## Keys and mode

| Value | Scope |
| --- | --- |
| `pk_test` / `pk_live` | Publishable. Safe in the browser |
| `sk_test` / `sk_live` | Secret. Server only. Full account access |
| `whsec_...` | Webhook signing secret, per endpoint |

Test mode and live mode are separate datasets. A customer, price, or subscription created in one does not exist in the other. `sk_test` cannot charge a real card and `sk_live` can.

## CLI

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger payment_intent.succeeded
stripe logs tail
stripe events list --limit 10
stripe events resend EVENT_ID
stripe customers list --limit 5
stripe prices list --limit 10 --expand data.product
```

`stripe listen` prints a signing secret for that session. It differs from the dashboard endpoint's secret, so use the printed one locally.

## Amounts

Amounts are integers in the currency's minor unit. `2000` is 20.00 EUR. Zero-decimal currencies such as JPY take the whole number, so `2000` is 2000 JPY.

Never use a floating point number for money. Store and send integers.

## Customers

```ts
await stripe.customers.create({ email, name, metadata: { app_user_id: userId } })
await stripe.customers.retrieve(customerId)
await stripe.customers.update(customerId, { email })
await stripe.customers.list({ email, limit: 1 })
await stripe.customers.search({ query: `metadata['app_user_id']:'${userId}'` })
```

## Products and prices

```ts
await stripe.products.create({ name: "Pro plan" })
await stripe.prices.create({
  product: productId,
  unit_amount: 2000,
  currency: "eur",
  recurring: { interval: "month" },
})
await stripe.prices.list({ active: true, expand: ["data.product"] })
await stripe.prices.update(priceId, { active: false })
```

A price is immutable except for a few fields such as `active` and `metadata`. To change an amount, create a new price and stop using the old one.

## Checkout

```ts
await stripe.checkout.sessions.create({
  mode: "subscription",
  customer: customerId,
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${origin}/done?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/pricing`,
  client_reference_id: userId,
})

await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items"] })
await stripe.billingPortal.sessions.create({ customer: customerId, return_url: origin })
```

`mode` is `payment`, `subscription`, or `setup`.

## Subscriptions

```ts
await stripe.subscriptions.retrieve(subscriptionId)
await stripe.subscriptions.list({ customer: customerId, status: "all" })
await stripe.subscriptions.update(subscriptionId, {
  items: [{ id: itemId, price: newPriceId }],
  proration_behavior: "create_prorations",
})
await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
await stripe.subscriptions.cancel(subscriptionId)
```

Statuses: `trialing`, `active`, `past_due`, `unpaid`, `canceled`, `incomplete`, `incomplete_expired`, `paused`.

## Payments and refunds

```ts
await stripe.paymentIntents.create(
  { amount: 2000, currency: "eur", customer: customerId, automatic_payment_methods: { enabled: true } },
  { idempotencyKey: `order-${orderId}` }
)
await stripe.paymentIntents.retrieve(paymentIntentId)
await stripe.refunds.create({ payment_intent: paymentIntentId, amount: 500 })
```

Pass an idempotency key on every create that costs money. A retry without one charges twice.

## Listing and expanding

```ts
for await (const price of stripe.prices.list({ active: true, limit: 100 })) {
  // auto-pagination
}
await stripe.subscriptions.retrieve(id, { expand: ["customer", "items.data.price.product"] })
```

Lists are paginated and default to a small page. Use the async iterator rather than reading one page.

## Test cards

| Number | Behaviour |
| --- | --- |
| `4242 4242 4242 4242` | succeeds |
| `4000 0025 0000 3155` | requires authentication |
| `4000 0000 0000 9995` | declined, insufficient funds |
| `4000 0000 0000 0002` | declined, generic |

Any future expiry and any three-digit code. These work in test mode only.

## Common events

`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`.

## Answer format

Lead with the call. Add one line on what it changes, whether it moves money or is irreversible, and whether it is test or live mode. Name the operation skill when the task goes beyond a lookup: pricing to `11ai-operator-stripe-products-and-prices`, Checkout to `11ai-operator-stripe-checkout`, plan changes to `11ai-operator-stripe-subscriptions`, charges and refunds to `11ai-operator-stripe-payments`, events to `11ai-operator-stripe-webhooks`, and failures to `11ai-operator-stripe-troubleshooting`.
