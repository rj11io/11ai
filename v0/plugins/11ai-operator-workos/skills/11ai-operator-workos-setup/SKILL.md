---
name: 11ai-operator-workos-setup
description: "Set up WorkOS in an application from zero, covering the environment and API key, client id, a cookie password of sufficient length, registered redirect URIs, the AuthKit SDK install and callback route, middleware for session refresh, the sign-out redirect, and keeping staging separate from production. Use when an application has no WorkOS wiring, when keys and redirect URIs must be configured, or when the user asks how to get WorkOS working."
---
# 11ai WorkOS setup

Most WorkOS setup failures are one of two things: a redirect URI that does not match exactly, or a session that is never refreshed. Get both right first and the rest follows. Use `11ai-operator-workos-environment` to inspect what already exists before writing anything.

## Decide the environment and gather values

Confirm before touching code:

- Which WorkOS environment this is — staging or production. They have separate keys, organizations, connections, and users, so a value from one is useless in the other.
- The application's real base URL for this environment, including scheme, host, and port.
- The callback path the application will expose.
- Whether users sign in through AuthKit's hosted page or through a specific organization's connection.

Four values are needed. Three are secrets and one is not:

| Value | Handling |
| --- | --- |
| `WORKOS_API_KEY` | Server only. Full API access for the environment |
| `WORKOS_CLIENT_ID` | Safe in a redirect URL |
| `WORKOS_COOKIE_PASSWORD` | Server only. At least 32 characters |
| `WORKOS_REDIRECT_URI` | Not secret, and must match a registered URI exactly |

Never take an API key through the terminal — it lands in shell history and in this transcript. Have the user copy it from the dashboard into an ignored environment file themselves.

Generate the cookie password locally rather than inventing one:

```bash
openssl rand -base64 32
```

Read [references/setup.md](references/setup.md) for the environment file shapes, the callback route and middleware for each framework, the sign-out configuration, and the dashboard-side registration steps.

## Register the redirect URI

The redirect URI must be registered in the WorkOS dashboard for that environment, and it must match the application's value character for character. `localhost` and `127.0.0.1` are different hosts, a trailing slash is a difference, and `http` is not `https`.

Register one URI per environment rather than trying to make one cover several. A production application should not have a `localhost` URI registered.

## Install and wire the routes

```bash
npm install @workos-inc/authkit-nextjs
```

Three pieces, and all three are required:

1. **The callback route** at the exact path in `WORKOS_REDIRECT_URI`, which exchanges the code for a session.
2. **Middleware** that refreshes the session on each request. Without it the access token expires after its short lifetime and the user appears randomly signed out — this is the most common "it worked and then stopped" report.
3. **A sign-out path** that clears the session and returns the user somewhere sensible, configured in the dashboard as well as in code.

Read the user on the server with the SDK's own helper rather than decoding a cookie or trusting a client-supplied user id. The helper verifies the session; anything else is an authorization bypass.

## Verify

Walk the whole loop rather than checking a call:

1. Visit a protected page while signed out and confirm a redirect to sign-in.
2. Sign in and confirm the callback returns to the application with a session.
3. Reload, then navigate — the session must survive both.
4. Wait past the access token lifetime, or clear it, and confirm the middleware refreshed it rather than signing the user out.
5. Sign out and confirm the protected page redirects again.
6. Request a protected server route with no cookie and confirm it refuses.

Confirm the environment too: read back the organization list with the server key and check the names match the environment you intended to configure.

## Guardrails

- Never print an API key, a cookie password, a webhook secret, or the contents of an environment file. Confirm a variable by name.
- Never expose the API key or cookie password to the browser, including behind a client-visible prefix such as `NEXT_PUBLIC_`. A key in a client bundle grants full API access to the environment and must be rotated.
- Do not register a production redirect URI alongside development ones, and do not add a wildcard to make a redirect work.
- Do not create, modify, or delete organizations, connections, or directories as part of setup. Those are separate operations with their own approval.
- Do not read a user identity from a request body or an unverified cookie.
- Keep staging and production keys in separate files and never mix them in one deployment.
- Report which environment was configured, the variable names written and to which files, whether those files are ignored, the registered redirect URI, the routes and middleware added, and the verification results including the refresh and signed-out checks.
