---
name: 11ai-mongodb-indexes
description: "Inspect MongoDB indexes, design single or compound indexes, analyze query plans, and remove obsolete indexes with explicit safeguards. Use when queries are slow, a unique constraint is needed, or the user asks about indexes."
---
# 11ai MongoDB indexes

Indexes trade write and storage cost for faster reads. Inspect the workload and existing indexes before proposing a new one, and never drop an index just because it is unused in a single sample.

## Inspect

    db.users.getIndexes()
    db.users.aggregate([{ $indexStats: {} }])
    db.users.stats({ scale: 1024 })

Record key pattern, name, uniqueness, partial or sparse behavior, TTL settings, and approximate size. Check application queries and deployment constraints before changing an index.

## Analyze a query

    db.users.find({ email: "ada@example.com" }).explain("executionStats")
    db.orders.explain("executionStats").aggregate([
      { $match: { status: "paid", customerId: 42 } },
      { $sort: { createdAt: -1 } },
      { $limit: 20 }
    ])

Compare the winning plan with nReturned, totalKeysExamined, totalDocsExamined, and executionTimeMillis. Treat explain as diagnostic evidence; do not promise a particular plan across server versions or data distributions.

## Create

    db.users.createIndex({ email: 1 }, { unique: true })
    db.orders.createIndex({ customerId: 1, createdAt: -1 })
    db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

Explain why the key order supports the target filter and sort. For unique indexes, check duplicates before creation and plan how conflicts will be handled. For TTL indexes, confirm the field is a BSON date and the expiration policy is intended.

## Drop

    db.users.dropIndex("email_1")

Index drops are state changes. Confirm the exact name, replacement coverage, traffic impact, and rollback plan. Ask for explicit approval before executing. Never drop _id_ indexes or use a broad cleanup command.

## Reporting

Return the current index inventory, evidence from the query plan, the proposed key pattern and options, expected tradeoffs, and a verification command. Keep security, encrypted fields, and Atlas-specific administration in a dedicated future skill.
