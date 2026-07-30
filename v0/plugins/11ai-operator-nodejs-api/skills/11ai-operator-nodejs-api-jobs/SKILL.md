---
name: 11ai-operator-nodejs-api-jobs
description: "Move slow work off the request path into background jobs, covering a durable queue rather than a floating promise, enqueuing inside the transaction that creates the work, idempotent handlers and retries with backoff, a dead letter queue, concurrency and ordering, scheduled and repeating jobs, a separate worker process, graceful shutdown mid-job, and observability. Use when a request is slow because of work that could happen later, when a job runs twice or is lost, or when a worker must be added."
---
# 11ai Node.js API background jobs

The failure this skill exists to prevent is losing work. A promise started in a handler and not awaited disappears when the process restarts, and nothing records that it was owed. Durability comes first: write the job down, then do it.

## Inspect what exists

```bash
grep -rn 'setTimeout\|setImmediate\|void \|\.catch(' --include='*.ts' src/routes/ src/controllers/ 2>/dev/null | head
grep -rn 'bullmq\|bull\|pg-boss\|agenda\|graphile-worker' package.json 2>/dev/null
grep -rn 'REDIS_URL\|DATABASE_URL' .env.example 2>/dev/null
ls src/workers/ src/jobs/ 2>/dev/null
```

Look for fire-and-forget work in handlers — a `void doSomething()` or a promise with only a `.catch` for logging. Each one is work that vanishes on the next deploy. That is the list to convert.

Establish whether a queue backend already exists. A database-backed queue is a good default when the API already has Postgres: it enqueues inside the same transaction, which removes a whole class of lost or phantom jobs.

## Enqueue durably, inside the transaction

```ts
import { Queue } from "bullmq"

export const emailQueue = new Queue("email", {
  connection: { url: config.REDIS_URL },
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1_000 },
    removeOnComplete: { age: 86_400, count: 1_000 },
    removeOnFail: { age: 604_800 },
  },
})
```

```ts
await emailQueue.add(
  "order-confirmation",
  { orderId },
  { jobId: `order-confirmation:${orderId}` }
)
```

The details that matter:

- **A deterministic `jobId`** makes enqueuing idempotent. A retried request then reuses the same id rather than queueing a second confirmation email.
- **Bounded attempts with exponential backoff.** Unlimited retries on a permanently failing job hammer a downstream service forever.
- **Retention settings**, or completed jobs accumulate until the store runs out of memory.
- **Pass an identifier, not a payload snapshot.** The handler re-reads current state; a payload copied at enqueue time is stale by the time it runs.

The ordering problem: enqueue after commit and a crash loses the job; enqueue before commit and a rollback leaves a job for a row that does not exist. Two correct answers:

1. **A database-backed queue**, enqueued in the same transaction — atomic by construction.
2. **An outbox table** written in the transaction, with a poller that moves rows to the queue.

Never call `queue.add` in the middle of a transaction against a separate store and assume it is safe.

## Write the handler to be re-runnable

```ts
import { Worker } from "bullmq"

export const emailWorker = new Worker(
  "email",
  async (job) => {
    const order = await findOrder(job.data.orderId)
    if (!order) return { skipped: "order deleted" }
    if (order.confirmationSentAt) return { skipped: "already sent" }

    await sendConfirmationEmail(order)
    await markConfirmationSent(order.id)
  },
  {
    connection: { url: config.REDIS_URL },
    concurrency: 5,
    limiter: { max: 100, duration: 60_000 },
  }
)

emailWorker.on("failed", (job, error) => {
  console.error("job failed", { id: job?.id, attempts: job?.attemptsMade, error: error.message })
})
```

Every handler must be safe to run twice. A queue guarantees at-least-once delivery, not exactly-once: a worker can complete the work and die before acknowledging, and the job runs again. The `confirmationSentAt` check is what makes that harmless, and it must be set in the same write as the effect where possible.

Distinguish the two failure kinds. A transient failure — a timeout, a 503 — should throw so it retries. A permanent one — a deleted record, invalid input — should return rather than throw, or it burns all five attempts and lands in the dead letter queue for no reason.

Set `concurrency` deliberately; each worker slot holds a database connection, so worker concurrency multiplied by worker count must fit the pool.

## Run workers as their own process

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "start:worker": "node dist/worker.js"
  }
}
```

Keep workers out of the API process. A CPU-heavy job in the API process blocks the event loop and slows every request, and the two scale on different signals — the API on request rate, the worker on queue depth.

```ts
// src/worker.ts
const shutdown = async () => {
  await emailWorker.close()
  await pool.end()
  process.exit(0)
}
process.on("SIGTERM", shutdown)
```

`worker.close()` stops taking new jobs and waits for the in-flight one to finish. Without it, a deploy kills a job mid-execution — which is survivable only because the handler is idempotent, and is still worth avoiding.

## Schedule repeating work

```ts
await emailQueue.add(
  "daily-digest",
  {},
  { repeat: { pattern: "0 3 * * *", tz: "UTC" }, jobId: "daily-digest" }
)
```

A fixed `jobId` prevents a duplicate schedule accumulating on every deploy — the classic cause of a digest arriving four times. Set the time zone explicitly, and make a repeating job's runtime shorter than its interval or runs overlap.

## Observe the queue

```ts
app.get("/internal/queues", async (_req, res) => {
  res.json({ email: await emailQueue.getJobCounts() })
})
```

Watch queue depth, failure rate, and the dead letter count. A queue that only grows means workers are down or too slow, and it is invisible from the API's own metrics — the API looks healthy while nothing gets done. Alert on depth and on any job reaching the dead letter queue.

## Verify

```bash
npm run start:worker &
curl -i -X POST http://localhost:3000/api/orders -d '{"sku":"SKU-1"}' -H 'Content-Type: application/json'
```

Check each of these:

1. The request returns quickly and the job appears in the queue.
2. Running the same job twice produces one effect.
3. A transient failure retries with growing delay; a permanent one does not consume every attempt.
4. A job exceeding its attempts lands in the dead letter queue and is visible.
5. Enqueuing inside a transaction that then rolls back leaves **no** job.
6. `SIGTERM` during a job lets it finish before the process exits.
7. Stopping the worker leaves jobs queued rather than lost, and they run when it returns.

## Report

State which work moved off the request path, the queue backend and how enqueuing relates to the database transaction, the deterministic job ids, the attempt and backoff policy, what makes each handler idempotent, how transient and permanent failures are distinguished, the worker process and its concurrency against the connection pool, any repeating schedule with its fixed id and time zone, the dead letter handling and alerting, and the verification including the duplicate-run, rollback, and shutdown checks.
