# Stripe setup reference

## Modes and keys

| Prefix | Meaning |
| --- | --- |
| `pk_test` / `sk_test` | Test mode. No real money |
| `pk_live` / `sk_live` | Live mode. Real money |
| `whsec_...` | Webhook signing secret, per endpoint |
| `rk_...` | Restricted key, scoped permissions |

Test and live are separate datasets on the same account. A customer, price, or subscription id from one does not exist in the other, which is why `No such customer` with a valid-looking id almost always means the wrong mode.

```text
# .env.local  (ignored)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
```

```text
# .env.example  (committed, no values)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
```

```bash
grep -q '^\.env' .gitignore || echo "env files are NOT ignored"
grep -rn 'NEXT_PUBLIC.*STRIPE_SECRET\|NEXT_PUBLIC.*WEBHOOK_SECRET' . --include='.env*' --include='*.ts' --include='*.tsx' 2>/dev/null
```

The second command must return nothing. A secret key in the browser bundle lets anyone read every customer and issue refunds.

For a service that only needs part of the API — a reporting job, say — use a restricted key with just the permissions it needs rather than the full secret key.

## Install

```bash
npm install stripe @stripe/stripe-js
```

`stripe` is the server library. `@stripe/stripe-js` is the browser one and takes only the publishable key.

## Server client

```ts
// lib/stripe.ts
import "server-only"
import Stripe from "stripe"

const key = process.env.STRIPE_SECRET_KEY
if (!key) throw new Error("STRIPE_SECRET_KEY is not set")

export const stripe = new Stripe(key, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
  maxNetworkRetries: 2,
  timeout: 20_000,
})
```

Each option earns its place:

- **`server-only`** turns a mistaken client import into a build error rather than a leaked key.
- **A pinned `apiVersion`.** Without it the client follows the account's default, which can change and alter response shapes with no code change. Upgrades then become deliberate.
- **`maxNetworkRetries`.** Stripe's library retries safe failures and attaches an idempotency key itself, so a network blip does not become a lost call.
- **`timeout`.** The default is long; a bounded one keeps a slow response from holding a request.
- **Throwing on a missing key at import.** A silent `undefined` produces an authentication error far from the cause.

## CLI and local forwarding

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

```text
> Ready! Your webhook signing secret is whsec_abc123 (^C to quit)
```

That secret belongs to the CLI session, not to any dashboard endpoint. Put it in `.env.local` while developing; a dashboard endpoint's secret will not verify CLI-forwarded events.

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe \
  --events checkout.session.completed,customer.subscription.updated,invoice.payment_failed
```

```bash
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
stripe logs tail
stripe events list --limit 10
stripe events resend evt_...
```

`stripe trigger` creates the objects the event needs, so the payload is realistic. `stripe events resend` is how you test idempotency.

## Webhook route

### Next.js App Router

```ts
// app/api/webhooks/stripe/route.ts
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { handleStripeEvent } from "@/lib/billing/events"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return Response.json({ error: "missing_signature" }, { status: 400 })
  }

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
  await handleStripeEvent(event)

  return Response.json({ received: true })
}
```

`await request.text()` gives the raw bytes. Verification is over the exact payload Stripe signed, so parsing first and re-serializing produces a different string and every verification fails.

Return 401 on a bad signature. A 500 makes Stripe retry a request that can never verify, and the retries accumulate.

### Express

```ts
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"] as string
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch {
      return res.status(401).json({ error: "invalid_signature" })
    }
    res.json({ received: true })
    void handleStripeEvent(event)
  }
)

app.use(express.json())
```

Mount the raw parser on this route **before** the global `express.json()`. Order in the file is the whole difference between a working endpoint and one that never verifies.

### Keep the route public

```ts
// middleware.ts
const isPublicRoute = createRouteMatcher(["/api/webhooks(.*)", "/sign-in(.*)"])
```

Stripe has no session. Authentication middleware protecting this path returns a redirect, Stripe records a delivery failure, and nothing in the application logs explains it.

## Idempotency

```sql
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz default now(),
  processed_at timestamptz
);
```

Insert the event id first and let the primary key reject a duplicate. Stripe retries with backoff for up to three days, so a handler that is not idempotent grants a plan twice or emails two receipts.

On the request side, pass an idempotency key to any create that costs money:

```ts
await stripe.paymentIntents.create(
  { amount, currency: "eur", customer: customerId },
  { idempotencyKey: `order-${orderId}` }
)
```

The key must be derived from something stable — an order id, not a timestamp or a random value. A random key makes every retry a new charge.

## First product and price

```bash
stripe products create --name "Pro plan"
stripe prices create \
  --product prod_... \
  --unit-amount 2000 \
  --currency eur \
  -d "recurring[interval]=month"
```

```ts
const product = await stripe.products.create({ name: "Pro plan" })
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 2000,
  currency: "eur",
  recurring: { interval: "month" },
})
```

Amounts are integers in the minor unit: `2000` is 20.00 EUR. Zero-decimal currencies such as JPY take the whole number, so `2000` is 2000 JPY. Never represent money as a floating point number.

Prices are effectively immutable. Changing an amount means creating a new price and deactivating the old one — existing subscriptions keep the old price until moved. Keep price ids in configuration:

```text
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
```

Look the price up on the server from an identifier you control. Never accept an amount or a price from the browser — a client that can send an amount can send `1`.

## Verify

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
stripe events resend evt_...
curl -i -X POST http://localhost:3000/api/webhooks/stripe -d '{}' -H 'stripe-signature: bad'
```

In order: the handler receives and records the event; the resend applies nothing new; the bad signature returns 401 and changes nothing.

Then complete a real test flow with `4242 4242 4242 4242` and confirm the amount recorded locally equals the price's `unit_amount`.

## Before going live

- Roll the test keys out and add the live pair, in the deployment's secret store rather than a file.
- Create the products and prices again in live mode — test ids do not exist there.
- Register the production webhook endpoint and use **its** signing secret, not the CLI's.
- Confirm the endpoint's `enabled_events` covers everything the application handles.
- Confirm `charges_enabled` is true on the account; incomplete onboarding blocks every charge.
- Confirm the API version pinned in code matches the webhook endpoint's version, or payload shapes will differ.
- Set up alerting on `invoice.payment_failed` and `charge.dispute.created`.
- Complete one real low-value purchase and refund it.
