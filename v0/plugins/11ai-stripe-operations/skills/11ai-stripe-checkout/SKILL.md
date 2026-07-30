---
name: 11ai-stripe-checkout
description: "Build Stripe Checkout sessions and handle their outcome, covering payment, subscription, and setup modes, server-side price lookup, attaching a customer and a client reference, success and cancel URLs, why fulfilment belongs in the webhook rather than the success page, trials and promotion codes, tax and address collection, expiry, and the billing portal as the management surface. Use when a purchase or signup flow must be built, when a user is charged but nothing was provisioned, or when the success page is doing work it should not."
---
# 11ai stripe checkout

The rule that decides whether a Checkout integration is correct: **fulfil in the webhook, not on the success page**. A user can close the tab, lose their connection, or never return, and their payment still succeeded. A success page that provisions access will miss those, and a success page that provisions access without verifying the session can be visited by anyone.

## Inspect first

```ts
import "server-only"
import { stripe } from "@/lib/stripe"

const prices = await stripe.prices.list({ active: true, limit: 20, expand: ["data.product"] })
```

```bash
grep -rn 'checkout.sessions.create' --include='*.ts' app/ src/ 2>/dev/null
grep -rn 'session_id' --include='*.tsx' --include='*.ts' app/ 2>/dev/null | head
grep -rn 'checkout.session.completed' --include='*.ts' app/ src/ lib/ 2>/dev/null
```

Check whether a webhook handler for `checkout.session.completed` exists. If the success page grants access and no handler does, that is the finding — every abandoned tab is a paid customer with nothing provisioned.

## Create the session on the server

```ts
export async function createCheckoutSession(opts: {
  tenantId: string
  userId: string
  lookupKey: string
  origin: string
}) {
  const prices = await stripe.prices.list({ lookup_keys: [opts.lookupKey], active: true })
  const price = prices.data[0]
  if (!price) throw new Error(`price ${opts.lookupKey} not found`)

  const customer = await ensureCustomer(opts.tenantId)

  return stripe.checkout.sessions.create({
    mode: price.recurring ? "subscription" : "payment",
    customer: customer.id,
    line_items: [{ price: price.id, quantity: 1 }],
    client_reference_id: opts.tenantId,
    metadata: { app_tenant_id: opts.tenantId, app_user_id: opts.userId },
    subscription_data: price.recurring
      ? { metadata: { app_tenant_id: opts.tenantId } }
      : undefined,
    success_url: `${opts.origin}/billing/done?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.origin}/pricing`,
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    customer_update: { address: "auto" },
  })
}
```

The decisions that matter:

- **The price is looked up on the server** from a lookup key. Never accept a price id, amount, or currency from the browser — a client that can send an amount can send `1`.
- **`mode`** is `payment` for a one-off, `subscription` for recurring, `setup` for collecting a card without charging.
- **An existing customer is attached**, so subscriptions and invoices accumulate on one customer rather than creating a duplicate each time.
- **`metadata` on both the session and the subscription.** The subscription's metadata is what later webhook events carry; session metadata does not appear on `customer.subscription.updated`.
- **`{CHECKOUT_SESSION_ID}`** is a literal placeholder Stripe substitutes. Do not interpolate it yourself.
- **`automatic_tax`** needs an address, hence `customer_update`. Without one, tax is wrong or the session fails.

Authorize the caller before creating the session, and derive the tenant from their session rather than a request parameter. Otherwise a user can start a checkout that provisions access for another tenant.

Sessions expire after 24 hours by default; set `expires_at` shorter for a time-limited offer. Redirect using the session's `url` rather than reconstructing one.

## Fulfil in the webhook

```ts
case "checkout.session.completed": {
  const session = event.data.object as Stripe.Checkout.Session

  if (session.payment_status !== "paid" && session.mode !== "subscription") break

  const tenantId = session.metadata?.app_tenant_id ?? session.client_reference_id
  if (!tenantId) throw new Error("checkout session with no tenant reference")

  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items", "subscription"],
  })

  await grantAccess({
    tenantId,
    customerId: String(full.customer),
    subscriptionId: full.subscription ? String((full.subscription as Stripe.Subscription).id) : null,
    priceId: full.line_items?.data[0]?.price?.id ?? null,
  })

  break
}
```

Points worth keeping:

- **Read `payment_status`.** A completed session in `payment` mode is not necessarily paid — an asynchronous method can still be pending, and `checkout.session.async_payment_succeeded` is the event for that case.
- **Re-retrieve with `expand`.** The event payload omits line items and the full subscription.
- **Make `grantAccess` idempotent.** Stripe retries, and a duplicate event must not grant twice or extend a period.
- **Take the tenant from metadata**, which is why it was set on creation.

Also handle `customer.subscription.updated` and `customer.subscription.deleted`, or a later cancellation or payment failure leaves access granted forever. `checkout.session.completed` is the start of the story, not all of it. See `11ai-stripe-subscriptions`.

## Use the success page for confirmation only

```ts
export default async function Page({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams
  if (!session_id) redirect("/pricing")

  const { userId, orgId } = await auth()
  const session = await stripe.checkout.sessions.retrieve(session_id)

  if (session.metadata?.app_tenant_id !== (await tenantIdFor(orgId))) {
    redirect("/pricing")
  }

  return <Confirmation status={session.payment_status} />
}
```

Two rules. Verify the session belongs to the signed-in caller — a session id in a URL is guessable enough to matter, and an unchecked page leaks what someone else bought. And do not grant access here; if the page finds access not yet granted, show a brief "confirming your payment" state and let the webhook land.

## Let the portal handle management

```ts
const portal = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: `${origin}/settings/billing`,
})
```

Checkout is for buying; the portal is for everything after — card updates, invoices, plan changes, cancellation. Take the customer id from the caller's own tenant record, never from a request parameter.

## Verify

Test the paths that break, not just the happy one:

1. Complete a session with `4242 4242 4242 4242` and confirm access is granted **by the webhook**.
2. Complete one and close the tab before returning — access must still be granted.
3. Use `4000 0025 0000 3155` and complete the authentication step.
4. Use `4000 0000 0000 9995` and confirm no access is granted.
5. Cancel from the payment page and confirm the cancel URL is reached with nothing changed.
6. Resend `checkout.session.completed` and confirm nothing double-applies.
7. Visit the success page with another tenant's session id and confirm it refuses.
8. Confirm the amount recorded locally matches the price's `unit_amount`.

## Report

State the mode, how the price is resolved, the customer attachment, the metadata set on the session and the subscription, the success and cancel URLs, exactly where access is granted and that it is the webhook, what makes that grant idempotent, which additional subscription events are handled, and the verification results including the closed-tab, declined-card, and replay checks. Flag any price or amount taken from the browser, any access granted on the success page, and any success page not verifying session ownership.
