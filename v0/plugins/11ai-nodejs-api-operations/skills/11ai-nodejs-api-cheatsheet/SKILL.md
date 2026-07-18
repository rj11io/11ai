---
name: 11ai-nodejs-api-cheatsheet
description: "Answer common Node.js API command and implementation questions with concise, safety-aware examples for runtime inspection, route work, validation, authentication, HTTP clients, tests, logs, and diagnostics. Use when the user asks what Node.js API command or pattern to use, wants a quick reference, or needs a command translated into plain language."
---

# 11ai Node.js API cheatsheet

Use this skill as a reference, not as permission to run commands or change an API. Prefer the project's existing package manager, scripts, framework, response shape, and test conventions. If the user provides an error rather than a quick question, hand off to `11ai-nodejs-api-troubleshooting`.

## Inspect the project

```bash
node --version
npm --version
npm run
npm pkg get scripts
npm pkg get dependencies
```

Use the package manager indicated by the lockfile: `npm` for `package-lock.json`, `pnpm` for `pnpm-lock.yaml`, `yarn` for `yarn.lock`, and `bun` for `bun.lockb` or `bun.lock`. Do not replace a lockfile or silently switch package managers.

## Run and check a local API

```bash
npm run dev
npm start
curl -i http://localhost:3000/health
curl -sS -D - -o /dev/null http://localhost:3000/api/items
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Use the script declared by the project rather than inventing a new entrypoint. Discover the port and health route from scripts, configuration, README files, or route registration. A `curl` request can change state when it uses `POST`, `PUT`, `PATCH`, or `DELETE`; use a safe `GET` for initial checks.

## HTTP request shapes

```bash
curl -i http://localhost:3000/api/items/123
curl -i -H 'Content-Type: application/json' \
  -d '{"name":"Example"}' \
  http://localhost:3000/api/items
curl -i -H "Authorization: Bearer $API_TOKEN" \
  http://localhost:3000/api/private
```

Never paste a real token into a command, log, test fixture, or chat. Use an environment variable and redact it in copied output.

## Native Node.js outbound request

For Node.js versions with global `fetch`, keep a timeout and check the response before parsing:

```js
const response = await fetch(url, {
  headers: { accept: "application/json" },
  signal: AbortSignal.timeout(10_000),
})

if (!response.ok) {
  throw new Error(`Upstream returned ${response.status}`)
}

const data = await response.json()
```

Use the project's existing HTTP wrapper when one exists. Retry only idempotent requests and only known transient failures.

## Status-code shorthand

- `200 OK`: successful read or update with a response body.
- `201 Created`: a resource was created; include its representation or location when the project does so.
- `202 Accepted`: work was accepted for asynchronous processing.
- `204 No Content`: success with no response body.
- `400 Bad Request`: malformed request syntax or invalid input when that is the project convention.
- `401 Unauthorized`: missing or invalid authentication.
- `403 Forbidden`: authenticated but not allowed.
- `404 Not Found`: resource or route does not exist.
- `409 Conflict`: request conflicts with current state.
- `422 Unprocessable Content`: syntactically valid request that fails semantic validation, when the API uses this convention.
- `429 Too Many Requests`: rate limit exceeded.
- `500 Internal Server Error`: unexpected server failure; do not expose stack traces.
- `502`, `503`, `504`: upstream or service-availability failures.

Follow the existing API contract when it differs from this shorthand.

## Common test commands

```bash
npm test
npm run test -- --runInBand
npm run test:watch
npm run lint
npm run typecheck
```

Do not assume the flags are supported. Read `package.json` first and run the narrowest relevant test before the full suite.

## Safe diagnostic commands

```bash
curl -v http://localhost:3000/health
node --trace-warnings ./path/to/entrypoint.js
git diff -- path/to/route.js path/to/test.js
```

Avoid `env`, unrestricted request dumps, or verbose logs that may print credentials. Keep diagnostics scoped to the failing route and redact authorization headers, cookies, API keys, and connection strings.

## Answer format

For a quick question, return the smallest useful command or snippet, explain the important flag or behavior in one sentence, and state whether it only reads state or changes it. If the answer depends on Express, Fastify, NestJS, or another framework, say so and ask the user to show the relevant project files when necessary.
