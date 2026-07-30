# 11ai Stripe operator

Eleven standalone skills for common Stripe billing and payment work, with read-first checks around mode, amounts, and anything that moves money.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-stripe-cheatsheet`](./skills/11ai-operator-stripe-cheatsheet/SKILL.md) | Looking up API calls, CLI commands, amounts in minor units, test cards, and event types |
| [`11ai-operator-stripe-setup`](./skills/11ai-operator-stripe-setup/SKILL.md) | Adding test keys, a pinned server client, the CLI, local webhook forwarding, and a first price |
| [`11ai-operator-stripe-environment`](./skills/11ai-operator-stripe-environment/SKILL.md) | Confirming the account and mode, the API version, webhook endpoints, and configured prices |
| [`11ai-operator-stripe-customers`](./skills/11ai-operator-stripe-customers/SKILL.md) | Creating and reconciling customers without duplicates, payment method defaults, and the billing portal |
| [`11ai-operator-stripe-products-and-prices`](./skills/11ai-operator-stripe-products-and-prices/SKILL.md) | Modelling plans, changing pricing safely, and grandfathering existing subscribers |
| [`11ai-operator-stripe-checkout`](./skills/11ai-operator-stripe-checkout/SKILL.md) | Building Checkout sessions and fulfilling in the webhook rather than the success page |
| [`11ai-operator-stripe-subscriptions`](./skills/11ai-operator-stripe-subscriptions/SKILL.md) | Upgrades, downgrades, proration, cancellation, failed payments, and mirroring status |
| [`11ai-operator-stripe-payments`](./skills/11ai-operator-stripe-payments/SKILL.md) | One-off charges, authentication steps, capture timing, refunds, and disputes |
| [`11ai-operator-stripe-webhooks`](./skills/11ai-operator-stripe-webhooks/SKILL.md) | Verifying against the raw body, idempotent handling, and replaying missed events |
| [`11ai-operator-stripe-integrations`](./skills/11ai-operator-stripe-integrations/SKILL.md) | The local billing mirror, one entitlement function, identity links, tax, and reconciliation |
| [`11ai-operator-stripe-troubleshooting`](./skills/11ai-operator-stripe-troubleshooting/SKILL.md) | Diagnosing mode confusion, signature failures, double charges, and access that does not match billing |

The skills are intentionally narrow. Combine them when a task crosses boundaries, such as creating a price before a Checkout session, or fixing a webhook endpoint and then reconciling the mirror.

## Safety contract

Confirm the mode before anything else. Test and live are separate datasets on the same account, ids do not cross between them, and live mode moves real money. A `pk_live` paired with an `sk_test` is a real misconfiguration, not a shortcut.

Calculate amounts on the server. Never accept an amount, currency, price id, or line total from the browser — a client that can send an amount can send `1`. Amounts are integers in the currency's minor unit, and zero-decimal currencies take the whole number; never hold money as a floating point number.

Pass an idempotency key derived from something stable — an order id, not a timestamp or random value — on every create that moves money. A retry without one charges twice, and a random key defeats the mechanism entirely.

Keep `STRIPE_SECRET_KEY` and webhook signing secrets server-side. A secret key in a client bundle lets anyone read every customer and issue refunds; it must be rolled and treated as a disclosure. Never handle raw card numbers — collect payment details through Checkout or Elements.

Fulfil in the webhook, not on the success page. A user can close the tab and their payment still succeeded. Verify webhooks against the raw request body before parsing, keep the route public in middleware, return 401 on a bad signature and 500 only on a processing failure, and key idempotency on the event id because retries run for days.

Derive access from the current subscription status on every request, through one entitlement function. A flag set once at purchase never hears about a cancellation or a failed payment. Handle the whole lifecycle, and reconcile on a schedule because events get missed.

Treat as requiring explicit approval, naming the amount and object: any refund, which is irreversible and does not return fees; cancelling a subscription immediately rather than at period end; deleting a customer, which cancels their subscriptions; migrating existing subscribers to a new price; and any operation in live mode. Before retrying a failed charge, check whether the first one succeeded — a double charge is far harder to put right than the original failure. Never refund a disputed charge; respond through the dispute process.

Do not print secret keys, signing secrets, customer payment details, or full event payloads.
