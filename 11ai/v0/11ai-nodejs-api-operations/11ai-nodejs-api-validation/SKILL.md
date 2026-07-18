---
name: 11ai-nodejs-api-validation
description: "Add, repair, or review validation for Node.js API bodies, query strings, path parameters, and headers using the project's existing schema library and error conventions. Use when an endpoint accepts user input, rejects malformed requests inconsistently, or needs a clear validation contract and tests."
---

# 11ai Node.js API validation

Make invalid input fail early, predictably, and without leaking sensitive values. First find the project's existing validator, schema style, coercion rules, unknown-field policy, and error envelope. Do not add a new validation dependency when an established project convention can do the job.

## Inspect the contract

For the target route, identify:

- required and optional body fields;
- query and path parameter types;
- header requirements and content type;
- defaults, normalization, coercion, and allowed enum values;
- size and length limits;
- whether unknown fields are stripped, ignored, or rejected;
- the project's choice of `400` versus `422` and validation-error shape.

Prefer a schema that can be reused by the handler and tests. Keep validation separate from business rules when the project distinguishes syntax from domain state.

## Implement safely

1. Validate at the boundary before side effects, database writes, or outbound requests.
2. Validate each input source explicitly: `params`, `query`, `headers`, and `body` should not be silently merged.
3. Return the existing structured validation error with field paths and safe messages. Do not echo passwords, tokens, authorization headers, or full sensitive payloads.
4. Use strict parsing for identifiers, dates, numbers, booleans, and enums. Avoid JavaScript truthiness for values such as `"false"`, `"0"`, and empty strings.
5. Enforce bounded strings, arrays, objects, and uploaded content according to the API's needs. Do not create an unbounded parser or body limit.
6. Keep validation deterministic and independent of remote services. Domain checks that require I/O belong in the service layer and should have a distinct conflict/not-found error.

## Test matrix

At minimum cover:

- valid minimum input;
- valid maximum or boundary input;
- missing required field;
- wrong primitive type;
- malformed identifier or date;
- invalid enum and unknown field;
- empty, oversized, or duplicate values when relevant;
- query/path/header input separately from body input;
- confirmation that invalid input causes no side effect.

Use the project's test runner and request helper. Assert status, safe error shape, and that the handler/service was not called when boundary validation fails.

## Reporting

State the accepted input contract, rejected cases, status code and error shape, library or existing helper reused, tests run, and any behavior that could affect clients. Do not silently loosen validation to make a failing test pass.
