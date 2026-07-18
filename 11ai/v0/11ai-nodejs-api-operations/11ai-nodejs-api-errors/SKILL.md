---
name: 11ai-nodejs-api-errors
description: "Design, repair, or review Node.js API error handling with stable status mapping, structured responses, async propagation, safe logs, and no accidental stack-trace or secret disclosure. Use when an API returns inconsistent errors, crashes on rejected promises, exposes internals, or needs a consistent error middleware pattern."
---

# 11ai Node.js API errors

An API error contract has two audiences: clients need a stable safe response, while operators need enough structured context to diagnose the failure. Inspect the current error middleware, framework defaults, logger, and response envelope before changing behavior.

## Separate error classes

Classify failures before mapping them:

- malformed input or failed schema validation;
- authentication or authorization failure;
- missing resource or state conflict;
- expected domain failure;
- upstream timeout, rejection, or invalid response;
- unexpected programming, dependency, or infrastructure failure.

Map each category to the project's established status codes. Do not turn every exception into `500`, and do not report an upstream failure as a successful empty response.

## Implement the boundary

1. Ensure synchronous throws and rejected async handlers reach one error boundary. Follow the framework's supported async pattern instead of relying on an accidental unhandled rejection.
2. Return one consistent shape, such as the project's existing `error`, `code`, `message`, and request/correlation identifier fields.
3. Keep client messages actionable but non-sensitive. Never include stack traces, SQL, filesystem paths, authorization headers, tokens, cookies, connection strings, or raw upstream bodies in production responses.
4. Log unexpected failures once at the boundary with a stable error code, request ID, route, method, status, and safe cause metadata. Avoid double-logging the same error at every layer.
5. Preserve the original cause for internal diagnostics when the runtime and logger support it; do not stringify arbitrary error objects into responses.
6. Define behavior for headers already sent, stream errors, aborted requests, and errors after a response starts.

## Verify the contract

Test at least:

- validation failure;
- unauthenticated and forbidden requests;
- not-found and conflict cases;
- upstream timeout or non-success response;
- thrown synchronous error;
- rejected async error;
- unexpected error with a safe production response;
- stable error shape and request ID behavior.

Use a test logger or redaction assertion to prove secrets and stacks are not emitted. Run a focused suite before broader tests.

## Reporting

Report the error categories and status mapping, response shape, logging behavior, async coverage, tests, and any client-visible contract change. If the project has no central error boundary, say so and propose the smallest framework-appropriate boundary rather than scattering ad hoc `try/catch` blocks.
