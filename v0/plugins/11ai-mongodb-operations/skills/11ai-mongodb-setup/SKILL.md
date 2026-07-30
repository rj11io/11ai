---
name: 11ai-mongodb-setup
description: "Install mongosh and the MongoDB Database Tools, stand up a local deployment through Docker or a package manager, or prepare an Atlas cluster with a database user, network access, and TLS, then assemble and verify a connection string without exposing its credentials. Use when MongoDB tooling is missing, when a local or hosted deployment must be created, when a connection string has to be built or repaired, or when the user asks how to get MongoDB running."
---
# 11ai MongoDB setup

Decide which deployment the work needs before installing anything, because the answer changes every later step: a local single server, a local replica set, or a hosted Atlas cluster. `11ai-mongodb-environment` inspects what already exists without touching it; run that first and let it tell you what is missing.

## Choose the deployment

- **Local single server** — fastest for development. Transactions and change streams are unavailable because both require a replica set.
- **Local single-node replica set** — the honest local default when the application uses transactions, change streams, or the newer session behaviour.
- **Atlas** — a hosted cluster, and the one that needs a database user, a network access rule, and TLS rather than an installation.

Match the server version to production. A local server two majors ahead accepts queries and aggregation stages that will fail after deployment.

## Install the client tools

```bash
command -v mongosh
mongosh --version
command -v mongodump
mongodump --version
```

`mongosh` is the shell and the Database Tools — `mongodump`, `mongorestore`, `mongoexport`, `mongoimport` — are a separate package. Install the tools only if import, export, or backup work is actually needed. Read [references/setup.md](references/setup.md) for the install commands per platform, the Docker and replica-set definitions, the Atlas preparation steps, and the connection string shapes.

## Create the deployment

For a local server, prefer a container so the version is explicit and removal is clean. Give it a named volume, or the data disappears with the container.

For Atlas, the work is account-side rather than machine-side: create the cluster, add a database user with the narrowest role the application needs, and add a network access rule for the current address. Do not add an access rule for all addresses to get past a connection error — that opens the cluster to the internet and leaves only the password in the way.

Never create a user with an account-wide administrative role for an application. `readWrite` on one database is the normal answer.

## Assemble the connection string

Build it from parts and keep it in an ignored environment file, never in a command:

```bash
grep -c MONGODB_URI .env.local
```

Rules that matter more than the syntax:

- Never echo the connection string, never paste a password into the terminal, and never read shell history to recover one. Both land in this transcript.
- Percent-encode any reserved character in the password. An unencoded `@` or `/` produces a parse error that reads like a hostname problem.
- Name the database in the string and set `retryWrites=true`. For a replica set, name the set rather than a single host, or a failover leaves the application pointed at a former primary.
- Keep separate credentials per environment. One string shared between development and production is the setup mistake with the largest blast radius.

## Verify

```bash
mongosh "$MONGODB_URI" --quiet --eval 'printjson({ ok: 1, db: db.getName(), me: db.hello().me, setName: db.hello().setName })'
mongosh "$MONGODB_URI" --quiet --eval 'db.runCommand({ connectionStatus: 1 }).authInfo.authenticatedUserRoles'
```

Read four things: the server answered, the default database is the intended one, the replica set name is present when one was expected, and the authenticated roles are the narrow ones that were granted. A connection that succeeds proves reachability, not that the account can read the collection the application needs.

## Guardrails

- Do not open network access to all addresses, disable TLS, or add `tlsAllowInvalidCertificates` to make a connection work. Each turns a configuration problem into an exposure.
- Do not print the connection string, a password, or the contents of an environment file. Use `grep -c` to confirm a variable is set rather than showing it.
- Do not grant an administrative or cluster-wide role to an application user.
- Do not upgrade or reconfigure an existing server as part of setup, and do not delete a data volume to resolve a startup error without checking what is in it.
- Report the deployment type and version, the tools installed, the database and user with the password redacted, the granted roles, and the verification output. If the connection still fails, hand off to `11ai-mongodb-troubleshooting`.
