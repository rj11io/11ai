---
name: 11ai-convex-integrations
description: "Connect Convex to the systems around it, covering React and Next.js clients with server-side rendering, identity providers through the auth config, external services called from actions, inbound webhooks on HTTP endpoints, mirroring an external system's records into Convex tables, file and email providers, and pipeline test and deploy steps. Use when a frontend must consume Convex reactively, when an identity provider or payment service must be wired in, or when another system's data must be kept in step with Convex."
---
# 11ai convex integrations

Convex is both the database and the server, so every integration lands in one of three places: the client subscribing reactively, an action reaching outward, or an HTTP endpoint receiving something inbound. Decide which one before writing, because the constraints differ sharply — queries cannot call out, and actions have no transaction.

## Name the seam

- **Client** — a React or Next.js application subscribing to queries, with server-side rendering needing a token and a preloaded query.
- **Identity provider** — an issuer whose tokens Convex validates, configured in `convex/auth.config.ts`.
- **Outbound services** — payment, email, or any API, called from an action with a timeout and a bounded retry.
- **Inbound webhooks** — an HTTP endpoint that verifies a signature and schedules the work.
- **Mirrors** — an external system's records copied into Convex tables, kept current by webhooks plus a reconciliation pass.
- **Pipelines** — tests against a real deployment, and a gated deploy.

## Wire one deliberately

1. Inspect first: which provider the client uses, whether `auth.config.ts` exists and names the right issuer, which actions already call outward, what `http.ts` exposes, and what the pipeline does.
2. Put external calls in actions only, and keep them internal. A query cannot call out at all, and a public action that spends money or uses a secret is an open endpoint.
3. Remember an action is not a transaction. Group the database writes that must succeed together into a single mutation and have the action call it once.
4. Verify every inbound webhook against the raw body before parsing, key idempotency on the event id, acknowledge fast, and process in a scheduled job.
5. For a mirror, treat webhooks as the fast path and a scheduled reconciliation as the correctness guarantee. Events get missed, and a mirror with no reconciliation drifts silently.
6. Set every secret on both the development and production deployments. Read [references/integrations.md](references/integrations.md) for the client wiring per framework, the auth config, the outbound action shape, the webhook endpoint, the mirror schema and reconciliation, and the pipeline steps.

## Verify end to end

- Load the application, confirm a query returns data, and confirm a mutation's effect appears without a refresh — that is the reactivity proof.
- Render a page on the server and confirm it works, which proves the token is being passed.
- Sign out and confirm queries stop returning data rather than serving a cached result.
- Point an outbound call at an unreachable address and confirm it times out and retries rather than hanging.
- Send a webhook with a bad signature and confirm 401 with no state change, then a valid one twice and confirm it applies once.
- Run the reconciliation pass twice and confirm the second run reports no changes.
- Compare `npx convex env list` against `npx convex env list --prod`.

## Report

State the seam wired, which client and provider the frontend uses, the issuer configured for authentication, which actions call outward with their timeouts and retry limits, the HTTP endpoints exposed and what authenticates each, the mirror tables and what keeps them current, the secrets required and whether they are set on both deployments, and the verification evidence including the duplicate-webhook and reconciliation checks. Never print secrets, tokens, deploy keys, or `env list` values. Flag every public action or query without an authorization check, and any mirror with no reconciliation pass.
