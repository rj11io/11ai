---
name: 11ai-operator-stripe-products-and-prices
description: "Model Stripe products and prices and change pricing safely, covering the immutability of a price, amounts in minor units and zero-decimal currencies, recurring intervals and trials, tiered and metered pricing, multiple currencies, lookup keys instead of hard-coded ids, deactivating rather than deleting, and grandfathering existing subscribers when a price changes. Use when a plan must be created, when an amount or currency must change, when a price id must be referenced from code, or when subscribers are on an outdated price."
---
# 11ai stripe products and prices

Version baseline: Stripe API 2026-02-25.clover and the latest stable SDK for the project language. Preserve an existing account, endpoint, or SDK pin unless the user explicitly requests an upgrade, and validate the compatibility table before moving API versions.

The fact that shapes every decision here: a price is immutable. Its amount, currency, and interval cannot be edited, so changing a price means creating a new one and deciding what happens to everyone on the old one. Plan that before creating anything.

## Inspect first

```ts
import "server-only"
import { stripe } from "@/lib/stripe"

const prices = await stripe.prices.list({ active: true, limit: 100, expand: ["data.product"] })
console.log(prices.data.map((p) => ({
  id: p.id,
  lookupKey: p.lookup_key,
  amount: p.unit_amount,
  currency: p.currency,
  interval: p.recurring?.interval,
  product: typeof p.product === "object" ? p.product.name : p.product,
})))
```

```bash
grep -rn 'price_' --include='*.ts' --include='*.tsx' src/ app/ lib/ 2>/dev/null | head
grep -o 'STRIPE_PRICE[A-Z_]*' .env.local 2>/dev/null
```

Read amounts as integers in the currency's minor unit: `2000` is 20.00 in a two-decimal currency. Zero-decimal currencies such as JPY take the whole number, so `2000` is 2000 JPY. Never represent money as a floating point number anywhere in the codebase.

A hard-coded `price_...` in application source is worth flagging — it makes a pricing change a deploy, and it will not exist in the other mode.

## Model the product and price

A product is the thing being sold; a price is one way to charge for it. One product with several prices is the normal shape: monthly and yearly, or several currencies.

```ts
const product = await stripe.products.create({
  name: "Pro plan",
  description: "For growing teams",
  metadata: { app_plan: "pro" },
})

const monthly = await stripe.prices.create({
  product: product.id,
  unit_amount: 2000,
  currency: "eur",
  recurring: { interval: "month" },
  lookup_key: "pro_monthly",
  metadata: { app_plan: "pro" },
})

const yearly = await stripe.prices.create({
  product: product.id,
  unit_amount: 20000,
  currency: "eur",
  recurring: { interval: "year" },
  lookup_key: "pro_yearly",
})
```

Set a `lookup_key`. It lets code ask for `pro_monthly` rather than embedding an id that differs between test and live mode:

```ts
const prices = await stripe.prices.list({ lookup_keys: ["pro_monthly"], active: true })
const price = prices.data[0]
if (!price) throw new Error("price pro_monthly not found")
```

Put your own plan identifier in `metadata` on both the product and the price, so a webhook can map a subscription back to a plan without a second lookup.

Never accept an amount, currency, or interval from the browser. Look the price up on the server from a plan name or lookup key you control — a client that can send an amount can send `1`.

## Other pricing shapes

```ts
await stripe.prices.create({
  product: productId,
  currency: "eur",
  recurring: { interval: "month" },
  billing_scheme: "tiered",
  tiers_mode: "graduated",
  tiers: [
    { up_to: 10, unit_amount: 500 },
    { up_to: "inf", unit_amount: 300 },
  ],
})
```

`graduated` charges each tier's rate for the units in that tier; `volume` charges every unit at the rate of the tier reached. They produce different totals for the same usage, and picking the wrong one is a billing error rather than a preference.

```ts
await stripe.prices.create({
  product: productId,
  currency: "eur",
  recurring: { interval: "month", usage_type: "metered" },
  unit_amount: 10,
})
```

Metered pricing bills reported usage, so the reporting side has to be reliable and idempotent — double-reported usage is double-billed.

```ts
await stripe.prices.create({
  product: productId,
  currency: "eur",
  unit_amount: 2000,
  recurring: { interval: "month" },
  currency_options: {
    usd: { unit_amount: 2200 },
    gbp: { unit_amount: 1800 },
  },
})
```

Set each currency's amount deliberately rather than converting at display time. A converted price changes daily and reconciles badly.

Trials belong on the subscription or the Checkout session, not on the price, so the same price can be used with and without one.

## Change a price without breaking subscribers

A price cannot be edited. Only `active`, `metadata`, `nickname`, and `lookup_key` can change. To change an amount:

1. **Create the new price** on the same product.
2. **Move the lookup key.** Remove it from the old price and set it on the new one, so code picks up the change with no deploy:

   ```ts
   await stripe.prices.update(oldPriceId, { lookup_key: undefined })
   await stripe.prices.update(newPriceId, { lookup_key: "pro_monthly" })
   ```

3. **Decide about existing subscribers.** Two honest options:
   - **Grandfather them.** Leave them on the old price and deactivate it for new sign-ups. Simplest and kindest.
   - **Migrate them.** Update each subscription's item to the new price, with a chosen proration behaviour, after telling them. See `11ai-operator-stripe-subscriptions`.

4. **Deactivate the old price** so nothing new uses it:

   ```ts
   await stripe.prices.update(oldPriceId, { active: false })
   ```

Deactivating a price does **not** change existing subscriptions — they keep billing at that price. That is the behaviour that makes grandfathering easy and also the one that surprises people who expected a deactivation to migrate everyone.

Raising a price on existing subscribers without notice is a customer-trust and often a legal problem, not just a technical one. Treat a migration as a decision the user makes, and say so plainly if asked to do it silently.

## Archive rather than delete

```ts
await stripe.products.update(productId, { active: false })
await stripe.prices.update(priceId, { active: false })
```

A price with any usage cannot be deleted, only deactivated. Deactivation hides it from new purchases and keeps the history intact, which is what you want — invoice history must stay attributable.

Deleting a product is possible only when it has no prices with usage, and it is rarely worth doing.

## Verify

```ts
const check = await stripe.prices.retrieve(newPriceId, { expand: ["product"] })
const active = await stripe.prices.list({ active: true, limit: 100 })
const onOld = await stripe.subscriptions.list({ price: oldPriceId, status: "active", limit: 100 })
```

After a pricing change, confirm the lookup key resolves to the new price, the old price is inactive, and count how many subscriptions still reference it — that number is the grandfathered population and it should be a deliberate figure, not a surprise.

Create the same products and prices in live mode separately. Test mode ids do not exist there, which is why lookup keys and configuration beat hard-coded ids.

## Report

State the product and price ids created with their amounts, currencies, and intervals, the lookup keys and where code reads them, the pricing shape chosen and why for tiered or metered, what happened to the previous price and how many subscriptions remain on it, whether subscribers were grandfathered or migrated and whether they were told, and the verification results. Flag any hard-coded price id in source, any amount accepted from the browser, and any money value held as a floating point number.
