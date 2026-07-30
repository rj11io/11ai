# 11ai MongoDB operator

Twelve standalone skills for common MongoDB Shell and Database Tools work, with read-first checks around writes, deletes, drops, restores, credentials, and production targets.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [11ai-operator-mongodb-cheatsheet](./skills/11ai-operator-mongodb-cheatsheet/SKILL.md) | Looking up common mongosh commands, filters, update operators, aggregation stages, and Database Tools flags |
| [11ai-operator-mongodb-setup](./skills/11ai-operator-mongodb-setup/SKILL.md) | Installing mongosh and Database Tools, standing up a local or Atlas deployment, and building a connection string |
| [11ai-operator-mongodb-environment](./skills/11ai-operator-mongodb-environment/SKILL.md) | Checking mongosh, Database Tools, connection, server, authentication, and deployment health |
| [11ai-operator-mongodb-integrations](./skills/11ai-operator-mongodb-integrations/SKILL.md) | Wiring the Node.js driver, Mongoose or Prisma, serverless pooling, migrations, change streams, tests, and backups |
| [11ai-operator-mongodb-databases](./skills/11ai-operator-mongodb-databases/SKILL.md) | Listing databases, selecting a database, checking stats, and creating or dropping databases deliberately |
| [11ai-operator-mongodb-collections](./skills/11ai-operator-mongodb-collections/SKILL.md) | Inspecting, creating, validating, renaming, and dropping collections |
| [11ai-operator-mongodb-crud](./skills/11ai-operator-mongodb-crud/SKILL.md) | Inserting, finding, updating, and deleting documents with scoped filters and previews |
| [11ai-operator-mongodb-querying](./skills/11ai-operator-mongodb-querying/SKILL.md) | Building filters, projections, sorts, pagination, counts, distinct queries, and date or array predicates |
| [11ai-operator-mongodb-aggregation](./skills/11ai-operator-mongodb-aggregation/SKILL.md) | Designing and testing aggregation pipelines with safe handling of $out and $merge |
| [11ai-operator-mongodb-indexes](./skills/11ai-operator-mongodb-indexes/SKILL.md) | Inspecting indexes, creating useful single or compound indexes, and reading explain output |
| [11ai-operator-mongodb-import-export](./skills/11ai-operator-mongodb-import-export/SKILL.md) | Using mongoimport, mongoexport, mongodump, mongorestore, and bsondump |
| [11ai-operator-mongodb-troubleshooting](./skills/11ai-operator-mongodb-troubleshooting/SKILL.md) | Diagnosing connection, authentication, TLS, duplicate-key, validation, timeout, and slow-query failures |

## Safety contract

Start with read-only inspection and confirm the deployment, database, collection, and filter before changing data. Ask for explicit approval before executing deleteMany, collection or database drops, index drops, restores with --drop, $out, $merge, or any command against an unclear or production target. Never print passwords, full connection URIs, tokens, or credential-bearing command output.

## Suggested next skills

Good v1 additions are transactions and sessions, performance profiling, users and roles, Atlas administration, and production backup or restore runbooks. Keep each as a separate skill so the common shell workflow stays easy to discover. Driver integration, schema migrations, and change streams now live in `11ai-operator-mongodb-integrations`.
