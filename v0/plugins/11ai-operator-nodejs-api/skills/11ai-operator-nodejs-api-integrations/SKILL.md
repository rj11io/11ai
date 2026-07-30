---
name: 11ai-operator-nodejs-api-integrations
description: "Connect a Node.js API to its dependencies, covering database clients and connection pooling, cache and queue workers, authentication providers and webhook receivers, structured logging with request correlation, tracing and metrics, container images and reverse proxies, and pipeline test and deploy steps. Use when an API must reach a datastore or upstream service, when a webhook endpoint must verify signatures, when requests need correlation across services, or when the API must run behind a proxy or in a container."
---

# 11ai Node.js API integrations

Every dependency an API takes on is a resource with a lifetime and a failure mode. Decide where it is created, how many exist, what happens when it is slow, and how it closes on shutdown — before wiring the call itself. A client created per request is the most common cause of an API that works in development and collapses under load.

## Name the seam

- **Datastores** — one pool per process, created at startup and closed during shutdown.
- **Cache and queues** — a client the API writes to, and usually a separate worker process that reads.
- **Authentication providers** — token verification against a rotating public key set, cached rather than fetched per request.
- **Webhook receivers** — signature verification over the raw body, before any parsing.
- **Logging and correlation** — one structured logger, and an identifier that follows a request through every downstream call.
- **Tracing and metrics** — instrumentation loaded before the application so it can wrap the framework.
- **Container and proxy** — the image contract and the headers a proxy sets that the API must be told to trust.
- **Pipeline** — the test and deploy steps, with dependencies provided as services.

## Wire one deliberately

1. Inspect first: how the API currently connects to anything, where those clients are created, what the shutdown path closes, and what the pipeline already runs.
2. Create each client once at module scope and export it. Close it in the shutdown handler alongside the server; a pool left open makes the process hang instead of exiting.
3. Give every outbound call a timeout and a bounded retry. A dependency without a timeout turns a slow upstream into an exhausted request pool, which looks like the API failing rather than the upstream.
4. Verify webhook signatures against the raw request body before parsing, and compare digests in constant time. A JSON body parser that runs first destroys the bytes the signature covers.
5. Attach one correlation identifier per request, log it on every line, and forward it on every outbound call. Read [references/integrations.md](references/integrations.md) for the pool setup and shutdown ordering, the token verification cache, the raw-body webhook route, the logger and correlation middleware, the tracing bootstrap, and the container and proxy settings.
6. Behind a proxy, tell the framework to trust the forwarding headers explicitly. Trusting them unconditionally lets a client spoof its own address, which breaks rate limiting and audit logs.

## Verify end to end

- Start the API and confirm one connection burst, then hold load and confirm the pool size stays flat rather than climbing.
- Point a dependency at an unreachable address and confirm the API returns a mapped error within the timeout instead of hanging.
- Send a webhook with a deliberately wrong signature and confirm it is rejected, then a valid one and confirm it is accepted exactly once.
- Follow one request through the logs by its correlation identifier and confirm it appears on every line, including the downstream call.
- Send `SIGTERM` under load and confirm in-flight requests finish, pools close, and the process exits inside its timeout.

## Reporting

State the seam wired, where each client is created and closed, the timeouts and retry limits chosen, the files changed, and the verification evidence including the failure-path and shutdown checks. Redact connection strings, tokens, and signing secrets. Call out any dependency still lacking a timeout, and anything a deployment platform must configure for the change to work.
