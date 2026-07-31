---
name: 11ai-operator-stripe-environment
description: "Confirm which Stripe account and mode an application is using, whether the key pair is consistent, whether any secret key is reachable from client code, the pinned API version, which webhook endpoints and enabled events exist, and the products and prices configured, without changing anything. Use before any Stripe operation, when a customer or price seems missing, when a webhook is not arriving, or when the user asks whether Stripe is set up."
---
# 11ai stripe environment

Version baseline: Stripe API 2026-02-25.clover and the latest stable SDK for the project language. Preserve an existing account, endpoint, or SDK pin unless the user explicitly requests an upgrade, and validate the compatibility table before moving API versions.

Test mode and live mode are separate datasets on the same account, and live mode moves real money. Confirm which one is in play before touching anything — this is the check that prevents the worst mistakes in this plugin. Keep this pass read-only.

## Confirm the mode and the keys

```bash
grep -o 'pk_test\|pk_live\|sk_test\|sk_live\|rk_test\|rk_live' .env.local 2>/dev/null | sort -u
grep -o '^[A-Z_]*' .env.local 2>/dev/null | sort
grep -c 'STRIPE_WEBHOOK_SECRET' .env.local 2>/dev/null
```

The prefixes answer the question without printing anything sensitive. A `pk_live` paired with an `sk_test` is a real misconfiguration: the browser collects a payment method against the live account while the server acts on the test one, and the failure is confusing rather than obvious.

```bash
grep -rn 'STRIPE_SECRET_KEY\|STRIPE_WEBHOOK_SECRET' --include='*.tsx' app/ components/ src/ 2>/dev/null
grep -rn 'NEXT_PUBLIC.*STRIPE_SECRET\|NEXT_PUBLIC.*WEBHOOK_SECRET' . --include='.env*' --include='*.ts' --include='*.tsx' 2>/dev/null
```

Both must return nothing. A secret key in the browser bundle grants full access to the account — reading every customer, issuing refunds, creating charges. Report it as an exposure, treat the key as compromised, and say it must be rolled in the dashboard.

List variable **names** only. Never `cat` an environment file.

## Confirm the account and API version

```bash
stripe config --list
```

```ts
// scripts/check-stripe.ts — server-side only
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const account = await stripe.accounts.retrieve()
console.log({
  id: account.id,
  country: account.country,
  chargesEnabled: account.charges_enabled,
  defaultCurrency: account.default_currency,
})
```

Read the account id back and confirm it is the intended account. An organization with several accounts — a sandbox, a production one, a client's — is exactly where a key ends up pointing somewhere unexpected.

```bash
grep -rn 'new Stripe(' --include='*.ts' src/ app/ lib/ 2>/dev/null
```

Check whether the API version is pinned in code. An unpinned client uses the account's default version, which can change and alter response shapes without a code change. A pinned version means upgrades are deliberate.

## Read the configured objects

```ts
const prices = await stripe.prices.list({ active: true, limit: 20, expand: ["data.product"] })
console.log(prices.data.map((p) => ({
  id: p.id,
  amount: p.unit_amount,
  currency: p.currency,
  interval: p.recurring?.interval,
  product: typeof p.product === "object" ? p.product.name : p.product,
})))

const endpoints = await stripe.webhookEndpoints.list({ limit: 10 })
console.log(endpoints.data.map((e) => ({
  url: e.url,
  status: e.status,
  events: e.enabled_events,
  apiVersion: e.api_version,
})))
```

Read the webhook endpoints carefully. Three things go wrong here and each is visible in that output: the endpoint is disabled, its `enabled_events` list omits an event the application depends on, or its `api_version` differs from the client's so payload shapes disagree.

Amounts are integers in minor units. A `unit_amount` of `2000` is 20.00 in a two-decimal currency — read them as such rather than assuming a decimal.

## Interpretation

- **A customer, price, or subscription that "does not exist"** — almost always the wrong mode. Check the key prefix first.
- **A mismatched key pair** — the browser and server are acting on different datasets.
- **`No such customer` with a valid-looking id** — the id was created in the other mode. Ids are mode-scoped.
- **Webhooks not arriving** — the endpoint is disabled, the event type is not in `enabled_events`, the route is protected by authentication middleware, or a body parser runs before signature verification.
- **A payload field missing that the documentation shows** — the endpoint's API version differs from the client's, or a field needs `expand`.
- **`Invalid API Key provided`** — the key is truncated, revoked, or from another account.
- **Live mode with `charges_enabled` false** — account onboarding is incomplete, so no charge will succeed regardless of the code.

## Report

State which mode and account the keys target and whether the pair is consistent, the variable names present, whether the API version is pinned and to what, the active prices with their amounts and intervals, the webhook endpoints with their status, enabled events, and API version, and whether charges are enabled. Report secrets as set or unset only. Flag any secret key reachable from client code as requiring rotation. End with the smallest next safe step, and hand off to `11ai-operator-stripe-setup` if values are missing or to `11ai-operator-stripe-troubleshooting` if something is already failing.
