---
name: 11ai-mongodb-cheatsheet
description: "Answer common MongoDB command and syntax questions with a compact mongosh and Database Tools reference. Use when the user wants a command lookup, a filter or update example, an aggregation stage reminder, or a quick explanation of MongoDB terminology."
---
# 11ai MongoDB cheatsheet

Use this skill as a reference first. Prefer a short command, explain the target placeholders, and mention whether it reads or changes data. If the user wants the command executed, hand off to the narrower operation skill and apply its safety checks.

## Connection and navigation

    mongosh
    mongosh "mongodb://localhost:27017/app"
    mongosh "$MONGODB_URI" --username "$MONGODB_USER" --authenticationDatabase admin

    show dbs
    use app
    db.getName()
    show collections
    db.getCollectionNames()
    db.getMongo()
    db.hello()

Do not paste a password into a command or print a full connection URI. Prefer an environment variable or the interactive password prompt.

## CRUD quick reference

    db.users.insertOne({ email: "ada@example.com", active: true })
    db.users.insertMany([{ email: "a@example.com" }, { email: "b@example.com" }])
    db.users.find({ active: true }, { email: 1 }).sort({ email: 1 }).limit(20)
    db.users.findOne({ email: "ada@example.com" })
    db.users.updateOne({ email: "ada@example.com" }, { $set: { active: false } })
    db.users.updateMany({ active: false }, { $set: { archived: true } })
    db.users.deleteOne({ email: "ada@example.com" })
    db.users.deleteMany({ archived: true })

For any multi-document update or delete, run countDocuments(filter) first and show the exact filter. Never replace a scoped filter with {} without explicit approval.

## Query operators

    { age: { $gte: 18, $lt: 65 } }
    { status: { $in: ["queued", "running"] } }
    { deletedAt: { $exists: false } }
    { $or: [{ role: "admin" }, { permissions: "manage" }] }
    { tags: { $all: ["mongodb", "database"] } }
    { items: { $elemMatch: { sku: "A1", quantity: { $gt: 0 } } } }

Use ISODate("2026-01-01T00:00:00Z") for dates and ObjectId("...") only when the stored _id is an ObjectId.

## Updates and values

| Need | Operator or method |
| --- | --- |
| Set or replace a field | $set |
| Remove a field | $unset |
| Increment a number | $inc |
| Add a unique array value | $addToSet |
| Append to an array | $push |
| Remove an array value | $pull |
| Insert when no match exists | upsert: true, only with a deliberate unique filter |
| Return the changed document | findOneAndUpdate(..., { returnDocument: "after" }) |

## Aggregation skeleton

    db.orders.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 20 }
    ])

$out and $merge write results to collections. Treat them like write operations and confirm the destination before running them.

## Index and diagnostics snippets

    db.users.getIndexes()
    db.users.createIndex({ email: 1 }, { unique: true })
    db.users.find({ email: "ada@example.com" }).explain("executionStats")
    db.users.aggregate([{ $indexStats: {} }])
    db.users.stats()

## Database Tools

Run these from the system shell, not inside mongosh:

    mongoexport --uri="$MONGODB_URI" --collection=users --out=users.json
    mongoimport --uri="$MONGODB_URI" --collection=users --file=users.json --jsonArray
    mongodump --uri="$MONGODB_URI" --archive=backup.archive --gzip
    mongorestore --uri="$MONGODB_URI" --archive=backup.archive --gzip
    bsondump dump/app/users.bson

Restores with --drop can remove target collections. Confirm the target and backup before using it.

## Official references

- [mongosh CRUD](https://www.mongodb.com/docs/mongodb-shell/crud/)
- [mongosh connection](https://www.mongodb.com/docs/mongodb-shell/connect/)
- [MongoDB query operators](https://www.mongodb.com/docs/manual/reference/operator/query/)
- [MongoDB update operators](https://www.mongodb.com/docs/manual/reference/operator/update/)
- [MongoDB Database Tools](https://www.mongodb.com/docs/database-tools/)
