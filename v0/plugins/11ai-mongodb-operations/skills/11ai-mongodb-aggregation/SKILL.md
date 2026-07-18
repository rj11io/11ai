---
name: 11ai-mongodb-aggregation
description: "Design, run, and explain MongoDB aggregation pipelines for filtering, reshaping, grouping, joining, and reporting. Use when a task needs more than a simple find query or when the user asks for a pipeline."
---
# 11ai MongoDB aggregation

Build pipelines incrementally and keep the first run read-only. Confirm the source collection, expected output shape, sample size, and whether the pipeline may write to another collection.

## Common pipeline

    db.orders.aggregate([
      { $match: { status: "paid" } },
      { $project: { customerId: 1, amount: 1, createdAt: 1 } },
      { $group: {
          _id: "$customerId",
          orderCount: { $sum: 1 },
          total: { $sum: "$amount" }
      } },
      { $sort: { total: -1 } },
      { $limit: 20 }
    ])

Push a selective $match early when it preserves correctness. Use $project or $set to make the output contract obvious. Add $unwind only when array expansion is intended.

## Useful stages

- $match filters documents
- $project includes, excludes, or computes fields
- $set and $unset reshape documents
- $group calculates totals and buckets
- $sort and $limit bound results
- $lookup joins a related collection
- $unwind expands array values
- $facet produces multiple result branches

For $lookup, confirm the local and foreign fields, cardinality, and whether missing matches should produce empty arrays or be removed with preserveNullAndEmptyArrays behavior.

## Test and explain

Start with a $limit after an early $match when the user only needs a sample. Compare input and output counts when correctness matters. Use an explain plan when performance is part of the task, then hand index changes to the indexes skill.

    db.orders.explain("executionStats").aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$customerId", total: { $sum: "$amount" } } }
    ])

## Stages that write

$out replaces or creates a collection, and $merge writes aggregation results into a destination according to its match policy. Treat both as writes:

1. name the source and destination
2. explain overwrite, merge, and unique-key behavior
3. preview the read-only pipeline
4. request explicit approval
5. verify the destination after execution

Never add $out or $merge merely to make a read query convenient.
