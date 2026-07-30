---
name: 11ai-operator-stripe-setup
description: "Set up Stripe in an application from zero, covering test mode keys and their scope, the server client with a pinned API version, the CLI and local webhook forwarding, the webhook route left public and reading a raw body, a first product and price, idempotency conventions, and the checklist before going live. Use when an application has no Stripe wiring, when webhook forwarding must be set up locally, or when the user asks how to add Stripe."
---
# 11ai stripe setup

Start in test mode and stay there until the whole flow works end to end. Two pieces need care: the secret key must never reach the browser, and the webhook route must receive a raw body on a path that authentication middleware leaves alone.

## Check what exists

```bash
grep -o 'pk_test\|pk_live\|sk_test\|sk_live' .env.local 2>/dev/null | sort -u
grep -rn 'new Stripe(' --include='*.ts' lib/ src/ app/ 2>/dev/null
stripe --version
```

Use `11ai-operator-stripe-environment` for the full inspection. If a client and webhook route already exist, this is not a fresh setup — change only what is missing.

Confirm the mode. Every key here should be `pk_test` and `sk_test`; a `sk_live` at this stage means real money is one mistake away.

## Add keys and the server client

```bash
npm install stripe @stripe/stripe-js
```

Three values, with different handling:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is designed for the browser and is safe to expose.
- `STRIPE_SECRET_KEY` grants full access to the account — reading every customer, issuing refunds, creating charges. Server only, never behind a client-exposed prefix, never committed.
- `STRIPE_WEBHOOK_SECRET` verifies incoming events. Server only, and it differs between the local CLI session and each dashboard endpoint.

Never take a secret key through the terminal; it lands in shell history and in this transcript. Have the user copy it from the dashboard into an ignored environment file themselves.

Create the client once, in a server-only module, with the API version pinned. An unpinned client follows the account's default version, which can change and alter response shapes without any code change. Read [references/setup.md](references/setup.md) for the environment file shapes, the client module, the webhook route per framework, and the go-live checklist.

## Install the CLI and forward webhooks

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

`stripe listen` prints a signing secret for that session, and it is not the same as any dashboard endpoint's secret. Put the printed one in the local environment file while developing.

```bash
stripe trigger checkout.session.completed
```

Triggering events is how the handler gets tested without completing a real flow every time.

## Add the webhook route

Three requirements, and all three are easy to miss:

1. **The route must read the raw body.** Signature verification runs over the exact bytes Stripe sent, so a JSON parser running first destroys them. In Next.js App Router use `await request.text()`; in Express mount `express.raw({ type: "application/json" })` on that route only, ahead of any global parser.
2. **The route must be public.** Stripe has no session, so authentication middleware that protects it returns a redirect and Stripe records a delivery failure. Add the path to the middleware's public list.
3. **Verification failures return 401, not 500.** A 500 tells Stripe to retry a request that will never verify.

Handle events idempotently from the start, keyed on the event id. Stripe retries, so a handler that is not idempotent grants a plan twice or sends two receipts.

## Create a first product and price

```bash
stripe products create --name "Pro plan"
stripe prices create --product prod_... --unit-amount 2000 --currency eur -d "recurring[interval]=month"
```

Amounts are integers in the currency's minor unit: `2000` is 20.00 EUR. Never use a floating point number for money anywhere in the codebase.

A price is effectively immutable — to change an amount you create a new price and stop using the old one. Store the price id in configuration rather than hard-coding an amount in the application, so pricing changes do not need a deploy.

## Verify

Prove the whole loop in test mode:

1. Start `stripe listen` and confirm it reports a connection.
2. Complete a Checkout session with the card `4242 4242 4242 4242`.
3. Confirm the webhook handler received `checkout.session.completed` and recorded the result.
4. Replay the same event with `stripe events resend` and confirm nothing double-applies.
5. Send a request to the webhook route with a wrong signature and confirm 401 with no state change.
6. Confirm the webhook route is reachable without a session.
7. Confirm the amount recorded locally matches the price's `unit_amount` exactly.

## Guardrails

- Never print a secret key, a webhook signing secret, or the contents of an environment file. Confirm a variable by name.
- Never expose `STRIPE_SECRET_KEY` to the browser, including behind `NEXT_PUBLIC_`. A secret key in a client bundle allows anyone to read customers and issue refunds, and it must be rolled.
- Do not use live keys during setup, and do not test with a real card.
- Do not trust an amount, price, or currency sent from the browser. Look the price up on the server from an id you control.
- Do not create charges, refunds, or subscriptions as part of setup beyond one test flow.
- Do not disable signature verification to get a handler working — an unverified endpoint accepts a forged payment event from anyone who finds the URL.
- Report the mode and account, the variable names written and to which files, whether those files are ignored, the pinned API version, the webhook route and how it reads the body, the product and price ids created with their amounts, and the verification results including the replay and bad-signature checks.
