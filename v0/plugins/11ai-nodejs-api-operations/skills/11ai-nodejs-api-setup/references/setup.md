# Node.js API setup reference

## Pin the runtime

```json
{
  "engines": { "node": ">=22" },
  "type": "module"
}
```

```text
22
```

`.nvmrc` and `engines` together keep local machines, the pipeline, and the container image on one version. A mismatch shows up as a syntax error on a language feature rather than as a version message.

## TypeScript

```bash
npm install --save-dev typescript @types/node
```

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2023"],
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "sourceMap": true,
    "declaration": false
  },
  "include": ["src/**/*"]
}
```

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["src/**/*.test.ts", "src/test/**"]
}
```

Notes that save time later:

- `module: NodeNext` requires the `.js` extension in relative imports even in TypeScript source. It looks wrong and is correct: `import { config } from "./config.js"`.
- `noUncheckedIndexedAccess` makes array and record access return a possibly-undefined type. It catches a whole class of runtime error in request handling, at the cost of a few explicit checks.
- A separate build config excludes tests so `dist` holds only shipping code.

Current Node runs TypeScript directly, so a development runner is often unnecessary:

```bash
node --watch --env-file=.env src/index.ts
```

Check the project's Node version before relying on that. On older versions, use `tsx watch src/index.ts`.

## Validated configuration

One module, parsed once, exported typed.

```bash
npm install zod
```

```ts
// src/config.ts
import { z } from "zod"

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("127.0.0.1"),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error("Invalid environment configuration:")
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`)
  }
  process.exit(1)
}

export const config = parsed.data
```

What this buys:

- The process refuses to start with a missing or malformed required variable, naming it. The alternative — a silent default — is how a service ends up pointed at the wrong database.
- `z.coerce.number()` handles the fact that every environment variable is a string.
- The error listing prints variable *names* and messages, never values, so a malformed connection string is not echoed into a log.
- `HOST` defaults to `127.0.0.1`. Binding to `0.0.0.0` exposes a development server to the local network, so make it a deliberate choice.

Commit the shape and never the values:

```text
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/app
LOG_LEVEL=debug
```

```bash
grep -q '^\.env$' .gitignore && echo ".env ignored"
```

## Split the app from the server

Tests need the application object; only the entry point needs a port.

```ts
// src/app.ts
import express from "express"
import { healthRouter } from "./routes/health.js"
import { errorHandler } from "./middleware/error-handler.js"

export function createApp() {
  const app = express()

  app.use(express.json({ limit: "1mb" }))
  app.use("/health", healthRouter)

  app.use((_req, res) => {
    res.status(404).json({ error: { code: "not_found", message: "Route not found" } })
  })

  app.use(errorHandler)

  return app
}
```

The order is load-bearing: body parsing first, then routes, then the catch-all 404, then the error handler last. An error handler registered before the routes never runs.

A JSON 404 rather than the framework's HTML default matters because clients parse the body.

## Framework scaffolds

### Express 5

```bash
npm install express
npm install --save-dev @types/express
```

Version 5 forwards a rejected promise from an async handler to the error middleware. On version 4 an async throw crashes the process unless every handler is wrapped, which is the single strongest reason to be on 5.

### Fastify

```bash
npm install fastify
```

```ts
import Fastify from "fastify"

export function createApp() {
  const app = Fastify({ logger: true })

  app.get("/health", async () => ({ status: "ok" }))

  app.post(
    "/users",
    {
      schema: {
        body: {
          type: "object",
          required: ["email"],
          properties: { email: { type: "string", format: "email" } },
        },
        response: {
          201: {
            type: "object",
            properties: { id: { type: "string" }, email: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => reply.code(201).send(await createUser(request.body))
  )

  return app
}
```

The response schema is not only documentation — Fastify compiles it into a fast serializer and it strips fields not declared, which prevents accidentally returning a password hash.

### Hono

```bash
npm install hono @hono/node-server
```

```ts
import { Hono } from "hono"
import { serve } from "@hono/node-server"

export const app = new Hono()

app.get("/health", (c) => c.json({ status: "ok" }))

serve({ fetch: app.fetch, port: config.PORT })
```

Built on web standards, so the same routes run on Node and on edge runtimes.

## Entry point and graceful shutdown

```ts
// src/index.ts
import { createApp } from "./app.js"
import { config } from "./config.js"
import { closeDatabase } from "./db.js"

const server = createApp().listen(config.PORT, config.HOST, () => {
  console.log(`listening on http://${config.HOST}:${config.PORT}`)
})

let shuttingDown = false

async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`${signal} received, shutting down`)

  const timer = setTimeout(() => {
    console.error("shutdown timed out, exiting")
    process.exit(1)
  }, config.SHUTDOWN_TIMEOUT_MS)
  timer.unref()

  server.close(async (error) => {
    if (error) {
      console.error("error closing server", error)
      process.exit(1)
    }
    await closeDatabase()
    clearTimeout(timer)
    process.exit(0)
  })
}

process.on("SIGTERM", () => void shutdown("SIGTERM"))
process.on("SIGINT", () => void shutdown("SIGINT"))

process.on("unhandledRejection", (reason) => {
  console.error("unhandled rejection", reason)
  process.exit(1)
})
```

Why each piece is there:

- `server.close` stops accepting new connections and waits for in-flight requests. Exiting immediately on `SIGTERM` drops requests mid-flight during every deploy.
- The timeout is the backstop for a request that never finishes. Without it, shutdown can hang until the platform kills the process.
- `timer.unref()` stops the timer itself from keeping the process alive.
- The `shuttingDown` guard makes a second signal a no-op rather than a double shutdown.
- Exiting on an unhandled rejection is deliberate: the process is in an unknown state, and a supervisor restarting it is safer than continuing.

## Health and readiness

```ts
// src/routes/health.ts
import { Router } from "express"
import { pingDatabase } from "../db.js"

export const healthRouter = Router()

healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() })
})

healthRouter.get("/ready", async (_req, res) => {
  try {
    await pingDatabase()
    res.json({ status: "ready" })
  } catch {
    res.status(503).json({ status: "not_ready" })
  }
})
```

Keep them separate. A liveness check that queries the database makes a platform restart a healthy process whenever the database has a brief problem, turning a small outage into a restart loop. Liveness answers "is this process alive"; readiness answers "should traffic come here".

## Verify the scaffold

```bash
npm run typecheck
npm run build
npm start &
SERVER=$!

curl -i http://localhost:3000/health
curl -i http://localhost:3000/no-such-route

time kill -TERM $SERVER
```

Check four things:

1. `/health` returns 200 with JSON.
2. An unknown route returns a JSON 404, not HTML.
3. A thrown error returns the mapped status with no stack trace in the body.
4. `SIGTERM` exits well inside the shutdown timeout.

Then confirm the configuration gate works, by starting once without a required variable:

```bash
env -u DATABASE_URL npm start
```

It must exit non-zero and name the variable.
