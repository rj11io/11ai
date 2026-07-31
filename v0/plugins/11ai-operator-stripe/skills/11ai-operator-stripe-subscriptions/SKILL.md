---
name: 11ai-operator-stripe-subscriptions
description: "Manage Stripe subscription lifecycles and mirror their state locally, covering statuses and what each means for access, creating with trials, upgrades and downgrades with proration behaviour, quantity changes, cancelling at period end versus immediately, pausing, dunning and past_due handling, reactivation, and reconciling the local mirror when events were missed. Use when a plan must change, when a cancellation must be scheduled, when access does not match what someone is paying for, or when a failed payment must be handled."
---
# 11ai stripe subscriptions

Version baseline: Stripe API 2026-02-25.clover and the latest stable SDK for the project language. Preserve an existing account, endpoint, or SDK pin unless the user explicitly requests an upgrade, and validate the compatibility table before moving API versions.

Access should be derived from the subscription's status, not from the fact that a checkout once succeeded. A subscription moves through states on its own — a card expires, a payment fails, a trial ends — and an application that grants access at purchase and never revisits it keeps giving away the product.

## Inspect first

```ts
import "server-only"
import { stripe } from "@/lib/stripe"

const subs = await stripe.subscriptions.list({
  customer: customerId,
  status: "all",
  limit: 10,
  expand: ["data.items.data.price.product", "data.latest_invoice"],
})

console.log(subs.data.map((s) => ({
  id: s.id,
  status: s.status,
  cancelAtPeriodEnd: s.cancel_at_period_end,
  currentPeriodEnd: s.items.data[0]?.current_period_end,
  price: s.items.data[0]?.price.id,
  quantity: s.items.data[0]?.quantity,
})))
```

Read `status` and `cancel_at_period_end` together. A subscription can be `active` and already scheduled to end, which means access continues now and stops later — a local mirror that stores only "active" loses that.

Compare against your own record before changing anything:

```sql
select tenant_id, stripe_subscription_id, plan, status, current_period_end
from public.subscriptions where stripe_subscription_id = $1;
```

## Map status to access

| Status | Access |
| --- | --- |
| `trialing` | yes |
| `active` | yes |
| `past_due` | usually yes, during the retry window |
| `unpaid` | no |
| `canceled` | no |
| `incomplete` | no, first payment never completed |
| `incomplete_expired` | no |
| `paused` | no |

```ts
const ACTIVE_STATUSES = new Set(["trialing", "active", "past_due"])
export const hasAccess = (status: string) => ACTIVE_STATUSES.has(status)
```

Decide `past_due` deliberately. Keeping access during the retry window is usually right — the card expired, the customer is not a defaulter — and cutting it off immediately generates support load. Keeping access through `unpaid` is giving the product away.

Derive access from the mirrored status on every request rather than from a boolean set once at purchase.

## Create with a trial

```ts
const subscription = await stripe.subscriptions.create(
  {
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: 14,
    trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
    metadata: { app_tenant_id: tenantId },
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  },
  { idempotencyKey: `sub-${tenantId}-${priceId}` }
)
```

`trial_settings.end_behavior` decides what happens when a trial ends with no card: `cancel` is honest, `pause` keeps the record. Without setting it, a trial can end in a state nobody planned.

`payment_behavior: "default_incomplete"` leaves the subscription `incomplete` until the first payment succeeds, which is what you want when collecting the card in your own interface rather than through Checkout.

Set `metadata` on the subscription itself — that is what later events carry.

## Upgrade and downgrade

```ts
const current = await stripe.subscriptions.retrieve(subscriptionId)
const itemId = current.items.data[0].id

await stripe.subscriptions.update(subscriptionId, {
  items: [{ id: itemId, price: newPriceId }],
  proration_behavior: "create_prorations",
})
```

Pass the **existing item id**. Omitting it adds a second item, so the customer is billed for both plans — the most common and most expensive mistake in this area.

`proration_behavior` has three values and they are business decisions, not defaults:

- `create_prorations` — credits the unused time and charges the difference on the next invoice. The usual choice for an upgrade.
- `always_invoice` — bills the difference immediately.
- `none` — no adjustment; the new price applies from the next period. Often right for a downgrade.

Preview before committing, so the customer can be told the amount:

```ts
const preview = await stripe.invoices.createPreview({
  customer: customerId,
  subscription: subscriptionId,
  subscription_details: {
    items: [{ id: itemId, price: newPriceId }],
    proration_behavior: "create_prorations",
  },
})
```

For a downgrade that should take effect later rather than now, schedule it rather than applying it immediately — otherwise the customer loses paid-for capability.

Quantity changes work the same way, on the item:

```ts
await stripe.subscriptions.update(subscriptionId, {
  items: [{ id: itemId, quantity: 12 }],
  proration_behavior: "create_prorations",
})
```

For per-seat billing, drive the quantity from the actual member count and reconcile it on a schedule, or the two drift.

## Cancel, pause, and reactivate

```ts
await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })

await stripe.subscriptions.cancel(subscriptionId)

await stripe.subscriptions.cancel(subscriptionId, { prorate: true, invoice_now: true })

await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false })
```

Cancelling at period end is almost always the right default: the customer keeps what they paid for and nothing is refunded unexpectedly. Cancelling immediately ends access now and needs explicit approval, because it takes away time already paid for.

A subscription scheduled to cancel can be reactivated by clearing the flag, but only before the period ends. Afterwards it is `canceled` and a new subscription is required.

```ts
await stripe.subscriptions.update(subscriptionId, {
  pause_collection: { behavior: "void" },
})
await stripe.subscriptions.update(subscriptionId, { pause_collection: null })
```

## Handle failed payments

Stripe retries a failed payment on a schedule set in the dashboard, then applies the configured end behaviour. The events to handle:

- `invoice.payment_failed` — tell the customer, with a link to the billing portal to fix the card. This is the most valuable notification in the whole integration.
- `customer.subscription.updated` — the status moved, so update the mirror and let access follow it.
- `customer.subscription.deleted` — the subscription ended; revoke access.

Do not implement your own retry logic. Stripe's dunning handles it, and a second retry loop double-charges.

## Mirror and reconcile

```sql
create table public.subscriptions (
  stripe_subscription_id text primary key,
  tenant_id uuid not null references public.tenants (id),
  stripe_customer_id text not null,
  status text not null,
  price_id text not null,
  quantity integer not null default 1,
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  updated_at timestamptz default now()
);
```

Update it from webhook events, and reconcile on a schedule because events get missed:

```ts
for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) {
  await upsertSubscription(sub)
}
await markMissingCanceled()
```

The `markMissingCanceled` step is the important half — it catches subscriptions that ended while the endpoint was down, which is exactly the case where someone keeps access they stopped paying for.

## Verify

1. Create a subscription and confirm access follows the status.
2. Upgrade and confirm exactly one item exists afterwards, at the new price.
3. Preview a proration and confirm the amount matches what the customer was told.
4. Schedule a cancellation and confirm access continues until the period end, then stops.
5. Simulate a failed payment with `stripe trigger invoice.payment_failed` and confirm the customer is notified and access follows the status.
6. Resend a subscription event and confirm nothing double-applies.
7. Run the reconciliation twice and confirm the second run reports no changes.

## Report

State the subscription id, its status and period end, the item ids and prices before and after, the proration behaviour chosen and the previewed amount, whether a cancellation is immediate or at period end, how access is derived from status and what `past_due` does, the mirror fields updated, whether reconciliation runs, and the verification results including the upgrade item count and the replay check. Flag any update that omitted the item id, any access granted from a one-time flag rather than the current status, and any custom retry logic.
