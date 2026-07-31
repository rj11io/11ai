---
name: 11ai-operator-stripe-troubleshooting
description: "Diagnose Stripe failures from reproducible evidence, covering test and live mode confusion, mismatched key pairs, secret keys reachable from the browser, webhook signature failures and protected webhook routes, API version mismatches on an endpoint, duplicate charges from missing idempotency keys, duplicate customers, subscriptions billed for two items, access that does not match subscription status, amount and currency mismatches, and declines versus errors. Use when a payment, subscription, or webhook misbehaves, when a customer or price seems missing, or when local records and Stripe disagree."
---
# 11ai stripe troubleshooting

Version baseline: Stripe API 2026-02-25.clover and the latest stable SDK for the project language. Preserve an existing account, endpoint, or SDK pin unless the user explicitly requests an upgrade, and validate the compatibility table before moving API versions.

Separate observed facts from theories. The first question is always which mode and which account, because test and live are separate datasets and a missing object is usually the wrong one. Never disable signature verification, never issue a refund to clear a symptom, and never retry a charge without checking whether the first one succeeded.

## Evidence collection

```bash
grep -o 'pk_test\|pk_live\|sk_test\|sk_live' .env.local 2>/dev/null | sort -u
grep -rn 'STRIPE_SECRET_KEY' --include='*.tsx' app/ components/ src/ 2>/dev/null
grep -rn 'api/webhooks' middleware.ts src/middleware.ts 2>/dev/null
grep -rn 'express.json\|bodyParser' --include='*.ts' src/ 2>/dev/null | head
date -u
stripe logs tail
stripe events list --limit 10
```

```ts
const intent = await stripe.paymentIntents.retrieve(id, { expand: ["latest_charge"] })
console.log({ status: intent.status, amount: intent.amount, received: intent.amount_received, error: intent.last_payment_error?.code })

const endpoints = await stripe.webhookEndpoints.list({ limit: 10 })
console.log(endpoints.data.map((e) => ({ url: e.url, status: e.status, apiVersion: e.api_version })))
```

`stripe logs tail` shows every API request the account received with its response, which usually names the problem before any code is read. The dashboard's webhook delivery log does the same for events.

`date -u` matters: a server clock outside the signature tolerance window breaks webhook verification.

Print key prefixes, not keys. Report secrets as set or unset.

## Classify the failure

- **`No such customer`, `No such price`, or a missing subscription with a valid-looking id** — the wrong mode. Ids are mode-scoped, so a test id does not exist in live mode. Check the key prefix first; this is the most common report.
- **A mismatched key pair** — `pk_live` with `sk_test` or the reverse. The browser and server act on different datasets and the failure is confusing rather than obvious.
- **`Invalid API Key provided`** — the key is truncated, revoked, or from another account. Read the account id back with `accounts.retrieve`.
- **A secret key in the client bundle** — full account access is in the browser: reading every customer, issuing refunds. Roll the key in the dashboard and treat it as a disclosure, not just a bug.
- **Webhooks never arriving** — four causes, in this order: the route is protected by authentication middleware so Stripe receives a redirect, the endpoint is disabled, the event type is not in `enabled_events`, or the URL is wrong. All four are visible in the endpoint listing and the delivery log.
- **Webhook signature always failing** — a body parser ran before verification and destroyed the raw bytes, the secret belongs to another endpoint or mode, or the clock is outside the tolerance window. The CLI's `stripe listen` secret is not a dashboard endpoint's secret.
- **A payload field missing that the documentation shows** — the endpoint's `api_version` differs from the client's pinned version, or the field needs `expand`.
- **The same event applied twice** — no idempotency store on the receiving side. Retries run for up to about three days.
- **A customer charged twice** — a create without an idempotency key, or one keyed on a timestamp or random value rather than something stable. Check `payment_intents.list` for the customer before retrying anything.
- **Duplicate customers for one tenant** — created without searching by metadata first, or with a non-deterministic idempotency key. Pick the one with the subscriptions, repoint the local link, and leave the empty one rather than deleting it.
- **A subscription billing for two plans** — an update that omitted the existing item id, which adds an item instead of replacing the price. Inspect `items.data` and remove the extra item.
- **Access not matching what someone pays for** — access was granted from a one-time flag at purchase instead of derived from the current subscription status, or only `checkout.session.completed` is handled so cancellations never revoke. Both need the lifecycle events and a single entitlement function.
- **A cancelled customer keeping access** — the mirror missed `customer.subscription.deleted` and no reconciliation runs.
- **An amount that is wrong by a factor of a hundred** — a decimal treated as minor units, or the reverse. Amounts are integers in the minor unit, and zero-decimal currencies such as JPY take the whole number.
- **A renewal failing with a card on file** — `invoice_settings.default_payment_method` was never set. Attaching a payment method does not make it the invoice default.
- **A card declined** — this is an outcome, not an error. Read `last_payment_error.code` and `decline_code`, tell the customer, and do not retry automatically; a retried decline can look like abuse.
- **`charges_enabled` false in live mode** — account onboarding is incomplete and no charge will succeed regardless of the code.
- **Automatic tax failing** — the customer has no address, so tax cannot be determined.

## Remediation discipline

1. Establish the mode and account before reading application code. Many reports end there.
2. Read `stripe logs tail` and the webhook delivery log before hypothesising. The request and its response are already recorded.
3. **Check for a successful charge before retrying anything.** List the customer's recent payment intents. Retrying a charge that already succeeded takes money twice, and that is far harder to put right than the original failure.
4. Fix the cause, not the symptom. Disabling signature verification makes the endpoint forgeable; refunding to clear a support ticket loses the fee; widening a status check to include `unpaid` gives the product away.
5. State confidence as high, medium, or low and name the evidence you are missing.
6. Make one bounded change, then rerun the full flow in test mode — purchase, webhook, entitlement, cancellation — not the single call.
7. After fixing a webhook problem, resend the missed events **and** run reconciliation. The retry window expires, so resending alone leaves gaps.
8. Never issue a refund on a disputed charge; that can result in paying twice. Respond through the dispute process.

Hand off when the cause is elsewhere: `11ai-operator-stripe-environment` for mode and key questions, `11ai-operator-stripe-setup` if wiring is missing, `11ai-operator-stripe-webhooks` for delivery and verification, `11ai-operator-stripe-subscriptions` for status and proration, `11ai-operator-stripe-payments` for charges and refunds, `11ai-operator-stripe-customers` for duplicates and links, and `11ai-operator-stripe-integrations` for the mirror and entitlements.

## Report

Conclude with: which mode and account were in play, the exact error code and message with the request id from the logs, the failing layer — mode, key, route, signature, API version, idempotency, mirror, or entitlement — the root cause or remaining uncertainty, the fix applied or proposed and why it addresses the cause rather than the symptom, its financial impact including any amount charged or refunded, how to undo it, and the verification result for the full flow. Flag any secret key reachable from client code as requiring rotation and disclosure, and name any customer who was double-charged so it can be corrected deliberately.
