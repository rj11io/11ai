# Node.js API integrations reference

## Database pool

One pool per process, created at module scope, closed on shutdown.

```ts
// src/db.ts
import { Pool } from "pg"
import { config } from "./config.js"

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 10_000,
})

export async function pingDatabase() {
  const { rows } = await pool.query("select 1 as ok")
  return rows[0]?.ok === 1
}

export async function closeDatabase() {
  await pool.end()
}
```

Every one of those settings prevents a specific failure:

- `max` bounds the pool. The real limit is `max` multiplied by the number of processes, so a service running four instances with `max: 10` needs forty connections available.
- `connectionTimeoutMillis` fails fast when the database is unreachable, instead of a request hanging until the client gives up.
- `statement_timeout` stops one pathological query from holding a connection indefinitely. Without it, a single slow query can consume the whole pool.
- `pool.end()` in shutdown is what lets the process exit. An open pool keeps the event loop alive and the process appears to hang.

Never create a pool inside a request handler. Never call `pool.end()` at the end of a request; the next one then has no pool.

For a serverless runtime, either use the provider's pooled endpoint or set `max: 1` and rely on many instances for concurrency. A per-instance pool of ten across a hundred cold starts exhausts any database.

## Outbound calls

Timeout and bounded retry, always.

```ts
// src/lib/http.ts
export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  { timeoutMs = 5_000, retries = 2 } = {}
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, { ...init, signal: controller.signal })

      if (response.status >= 500 && attempt < retries) {
        lastError = new Error(`upstream ${response.status}`)
        await sleep(2 ** attempt * 100 + Math.random() * 100)
        continue
      }

      if (!response.ok) {
        throw new UpstreamError(response.status, await response.text())
      }

      return (await response.json()) as T
    } catch (error) {
      lastError = error
      if (attempt === retries) break
      await sleep(2 ** attempt * 100 + Math.random() * 100)
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError
}
```

The rules behind it:

- `fetch` has no default timeout. Without `AbortSignal`, a slow upstream holds a request until the client disconnects, and enough of those exhaust the server.
- Retry only what is safe: a 5xx, a timeout, or a connection error. Never retry a 4xx — the request was wrong and will be wrong again.
- Retry only idempotent methods, unless the upstream accepts an idempotency key.
- Exponential backoff with jitter. Fixed-interval retries from many instances synchronise into a thundering herd.
- Cap total attempts. Retries multiply across service hops: three services each retrying three times is twenty-seven calls from one request.

## Authentication provider

Verify tokens against the provider's rotating public keys, cached rather than fetched per request.

```bash
npm install jose
```

```ts
// src/auth/verify.ts
import { createRemoteJWKSet, jwtVerify } from "jose"
import { config } from "../config.js"

const jwks = createRemoteJWKSet(new URL(config.JWKS_URL), {
  cooldownDuration: 30_000,
  cacheMaxAge: 600_000,
})

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: config.AUTH_ISSUER,
    audience: config.AUTH_AUDIENCE,
  })
  return payload
}
```

Non-negotiable checks: signature, `issuer`, `audience`, and expiry. Omitting `audience` accepts a valid token minted for a different application — a real privilege escalation, not a technicality.

`createRemoteJWKSet` caches the key set and refetches when it sees an unknown key id, which handles rotation without a request per verification. Never disable verification to debug; decode the token separately instead.

Never log a token. Log the subject claim if you need to trace a request to a user.

## Webhook receiver

Signature verification runs over the raw bytes, before any parsing.

```ts
// src/routes/webhook.ts
import crypto from "node:crypto"
import express from "express"
import { config } from "../config.js"

export const webhookRouter = express.Router()

webhookRouter.post(
  "/provider",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.header("x-provider-signature") ?? ""
    const expected = crypto
      .createHmac("sha256", config.WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex")

    const a = Buffer.from(signature)
    const b = Buffer.from(expected)

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: { code: "invalid_signature" } })
    }

    const event = JSON.parse(req.body.toString("utf8"))

    if (await alreadyProcessed(event.id)) {
      return res.status(200).json({ received: true })
    }

    await recordEvent(event.id)
    res.status(200).json({ received: true })

    void handleEvent(event).catch((error) =>
      console.error("webhook handling failed", { eventId: event.id, error })
    )
  }
)
```

Five things this gets right:

- **Raw body.** Mount `express.raw` on this route only. A global `express.json()` consumes the stream and the bytes the signature covers are gone.
- **Constant-time comparison.** `timingSafeEqual` and a length check first, because it throws on differing lengths.
- **Reject before parsing.** An unverified body is untrusted input.
- **Idempotency.** Providers redeliver. Record the event id and treat a repeat as success, or a retry double-charges or double-sends.
- **Acknowledge fast, work after.** Providers time out in seconds and retry. Return 200 once the event is durably recorded, then process it — ideally through a queue rather than a floating promise.

Register the raw route before the global JSON parser in the middleware chain.

## Structured logging and correlation

```bash
npm install pino
```

```ts
// src/lib/logger.ts
import pino from "pino"
import { config } from "../config.js"

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.token",
      "*.secret",
    ],
    censor: "[redacted]",
  },
})
```

```ts
// src/middleware/correlation.ts
import { AsyncLocalStorage } from "node:async_hooks"
import { randomUUID } from "node:crypto"
import type { RequestHandler } from "express"
import { logger } from "../lib/logger.js"

export const requestContext = new AsyncLocalStorage<{ requestId: string }>()

export const correlation: RequestHandler = (req, res, next) => {
  const requestId = req.header("x-request-id") ?? randomUUID()
  res.setHeader("x-request-id", requestId)

  requestContext.run({ requestId }, () => {
    const child = logger.child({ requestId, method: req.method, path: req.path })
    const start = process.hrtime.bigint()

    res.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6
      child.info({ status: res.statusCode, durationMs: Math.round(ms) }, "request")
    })

    next()
  })
}
```

`AsyncLocalStorage` carries the identifier through async calls without threading it through every function signature. Read it in the outbound client and forward it:

```ts
const { requestId } = requestContext.getStore() ?? {}
await fetchJson(url, { headers: { "x-request-id": requestId ?? "" } })
```

Accepting an inbound `x-request-id` is what makes a trace span services. The `redact` list is what keeps an authorization header out of the log; add to it whenever a new sensitive field appears in a request body.

## Tracing and metrics

Instrumentation must load before the application so it can wrap the framework and clients.

```bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http
```

```ts
// src/telemetry.ts
import { NodeSDK } from "@opentelemetry/sdk-node"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"

const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME ?? "api",
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
})

sdk.start()

process.on("SIGTERM", () => void sdk.shutdown())
```

```json
{
  "scripts": {
    "start": "node --import ./dist/telemetry.js dist/index.js"
  }
}
```

Loading it with `--import` is what makes auto-instrumentation work. Imported from inside the application, the framework and clients are already loaded and unwrapped, and traces come out empty.

Sample in production. Tracing every request at high volume costs more than the insight is worth.

## Container image

```dockerfile
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Two things this depends on. `CMD` in exec form means the Node process is PID 1 and receives `SIGTERM` directly — shell form runs it under `/bin/sh`, which does not forward signals, so every stop waits out the timeout and then kills the process, dropping in-flight requests. And `HOST` must be `0.0.0.0` inside a container; the development default of `127.0.0.1` is unreachable from outside it.

```bash
docker run -d --name api -p 3000:3000 -e HOST=0.0.0.0 api:local
time docker stop api
```

A stop that takes ten seconds is a signal-handling bug. A clean one returns in well under a second.

## Behind a reverse proxy

```ts
app.set("trust proxy", 1)
```

The number is how many proxies sit in front. Getting it right matters because `req.ip`, `req.protocol`, and rate limiting all read the forwarding headers.

Do not use `app.set("trust proxy", true)`. It trusts the header from any source, so a client can set `X-Forwarded-For` to whatever it likes — which defeats rate limiting by address and puts false addresses in audit logs.

The proxy must also set the headers the API expects:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 30s;
}
```

Keep the proxy's read timeout above the API's own request timeout, or the proxy returns a gateway error while the API is still working and the logs disagree about what happened.

## Pipeline

```yaml
jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: app_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 3s
          --health-retries 10

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --ci
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/app_test
      - run: npm run build
```

`node-version-file: .nvmrc` keeps the pipeline on the version the project pinned. The health options on the service are what stop tests racing the database's first boot — without them, the first test run fails on connection roughly half the time.

Run `lint` and `typecheck` before tests so a fast failure comes back fast, and `build` last so a compile error cannot be masked by passing tests.
