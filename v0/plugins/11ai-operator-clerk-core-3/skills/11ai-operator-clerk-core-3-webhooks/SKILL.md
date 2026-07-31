---
name: 11ai-operator-clerk-core-3-webhooks
description: "Receive and handle Clerk webhook events safely, covering endpoint registration per instance, signature verification against the raw request body, keeping the route public in middleware, idempotency keyed on the event id, acknowledging before processing, handling user and organization and membership events, out-of-order delivery, retries, local delivery through a tunnel, and reconciling a mirror when events were missed. Use when a local database must track Clerk users or organizations, when events arrive but nothing happens, when verification fails, or when an event applied twice."
---
# 11ai clerk webhooks

Version baseline: Clerk Core 3 and Clerk API 2026-05-12; each Clerk SDK has its own compatible semver (for example @clerk/nextjs v7.5.2 or newer). Inspect the installed SDK and the API-version compatibility table before editing.

Three things make this endpoint correct: the middleware leaves it public, verification runs against the raw body, and each event applies at most once. Miss the first and Clerk gets a redirect instead of your handler; miss the second and the endpoint is forgeable; miss the third and it double-applies.

## Inspect first

```bash
grep -rn 'verifyWebhook\|svix\|WEBHOOK_SIGNING_SECRET' --include='*.ts' app/ src/ 2>/dev/null
grep -rn 'api/webhooks' middleware.ts src/middleware.ts 2>/dev/null
grep -c 'CLERK_WEBHOOK_SIGNING_SECRET' .env.local 2>/dev/null
grep -rn 'express.json\|bodyParser' --include='*.ts' src/ 2>/dev/null | head
```

Two checks answer most failures. Is the webhook path in the middleware's public list — an external sender has no session, so a protected route redirects it and Clerk records a delivery failure. And does a global body parser run before the route, which destroys the raw bytes the signature covers.

Each endpoint has its own signing secret, per instance. A development secret against production events fails every verification.

## Verify against the raw body

```ts
// app/api/webhooks/clerk/route.ts
import { verifyWebhook } from "@clerk/nextjs/webhooks"

export async function POST(request: Request) {
  let event
  try {
    event = await verifyWebhook(request)
  } catch {
    return Response.json({ error: "invalid_signature" }, { status: 401 })
  }

  if (await alreadyProcessed(event.data.id ? `${event.type}:${event.data.id}` : "")) {
    return Response.json({ received: true })
  }

  await recordEvent(event)
  await handleEvent(event)

  return Response.json({ received: true })
}
```

`verifyWebhook` reads the raw body itself and checks the signature and timestamp. Doing it by hand means reading `request.text()` before any parsing and verifying with the Svix headers — never parse first and verify the re-serialized result, because the bytes will differ.

Return 401 on a bad signature, not 500. A 500 tells the sender to retry a request that will never verify, and the retries pile up.

Do not disable verification to get past a failure. An unverified endpoint accepts a forged `user.created` or `organizationMembership.created` from anyone who finds the URL.

A signature failure has three usual causes, in this order: a body parser ran first, the secret is from the wrong endpoint or instance, or the server clock is outside the tolerance window. Check the clock before suspecting the secret.

```ts
// middleware.ts
const isPublicRoute = createRouteMatcher(["/api/webhooks(.*)", "/sign-in(.*)"])
```

## Be idempotent and acknowledge fast

```sql
create table public.webhook_events (
  id text primary key,
  type text not null,
  received_at timestamptz default now(),
  processed_at timestamptz
);
```

Insert the event id before doing the work and let the primary key reject a duplicate. Clerk retries on failure and can redeliver, so a handler that is not idempotent creates a second row, sends a second email, or grants a membership twice.

Acknowledge within a couple of seconds. Anything slow should be queued:

```ts
  await recordEvent(event)
  await queue.enqueue({ eventId: event.data.id, type: event.type })
  return Response.json({ received: true })
```

Return 200 only once the event is durably recorded. Returning 200 and losing it in memory means the sender considers it delivered and never retries.

## Handle the events

```ts
async function handleEvent(event: { type: string; data: Record<string, unknown> }) {
  switch (event.type) {
    case "user.created":
    case "user.updated":
      await upsertUser(event.data)
      break
    case "user.deleted":
      await deactivateUser(event.data.id as string)
      break
    case "organization.created":
    case "organization.updated":
      await upsertTenant(event.data)
      break
    case "organization.deleted":
      await deactivateTenant(event.data.id as string)
      break
    case "organizationMembership.created":
    case "organizationMembership.updated":
      await upsertMembership(event.data)
      break
    case "organizationMembership.deleted":
      await removeMembership(event.data)
      break
    case "session.created":
      await recordSignIn(event.data)
      break
    default:
      console.info("unhandled clerk event", event.type)
  }
}
```

Rules for the handlers:

- **Upsert, never plain insert.** The same user arrives from a webhook, from a sign-in, and from a reconciliation pass; all three must converge on one row keyed on the Clerk id.
- **Do not assume ordering.** A `user.updated` can arrive before its `user.created`. Apply the state in the event rather than a delta, and make an update create the row if it is missing.
- **Deactivate, do not delete.** A `user.deleted` event should revoke access and keep the record, so history stays attributable. Revoking access means ending sessions too, not only setting a flag.
- **Handle an unknown type with 200.** New event types appear; erroring on them starts a retry loop over something you do not consume.

Never treat an event as a substitute for reading the current state when the decision matters. An event says something changed; the API says what it is now.

## Deliver locally and reconcile

A `localhost` endpoint is unreachable from Clerk, so use a tunnel and register the temporary URL as an endpoint on the development instance with its own secret. Remove it afterwards — a stale endpoint pointing at a dead tunnel accumulates failed deliveries.

Because events do get missed — an outage, a deploy, an expired retry — a reconciliation pass is required rather than optional:

```ts
export async function reconcileUsers() {
  const remote = await listAllClerkUsers()
  const remoteIds = new Set(remote.map((u) => u.id))

  for (const user of remote) await upsertUser(user)

  for (const row of await loadActiveLocalUsers()) {
    if (!remoteIds.has(row.clerk_user_id)) await deactivateUser(row.clerk_user_id)
  }
}
```

The second loop is the important half: it catches users deleted in Clerk while the endpoint was down, which is precisely the deprovisioning failure that matters. Run it on a schedule and after any incident affecting the endpoint.

## Verify

1. A request with no signature or a tampered body returns 401 and changes nothing.
2. A valid event applies, and the same event delivered twice applies once.
3. An unknown event type returns 200 without erroring.
4. A `user.deleted` event removes access, including any live session.
5. The webhook route is reachable without a session — confirm the middleware does not redirect it.
6. Run the reconciliation pass twice and confirm the second run reports no changes.
7. Check the endpoint's delivery log in the dashboard for failures you have not seen locally.

## Report

State the endpoint path, which instance it is registered on, that the route is public in middleware, that verification runs against the raw body before parsing, the idempotency store and its key, whether processing is inline or queued, which event types are handled and which are ignored, whether a reconciliation pass exists and when it runs, and the verification results including the tampered-signature and duplicate-delivery checks. Never print the signing secret, the secret key, or full event payloads containing personal data. Flag any route where a body parser runs before verification, and any mirror with no reconciliation.
