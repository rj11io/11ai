---
name: 11ai-nodejs-api-troubleshooting
description: "Diagnose Node.js API startup, port, routing, validation, authentication, runtime, upstream, test, and dependency failures through bounded evidence collection and the least invasive next step. Use when the user provides an error, an API is not responding, a route returns an unexpected status, or a Node.js service behaves inconsistently."
---

# 11ai Node.js API troubleshooting

Troubleshoot from evidence, not guesses. Start read-only, preserve the current state, and separate a client problem, process problem, route problem, application problem, dependency problem, and upstream problem. Do not install packages, restart production, rotate keys, switch environments, or delete data without a clear request and target.

## Triage order

1. **Target** — confirm repository, working directory, environment, URL, method, port, and expected behavior.
2. **Runtime** — collect Node.js version, package manager, project script, framework, and exact startup command.
3. **Process** — determine whether the intended process is running, exited, listening on the expected address, or blocked by another PID.
4. **Transport** — use a harmless local request and capture status, headers, timing, and a redacted body.
5. **Routing** — compare method, path prefix, version, router mount, middleware order, and the app instance under test.
6. **Application** — inspect validation, auth, handler logs, error mapping, dependencies, and response serialization.
7. **Upstream** — distinguish timeout, DNS/TLS, connection refusal, non-success response, rate limit, and malformed response.
8. **Tests/configuration** — compare the failing command, environment names, required variable names, fixtures, and teardown behavior.

## Safe evidence collection

```bash
node --version
npm run
npm pkg get scripts
lsof -nP -iTCP:PORT -sTCP:LISTEN
ps -o pid=,ppid=,etime=,command= -p PID
curl -i --max-time 10 http://localhost:PORT/health
git diff -- path/to/relevant/file.js path/to/relevant.test.js
```

Use the project's package manager and route. Capture the exact command and exit code. Read logs narrowly with a line limit. Redact authorization headers, cookies, API keys, JWTs, signed URLs, connection strings, personal data, and full request bodies before sharing output.

## Interpret common symptoms

- `command not found`: the executable is missing or not on `PATH`; do not assume how to install it.
- `EADDRINUSE`: identify the listener and command before stopping it; it may be an intentional service.
- process exits immediately: inspect startup output, required variables, module format, Node engine, and dependency resolution.
- connection refused: no listener at that address/port, or the service is bound elsewhere.
- `404`: verify method, path prefix, version, router mounting, and whether the response came from a proxy or the API.
- `401`: inspect credential presence/source and verifier expectations without exposing the credential.
- `403`: inspect identity claims and authorization policy; valid authentication is not permission.
- `400`/`422`: compare exact field paths, types, coercion, content type, and validation contract.
- `5xx`: locate the first server-side error and cause; do not mask it with a generic client retry.
- timeout: identify which hop timed out, whether a request has a bounded timeout, and whether retries amplify load.
- tests pass in isolation but fail together: look for shared state, leaked listener/timer, order dependence, or environment mutation.

## Recovery boundary

After evidence identifies a likely cause, propose the least invasive fix and its verification. A restart may be reasonable for a local process the user asked to operate; it is not a default repair for an unknown or production process. Never clear a database, remove dependencies, delete lockfiles, disable TLS, weaken auth, or broaden CORS as a generic troubleshooting step.

## Reporting

End with: confirmed facts, strongest hypothesis, evidence supporting it, unresolved alternatives, exact next action, risk/side effect, and verification command. If the evidence is insufficient, say what single observation would distinguish the leading possibilities.
