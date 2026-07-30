---
name: 11ai-operator-mongodb-backups
description: "Take MongoDB backups and prove they restore, covering mongodump archives and oplog capture, selective namespace dumps, restoring into a scratch namespace for verification, document and index comparison, the destructive restore flags, point-in-time recovery on a managed cluster, retention and encryption, and scheduling with monitored failures. Use when a backup must be taken before a risky change, when a restore must be verified, or when a recovery plan must be established."
---
# 11ai MongoDB backups

A backup nobody has restored is an assumption, not a backup. Every procedure here ends with a restore into a scratch namespace and a comparison, because that is the only step that proves anything. The restore flags are also the most destructive commands in this plugin, so the target is named and approved before any restore runs.

## Establish what needs protecting

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  db.adminCommand({ listDatabases: 1 }).databases
    .forEach(d => printjson({ db: d.name, sizeMB: Math.round(d.sizeOnDisk / 1048576) }))'
mongosh "$MONGODB_URI" --quiet --eval '
  db.getCollectionNames().forEach(c => printjson({ collection: c, count: db[c].countDocuments(), indexes: db[c].getIndexes().length }))'
mongosh "$MONGODB_URI" --quiet --eval 'printjson({ setName: db.hello().setName, version: db.version() })'
mongodump --version
```

Record the document counts and index counts per collection now. They are the figures a restore is checked against, and reconstructing them afterwards is guesswork.

Check the tools version against the server version. An older `mongodump` against a newer server can fail on collection options it does not recognise.

## Take the backup

```bash
mongodump --uri="$MONGODB_URI" --archive=dump-$(date +%F-%H%M).gz --gzip
mongodump --uri="$MONGODB_URI" --archive=app-$(date +%F).gz --gzip --db=app
mongodump --uri="$MONGODB_URI" --archive=orders-$(date +%F).gz --gzip --db=app --collection=orders
mongodump --uri="$MONGODB_URI" --archive=full-$(date +%F).gz --gzip --oplog
```

A single `--archive` file is easier to move and verify than a directory tree. `--gzip` shrinks it substantially.

`--oplog` captures operations that occur *during* the dump, which is what makes a backup of a live replica set consistent to a single point. Without it, a dump of a busy database can contain a half-applied change across collections. It requires a replica set and it is the flag to use for anything real.

Never put a password in the URI on the command line — it lands in shell history and the process list. Use an environment variable already set, or let the tools prompt.

```bash
ls -lh dump-*.gz
mongodump --uri="$MONGODB_URI" --archive=/dev/null --gzip --dryRun 2>&1 | tail -3
```

A dump that completes with a nonzero exit code or an unexpectedly small file is a failed backup. Check both.

## Prove the restore

This is the step that makes it a backup. Restore into a **different** namespace, never over the source:

```bash
mongorestore --uri="$MONGODB_TEST_URI" --archive=dump-2026-07-30-1200.gz --gzip \
  --nsFrom='app.*' --nsTo='restore_check.*'
```

```bash
mongosh "$MONGODB_TEST_URI" --quiet --eval '
  const src = db.getSiblingDB("app"), dst = db.getSiblingDB("restore_check");
  dst.getCollectionNames().forEach(c => printjson({
    collection: c,
    restored: dst[c].countDocuments(),
    indexes: dst[c].getIndexes().length
  }))'
```

Compare against the counts recorded earlier. Check three things, not one:

1. **Every collection is present** — a missing one means a selective dump was narrower than intended.
2. **Document counts match.**
3. **Index counts match.** Indexes are rebuilt on restore and a failure there is easy to miss; a restored collection without its indexes is functionally broken under load.

Then read a few documents and confirm the field shape, and drop the scratch namespace when finished.

For point-in-time recovery with an oplog dump:

```bash
mongorestore --uri="$MONGODB_TEST_URI" --archive=full-2026-07-30.gz --gzip --oplogReplay
```

## Treat the destructive flags carefully

```bash
mongorestore --uri="$URI" --archive=dump.gz --gzip --drop
mongorestore --uri="$URI" --archive=dump.gz --gzip --nsInclude='app.orders'
```

- **`--drop`** removes each collection before restoring it. Anything written since the dump is gone.
- **Without `--nsTo`**, the restore writes into the original database names — so a dump of production restored without remapping overwrites production.
- **A restore is not a merge.** Existing documents with matching ids cause duplicate-key errors unless dropped first, which leaves a partial restore.

For any restore against a real deployment: name the target, take a fresh dump of the current state first so the restore itself is reversible, get explicit approval, then run it and verify.

## Schedule and retain

```bash
0 3 * * * /usr/local/bin/flock -n /tmp/mongodump.lock /usr/local/bin/mongodump --uri="$MONGODB_URI" --archive=/backups/app-$(date +\%F).gz --gzip --oplog >> /var/log/mongodump.log 2>&1
```

Points that decide whether a schedule is real:

- **Escape `%` in a crontab** — an unescaped one truncates the command, so `date +\%F`.
- **Redirect both streams** to a log, or a failure leaves no trace.
- **Lock against overlap** so a slow dump cannot run twice.
- **Alert on failure and on absence.** A job that stops running silently is the common way backups disappear; monitor for a recent file, not just for errors.
- **Store off-host and encrypted at rest**, with a retention policy. A backup on the same disk as the database protects against nothing.
- **Restore on a schedule too** — a monthly verification restore is what keeps this honest.

On a managed cluster, prefer the provider's continuous backup and point-in-time restore, and still perform a verification restore to a scratch cluster.

## Report

State the deployment and version, the collections with document and index counts before the dump, the exact dump command including whether `--oplog` was used, the archive path and size, the verification restore target and the compared counts per collection, any discrepancy, and whether the scratch namespace was removed. For a restore against a real deployment, state the target, the pre-restore dump taken as a rollback, the approval, and the post-restore verification. Never print credentials, and say plainly when a backup has not been restore-tested.
