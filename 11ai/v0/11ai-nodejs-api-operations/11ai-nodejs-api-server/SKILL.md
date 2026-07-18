---
name: 11ai-nodejs-api-server
description: "Start, inspect, health-check, observe, and safely stop a local Node.js API server using the project's own scripts and discovered port configuration. Use when the user wants to run an API locally, verify that it responds, inspect logs, investigate a port conflict, or stop a process created for the task."
---

# 11ai Node.js API server

Operate on a local development or test server with a clear target and an evidence trail. Discover the project's start command, entrypoint, port, and health route before acting. Never kill an unrelated process, start a production service, expose a port publicly, or pass secrets on a command line without explicit user direction.

## Inspect first

Run the smallest useful read-only checks:

```bash
npm run
npm pkg get scripts
lsof -nP -iTCP:PORT -sTCP:LISTEN
curl -sS -D - -o /dev/null http://localhost:PORT/health
```

Replace `PORT` and `/health` only with values discovered from the project or the user's request. If the server may be bound to another interface, inspect the actual listen configuration before changing it.

## Start

1. Prefer the declared `dev`, `start`, or test-server script.
2. Run it in the foreground when the user needs to see output or when ownership of the process is unclear.
3. If a background process is explicitly requested, record the command, working directory, PID, port, and log destination. Do not hide startup failures.
4. Wait for a bounded readiness check rather than a blind long sleep:

   ```bash
   for i in 1 2 3 4 5; do
     curl -fsS http://localhost:PORT/health && break
     sleep 1
   done
   ```

   Use the project's health endpoint or a harmless known `GET` route. A `404` may mean the route is wrong, not that the process is down.

## Verify behavior

Check both transport and application behavior:

```bash
curl -i http://localhost:PORT/health
curl -i http://localhost:PORT/api/resource
```

Report the status code, relevant headers, response body shape, process identity, bound address, and any startup warnings. Redact cookies, authorization headers, API keys, and connection strings.

## Port conflicts

Inspect the listener and its command before changing anything:

```bash
lsof -nP -iTCP:PORT -sTCP:LISTEN
ps -o pid=,ppid=,etime=,command= -p PID
```

If another process owns the port, report it and offer a project-supported alternate port or a targeted stop. Do not use a broad `pkill`, kill a parent process blindly, or assume a listener is abandoned.

## Stop and cleanup

Stop only a process started for this task or one the user explicitly identifies. Prefer a graceful signal and verify that the PID exited. If a supervisor respawns it, identify the supervisor and stop at that layer only with approval. Do not remove logs, build output, or dependencies as part of stopping a server.

## Reporting

End with: command used, working directory, PID if applicable, port/address, readiness result, relevant logs or error, and whether the process remains running. If startup failed, hand the evidence to `11ai-nodejs-api-troubleshooting`.
