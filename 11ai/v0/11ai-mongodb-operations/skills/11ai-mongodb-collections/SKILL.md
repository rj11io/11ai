---
name: 11ai-mongodb-collections
description: "Inspect, create, validate, rename, and remove MongoDB collections with scoped safety checks. Use when the user asks about collection names, options, validators, capped collections, stats, renames, or drops."
---
# 11ai MongoDB collections

Keep collection operations separate from document CRUD. Inspect existing options before changing collection shape, and treat rename and drop as destructive operations.

## Inspect

    show collections
    db.getCollectionNames()
    db.getCollectionInfos({ name: "users" })
    db.users.stats()
    db.users.getIndexes()

Use getCollectionInfos to see validators, validation levels, capped settings, and other options. Avoid printing sample documents when metadata is enough.

## Create

A basic collection:

    db.createCollection("users")

A collection with document validation:

    db.createCollection("users", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["email"],
          properties: {
            email: { bsonType: "string" }
          }
        }
      },
      validationLevel: "strict",
      validationAction: "error"
    })

Confirm field names, required fields, and whether existing documents comply before enabling strict validation.

## Rename

    db.users.renameCollection("users_archive")

Check that the destination name is unused, identify application references, and ask for explicit approval. A rename can break code even when no data is lost.

## Drop

    db.users.drop()

A collection drop is irreversible. First confirm the deployment, database, collection, backup requirement, and expected data loss. Require approval for the exact command; never use a wildcard or infer the target from a partial name.

## Reporting

Report the collection name, options, approximate count or size when requested, indexes, and the next safe action. Hand document changes to the CRUD skill and index changes to the indexes skill.
