---
name: 11ai-operator-mongodb-v8-profiling
description: "Find and fix slow MongoDB queries, covering the slow-query log and database profiler levels, reading explain output for the winning plan and examined-versus-returned ratio, collection scans and unindexed sorts, index selectivity and prefix order, covered queries, aggregation stage costs, and proving an index changed the plan. Use when a query or aggregation is slow, when an index must be justified before adding it, or when database load must be attributed to specific operations."
---
# 11ai MongoDB profiling

Version baseline: MongoDB 8.x, with 8.3.7 as the current stable release at this review. Inspect server, Atlas release track, featureCompatibilityVersion, mongosh, Database Tools, and driver versions independently before using 8.3-only behavior.

Read the plan before adding an index. An index guessed from a query's shape often goes unused because its field order does not match, and every index costs write throughput and storage — so the discipline is measure, add one index, prove the plan changed, repeat.

## Find the slow operations

```bash
mongosh "$MONGODB_URI" --quiet --eval 'printjson(db.getProfilingStatus())'
mongosh "$MONGODB_URI" --quiet --eval 'db.setProfilingLevel(1, { slowms: 100 })'
mongosh "$MONGODB_URI" --quiet --eval '
  db.system.profile.find({ millis: { $gt: 100 } })
    .sort({ millis: -1 }).limit(10)
    .forEach(d => printjson({ ms: d.millis, ns: d.ns, op: d.op, scanned: d.docsExamined, returned: d.nreturned, plan: d.planSummary }))'
```

Profiler levels: `0` off, `1` slow operations only, `2` everything. Level `2` on a busy production deployment writes a profile document per operation and is itself a load problem — use level `1` with a threshold, and turn it off when finished.

`system.profile` is a capped collection, so it holds a rolling window. Read it promptly after reproducing the slow operation.

For live activity without the profiler:

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  db.currentOp({ "secs_running": { $gt: 3 }, "op": { $ne: "none" } }).inprog
    .forEach(o => printjson({ secs: o.secs_running, ns: o.ns, op: o.op, plan: o.planSummary }))'
```

## Read the plan properly

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  printjson(db.orders.find({ status: "open", createdAt: { $gt: new Date("2026-07-01") } })
    .sort({ createdAt: -1 }).limit(20)
    .explain("executionStats").executionStats)'
```

Four numbers decide everything:

- **`totalDocsExamined` versus `nReturned`.** Examining 100,000 documents to return 20 is the problem, stated numerically. A healthy indexed query examines roughly what it returns.
- **`totalKeysExamined`.** Far more keys than documents returned means the index is not selective enough for this filter.
- **`executionTimeMillis`.** The actual cost.
- **`winningPlan.stage`.** `COLLSCAN` means no index was used at all. `IXSCAN` followed by `FETCH` is normal. `SORT` appearing as a stage means the sort happened in memory rather than being served by the index — that fails outright past the memory limit.

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  printjson(db.orders.find({ status: "open" }).explain("allPlansExecution").queryPlanner.rejectedPlans.length)'
```

Run `explain` on the query *as the application issues it*, including the sort, projection, and limit. A query explained without its sort looks fine and is slow in production.

## Design the index from the plan

Field order follows equality, then sort, then range:

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  db.orders.createIndex({ status: 1, createdAt: -1 }, { name: "status_createdAt", background: true })'
```

For the query above, `status` is an equality match, `createdAt` carries both the sort and a range — so `{ status: 1, createdAt: -1 }` serves the filter and removes the in-memory sort. Reversing them would not.

A compound index also serves queries on a **prefix** of its fields, so `{ status: 1, createdAt: -1 }` covers a filter on `status` alone. That means one well-ordered compound index often replaces two single-field ones — check for redundant indexes before adding another:

```bash
mongosh "$MONGODB_URI" --quiet --eval 'db.orders.getIndexes().forEach(i => printjson({ name: i.name, key: i.key }))'
mongosh "$MONGODB_URI" --quiet --eval 'db.orders.aggregate([{ $indexStats: {} }]).forEach(s => printjson({ name: s.name, ops: s.accesses.ops }))'
```

`$indexStats` shows access counts since the last restart. An index with zero operations is pure write cost — report it as a removal candidate rather than adding more alongside it.

A **covered** query — one whose projection uses only indexed fields — skips the document fetch entirely and shows no `FETCH` stage. Worth aiming for on a hot read path.

Build in the background on a populated collection, and use `createIndex` in a migration so the index exists in every environment rather than only this one.

## Profile aggregations

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  printjson(db.orders.explain("executionStats").aggregate([
    { $match: { status: "open" } },
    { $sort: { createdAt: -1 } },
    { $limit: 20 }
  ]))'
```

Put `$match` first so an index narrows the input before any other stage runs. A `$match` after a `$group` or `$unwind` filters rows the server already built, which is the most common aggregation performance mistake. `$sort` before `$limit` can be served by an index; after a `$group` it cannot.

## Prove the change

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  const e = db.orders.find({ status: "open", createdAt: { $gt: new Date("2026-07-01") } })
    .sort({ createdAt: -1 }).limit(20).explain("executionStats").executionStats;
  printjson({ ms: e.executionTimeMillis, examined: e.totalDocsExamined, returned: e.nReturned, plan: e.executionStages.stage })'
mongosh "$MONGODB_URI" --quiet --eval 'db.setProfilingLevel(0)'
```

Re-run the same explain and compare the four numbers against the baseline. The index worked when `totalDocsExamined` falls close to `nReturned`, the `SORT` stage is gone, and the winning plan names the new index. A faster wall-clock time with an unchanged plan is a warm cache, not a fix.

Turn the profiler back off when finished.

## Report

State the deployment and collection, the slow operation with its original timing and examined-versus-returned counts, the winning plan before the change, why the index has that specific field order, the index created with its name and build mode, the same four numbers after, any redundant or unused indexes found, and confirmation that the profiler was returned to its original level. Separate a plan change from a cache effect.
