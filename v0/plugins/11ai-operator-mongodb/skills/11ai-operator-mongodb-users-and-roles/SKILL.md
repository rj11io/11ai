---
name: 11ai-operator-mongodb-users-and-roles
description: "Create and audit MongoDB database users with least privilege, covering the authentication database, built-in roles and what each grants, custom roles scoped to specific actions and collections, listing effective privileges, changing a password without downtime, removing a user, and separating an application account from an administrative one. Use when an application needs credentials, when a user's access must be audited or narrowed, or when a password must be rotated."
---
# 11ai MongoDB users and roles

An application account should be able to do exactly what the application does and nothing else. The common failure is giving it an administrative role because that removes an error quickly — after which a bug in the application can drop a collection. Grant the narrowest role, and treat any privilege widening as a change needing explicit approval.

## Audit what exists

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  db.getSiblingDB("admin").system.users.find({}, { user: 1, db: 1, roles: 1 })
    .forEach(u => printjson({ user: u.user, authDb: u.db, roles: u.roles }))'
mongosh "$MONGODB_URI" --quiet --eval 'printjson(db.runCommand({ usersInfo: 1, showPrivileges: false }))'
mongosh "$MONGODB_URI" --quiet --eval 'printjson(db.runCommand({ connectionStatus: 1 }).authInfo)'
```

Never select the `credentials` field — it holds password verifiers. Read `user`, `db`, and `roles` only.

`connectionStatus` shows what the *current* connection is authenticated as, which is the first thing to establish: an audit run as a cluster administrator sees everything, and an application connection that unexpectedly has that role is the finding.

To see a user's effective privileges expanded:

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  printjson(db.getSiblingDB("admin").runCommand({ usersInfo: { user: "APP_USER", db: "app" }, showPrivileges: true }))'
```

## Understand the authentication database

A user belongs to the database it was created in, and that database is the `authSource`. A user created in `admin` authenticates against `admin` even when it only has rights on `app`.

```text
mongodb+srv://APP_USER:PASSWORD@cluster.example.net/app?authSource=admin
```

A wrong `authSource` reports authentication failure even with the correct password — that is the single most common credential problem, and it is not a password problem. Report the `authSource` alongside any user you create.

## Grant the narrowest built-in role

| Role | Grants |
| --- | --- |
| `read` | read one database |
| `readWrite` | read and write one database, including dropping collections |
| `dbAdmin` | indexes, statistics, and validation on one database |
| `readWriteAnyDatabase` | read and write **every** database |
| `dbOwner` | full control of one database |
| `root` | everything, cluster-wide |

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  db.getSiblingDB("admin").createUser({
    user: "APP_USER",
    pwd: passwordPrompt(),
    roles: [{ role: "readWrite", db: "app" }]
  })'
```

`readWrite` on one database is the normal answer for an application. Note it includes dropping collections in that database, so a destructive bug is still possible — a custom role is the fix when that matters.

Use `passwordPrompt()` so the password is typed rather than written into the command. A password as a literal argument lands in shell history, in the process list, and in this transcript. Never accept a password through this conversation; have the user type it.

Never grant `root`, `readWriteAnyDatabase`, or `dbOwner` to an application. Separate accounts by purpose: one for the application with `readWrite` on its database, one for a reporting job with `read`, and administrative access held by a person rather than a service.

## Build a custom role when built-ins are too broad

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  db.getSiblingDB("admin").createRole({
    role: "appWriter",
    privileges: [
      { resource: { db: "app", collection: "orders" }, actions: ["find", "insert", "update"] },
      { resource: { db: "app", collection: "customers" }, actions: ["find"] }
    ],
    roles: []
  })'
```

This grants exactly those actions on exactly those collections — no `drop`, no access to other collections, no index changes. Omitting `remove` from the actions means the account cannot delete documents at all, which is often correct for an append-only workload.

Grant it like any other role:

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  db.getSiblingDB("admin").grantRolesToUser("APP_USER", [{ role: "appWriter", db: "admin" }])'
mongosh "$MONGODB_URI" --quiet --eval '
  db.getSiblingDB("admin").revokeRolesFromUser("APP_USER", [{ role: "readWrite", db: "app" }])'
```

Grant the new role and verify it before revoking the old one, or the application loses access between the two commands.

## Rotate a password without downtime

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  db.getSiblingDB("admin").changeUserPassword("APP_USER", passwordPrompt())'
```

Changing a password does not drop existing connections, so running instances keep working until they reconnect. That is a short window, not a safe one — the ordered approach avoids it entirely:

1. Create a second user with the same role and a new password.
2. Deploy the application with the new credentials.
3. Confirm no connections remain under the old user.
4. Remove the old user.

For a single-account rotation, change the password and update the secret store in the same operation, then restart the consumers deliberately.

```bash
mongosh "$MONGODB_URI" --quiet --eval '
  printjson(db.getSiblingDB("admin").runCommand({ connPoolStats: 1 }).numClientConnections)'
```

Removal is not reversible and cuts off whatever is using it:

```bash
mongosh "$MONGODB_URI" --quiet --eval 'db.getSiblingDB("admin").dropUser("OLD_USER")'
```

Establish what authenticates as that user before dropping it, and get approval naming the user.

## Verify

```bash
mongosh "mongodb+srv://APP_USER@cluster.example.net/app?authSource=admin" --quiet \
  --eval 'printjson(db.runCommand({ connectionStatus: 1 }).authInfo.authenticatedUserRoles)'
```

Then test the boundary, which is the half usually skipped: as the new user, confirm the intended read and write succeed **and** confirm a forbidden action fails. An account that can do its job has not been shown to be least-privilege until something is proven to be denied.

```bash
mongosh "$APP_URI" --quiet --eval 'db.orders.findOne()'
mongosh "$APP_URI" --quiet --eval 'try { db.orders.drop() } catch (e) { print("correctly denied: " + e.codeName) }'
```

## Report

State the deployment, the user name and its authentication database, the roles or custom role granted with the exact actions and resources, why a built-in role was too broad if a custom one was used, the connection-string `authSource`, whether a password was rotated and how consumers were updated, anything revoked or dropped and what was confirmed to depend on it, and the verification including the denied-action test. Never print a password or the `credentials` field. Flag any account holding `root`, `dbOwner`, or an `AnyDatabase` role.
