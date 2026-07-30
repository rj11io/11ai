---
name: 11ai-operator-workos-environment
description: "Inspect which WorkOS environment an application targets, which API key and client id it holds, whether the redirect URI matches a registered one, the cookie password strength, the configured connections and directories per organization, and which webhook endpoints exist, without changing anything. Use before a WorkOS operation, when sign-in fails on a redirect, when an object seems missing, or when the user asks whether WorkOS is set up."
---
# 11ai WorkOS environment

Staging and production are separate WorkOS environments with separate keys, connections, organizations, and users. An object created in one genuinely does not exist in the other, so establish which environment the application is pointed at before concluding anything is broken. Keep this pass read-only.

## Inspect what the application holds

```bash
ls -la .env .env.local .env.example 2>/dev/null
grep -o '^[A-Z_]*' .env.local 2>/dev/null | sort
grep -c 'WORKOS_API_KEY\|WORKOS_CLIENT_ID\|WORKOS_COOKIE_PASSWORD\|WORKOS_REDIRECT_URI' .env.local 2>/dev/null
grep -rn 'WORKOS_API_KEY\|WORKOS_COOKIE_PASSWORD' --include='*.tsx' app/ components/ 2>/dev/null
```

List variable **names**, never values. An API key printed here grants full access to the environment for as long as it lives.

The last command is a real check: `WORKOS_API_KEY` or `WORKOS_COOKIE_PASSWORD` referenced from a client component, or behind a client-exposed prefix such as `NEXT_PUBLIC_`, is an exposure. Report it and treat the key as compromised.

Two values reveal the environment without printing anything sensitive:

```bash
grep -o 'sk_test\|sk_live' .env.local 2>/dev/null | head -1
grep -o 'client_[A-Za-z0-9]\{8\}' .env.local 2>/dev/null | head -1
```

The key prefix distinguishes a staging key from a production one. Print only that prefix and a truncated client id, never the rest.

Check the cookie password length without revealing it:

```bash
awk -F= '/^WORKOS_COOKIE_PASSWORD=/{print length($2) " characters"}' .env.local 2>/dev/null
```

It must be at least 32 characters. A shorter one makes the session cookie fail to encrypt, and the error does not say so plainly.

## Confirm the redirect URI

```bash
grep -o 'WORKOS_REDIRECT_URI=.*' .env.local 2>/dev/null
grep -rn 'callback' --include='route.ts' app/ 2>/dev/null | head
```

The redirect URI is safe to display and is the most common cause of a broken sign-in. Three things must agree exactly: the value in the environment, the route that actually exists in the application, and a URI registered in the WorkOS dashboard for that environment.

Exact means exact. `http://localhost:3000/callback` and `http://127.0.0.1:3000/callback` are different, a trailing slash matters, and `http` and `https` are different. There is no partial matching.

## Read the configured objects

```ts
import { WorkOS } from "@workos-inc/node"

const workos = new WorkOS(process.env.WORKOS_API_KEY!)

const orgs = await workos.organizations.listOrganizations({ limit: 20 })
console.log(orgs.data.map((o) => ({ id: o.id, name: o.name, domains: o.domains.map((d) => d.domain) })))

const connections = await workos.sso.listConnections({ limit: 20 })
console.log(connections.data.map((c) => ({ id: c.id, org: c.organizationId, type: c.connectionType, state: c.state })))

const directories = await workos.directorySync.listDirectories({ limit: 20 })
console.log(directories.data.map((d) => ({ id: d.id, org: d.organizationId, type: d.type, state: d.state })))
```

Read the `state` on each connection and directory. A connection that exists but is not active will not authenticate anyone, and that is a configuration step an administrator completes — not something to fix in code.

Run this as a one-off script with the server key, never from anything reachable by a browser.

## Interpretation

- **An organization, user, or connection that "does not exist"** — usually the wrong environment. Check the key prefix before anything else.
- **A redirect rejected immediately after sign-in** — the redirect URI is not registered, or does not match character for character.
- **Sign-in succeeding then the user appearing signed out** — no middleware refreshing the session, or a cookie password under 32 characters.
- **A connection in a draft or inactive state** — configuration is incomplete on the identity provider side. Hand off to `11ai-operator-workos-sso`.
- **A directory listing far fewer users than expected** — only the first page was read. These lists are cursor-paginated.
- **`401 Unauthorized` from the API** — the key is for a different environment, was truncated on paste, or has been revoked.
- **Webhook events arriving but never handled** — the endpoint returns an error, or signature verification is failing because a body parser ran first.

## Report

State which environment the key targets from its prefix, the client id truncated, whether the cookie password meets the length requirement, the redirect URI and whether the matching route exists, the organizations with their verified domains, the connections and directories with their states, and which webhook endpoints are configured. Report secrets as set or unset only. Flag any server key reachable from client code as an exposure requiring rotation. End with the smallest next safe step, and hand off to `11ai-operator-workos-setup` if values are missing or to `11ai-operator-workos-troubleshooting` if something is already failing.
