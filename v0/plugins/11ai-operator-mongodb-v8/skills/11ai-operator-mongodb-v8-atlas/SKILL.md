---
name: 11ai-operator-mongodb-v8-atlas
description: "Operate a MongoDB Atlas cluster and its access, covering the CLI and project context, cluster tiers and scaling, network access lists and private networking, database users and their scoping, backup snapshots and point-in-time restore, alerts and metrics, pausing and terminating a cluster, and why an open access list is an exposure. Use when an Atlas cluster must be inspected, resized, paused, or restored, or when its network and user access must be audited or changed."
---
# 11ai MongoDB Atlas

Version baseline: MongoDB 8.x, with 8.3.7 as the current stable release at this review. Inspect server, Atlas release track, featureCompatibilityVersion, mongosh, Database Tools, and driver versions independently before using 8.3-only behavior.

Atlas changes are account-side and several are billable or destructive, so establish the organization, project, and cluster before anything. The highest-value check in this skill is the network access list: an entry allowing every address leaves only a password between the cluster and the internet.

## Establish context and read the cluster

```bash
atlas auth whoami
atlas projects list
atlas config describe default
atlas clusters list --projectId PROJECT_ID
atlas clusters describe CLUSTER --projectId PROJECT_ID \
  --output json | jq '{name, tier: .providerSettings.instanceSizeName, version: .mongoDBVersion, paused, diskGB: .diskSizeGB, backup: .providerBackupEnabled}'
```

Confirm the project name, not just its id — an organization with production and staging projects makes a mistyped id an expensive mistake.

Read the tier, version, and whether backup is enabled. A cluster without backup is a cluster whose data cannot be recovered, which is worth reporting on sight.

## Audit access before changing it

```bash
atlas accessLists list --projectId PROJECT_ID
atlas dbusers list --projectId PROJECT_ID
atlas privateEndpoints aws list --projectId PROJECT_ID
```

Check the access list for `0.0.0.0/0`. If it is present, report it as an exposure: the cluster accepts connections from anywhere and only the password stops them. It usually got there to fix a connection error during setup.

The right answers instead, in order of preference: a private endpoint or network peering so traffic never crosses the internet; the provider's documented integration for a serverless platform; or a specific address range for a known office or bastion.

```bash
curl -s https://checkip.amazonaws.com
atlas accessLists create --currentIp --comment "developer laptop, remove after DATE" --projectId PROJECT_ID
atlas accessLists create 203.0.113.0/24 --comment "office range" --projectId PROJECT_ID
atlas accessLists delete 0.0.0.0/0 --projectId PROJECT_ID --force
```

Add a comment and, for a temporary entry, an expiry. An access list accumulates former laptops otherwise, and nobody can later say which entries are still needed.

```bash
atlas dbusers create --username APP_USER --role readWrite@app --projectId PROJECT_ID
atlas dbusers describe APP_USER --projectId PROJECT_ID
atlas dbusers delete APP_USER --projectId PROJECT_ID --force
```

`atlas dbusers create` prompts for the password rather than taking it as an argument — let it prompt. Scope the role to one database; never grant an account-wide administrative role to an application.

## Scale, pause, and terminate

```bash
atlas clusters update CLUSTER --tier M30 --projectId PROJECT_ID
atlas clusters update CLUSTER --diskSizeGB 100 --projectId PROJECT_ID
atlas clusters pause CLUSTER --projectId PROJECT_ID
atlas clusters start CLUSTER --projectId PROJECT_ID
atlas clusters watch CLUSTER --projectId PROJECT_ID
```

Each of these has a consequence to state before running it:

- **A tier change** is billable and performs a rolling restart. Connections drop as each member steps down, so a client without retryable writes sees errors.
- **Disk can grow but not shrink.**
- **Pausing** stops billing for compute and keeps the data. A paused cluster is unreachable, and Atlas resumes it automatically after a period — so pausing is not an indefinite state.
- **`watch`** blocks until the change completes, which is what to use instead of assuming the update finished.

```bash
atlas clusters delete CLUSTER --projectId PROJECT_ID
```

Termination destroys the cluster and its data. Require explicit approval naming the cluster and the project, confirm a current snapshot exists and has been download-verified, and prefer pausing when the cluster might be needed again.

## Snapshots and restore

```bash
atlas backups snapshots list CLUSTER --projectId PROJECT_ID
atlas backups snapshots create CLUSTER --desc "before schema change" --projectId PROJECT_ID
atlas backups restores start automated --clusterName CLUSTER \
  --targetClusterName SCRATCH_CLUSTER --targetProjectId PROJECT_ID \
  --snapshotId SNAPSHOT_ID --projectId PROJECT_ID
atlas backups restores list CLUSTER --projectId PROJECT_ID
```

Restore into a **scratch cluster**, never over the source. That is what makes verifying a backup safe, and restoring onto the live cluster replaces its data.

Continuous backup gives point-in-time restore within the retention window; a manual snapshot before a risky change is still worth taking because the automated window may be shorter than the time it takes to notice a problem.

A snapshot is not verified until it has been restored and its document counts compared. Schedule that check rather than assuming.

## Alerts and metrics

```bash
atlas alerts list --projectId PROJECT_ID
atlas alerts settings list --projectId PROJECT_ID
atlas metrics processes HOST:PORT --granularity PT1M --period PT6H \
  --type CONNECTIONS,OPCOUNTER_QUERY --projectId PROJECT_ID
```

The alerts worth having configured: connections approaching the tier limit, disk approaching full, replication lag, and a query targeting ratio indicating unindexed queries. Disk full stops writes, and connection exhaustion rejects new clients while existing ones look fine.

Creating an alert notifies real people — confirm the recipients and threshold first.

## Report

State the organization, project name and id, and cluster with its tier, version, and paused state; whether backup is enabled; the network access list entries with any `0.0.0.0/0` flagged as an exposure; the database users and their scoped roles; exactly what was changed with its billing and availability impact; any snapshot taken or restore performed with its target cluster and compared counts; and the alerts configured with their recipients. Never print a password or a full connection string.
