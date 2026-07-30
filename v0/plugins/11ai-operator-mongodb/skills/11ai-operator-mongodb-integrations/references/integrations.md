# MongoDB integrations reference

## Driver: one client per process

```bash
npm install mongodb
```

```ts
// lib/mongo.ts
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) throw new Error("MONGODB_URI is not set")

export const client = new MongoClient(uri, {
  maxPoolSize: 10,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 5_000,
  retryWrites: true,
})

export const db = client.db()
```

What each part is doing:

- The client is created at module scope, so it exists once per process and the pool is shared. `MongoClient` is already a pool; creating one per request creates a pool per request.
- `db()` with no argument uses the database named in the connection string, which keeps the name in one place.
- `serverSelectionTimeoutMS` at five seconds turns an unreachable deployment into a fast, clear failure instead of a thirty-second hang.
- Throwing on a missing variable at import time is deliberate. A silent fallback to `localhost` is how a production process ends up querying nothing.

Connecting is not required before the first operation; the driver connects lazily and queues. Calling `connect()` at startup is still useful because it surfaces a bad connection string at boot rather than on the first request.

Close only on shutdown, never at the end of a request:

```ts
process.on("SIGTERM", async () => {
  await client.close()
  process.exit(0)
})
```

## Serverless connection caching

A serverless platform can run many concurrent instances of one function. Without caching, each invocation opens a pool and the deployment hits its connection limit under a traffic spike.

```ts
// lib/mongo.ts
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) throw new Error("MONGODB_URI is not set")

const globalForMongo = global as unknown as {
  mongoClientPromise?: Promise<MongoClient>
}

const clientPromise =
  globalForMongo.mongoClientPromise ??
  new MongoClient(uri, {
    maxPoolSize: 5,
    minPoolSize: 0,
    maxIdleTimeMS: 30_000,
  }).connect()

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClientPromise = clientPromise
}

export default clientPromise
```

The reasoning:

- Caching a *promise* rather than a client means concurrent invocations during a cold start share one connection attempt instead of racing.
- A small `maxPoolSize` is right here. Concurrency comes from many instances, not from one large pool, and the total is instances multiplied by pool size.
- `maxIdleTimeMS` lets idle connections close so a frozen instance does not hold them indefinitely.
- Caching on `global` in development survives hot reload, which otherwise leaks a pool per edit.

Check the total against the deployment's limit:

```bash
mongosh "$MONGODB_URI" --quiet --eval 'printjson(db.serverStatus().connections)'
```

A `current` value that climbs with traffic and never falls back is the signature of a per-request client.

## Mongoose

```bash
npm install mongoose
```

```ts
// lib/mongoose.ts
import mongoose from "mongoose"

const uri = process.env.MONGODB_URI
if (!uri) throw new Error("MONGODB_URI is not set")

const globalForMongoose = global as unknown as {
  mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
}

const cached = globalForMongoose.mongoose ?? { conn: null, promise: null }
globalForMongoose.mongoose = cached

export async function connectMongoose() {
  if (cached.conn) return cached.conn
  cached.promise ??= mongoose.connect(uri, {
    maxPoolSize: 5,
    bufferCommands: false,
  })
  cached.conn = await cached.promise
  return cached.conn
}
```

```ts
// models/user.ts
import { Schema, model, models } from "mongoose"

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const User = models.User ?? model("User", userSchema)
```

Two Mongoose-specific traps:

- `models.User ?? model(...)` is required under hot reload. Calling `model()` twice for one name throws an overwrite error.
- `bufferCommands: false` makes a query fail fast when there is no connection instead of queueing silently until a timeout.

`unique: true` is an index instruction, not a validation rule. It only takes effect once the index exists, and duplicates already in the collection prevent it from building. Create it deliberately rather than relying on `autoIndex` in production, where index builds at boot slow every deploy.

## Prisma

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider mongodb
```

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model User {
  id     String  @id @default(auto()) @map("_id") @db.ObjectId
  email  String  @unique
  active Boolean @default(true)
}
```

```ts
// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

Prisma on MongoDB requires a replica set, including locally — a standalone server is rejected. `prisma db push` applies the schema; there are no SQL-style migration files for this provider, so data changes still need the migration approach below.

## Migrations

MongoDB has no schema to alter, but indexes and data shape still change. Use a versioned, forward-only, idempotent script set with a record of what has run.

```ts
// migrations/002-add-email-index.ts
import type { Db } from "mongodb"

export const name = "002-add-email-index"

export async function up(db: Db) {
  await db.collection("users").createIndex(
    { email: 1 },
    { unique: true, name: "email_unique", background: true }
  )

  await db.collection("users").updateMany(
    { active: { $exists: false } },
    { $set: { active: true } }
  )
}
```

```ts
// migrations/run.ts
import { db } from "../lib/mongo"

const applied = db.collection("_migrations")

for (const migration of migrations) {
  if (await applied.findOne({ name: migration.name })) continue
  await migration.up(db)
  await applied.insertOne({ name: migration.name, appliedAt: new Date() })
  console.log(`applied ${migration.name}`)
}
```

Rules that make this safe:

- **Idempotent.** `createIndex` on an existing identical index is a no-op; a rename or a changed option is not, and will error. Name indexes explicitly so a change is visible.
- **Recorded.** The `_migrations` collection is what makes a rerun a no-op. Run the whole set twice during development and confirm the second run does nothing.
- **Background index builds** on a populated collection. A foreground build blocks writes to that collection for its duration.
- **Batched updates** on a large collection. A single `updateMany` over millions of documents holds resources for a long time; page through with a filter on the last processed id.
- **Forward-only.** A `down` function that has never been tested is worse than none. Recover from a backup instead.

## Change streams

Requires a replica set. Resume from a stored token, or a restart reprocesses or skips events.

```ts
import type { ResumeToken } from "mongodb"

let resumeAfter: ResumeToken | undefined = await loadToken()

const stream = db.collection("orders").watch(
  [{ $match: { operationType: { $in: ["insert", "update"] } } }],
  { resumeAfter, fullDocument: "updateLookup" }
)

for await (const change of stream) {
  await handle(change)
  await saveToken(change._id)
}
```

Points worth knowing:

- Store the token *after* the work succeeds, or a crash between the two loses the event.
- `fullDocument: "updateLookup"` fetches the current document for an update, since the change itself carries only the modified fields. It is a second read, so use it only when needed.
- A token older than the oplog window cannot resume; the stream errors and the application must fall back to a full reconciliation. Handle that case rather than crash-looping.
- Filter inside the pipeline, not in application code, so the server does the work.
- One consumer per stream. Two instances watching the same collection both process every event, which double-applies side effects.

## Tests against a real deployment

Isolate per worker so parallel tests cannot collide:

```ts
import { MongoClient } from "mongodb"

const dbName = `test_${process.env.JEST_WORKER_ID ?? "1"}`
let client: MongoClient

beforeAll(async () => {
  client = await new MongoClient(process.env.MONGODB_TEST_URI!).connect()
})

afterEach(async () => {
  const collections = await client.db(dbName).collections()
  await Promise.all(collections.map((c) => c.deleteMany({})))
})

afterAll(async () => {
  await client.db(dbName).dropDatabase()
  await client.close()
})
```

The container option gives a fresh server with no shared deployment at all:

```ts
import { MongoDBContainer } from "@testcontainers/mongodb"

const container = await new MongoDBContainer("mongo:8").start()
process.env.MONGODB_TEST_URI = container.getConnectionString()
```

Raise the hook timeout past the image pull, and close the client in `afterAll` — an open pool keeps the process alive and makes the suite look like it hangs.

Never point tests at a shared or production deployment. `deleteMany({})` in `afterEach` is exactly as destructive as it looks if the connection string is wrong.

## Backups

```bash
mongodump --uri="$MONGODB_URI" --archive=dump-$(date +%F).gz --gzip
```

```bash
mongorestore --uri="$MONGODB_TEST_URI" --archive=dump-2026-07-29.gz --gzip \
  --nsFrom='app.*' --nsTo='restore_check.*'
```

```bash
mongosh "$MONGODB_TEST_URI" --quiet --eval 'db.getSiblingDB("restore_check").users.countDocuments()'
```

Restore into a scratch namespace and count documents against the source. A dump nobody has restored is an untested assumption.

Two flags to treat carefully: `--drop` removes each collection before restoring it, and `mongorestore` without `--nsTo` writes into the original database names. Both belong behind explicit approval of the exact target.
