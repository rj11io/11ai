---
name: 11ai-nodejs-api-routes
description: "Inspect, add, change, or verify Node.js HTTP routes while preserving the project's framework, router registration, middleware order, response envelope, status codes, naming, and test conventions. Use when the user asks to create or modify an endpoint, route a handler, expose a resource, or understand where an API route is implemented."
---

# 11ai Node.js API routes

Treat a route as a public contract: method, path, parameters, authentication, validation, status codes, response shape, error behavior, and tests all matter. Inspect the project before editing and do not invent a framework, URL shape, identifier format, response envelope, or persistence layer when the repository already provides one.

## Discover the route architecture

Identify:

- the server entrypoint and router composition;
- the framework and version;
- route modules, controllers, handlers, and middleware order;
- path prefixes and versioning such as `/api` or `/v1`;
- existing patterns for async errors, dependency injection, response serialization, and status codes;
- the nearest analogous route and its focused test.

Useful searches include:

```bash
rg -n "app\.(get|post|put|patch|delete|use)\(|router\.(get|post|put|patch|delete|use)\(|fastify\.(get|post|put|patch|delete)\(|@(?:Get|Post|Put|Patch|Delete)\(" src test tests
```

## Add or change a route

1. Translate the request into a small contract: method, path, inputs, auth, success status/body, and expected failures.
2. Find the closest existing route and follow its file boundaries and naming.
3. Register the route in the correct router and prefix; verify that the router is actually mounted.
4. Keep the handler thin. Put business logic in the project's existing service/use-case layer when one exists.
5. Reuse existing validation, authentication, error middleware, logging, and response helpers. Do not create a second pattern for the same concern.
6. Preserve idempotency and status-code semantics. Do not turn a read into a write or broaden an existing route's authorization accidentally.
7. Add focused tests for the happy path, malformed or missing input, unauthorized access when relevant, not-found/conflict behavior, and unexpected failures.

## Verify routing

Run the narrowest route test first, then use a harmless request against a local server if appropriate:

```bash
curl -i http://localhost:PORT/EXACT/PATH
```

For a `404`, distinguish an unregistered route from an application-level not-found response by checking router mounting, path prefixes, HTTP method, and the server instance under test. For a `405`, inspect method registration and any method-not-allowed middleware.

## Reporting

Report the final method/path contract, files changed, middleware and validation applied, tests run, and any assumptions. Call out breaking changes explicitly, especially renamed paths, changed status codes, response envelopes, or authorization requirements.
