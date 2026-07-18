---
name: 11ai-mongodb-databases
description: "Inspect and manage MongoDB databases with explicit target checks. Use to list databases, select a database, inspect database statistics, create a database through a collection, or deliberately drop a database after approval."
---
# 11ai MongoDB databases

Use this skill for database-level navigation and lifecycle tasks. MongoDB creates a database when data or a collection is first written; selecting a name with use does not by itself create one.

## Read-only inspection

    show dbs
    db.getName()
    db.stats()
    db.getCollectionNames()
    db.getSiblingDB("admin").runCommand({ connectionStatus: 1 })

When the current database is not obvious, report the value from db.getName() and ask for the intended target before writing. Do not infer a production database from a connection URI alone.

## Selecting and creating

    use app
    db.createCollection("users")
    db.getSiblingDB("reporting").createCollection("daily")

Before creating anything, check whether the database or collection already exists and confirm the intended name. If the task only needs a collection, use the collections skill for validation options and collection-specific checks.

## Dropping a database

Dropping is irreversible for the target database. Before proposing db.dropDatabase():

1. confirm the exact deployment and database name
2. list collections and report approximate sizes
3. create or verify a backup if the user needs recovery
4. show the exact command and ask for explicit approval
5. after approval, run it and verify the result without printing sensitive data

Never run db.dropDatabase() because a database appears empty, stale, or misspelled. If the request says clean up, ask which exact database or provide a dry-run inventory first.
