---
name: 11ai-operator-nodejs-api-v24-rate-limiting
description: "Add rate limiting to a Node.js API without blocking legitimate traffic, covering the key choice of address versus authenticated identity, trusting forwarded headers behind a proxy, a shared store across instances, per-route limits for expensive and authentication endpoints, the standard response headers and 429 status, burst allowance, and excluding health checks. Use when an API must be protected from abuse, when a limiter blocks real users, or when limits reset unexpectedly across instances."
---
# 11ai Node.js API rate limiting

Version baseline: Node.js 24.x Krypton LTS, using the latest security patch in that release line (24.18.0 at this review). Do not silently move an existing application between Node release lines; inspect engines, runtime files, CI, and deployment support first.

Two mistakes make a limiter worse than none. Keying on an address the client controls lets an attacker rotate past it while a shared corporate address gets blocked. And an in-memory store gives each instance its own counter, so the effective limit is the configured one multiplied by instance count — and it resets on every deploy.

## Inspect the deployment shape first

```bash
grep -rn 'rate-limit\|rateLimit\|trust proxy' --include='*.ts' src/ 2>/dev/null
grep -rn "app.set('trust proxy'\|trustProxy" --include='*.ts' src/ 2>/dev/null
node -e "console.log(process.env.REDIS_URL ? 'shared store available' : 'no shared store configured')"
```

Establish three things before writing any limiter:

1. **How many instances run.** More than one means an in-memory store cannot enforce a global limit.
2. **How many proxies sit in front.** That number decides how to read the client address.
3. **Whether a shared store exists.** Without one, the limiter is per-instance and approximate.

Also check whether the platform already rate limits at its edge. Two limiters with different keys produce blocks nobody can explain.

## Read the client address correctly

```ts
app.set("trust proxy", 1)
```

The number is how many proxies are in front. This is the setting that decides whether the limiter works at all:

- **Set too low or unset**, every request appears to come from the proxy, so all traffic shares one counter and the whole API is limited as a single client.
- **Set to `true`**, the header is trusted from any source, so a client can send `X-Forwarded-For: <random>` on each request and bypass the limit entirely.

Never use `app.set("trust proxy", true)` on a public API. Count the hops and set the number.

```bash
curl -s http://localhost:3000/api/debug/ip -H 'X-Forwarded-For: 203.0.113.9'
```

Verify that the address the application sees matches the real client, not the proxy and not an attacker-supplied value.

## Key on identity where you have one

```ts
import rateLimit from "express-rate-limit"
import { RedisStore } from "rate-limit-redis"
import { createClient } from "redis"

const redis = createClient({ url: config.REDIS_URL })
await redis.connect()

const store = new RedisStore({ sendCommand: (...args: string[]) => redis.sendCommand(args) })

export const apiLimiter = rateLimit({
  store,
  windowMs: 60_000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as { auth?: { userId?: string } }).auth?.userId
    return userId ? `user:${userId}` : `ip:${req.ip}`
  },
  skip: (req) => req.path === "/health" || req.path === "/health/ready",
  handler: (_req, res) => {
    res.status(429).json({ error: { code: "rate_limited", message: "Too many requests" } })
  },
})
```

An authenticated identity is a much better key than an address: it survives a changing address, it does not punish everyone behind one office connection, and it cannot be spoofed once the token is verified. Fall back to the address only for unauthenticated traffic.

`standardHeaders: "draft-7"` sends `RateLimit` and `RateLimit-Policy` so a well-behaved client can back off instead of retrying blindly. Return 429, and add `Retry-After` for anything a client should wait on.

Exclude health and readiness endpoints. A limited health check makes a platform mark a healthy instance as down.

## Set per-route limits

```ts
export const authLimiter = rateLimit({
  store,
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `auth:${req.ip}:${String((req.body as { email?: string })?.email ?? "")}`,
})

app.use("/api", apiLimiter)
app.post("/api/auth/login", authLimiter, loginHandler)
app.post("/api/reports", expensiveLimiter, reportHandler)
```

One global limit is the wrong shape. A cheap read and a credential check do not deserve the same allowance:

- **Authentication endpoints** need a tight limit with `skipSuccessfulRequests: true`, so only failures count and a legitimate user is never locked out by their own successful sign-ins. Keying on address plus the submitted identifier slows credential stuffing without letting one attacker lock out a real account.
- **Expensive endpoints** — reports, exports, anything that fans out — need their own small limit.
- **Write endpoints** usually deserve less than reads.

Where bursts are normal, prefer a token-bucket approach over a fixed window: a fixed window lets a client spend the whole allowance in the last second of one window and again in the first second of the next, which is twice the intended rate at the boundary.

## Fail open or closed, deliberately

If the shared store is unreachable, the limiter must choose: fail open and stop limiting, or fail closed and reject everything. Failing closed turns a cache outage into a full outage, so fail open for a general API limiter and log loudly — but fail closed for an authentication limiter, where losing the protection is worse than losing availability.

Make the choice explicit in code rather than inheriting a library default.

## Verify

```bash
for i in $(seq 1 130); do curl -s -o /dev/null -w '%{http_code} ' http://localhost:3000/api/orders; done; echo
curl -i http://localhost:3000/api/orders | grep -i 'ratelimit'
for i in $(seq 1 12); do curl -s -o /dev/null -w '%{http_code} ' -X POST http://localhost:3000/api/auth/login -d '{"email":"a@example.com","password":"wrong"}' -H 'Content-Type: application/json'; done; echo
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/health
```

Check each of these:

1. The limit triggers at the configured count and returns 429 with the headers.
2. A spoofed `X-Forwarded-For` does **not** reset the counter.
3. With two instances running, the limit is global rather than doubled.
4. Failed sign-ins count and successful ones do not.
5. Health checks are never limited.
6. The counter survives a restart, proving the shared store is in use.

## Report

State the number of proxies and the `trust proxy` value, the key used per route and why identity or address, the store and whether it is shared across instances, the limits and windows per route with the reasoning for authentication and expensive endpoints, the response status and headers, the fail-open or fail-closed choice per limiter, the excluded paths, and the verification including the spoofed-header test, the multi-instance check, and the restart persistence.
