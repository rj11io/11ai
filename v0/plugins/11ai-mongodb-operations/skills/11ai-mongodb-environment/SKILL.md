---
name: 11ai-mongodb-environment
description: "Inspect MongoDB client tools, connection details, server health, authentication context, and deployment capabilities without changing data. Use before an operation or when mongosh cannot connect, the target is unclear, or the user asks whether MongoDB is ready."
---
# 11ai MongoDB environment

Establish exactly which MongoDB deployment will receive a command before using any write or administrative operation. Keep the initial pass read-only and redact secrets from all output.

## Preflight

Check only what is relevant:

    command -v mongosh
    mongosh --version
    command -v mongodump
    mongodump --version

If a connection is available, use a credential-safe shell check:

    mongosh "$MONGODB_URI" --quiet --eval 'printjson({ db: db.getName(), hello: db.hello() })'

Never echo MONGODB_URI, inspect shell history, or include a password in a command. If the user supplies a URI, redact credentials and preserve only the scheme, host class, port, and database name in the report.

## Connection checks

Classify the target as local, remote self-hosted, Atlas, replica set, or mongos. Confirm:

- the hostname or cluster label
- the default database
- the authentication database and user name, without the password
- whether TLS is required
- whether the shell can reach the server
- the server version and db.hello() response
- whether the account can read the requested database or collection

For a local default deployment, mongosh with no arguments targets localhost on port 27017. For Atlas or remote deployments, use the connection string supplied by the user and let mongosh prompt for the password when possible.

## Safe reporting

End with:

1. tool availability and versions
2. target classification, with secrets redacted
3. connection and authentication result
4. active database and relevant capabilities
5. the smallest next safe command

Do not restart a server, change a context, install tools, change firewall rules, or modify credentials as part of this skill.
