---
name: 11ai-operator-mongodb-v8-transactions
description: "Write multi-document MongoDB transactions correctly, covering the replica set requirement, sessions and the callback API, read and write concerns, transient error retries and the commit-unknown case, the time and size limits, passing the session to every operation, and when a single-document update or a schema change is the better answer. Use when several documents must change atomically, when a transaction aborts or times out, or when a write must be all-or-nothing."
---
# 11ai MongoDB transactions

Version baseline: MongoDB 8.x, with 8.3.7 as the current stable release at this review. Inspect server, Atlas release track, featureCompatibilityVersion, mongosh, Database Tools, and driver versions independently before using 8.3-only behavior.

Two facts decide most of this. Transactions require a replica set — a standalone server rejects them outright, including a local development server started without one. And a transaction that touches many documents or runs long is a sign the data model is fighting you: MongoDB updates a single document atomically for free, so the best transaction is often the one you do not need.

## Check the prerequisite and the current shape

```bash
mongosh "$MONGODB_URI" --quiet --eval 'printjson({ setName: db.hello().setName ?? "standalone: transactions unavailable", version: db.version() })'
mongosh "$MONGODB_URI" --quiet --eval 'printjson(db.serverStatus().transactions)'
```

`setName` absent means no transactions. For local development, run a single-node replica set rather than a standalone server, or the code works in production and fails on every developer machine.

Before writing one, ask whether it is needed. If the fields that must change together live in one document, a single `updateOne` is already atomic and cheaper. Restructuring two collections into one embedded document removes the transaction entirely and is usually the better fix.

`db.serverStatus().transactions` shows current and aborted counts, which is where to look when transactions are failing under load.

## Use the callback API

```js
const session = client.startSession()

try {
  const result = await session.withTransaction(async () => {
    const orders = client.db().collection("orders")
    const inventory = client.db().collection("inventory")

    const item = await inventory.findOne({ sku: "SKU-1" }, { session })
    if (!item || item.quantity < 1) throw new Error("out of stock")

    await inventory.updateOne({ sku: "SKU-1" }, { $inc: { quantity: -1 } }, { session })
    await orders.insertOne({ sku: "SKU-1", createdAt: new Date() }, { session })
  }, {
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" },
    readPreference: "primary",
  })
} finally {
  await session.endSession()
}
```

The details that make this correct:

- **`withTransaction` over manual start and commit.** It retries transient errors and the unknown-commit case for you, which is the part hand-rolled code gets wrong.
- **`{ session }` on every operation.** An operation without it runs *outside* the transaction and is not rolled back — a silent correctness bug with no error.
- **`endSession` in `finally`.** A leaked session holds server resources.
- **`w: "majority"`** so a committed write survives a failover. A lower write concern can lose an acknowledged transaction.
- **Throwing to abort.** Any thrown error aborts and rolls back; there is no need to call abort explicitly inside the callback.

Keep the callback free of side effects that cannot be rolled back — no email, no payment call, no file write. The callback can be retried, so anything external would happen twice. Record the intent in the transaction and do the external work after it commits.

## Handle the two error classes

```js
if (error.hasErrorLabel?.("TransientTransactionError")) {
  // the whole transaction can be retried; withTransaction already does this
}
if (error.hasErrorLabel?.("UnknownTransactionCommitResult")) {
  // the commit may or may not have applied; retry the commit, not the work
}
```

`UnknownTransactionCommitResult` is the case that produces duplicates in hand-written code: the commit was sent, the response was lost, and retrying the *whole* transaction can apply it twice. `withTransaction` retries only the commit, which is why using it matters.

A `WriteConflict` means two transactions touched the same document; it is transient and retried. Frequent write conflicts mean contention on a hot document — reduce the transaction's scope rather than raising retries.

## Respect the limits

- **60 seconds by default.** A transaction exceeding the server's `transactionLifetimeLimitSeconds` is aborted. Do not raise the limit to accommodate slow work; make the transaction smaller.
- **Every query inside must use an index.** A collection scan inside a transaction holds locks far longer and turns contention into cascading conflicts.
- **Keep the document count small.** Hundreds of documents in one transaction is a modelling problem; batch the work instead and make each batch independently safe.
- **Create collections and indexes outside a transaction.** Older servers reject a collection created implicitly inside one, so create it up front.

## Verify

```js
await client.db().collection("inventory").findOne({ sku: "SKU-1" })
await client.db().collection("orders").countDocuments({ sku: "SKU-1" })
```

Test the abort path explicitly, which is the half usually left untested: force the callback to throw after the first write and confirm **neither** change persisted. A transaction that has only been seen committing has not been shown to roll back.

Then run it concurrently — two processes against the same document — and confirm the outcome is correct and any conflict was retried rather than surfaced as an error.

```bash
mongosh "$MONGODB_URI" --quiet --eval 'printjson(db.serverStatus().transactions)'
```

## Report

State the deployment type and confirmed replica set name, why a transaction is needed rather than a single-document update, the collections and operations inside it, that every operation received the session, the read and write concerns, the retry handling for transient and unknown-commit errors, the indexes backing each query inside, and the verification including the abort-path and concurrent tests. Name any external side effect moved outside the transaction.
