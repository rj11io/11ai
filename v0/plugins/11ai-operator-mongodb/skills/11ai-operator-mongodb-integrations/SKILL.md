---
name: 11ai-operator-mongodb-integrations
description: "Connect MongoDB to the systems around it, covering the Node.js driver and connection reuse, Mongoose or Prisma as a schema layer, connection pooling in serverless and container runtimes, schema migration tooling, change streams feeding an application, tests against a real deployment, and backups. Use when an application must open a connection correctly, when a serverless function exhausts connections, when a migration or seed step must be added, or when tests need a real database."
---
# 11ai MongoDB integrations

Almost every MongoDB integration problem is a connection-lifetime problem: who opens the connection, how many exist, and when they close. Establish that before touching query code, because a pool created in the wrong place fails under load rather than in development.

## Name the seam

- **Driver and connection reuse** — one client, one pool, created once per process and shared.
- **Schema layer** — Mongoose or Prisma owns models, validation, and types on top of the driver.
- **Serverless and container runtimes** — a function that creates a client per invocation exhausts the deployment's connection limit.
- **Migrations** — MongoDB has no schema to migrate, so data and index changes need a versioned, replayable, forward-only tool.
- **Change streams** — an application reacts to writes, which requires a replica set and a resume token.
- **Tests** — a real deployment per run or per worker, isolated so tests cannot see each other's data.
- **Backups** — a dump that is verified by restoring it somewhere harmless.

## Wire one deliberately

1. Inspect first: how the application currently connects and where that code runs, whether a schema layer already exists, the deployment type and its connection limit, and what the test setup does today.
2. Create the client once per process, at module scope, and reuse it. Never open a connection inside a request handler, and never close the shared client at the end of a request.
3. In a serverless runtime, cache the client on the global object so a warm invocation reuses it, and keep the pool small. Read [references/integrations.md](references/integrations.md) for the driver singleton, the serverless caching pattern, the Mongoose and Prisma setup, the migration and change stream shapes, and the test isolation options.
4. Pick one schema owner. The driver and a schema layer can coexist, but the same collection written through both loses the validation the schema layer promised.
5. Make migrations forward-only, idempotent, and recorded in a collection so a rerun is a no-op. Build indexes in the background on a populated collection; a foreground build blocks writes.
6. For tests, give each worker its own database name rather than relying on ordering, and never point tests at a shared or production deployment.

## Verify end to end

- Start the application and confirm exactly one connection burst appears, then count open connections under load with `db.serverStatus().connections` and confirm the number stays near the pool size rather than climbing.
- Run a migration twice and confirm the second run changes nothing.
- Restart the application and confirm a change stream resumes from its token rather than reprocessing history or skipping events.
- Restore a backup into a scratch database and count documents against the source. A dump that has never been restored is not a backup.
- Run the test suite twice in a row and confirm it passes both times.

## Report

State the seam wired, where the client is created and its pool size, the schema owner, the files changed, the connection count observed under load, and the verification evidence. Redact connection strings and credentials. Call out any place where two layers can write the same collection, and any index built in the foreground.
