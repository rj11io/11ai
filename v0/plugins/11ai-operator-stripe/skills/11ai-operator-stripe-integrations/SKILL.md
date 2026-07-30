---
name: 11ai-operator-stripe-integrations
description: "Connect Stripe to the systems around it, covering the local billing mirror and how access is derived from it, linking customers to users or tenants and to an identity provider, entitlement checks in application code, the client library and Elements, tax and invoicing configuration, reconciliation jobs, revenue reporting exports, and pipeline test and deploy steps. Use when billing state must drive access, when Stripe must link to an identity provider or database, or when local records and Stripe disagree."
---
# 11ai stripe integrations

Stripe holds the money; your database holds access. The integration is the mirror between them, and one rule carries it: access is derived from the mirrored subscription status on every request, never from a flag set once when a payment succeeded. Everything else is plumbing around that.

## Name the seam

- **Billing mirror** — customers, subscriptions, and invoices copied into local tables keyed on Stripe ids, kept current by webhooks and a reconciliation job.
- **Entitlements** — a single function that turns mirrored status into a yes or no, called by every protected path.
- **Identity link** — the customer attached to a user or an organization from your identity provider, linked in both directions.
- **Client library** — the publishable key, Elements or Checkout, and nothing privileged in the browser.
- **Tax and invoicing** — automatic tax, addresses, tax identifiers, and invoice settings.
- **Reporting** — exports for finance, read-only and reconciled against Stripe's own reports.
- **Pipelines** — tests that do not call a live account, and a deploy that does not carry test keys.

## Wire one deliberately

1. Inspect first: which local tables already hold Stripe ids, how access is currently decided, whether webhooks update the mirror, and whether any reconciliation runs.
2. Mirror on Stripe ids — `stripe_customer_id`, `stripe_subscription_id` — and treat Stripe as authoritative for money and status. Never key on email.
3. Write one entitlement function and call it everywhere. Scattered status checks drift, and one of them will keep granting access after a cancellation.
4. Attach the customer to the paying entity — usually an organization, not the person who signed up — so the subscription survives them leaving.
5. Keep the mirror current with webhooks for speed **and** a scheduled reconciliation for correctness. Events get missed, and the failure mode is someone keeping access they stopped paying for.
6. Keep the secret key server-side and send only a `client_secret` or a Checkout URL to the browser. Read [references/integrations.md](references/integrations.md) for the mirror schema, the entitlement function, the identity link, the client wiring, tax settings, reconciliation, and the pipeline.

## Verify end to end

- Complete a test purchase and confirm access is granted by the webhook, then cancel and confirm access ends when the period does.
- Simulate a failed payment and confirm the status moves and access follows the rule you chose for `past_due`.
- Delete the local mirror row for an active subscription, run reconciliation, and confirm it is restored.
- Run reconciliation twice and confirm the second run reports no changes.
- Confirm the amount and currency in the local order match the Stripe object exactly, as integers.
- Confirm no secret key appears in the client bundle, and that a protected route refuses an unentitled tenant.

## Report

State the seam wired, the mirror tables and their keys, the single entitlement function and every path that calls it, how the customer links to a user or organization in both directions, which webhook events maintain the mirror, whether reconciliation runs and on what schedule, how tax and invoicing are configured, the files changed, and the verification evidence including the cancellation and reconciliation checks. Never print secret keys, signing secrets, or customer payment details. Flag any access decision made from a one-time flag, any mirror without reconciliation, any amount held as a floating point number, and any secret reachable from client code.
