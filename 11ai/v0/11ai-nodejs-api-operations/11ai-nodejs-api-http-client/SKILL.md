---
name: 11ai-nodejs-api-http-client
description: "Implement or review outbound HTTP calls from Node.js APIs with the project's existing fetch, undici, axios, or wrapper conventions, including timeouts, safe retries, response checks, error mapping, authentication, and tests. Use when an API calls an upstream service or fails on timeout, non-success responses, malformed data, or connection errors."
---

# 11ai Node.js API HTTP client

Treat every outbound call as an unreliable boundary. Inspect the existing client wrapper, Node.js version, configuration, logging, and retry policy before adding another implementation. Do not call a real external or production endpoint to validate code unless the user explicitly requests it and the target is clear.

## Define the upstream contract

Record the method, URL construction, path/query encoding, request headers, authentication source, body/content type, expected success statuses, response schema, timeout, retry policy, and mapping to the local API. Keep base URLs and credentials in approved configuration; never hard-code them.

## Implement safely

1. Reuse global `fetch`, `undici`, `axios`, or the repository wrapper according to the project convention. Do not add a dependency for a single call without checking the existing stack.
2. Set a bounded timeout with `AbortSignal.timeout`, `AbortController`, or the existing wrapper. Treat timeout and cancellation separately where callers need to know the difference.
3. Check `response.ok` or the explicit accepted status set before parsing a success body. Bound or stream large responses when the endpoint can return untrusted content.
4. Validate the upstream response before using it. A `200` response with the wrong JSON shape is still an upstream failure.
5. Retry only idempotent operations or requests with an explicit idempotency key. Limit attempts, use backoff with jitter, and retry only transient network/availability statuses.
6. Avoid retrying authentication failures, validation failures, conflicts, user cancellation, or non-idempotent writes without a clear contract.
7. Redact authorization, cookies, API keys, signed URLs, and sensitive request/response fields from logs and error messages.
8. Map upstream failures to stable local errors and preserve useful cause/status metadata internally.

## Test without a real upstream

Use the project's mock server, adapter, interceptor, or dependency injection pattern. Cover success, invalid JSON/schema, timeout, cancellation, connection failure, each relevant non-success status, retry exhaustion, and confirmation that secrets are not logged. Keep tests deterministic and avoid sleeping for real backoff durations.

## Reporting

Report the client used, timeout, accepted statuses, retry conditions, response validation, local error mapping, test doubles, and any external configuration required. If the upstream contract is unknown, preserve the uncertainty and identify the missing source of truth.
