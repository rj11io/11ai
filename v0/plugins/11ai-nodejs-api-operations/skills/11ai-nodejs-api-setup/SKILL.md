---
name: 11ai-nodejs-api-setup
description: "Scaffold a Node.js HTTP API from zero, choosing a framework, setting up TypeScript and the module system, loading configuration from the environment with validation, adding a graceful shutdown and a health route, and wiring development, build, lint, and test scripts. Use when a repository has no API server yet, when an existing project needs its runtime and scripts brought into working order, or when the user asks how to start a Node.js API."
---

# 11ai Node.js API setup

Setup decisions are hard to reverse once routes exist, so make the four that matter explicitly: the framework, the module system, how configuration arrives, and how the process starts and stops. Everything else can be added later without disturbing what is already written.

## Read what exists first

```bash
cat package.json
node --version
node -p "require('./package.json').type ?? 'commonjs'"
ls tsconfig.json .nvmrc .env.example 2>/dev/null
```

If any server code already exists, this is not a scaffold. Use `11ai-nodejs-api-environment` to inspect it and change only what is broken; adding a second framework or a second configuration loader alongside a working one is the failure this step prevents.

## Choose the framework and module system

Pick from what the team already runs where possible. Otherwise:

- **Express** — the largest ecosystem and the most examples. Version 5 handles async errors without a wrapper.
- **Fastify** — schema-based validation and serialization built in, and the fastest of these by a clear margin.
- **Hono** — small, standards-based, and portable to edge runtimes as well as Node.
- **NestJS** — a full structure with dependency injection, worth it for a large team and heavy for a small service.

Use native ECMAScript modules for a new project: set `"type": "module"` and TypeScript's `module` to `NodeNext`. Mixing the two module systems later is the most tedious migration in a Node project.

Pin the Node version in `.nvmrc` and in `engines` so local, pipeline, and container runtimes agree. Read [references/setup.md](references/setup.md) for the per-framework scaffold, the TypeScript configuration, the validated configuration loader, and the graceful shutdown implementation.

## Build the base server

Five things, in this order, before any business route:

1. **Configuration from the environment, validated at startup.** Parse and check every variable once at boot and export a typed object. A missing required variable must stop the process with a message naming it, never fall back to a default nobody chose.
2. **A separate app and server.** Export the application without calling `listen`, then start it in a thin entry file. Tests need the app; only the entry point needs a port.
3. **A health route** that reports the process is up, and a readiness route that checks dependencies if a platform will use it. Keep them apart: a health check that queries the database restarts a healthy process during a database blip.
4. **Graceful shutdown.** Handle `SIGTERM`, stop accepting connections, finish in-flight requests under a timeout, close pools, then exit.
5. **An error boundary** that maps thrown errors to status codes and never returns a stack trace to a client. `11ai-nodejs-api-errors` owns the detail.

## Wire the scripts

```json
{
  "scripts": {
    "dev": "node --watch --env-file=.env src/index.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/index.js",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  }
}
```

Current Node runs TypeScript directly and has its own watch mode and env-file loading, so a separate runner and a dotenv dependency are often unnecessary — check the project's Node version before adding either. Keep `start` running built output; running the dev command in production is how a service ends up recompiling on every restart.

Commit a `.env.example` with every variable name and no real values, and confirm `.env` is ignored.

## Verify

```bash
npm run typecheck
npm run build
npm start &
curl -i http://localhost:3000/health
```

Then check the three things a working scaffold must do: an unknown path returns a JSON 404 rather than HTML, a deliberately thrown error returns the mapped status with no stack trace in the body, and the process exits cleanly on `SIGTERM` in well under the shutdown timeout. Stop the server you started; never leave a background process running.

Confirm a missing required variable actually stops the process, by starting it once without one.

## Guardrails

- Do not scaffold over existing server code. Report what is there and change only what was asked.
- Do not commit `.env`, and do not print the contents of one. Confirm a variable is set by name, not by value.
- Do not add a dependency without saying which and why, and use the project's own package manager.
- Do not bind to `0.0.0.0` on a development machine without saying so; it exposes the server to the local network.
- Do not enable permissive cross-origin access or disable TLS verification to make a first request work.
- Report the framework and module system chosen and why, the files created, the configuration variables required, the scripts added, and the verification output including the shutdown check.
