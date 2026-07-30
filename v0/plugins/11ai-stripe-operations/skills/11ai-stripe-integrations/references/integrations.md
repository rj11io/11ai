# Stripe integrations reference

## Billing mirror

```sql
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  external_organization_id text unique not null,
  name text not null,
  stripe_customer_id text unique,
  created_at timestamptz default now()
);

create table public.subscriptions (
  stripe_subscription_id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  stripe_customer_id text not null,
  status text not null,
  price_id text not null,
  plan text not null,
  quantity integer not null default 1,
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  stripe_event_created timestamptz,
  updated_at timestamptz default now()
);

create index subscriptions_tenant_idx on public.subscriptions (tenant_id);

create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz default now(),
  processed_at timestamptz
);
```

Two columns earn special mention. `stripe_event_created` lets a handler ignore an event older than the last one applied, which is what stops a late retry reverting a newer change. And `plan` is your own vocabulary, derived from the price, so application code never reasons about `price_...` ids.

```ts
export async function upsertSubscription(sub: Stripe.Subscription, eventCreated?: number) {
  const item = sub.items.data[0]
  const tenantId = sub.metadata.app_tenant_id ?? (await tenantIdByCustomer(String(sub.customer)))
  if (!tenantId) throw new Error(`subscription ${sub.id} has no tenant link`)

  await db.query(
    `insert into public.subscriptions (
       stripe_subscription_id, tenant_id, stripe_customer_id, status, price_id, plan,
       quantity, cancel_at_period_end, current_period_end, stripe_event_created
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (stripe_subscription_id) do update set
       status = excluded.status,
       price_id = excluded.price_id,
       plan = excluded.plan,
       quantity = excluded.quantity,
       cancel_at_period_end = excluded.cancel_at_period_end,
       current_period_end = excluded.current_period_end,
       stripe_event_created = excluded.stripe_event_created,
       updated_at = now()
     where public.subscriptions.stripe_event_created is null
        or excluded.stripe_event_created >= public.subscriptions.stripe_event_created`,
    [
      sub.id,
      tenantId,
      String(sub.customer),
      sub.status,
      item.price.id,
      planForPrice(item.price),
      item.quantity ?? 1,
      sub.cancel_at_period_end,
      item.current_period_end ? new Date(item.current_period_end * 1000) : null,
      eventCreated ? new Date(eventCreated * 1000) : null,
    ]
  )
}
```

The `where` clause on the update is the out-of-order guard: an older event cannot overwrite a newer state. Without it, a retry delivered late downgrades a customer who has already upgraded.

## Entitlements: one function, called everywhere

```ts
// lib/billing/entitlements.ts
const ACTIVE_STATUSES = new Set(["trialing", "active", "past_due"])

export type Entitlement = { plan: string; active: boolean; seats: number }

export async function entitlementFor(tenantId: string): Promise<Entitlement> {
  const row = await db.queryOne(
    `select plan, status, quantity from public.subscriptions
     where tenant_id = $1 and status = any($2)
     order by updated_at desc limit 1`,
    [tenantId, [...ACTIVE_STATUSES]]
  )

  if (!row) return { plan: "free", active: false, seats: 1 }
  return { plan: row.plan, active: true, seats: row.quantity }
}

export async function requirePlan(tenantId: string, plans: string[]) {
  const entitlement = await entitlementFor(tenantId)
  if (!plans.includes(entitlement.plan)) throw new HttpError(403, "upgrade_required")
  return entitlement
}
```

```ts
export async function POST(request: Request) {
  const { orgId } = await auth()
  const tenantId = await tenantIdForOrganization(orgId!)
  await requirePlan(tenantId, ["pro", "enterprise"])
  // ...
}
```

One function, one place to change the `past_due` decision, one place to audit. Scattered `status === "active"` checks are where a cancelled customer keeps a feature nobody noticed.

Whether `past_due` keeps access is a business decision. Keeping it through the retry window is usually right — an expired card is not a defaulting customer — and keeping it through `unpaid` is giving the product away.

Never derive access from a one-time flag written at purchase. A subscription changes state on its own, and a boolean set once never hears about it.

## Linking to an identity provider

```ts
export async function ensureCustomerForOrganization(org: {
  id: string
  name: string
  email: string
}) {
  const tenant = await tenantByExternalOrganizationId(org.id)
  if (tenant?.stripe_customer_id) {
    return stripe.customers.retrieve(tenant.stripe_customer_id)
  }

  const found = await stripe.customers.search({
    query: `metadata['app_tenant_id']:'${tenant!.id}'`,
  })
  if (found.data[0]) {
    await db.query(`update public.tenants set stripe_customer_id = $2 where id = $1`, [
      tenant!.id,
      found.data[0].id,
    ])
    return found.data[0]
  }

  const customer = await stripe.customers.create(
    {
      name: org.name,
      email: org.email,
      metadata: { app_tenant_id: tenant!.id, external_organization_id: org.id },
    },
    { idempotencyKey: `customer-${tenant!.id}` }
  )

  await db.query(`update public.tenants set stripe_customer_id = $2 where id = $1`, [
    tenant!.id,
    customer.id,
  ])

  return customer
}
```

Three defences against duplicate customers, all worth keeping: check the local link, then search Stripe by metadata, then create with an idempotency key derived from the tenant id. `search` is eventually consistent, which is why the key is the last line of defence rather than the first.

Store the link in both directions — the customer id on the tenant row, the tenant id in the customer's metadata. That is what makes reconciliation possible when they drift.

Attach billing to the organization, not the user who signed up, or the subscription follows them out of the company.

## Client wiring

```tsx
// Checkout: the server creates the session, the browser follows the URL
const response = await fetch("/api/billing/checkout", {
  method: "POST",
  body: JSON.stringify({ plan: "pro_monthly" }),
})
const { url } = await response.json()
window.location.assign(url)
```

Send a plan name, not a price id or an amount. The server resolves it by lookup key.

```tsx
// Elements: the server creates the intent, the browser gets only the client secret
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function PaymentForm({ clientSecret }: { clientSecret: string }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <Form />
    </Elements>
  )
}

function Form() {
  const stripe = useStripe()
  const elements = useElements()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/orders/done` },
    })
    if (error) setMessage(error.message ?? "Payment failed")
  }

  return <form onSubmit={onSubmit}><PaymentElement /><button>Pay</button></form>
}
```

The `client_secret` is scoped to one intent and is safe in the browser. The secret key never is. And the client's result is not the source of truth — a network failure after a successful payment shows the user an error for a charge that went through, which is why the webhook decides.

For the management surface, use the billing portal rather than building card and invoice screens:

```ts
const { orgId } = await auth()
const tenant = await tenantForOrganization(orgId!)

const portal = await stripe.billingPortal.sessions.create({
  customer: tenant.stripe_customer_id!,
  return_url: `${origin}/settings/billing`,
})
```

Take the customer id from the caller's own tenant record. A portal session created from a request-supplied customer id exposes another customer's invoices and lets the holder cancel their subscription.

## Tax and invoicing

```ts
await stripe.checkout.sessions.create({
  // ...
  automatic_tax: { enabled: true },
  customer_update: { address: "auto", name: "auto" },
  tax_id_collection: { enabled: true },
  invoice_creation: { enabled: true },
})
```

Automatic tax needs an address, which is why `customer_update` is there. Without one, tax is wrong or the session fails outright.

`tax_id_collection` lets business customers enter a VAT identifier, which changes the tax treatment and is usually required for business sales in the European Union.

```ts
await stripe.customers.update(customerId, {
  invoice_settings: {
    default_payment_method: paymentMethodId,
    custom_fields: [{ name: "Purchase order", value: poNumber }],
  },
})
```

Attaching a payment method does not make it the default for invoices. Forgetting `invoice_settings.default_payment_method` is a common cause of a renewal failing while a card is visibly on file.

Registering for tax collection in a jurisdiction is a legal step, not a code change. Say so rather than enabling something that implies compliance.

## Reconciliation

```ts
// jobs/reconcile-billing.ts
export async function reconcileBilling() {
  const seen = new Set<string>()

  for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) {
    seen.add(sub.id)
    await upsertSubscription(sub)
  }

  const local = await db.query(
    `select stripe_subscription_id from public.subscriptions where status = any($1)`,
    [["trialing", "active", "past_due"]]
  )

  for (const row of local.rows) {
    if (!seen.has(row.stripe_subscription_id)) {
      await db.query(
        `update public.subscriptions set status = 'canceled', updated_at = now()
         where stripe_subscription_id = $1`,
        [row.stripe_subscription_id]
      )
      console.warn("marked missing subscription canceled", row.stripe_subscription_id)
    }
  }

  for await (const customer of stripe.customers.list({ limit: 100 })) {
    if (!customer.metadata.app_tenant_id) {
      console.warn("customer with no tenant link", customer.id)
    }
  }
}
```

The second loop is the half that matters. It catches subscriptions that ended while the webhook endpoint was down — precisely the case where someone keeps access after they stopped paying. A mirror fed only by webhooks drifts, and the drift is invisible until it costs money.

Run it daily, and after any incident affecting the endpoint. Stripe's retry window expires, so replaying events is not a substitute.

## Reporting

```ts
const report = await stripe.reporting.reportRuns.create({
  report_type: "balance.summary.1",
  parameters: {
    interval_start: Math.floor(startDate.getTime() / 1000),
    interval_end: Math.floor(endDate.getTime() / 1000),
  },
})
```

Use Stripe's own reports for anything finance relies on. A total computed from your mirror will disagree with Stripe's, because fees, refunds, disputes, and currency conversion are not in the mirror — and the disagreement surfaces at the worst moment.

Keep reporting read-only and never derive an amount owed from local data alone.

## Pipeline

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
        env:
          STRIPE_SECRET_KEY: sk_test_dummy_for_stubbed_tests
          STRIPE_WEBHOOK_SECRET: whsec_dummy
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pk_test_dummy
      - run: npm run build
        env:
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pk_test_dummy
```

Stub Stripe in unit tests rather than calling a live account — a suite hitting the API is slow, flaky, and creates real test-mode objects that accumulate. Keep a small number of genuine integration checks in a separate job that runs against test mode on a schedule.

The build needs the publishable key because it is compiled into the bundle.

Never put a live key in a pipeline used by tests, and never let a test job run against live mode. Before promoting, confirm in live mode: the products and prices exist (test ids do not carry over), the webhook endpoint is registered with its own secret and the right `enabled_events`, its API version matches the pinned one, `charges_enabled` is true, and alerting exists on `invoice.payment_failed` and `charge.dispute.created`.
