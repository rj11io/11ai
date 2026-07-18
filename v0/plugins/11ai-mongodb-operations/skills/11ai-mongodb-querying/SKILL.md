---
name: 11ai-mongodb-querying
description: "Build precise MongoDB read queries with filters, projections, sorting, pagination, counts, distinct values, dates, arrays, and null handling. Use when a user needs help expressing a search or wants a bounded result set from a collection."
---
# 11ai MongoDB querying

Turn natural-language conditions into a precise filter, projection, and bounded result plan. Confirm field names and BSON types before running a query that could return sensitive or very large data.

## Filter patterns

    db.orders.find({ status: "paid" })
    db.orders.find({ total: { $gte: 100, $lt: 1000 } })
    db.orders.find({ status: { $in: ["queued", "running"] } })
    db.orders.find({ deletedAt: { $exists: false } })
    db.orders.find({ $or: [{ region: "EU" }, { region: "UK" }] })
    db.orders.find({ items: { $elemMatch: { sku: "A1", quantity: { $gt: 0 } } } })

Use implicit AND for conditions on separate fields. Use $or when alternatives are intended. Distinguish a missing field from an explicit null with $exists and a precise type predicate where needed.

## Projection, sort, and bounds

    db.users.find(
      { active: true },
      { _id: 1, email: 1, createdAt: 1 }
    ).sort({ createdAt: -1, _id: 1 }).limit(50)

Prefer a limit for exploratory reads. For stable pagination, use a range on a unique, ordered field such as createdAt plus _id instead of large skip values. Do not mix inclusion and exclusion projections except for _id.

## Counts and distinct values

    db.orders.countDocuments({ status: "paid" })
    db.orders.estimatedDocumentCount()
    db.orders.distinct("customerId", { status: "paid" })

Use countDocuments for an exact filtered count. Treat estimatedDocumentCount as an estimate and explain the difference.

## Dates, strings, and arrays

Use BSON dates rather than date strings when the field is stored as a date:

    db.events.find({
      createdAt: {
        $gte: ISODate("2026-01-01T00:00:00Z"),
        $lt: ISODate("2026-02-01T00:00:00Z")
      }
    })

Use regex only when a bounded, case-aware scan is acceptable. For array membership, direct equality matches an array element; use $all or $elemMatch when multiple conditions must apply.

## Verification

If a query is slow or the result is surprising, inspect actual field names and types, add a small limit, and hand off to the indexes skill for explain and index analysis. Never alter data while debugging a read query.
