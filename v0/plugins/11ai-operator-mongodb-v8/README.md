# 11ai MongoDB v8 operator

Seventeen standalone MongoDB 8 skills with a current stable baseline of MongoDB 8.3.7. Server, Atlas release track, feature compatibility version, drivers, `mongosh`, and Database Tools still require independent inspection.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [11ai-operator-mongodb-v8-cheatsheet](./skills/11ai-operator-mongodb-v8-cheatsheet/SKILL.md) | Looking up common mongosh commands, filters, update operators, aggregation stages, and Database Tools flags |
| [11ai-operator-mongodb-v8-setup](./skills/11ai-operator-mongodb-v8-setup/SKILL.md) | Installing mongosh and Database Tools, standing up a local or Atlas deployment, and building a connection string |
| [11ai-operator-mongodb-v8-environment](./skills/11ai-operator-mongodb-v8-environment/SKILL.md) | Checking mongosh, Database Tools, connection, server, authentication, and deployment health |
| [11ai-operator-mongodb-v8-integrations](./skills/11ai-operator-mongodb-v8-integrations/SKILL.md) | Wiring the Node.js driver, Mongoose or Prisma, serverless pooling, migrations, change streams, tests, and backups |
| [11ai-operator-mongodb-v8-databases](./skills/11ai-operator-mongodb-v8-databases/SKILL.md) | Listing databases, selecting a database, checking stats, and creating or dropping databases deliberately |
| [11ai-operator-mongodb-v8-collections](./skills/11ai-operator-mongodb-v8-collections/SKILL.md) | Inspecting, creating, validating, renaming, and dropping collections |
| [11ai-operator-mongodb-v8-crud](./skills/11ai-operator-mongodb-v8-crud/SKILL.md) | Inserting, finding, updating, and deleting documents with scoped filters and previews |
| [11ai-operator-mongodb-v8-querying](./skills/11ai-operator-mongodb-v8-querying/SKILL.md) | Building filters, projections, sorts, pagination, counts, distinct queries, and date or array predicates |
| [11ai-operator-mongodb-v8-aggregation](./skills/11ai-operator-mongodb-v8-aggregation/SKILL.md) | Designing and testing aggregation pipelines with safe handling of $out and $merge |
| [11ai-operator-mongodb-v8-indexes](./skills/11ai-operator-mongodb-v8-indexes/SKILL.md) | Inspecting indexes, creating useful single or compound indexes, and reading explain output |
| [11ai-operator-mongodb-v8-import-export](./skills/11ai-operator-mongodb-v8-import-export/SKILL.md) | Using mongoimport, mongoexport, mongodump, mongorestore, and bsondump |
| [11ai-operator-mongodb-v8-transactions](./skills/11ai-operator-mongodb-v8-transactions/SKILL.md) | Writing multi-document transactions with sessions, correct concerns, and retry handling |
| [11ai-operator-mongodb-v8-profiling](./skills/11ai-operator-mongodb-v8-profiling/SKILL.md) | Finding slow queries, reading explain output, and proving an index changed the plan |
| [11ai-operator-mongodb-v8-users-and-roles](./skills/11ai-operator-mongodb-v8-users-and-roles/SKILL.md) | Creating and auditing least-privilege database users, custom roles, and password rotation |
| [11ai-operator-mongodb-v8-atlas](./skills/11ai-operator-mongodb-v8-atlas/SKILL.md) | Operating an Atlas cluster, its network access list, users, snapshots, and alerts |
| [11ai-operator-mongodb-v8-backups](./skills/11ai-operator-mongodb-v8-backups/SKILL.md) | Taking dumps and proving they restore, plus the destructive restore boundaries |
| [11ai-operator-mongodb-v8-troubleshooting](./skills/11ai-operator-mongodb-v8-troubleshooting/SKILL.md) | Diagnosing connection, authentication, TLS, duplicate-key, validation, timeout, and slow-query failures |

## Safety contract

Start with read-only inspection and confirm the deployment, database, collection, and filter before changing data. Ask for explicit approval before executing deleteMany, collection or database drops, index drops, restores with --drop, $out, $merge, or any command against an unclear or production target. Never print passwords, full connection URIs, tokens, or credential-bearing command output.
