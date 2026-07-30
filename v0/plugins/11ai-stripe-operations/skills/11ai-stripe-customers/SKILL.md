---
name: 11ai-stripe-customers
description: "Create, find, and reconcile Stripe customers against local user or tenant records, covering lookup by metadata rather than email, storing the customer id locally, avoiding duplicates on retry, payment methods and the default for invoices, tax identifiers and addresses, the billing portal, and deleting versus keeping a customer. Use when a customer must be created for a user or organization, when duplicate customers appear, when a subscription cannot find its customer, or when local records and Stripe disagree."
---
# 11ai stripe customers

A customer is the anchor for every subscription, invoice, and payment method, so the important decision is what it maps to locally — a user or an organization — and how that link is stored. Duplicate customers are the characteristic failure here, and they come from creating one without checking first.

## Inspect first

```ts
import "server-only"
import { stripe } from "@/lib/stripe"

const found = await stripe.customers.search({
  query: `metadata['app_tenant_id']:'${tenantId}'`,
})

const byEmail = await stripe.customers.list({ email, limit: 10 })
console.log(byEmail.data.map((c) => ({ id: c.id, email: c.email, created: c.created })))
```

Search by your own metadata key, not by email. Stripe allows several customers with the same address, so an email lookup can return two and picking the first silently attaches a subscription to the wrong one.

Check the local side too:

```sql
select id, clerk_organization_id, stripe_customer_id from public.tenants where id = $1;
select count(*) from public.tenants where stripe_customer_id is null;
```

A tenant with no customer id and a customer whose metadata names that tenant is a broken link, not a missing customer — fix the link rather than creating another.

## Decide what a customer represents

Attach billing to the paying entity:

- **An organization or tenant** for anything sold per team. The subscription then survives the person who signed up leaving.
- **A user** only for a genuinely single-person product.

Getting this wrong is expensive to undo, because subscriptions, invoices, and payment methods all hang off the customer. If a per-team product creates one customer per user, every member ends up with their own subscription.

## Create without duplicating

```ts
export async function ensureCustomer(tenant: { id: string; name: string; email: string }) {
  const existing = await stripe.customers.search({
    query: `metadata['app_tenant_id']:'${tenant.id}'`,
  })
  if (existing.data[0]) return existing.data[0]

  return stripe.customers.create(
    {
      name: tenant.name,
      email: tenant.email,
      metadata: { app_tenant_id: tenant.id },
    },
    { idempotencyKey: `customer-${tenant.id}` }
  )
}
```

Three defences against duplicates, and all three are worth keeping:

- **Search by metadata before creating.**
- **An idempotency key derived from the tenant id**, so a retried request returns the same customer instead of a second one. A random or time-based key defeats this.
- **Store the id locally in the same transaction as whatever prompted the creation**, so a failure cannot leave a customer in Stripe that nothing references.

```sql
update public.tenants set stripe_customer_id = $2 where id = $1;
```

Put the link in both directions — the customer id on your row, and your id in the customer's `metadata`. That is what makes reconciliation possible when they drift.

Note that `search` is eventually consistent: a customer created a second ago may not appear yet. That is why the idempotency key matters as the second line of defence.

## Update, payment methods, and tax

```ts
await stripe.customers.update(customerId, {
  email: tenant.email,
  name: tenant.name,
  address: { line1, city, postal_code, country },
  metadata: { app_tenant_id: tenant.id },
})
```

`metadata` is replaced key by key, and passing an empty object clears nothing while passing a key with an empty string removes it. Read the current metadata and spread it if you mean to merge.

An address is not optional in practice: it determines tax calculation, and a missing country makes automatic tax fail or apply the wrong rate.

```ts
await stripe.paymentMethods.list({ customer: customerId, type: "card" })

await stripe.customers.update(customerId, {
  invoice_settings: { default_payment_method: paymentMethodId },
})

await stripe.customers.createTaxId({ type: "eu_vat", value: "DE123456789" })
```

Attaching a payment method does not make it the default for invoices — that is `invoice_settings.default_payment_method`, and forgetting it is a common cause of a renewal failing while a card is clearly on file.

Never handle raw card numbers. Collect payment methods through Checkout, Elements, or a setup intent, so the details never touch your server.

## Let the customer manage their own billing

```ts
const session = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: `${origin}/settings/billing`,
})
```

The portal handles card updates, invoice history, plan changes, and cancellation, configured in the dashboard. It removes most of the interface you would otherwise build, and it keeps card handling out of your application entirely.

Authorize before creating a session. Take the customer id from the caller's own tenant record, never from a request parameter — a portal session for someone else's customer exposes their invoices and lets the holder cancel their subscription.

## Delete carefully

```ts
await stripe.customers.del(customerId)
```

Deleting a customer cancels their subscriptions immediately and detaches their payment methods. It is irreversible, and invoice history stays for your records but the customer object is gone.

Almost always the wrong action. Prefer cancelling the subscription and marking your own record inactive, which keeps the billing history intact and attributable. If deletion is genuinely required, name the customer id and the tenant in the confirmation, report the active subscriptions it will cancel, and get explicit approval.

## Verify and reconcile

```ts
const customer = await stripe.customers.retrieve(customerId, {
  expand: ["subscriptions", "invoice_settings.default_payment_method"],
})
```

After a change, read the customer back and confirm the field, the metadata link, and the default payment method.

Reconcile on a schedule, because links do drift:

```ts
for await (const customer of stripe.customers.list({ limit: 100 })) {
  const tenantId = customer.metadata.app_tenant_id
  if (!tenantId) console.warn("customer with no tenant link", customer.id)
  else if (!(await tenantExists(tenantId))) console.warn("customer for missing tenant", customer.id)
}
```

Report the customer id and what it maps to, whether a search found an existing one before creating, the idempotency key used, the local field storing the link, the default payment method and address status, and anything cancelled or deleted with whether it is reversible. Flag duplicate customers for the same tenant, customers with no metadata link, and any billing portal session created from a request-supplied customer id.
