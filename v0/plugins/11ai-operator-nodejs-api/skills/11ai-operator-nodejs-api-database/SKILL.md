---
name: 11ai-operator-nodejs-api-database
description: "Add database access and CRUD endpoints to a Node.js API, covering one pool per process and its sizing, parameterized queries, a repository layer separate from handlers, transactions across related writes, mapping database errors to status codes, migrations as the schema owner, connection handling in serverless runtimes, and closing the pool on shutdown. Use when an API must read or write a database, when CRUD endpoints must be added, or when connection or query errors appear under load."
---
# 11ai Node.js API database access

Two decisions determine whether this works under load: the pool is created once per process, and every value reaching SQL is a parameter rather than string-concatenated. Get those right and the rest is shape.

## Inspect what exists

```bash
cat package.json | grep -iE 'pg|mysql|prisma|drizzle|knex|mongoose|sequelize'
grep -rn 'new Pool\|createPool\|new PrismaClient\|drizzle(' --include='*.ts' src/ lib/ 2>/dev/null
grep -rn 'DATABASE_URL' --include='*.ts' src/ 2>/dev/null | head
ls migrations/ prisma/ drizzle/ 2>/dev/null
```

Find where the client is created. A `new Pool(...)` inside a request handler or a route module that is imported per request is the defect to fix before anything else — it opens a pool per request and exhausts the database under modest traffic.

## Create one pool, close it on shutdown

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

pool.on("error", (error) => console.error("idle client error", error))

export async function closeDatabase() {
  await pool.end()
}
```

Each setting prevents a specific failure:

- **`max`** bounds the pool. The real limit is `max` multiplied by process count, so four instances at 10 need 40 connections available.
- **`connectionTimeoutMillis`** turns an unreachable database into a fast, clear error instead of a hanging request.
- **`statement_timeout`** stops one pathological query holding a connection indefinitely. Without it, a single slow query can consume the whole pool.
- **The `error` listener** prevents an idle-client error from crashing the process.
- **`pool.end()`** in the shutdown handler is what lets the process exit; an open pool keeps the event loop alive and the process looks hung.

In a serverless runtime, use the provider's pooled endpoint or set `max: 1` — concurrency comes from many instances, not one large pool.

## Keep queries parameterized and in a repository

```ts
// src/repositories/users.ts
import { pool } from "../db.js"

export async function findUserById(id: string) {
  const { rows } = await pool.query(
    `select id, email, created_at from public.users where id = $1`,
    [id]
  )
  return rows[0] ?? null
}

export async function listUsers({ limit, offset }: { limit: number; offset: number }) {
  const { rows } = await pool.query(
    `select id, email from public.users order by created_at desc limit $1 offset $2`,
    [Math.min(limit, 100), offset]
  )
  return rows
}

export async function createUser({ email }: { email: string }) {
  const { rows } = await pool.query(
    `insert into public.users (email) values ($1) returning id, email, created_at`,
    [email]
  )
  return rows[0]
}
```

Rules that matter more than the shape:

- **Always parameterize.** Never build SQL by interpolating a value, even one that looks safe — that is SQL injection, and a validator upstream is not a substitute.
- **Select named columns, not `*`.** A `select *` leaks a column added later, such as a password hash, straight into a response.
- **Clamp the limit** in the repository, not only in the handler. An unbounded limit is a denial-of-service vector.
- **Keep SQL out of handlers.** A repository layer makes the queries testable and stops the same query being written three ways.
- **Never build an `order by` column from user input** without checking it against an allow-list; it cannot be parameterized.

## Group related writes in a transaction

```ts
export async function createOrderWithItems(order: NewOrder, items: NewItem[]) {
  const client = await pool.connect()
  try {
    await client.query("begin")
    const { rows } = await client.query(
      `insert into public.orders (customer_id, total) values ($1, $2) returning id`,
      [order.customerId, order.total]
    )
    const orderId = rows[0].id
    for (const item of items) {
      await client.query(
        `insert into public.order_items (order_id, sku, quantity) values ($1, $2, $3)`,
        [orderId, item.sku, item.quantity]
      )
    }
    await client.query("commit")
    return orderId
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
  }
}
```

`client.release()` in `finally` is required — a client checked out and never released is a permanently lost pool slot, and enough of those hang the API.

Do not call an external service inside a transaction. It holds a connection for the duration of a network call, and a rollback cannot undo the external effect.

## Map database errors to status codes

```ts
export function statusForDatabaseError(error: unknown): number {
  const code = (error as { code?: string }).code
  switch (code) {
    case "23505": return 409  // unique violation
    case "23503": return 409  // foreign key violation
    case "23514": return 400  // check constraint violation
    case "22P02": return 400  // invalid input syntax
    case "57014": return 504  // statement timeout
    default: return 500
  }
}
```

A unique violation is a conflict the client can act on, not a server error — returning 500 for a duplicate email tells the user nothing. Never pass a raw database message to a client: it reveals table and column names. Log the original, return a mapped code and a generic message.

## Let migrations own the schema

Schema changes belong in versioned migration files, applied by one tool, and run as a deploy step rather than at application startup — several instances starting at once would race. Two owners for the schema produces permanent drift, so if an ORM manages migrations, hand-written SQL migrations must not, and the reverse.

## Verify

```bash
curl -i http://localhost:3000/api/users
curl -i -X POST http://localhost:3000/api/users -H 'Content-Type: application/json' -d '{"email":"a@example.com"}'
curl -i -X POST http://localhost:3000/api/users -H 'Content-Type: application/json' -d '{"email":"a@example.com"}'
```

The second identical POST must return 409, not 500. Then check the pool under load:

```sql
select count(*), state from pg_stat_activity where datname = current_database() group by state;
```

Hold load and confirm the connection count stays near the pool size rather than climbing. Point `DATABASE_URL` at an unreachable host and confirm the API returns a mapped error within the timeout instead of hanging. Finally send `SIGTERM` under load and confirm in-flight requests finish, the pool closes, and the process exits.

## Report

State where the pool is created and its size, the total across instances against the database's limit, the repository functions added with their parameterized queries, which writes are grouped in a transaction and that the client is released in `finally`, the database-error to status-code mapping, who owns migrations and when they run, and the verification including the duplicate-key status, the connection count under load, the unreachable-database behaviour, and the shutdown check. Flag any interpolated SQL, any `select *` on a table with sensitive columns, and any unbounded query.
