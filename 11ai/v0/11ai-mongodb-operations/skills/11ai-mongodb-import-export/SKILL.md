---
name: 11ai-mongodb-import-export
description: "Use MongoDB Database Tools for JSON or CSV import, JSON or CSV export, BSON dumps, restores, and BSON inspection. Use when moving data between files and MongoDB or preparing a backup and restore procedure."
---
# 11ai MongoDB import and export

These commands run from the system shell, not inside mongosh. Treat every file path, namespace, connection, and restore mode as part of the change scope. Never include passwords in command history or output.

## Identify the right tool

| Need | Tool |
| --- | --- |
| Export JSON or CSV | mongoexport |
| Import Extended JSON, CSV, or TSV | mongoimport |
| Create a BSON dump | mongodump |
| Restore a BSON dump | mongorestore |
| Inspect BSON as JSON | bsondump |

Check the installed version before moving data:

    mongodump --version
    mongoexport --version

Use tool versions compatible with the source and destination deployment. Confirm the database and collection namespace, document format, encoding, and expected volume.

## Export and import

    mongoexport --uri="$MONGODB_URI" --collection=users --out=users.json
    mongoexport --uri="$MONGODB_URI" --collection=users --type=csv --fields=email,createdAt --out=users.csv
    mongoimport --uri="$MONGODB_URI" --collection=users --file=users.json --jsonArray
    mongoimport --uri="$MONGODB_URI" --collection=users --type=csv --headerline --file=users.csv

Prefer a temporary output path, check disk space, and verify counts before and after import. Explain whether an import appends, inserts, replaces, or upserts. Use a staging collection when the destination is important.

## Dump and restore

    mongodump --uri="$MONGODB_URI" --archive=backup.archive --gzip
    mongorestore --uri="$MONGODB_URI" --archive=backup.archive --gzip

For a targeted namespace, use the tool's namespace include or exclude options rather than relying on deprecated broad database or collection flags. If the user needs a dry run, use the tool's supported dry-run option and do not treat a dry run as a backup.

## Destructive restore modes

    mongorestore --uri="$MONGODB_URI" --archive=backup.archive --gzip --drop

--drop removes target collections that are present in the backup before restoring them. Require explicit approval and verify:

1. target deployment and database
2. backup path, timestamp, and readability
3. source and destination compatibility
4. namespaces included
5. rollback or recovery path

Never restore an unverified archive to production. Do not restore admin users and roles unless that is the explicit goal.

## Verification

Report tool versions, archive or file checks, namespaces, counts before and after, warnings, failed documents, and any data conversion such as CSV losing BSON types. Use the troubleshooting skill for authentication, permission, version, or duplicate-key failures.
