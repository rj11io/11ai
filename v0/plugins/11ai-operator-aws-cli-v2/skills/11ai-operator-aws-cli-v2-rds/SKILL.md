---
name: 11ai-operator-aws-cli-v2-rds
description: "Inspect and operate RDS and Aurora databases, covering instance and cluster state, endpoints and parameter groups, snapshots and point-in-time restore, storage and connection metrics, maintenance and pending modifications, failover, and the difference between an immediate change and one deferred to a maintenance window. Use when a database must be inspected, snapshotted, restored, resized, or its maintenance state understood."
---
# 11ai AWS RDS

Version baseline: AWS CLI v2, using the latest stable v2 patch available for the host platform (2.36.x at this review). Reject AWS CLI v1-only behavior and inspect aws --version plus the live v2 command help before composing commands.

A database holds the state that cannot be rebuilt from a repository, so every change here is higher-stakes than the same change on a stateless service. Establish the instance, its engine version, and whether it is production before touching anything, and take a snapshot before any modification that could interrupt it.

## Inspect first

```bash
aws rds describe-db-instances --profile PROFILE --region REGION \
  --query 'DBInstances[].{Id:DBInstanceIdentifier,Status:DBInstanceStatus,Class:DBInstanceClass,Engine:EngineVersion,MultiAZ:MultiAZ,Storage:AllocatedStorage,Public:PubliclyAccessible}'
aws rds describe-db-instances --db-instance-identifier ID --profile PROFILE --region REGION \
  --query 'DBInstances[0].{Endpoint:Endpoint.Address,Port:Endpoint.Port,Pending:PendingModifiedValues,Window:PreferredMaintenanceWindow,Backup:BackupRetentionPeriod,Deletion:DeletionProtection}'
aws rds describe-db-clusters --profile PROFILE --region REGION \
  --query 'DBClusters[].{Id:DBClusterIdentifier,Status:Status,Members:DBClusterMembers[].DBInstanceIdentifier}'
```

Read four things before deciding anything: the status, `PendingModifiedValues`, whether `MultiAZ` is on, and whether `DeletionProtection` is enabled. A pending modification means a change is already queued for the maintenance window, and stacking another on top makes the outcome hard to predict.

`PubliclyAccessible` being true on a production database is worth reporting on sight — it means the instance has a public address, and only the security group stands between it and the internet.

Never print the master password or a connection string containing one. Report the endpoint and port; credentials belong in a secret store.

## Read health and capacity

```bash
aws cloudwatch get-metric-statistics --namespace AWS/RDS --metric-name FreeStorageSpace \
  --dimensions Name=DBInstanceIdentifier,Value=ID --statistics Minimum \
  --start-time "$(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ)" --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --period 3600 --profile PROFILE --region REGION
aws rds describe-events --source-identifier ID --source-type db-instance --duration 1440 \
  --profile PROFILE --region REGION
```

`FreeStorageSpace` and `DatabaseConnections` explain most incidents. A database that has run out of storage stops accepting writes and moves to `storage-full`; a connection count at the instance limit rejects new connections while the existing ones look healthy. Check both before concluding an application bug.

## Snapshot before changing

```bash
aws rds create-db-snapshot --db-instance-identifier ID \
  --db-snapshot-identifier ID-before-CHANGE-$(date +%Y%m%d%H%M) --profile PROFILE --region REGION
aws rds wait db-snapshot-available --db-snapshot-identifier SNAPSHOT_ID --profile PROFILE --region REGION
aws rds describe-db-snapshots --db-instance-identifier ID --snapshot-type manual \
  --query 'DBSnapshots[].{Id:DBSnapshotIdentifier,Status:Status,Created:SnapshotCreateTime}' \
  --profile PROFILE --region REGION
```

Wait for the snapshot to reach `available` before proceeding. A snapshot still being created is not a rollback point.

Automated backups give point-in-time restore within the retention window; a manual snapshot persists until deleted. Take a manual one before a modification, because the automated window may be shorter than the time it takes to notice a problem.

## Modify, restore, and fail over

```bash
aws rds modify-db-instance --db-instance-identifier ID --db-instance-class CLASS \
  --apply-immediately --profile PROFILE --region REGION
aws rds modify-db-instance --db-instance-identifier ID --allocated-storage GB \
  --profile PROFILE --region REGION
```

`--apply-immediately` starts the change now, usually with an interruption; omitting it defers to the maintenance window, which surprises people later. Say which one is happening and what the interruption is.

Two engine-specific facts worth stating before agreeing to a change: storage can be increased but never decreased, and an engine-version upgrade is one-way — the rollback is a restore from a snapshot.

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ID-restore-check --db-snapshot-identifier SNAPSHOT_ID \
  --no-publicly-accessible --profile PROFILE --region REGION
aws rds restore-db-instance-to-point-in-time --source-db-instance-identifier ID \
  --target-db-instance-identifier ID-pitr --restore-time TIMESTAMP \
  --profile PROFILE --region REGION
```

A restore always creates a **new** instance; it never overwrites the original. That is what makes it safe to verify a backup — restore to a scratch identifier, check the data, then delete it. Restore with `--no-publicly-accessible` so a scratch copy of production data is not exposed, and remember it comes up with default security groups and parameter groups that may not match.

```bash
aws rds failover-db-cluster --db-cluster-identifier CLUSTER_ID --profile PROFILE --region REGION
aws rds reboot-db-instance --db-instance-identifier ID --force-failover --profile PROFILE --region REGION
```

A failover drops in-flight connections. It is the right tool for testing resilience deliberately and the wrong tool for clearing a symptom.

Deletion needs explicit approval naming the instance, and a final snapshot:

```bash
aws rds delete-db-instance --db-instance-identifier ID \
  --final-db-snapshot-identifier ID-final --profile PROFILE --region REGION
```

Never use `--skip-final-snapshot` on anything that has held real data. `DeletionProtection` exists to stop this and should not be disabled to get a delete through without a separate, explicit decision.

## Report

State the account, region, instance or cluster identifier, engine version, class, and status; whether it is multi-availability-zone and whether it is publicly accessible; the snapshot taken with its identifier and confirmed `available` state; the exact modification and whether it applied immediately or was deferred, with the expected interruption; and the verification after the change. Never print master credentials. Say plainly whether a rollback exists and how to use it.
