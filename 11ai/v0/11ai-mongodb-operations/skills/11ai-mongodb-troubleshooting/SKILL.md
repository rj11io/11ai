---
name: 11ai-mongodb-troubleshooting
description: "Diagnose common MongoDB Shell and Database Tools failures using read-only evidence and a symptom-to-cause decision tree. Use for connection, DNS, TLS, authentication, permissions, duplicate-key, validation, timeout, restore, or slow-query problems."
---
# 11ai MongoDB troubleshooting

Collect the exact error, target class, tool version, server version, and the smallest reproducible command. Redact passwords, full URIs, tokens, certificate contents, and document data that is not needed for diagnosis.

## First pass

    mongosh --version
    mongodump --version
    mongosh "$MONGODB_URI" --quiet --eval 'printjson({ db: db.getName(), hello: db.hello() })'

Classify the failure before changing anything:

- command not found: client tool or PATH problem
- server selection timeout: DNS, firewall, allowlist, route, TLS, or unavailable deployment
- authentication failed: user, password, authSource, mechanism, or account state
- not authorized: the connection works but the role lacks the requested privilege
- duplicate key: a unique index conflicts with the write or upsert filter
- document failed validation: the document does not satisfy the collection validator
- network or TLS error: certificate, hostname, CA, proxy, or TLS mode mismatch
- slow query: missing or unsuitable index, unbounded result, high cardinality, or server load
- restore or import failure: incompatible tool, malformed file, namespace, permissions, or duplicate data

## Targeted checks

For connection failures, verify DNS resolution, the host and port, Atlas or firewall allowlists, TLS requirements, proxy settings, and whether the deployment is reachable from the current machine. Do not disable TLS or allowlists as a first workaround.

For authentication failures, verify the username, authentication database, mechanism, and role assignment without requesting or displaying the password. Let mongosh prompt for the password.

For authorization failures, identify the exact database command and the minimum privilege it needs. Do not recommend a broad admin role as a shortcut.

For duplicate-key failures, inspect the conflicting unique index and query for the existing key. Decide whether the correct behavior is reject, update, or deliberate upsert.

For validation failures, inspect collection options and compare the rejected document to the validator. Do not weaken validation before understanding why the document is invalid.

For slow reads, add a small limit, run explain with executionStats, compare keys examined with documents examined, and check existing indexes. Do not create or drop indexes without a workload-based reason.

## Safe repair loop

1. Reproduce with a redacted, bounded command.
2. Gather read-only evidence.
3. State the most likely cause and alternatives.
4. Propose the least invasive fix.
5. Ask before changing credentials, firewall rules, TLS settings, indexes, validators, data, or deployment configuration.
6. Verify the result and report what changed.

Do not hide uncertainty behind a generic retry. If the error points to Atlas administration, server configuration, roles, transactions, or driver behavior, identify that as a boundary and hand off to a dedicated skill when one is added.
