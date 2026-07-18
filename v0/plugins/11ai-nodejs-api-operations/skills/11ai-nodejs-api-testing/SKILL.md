---
name: 11ai-nodejs-api-testing
description: "Create and run focused tests for Node.js APIs, including handler, middleware, route, integration, upstream-client, and contract behavior, while using the project's existing test runner and avoiding real production services. Use when an endpoint changes, a regression needs coverage, or API behavior must be verified."
---

# 11ai Node.js API testing

Test the observable API contract and the smallest useful internal unit. Discover the existing runner, setup, app factory, test database/service fixtures, and request helper before writing tests. Do not change test infrastructure or seed shared environments merely to make a test pass.

## Choose the test level

- **Unit**: pure validation, mapping, policy, or service logic with dependencies mocked at the project boundary.
- **Handler/middleware**: request transformation, auth, validation, error mapping, and response behavior without a real listener.
- **Route/integration**: the actual router and middleware stack using an in-process app or ephemeral port.
- **Upstream client**: a mock server or adapter that controls statuses, latency, malformed bodies, and connection failures.
- **Contract**: stable method/path/status/response assertions shared with a consumer or OpenAPI source when the project has one.

Prefer an app factory that returns the configured application without calling `listen()`. If the project cannot do that, use an ephemeral port and ensure teardown runs even when assertions fail.

## Build a useful matrix

For a changed endpoint cover:

- the valid minimum and representative success case;
- malformed or missing body, query, path, and header input;
- authentication and authorization failures when protected;
- not-found, conflict, and upstream failure behavior when relevant;
- response status, headers, content type, and safe body shape;
- no side effects after boundary validation or auth failure;
- timeout, cancellation, and retry behavior for outbound calls;
- cleanup of listeners, timers, mocks, files, and database records.

Avoid asserting incidental wording, private function layout, or exact log formatting unless those are deliberate contracts. Do not use arbitrary long sleeps; await a bounded condition or inject a clock.

## Run and debug

1. Read `package.json` and use the declared test script and runner.
2. Run the narrowest file or test name first.
3. Run lint and typecheck when the project defines them.
4. Run the relevant suite, then the full suite when the change could affect shared middleware or route composition.
5. If a test fails, capture the exact command, exit code, assertion, request, response, and cleanup state; hand environment or runtime failures to `11ai-nodejs-api-troubleshooting`.

Never “fix” a flaky test by increasing timeouts blindly or weakening assertions. Find the race, leaked resource, shared state, or unavailable dependency.

## Reporting

List tests added or changed, the behavior each protects, commands run, pass/fail result, and any unverified external dependency. State whether tests ran against an in-process app, ephemeral listener, mocks, containers, or a shared service.
