---
name: 11ai-mongodb-crud
description: "Perform everyday MongoDB document creates, reads, updates, and deletes through mongosh with scoped filters and preview-first safety. Use when the user wants to add, inspect, modify, or remove documents in a known collection."
---
# 11ai MongoDB CRUD

Work only after the deployment, database, collection, and document shape are known. Reads can run immediately when authorized; writes require a clear target, and multi-document changes require a count or preview before execution.

## Create

    db.users.insertOne({ email: "ada@example.com", active: true })
    db.users.insertMany([
      { email: "a@example.com", active: true },
      { email: "b@example.com", active: true }
    ])

Validate required fields, types, uniqueness expectations, and whether the user wants generated _id values or supplied identifiers. Report inserted ids without exposing unrelated documents.

## Read

Prefer the smallest useful projection and limit:

    db.users.find(
      { active: true },
      { _id: 1, email: 1 }
    ).sort({ email: 1 }).limit(20)

Use findOne for a single expected document. Use countDocuments(filter) before a broad read or before any multi-document write. Do not dump an entire collection unless the user explicitly requests it and the data is safe to display.

## Update

    db.users.updateOne(
      { email: "ada@example.com" },
      { $set: { active: false }, $currentDate: { updatedAt: true } }
    )

    db.users.updateMany(
      { active: false, archived: { $ne: true } },
      { $set: { archived: true }, $currentDate: { updatedAt: true } }
    )

Show the exact filter, update document, matched count, and modified count. Ask before running updateMany. Treat upsert as a write that can create a document; require a deliberate unique filter and explain the insert path.

## Delete

    db.users.deleteOne({ email: "ada@example.com" })
    db.users.deleteMany({ archived: true })

For deleteOne, verify the filter identifies the intended document. For deleteMany, run countDocuments(filter), show the result, and request explicit approval for the exact filter. Never use an empty filter for deletion.

## Verification

After a write, verify the result with a targeted read or result document. If the operation returns zero matches, do not broaden the filter automatically; inspect field names, types, database, and collection first.
