# 11ai Clerk operations

Ten standalone skills for common Clerk authentication and user work, with read-first checks around instances, tenant scoping, and anything that changes a person's access.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-clerk-cheatsheet`](./skills/11ai-clerk-cheatsheet/SKILL.md) | Looking up components, hooks, server helpers, backend API calls, and metadata scope |
| [`11ai-clerk-setup`](./skills/11ai-clerk-setup/SKILL.md) | Adding keys, the provider, default-deny middleware, sign-in routes, and a protected page |
| [`11ai-clerk-environment`](./skills/11ai-clerk-environment/SKILL.md) | Inspecting which instance is targeted, the wiring, redirect paths, and where authorization actually happens |
| [`11ai-clerk-authentication`](./skills/11ai-clerk-authentication/SKILL.md) | Wiring sign-in and sign-up flows, redirects, social connections, and an enforced onboarding step |
| [`11ai-clerk-sessions`](./skills/11ai-clerk-sessions/SKILL.md) | Protecting routes, reading the session on the server, permission checks, and verifying a bearer token |
| [`11ai-clerk-users`](./skills/11ai-clerk-users/SKILL.md) | Reading and changing user records, metadata, and banning or deleting with session revocation |
| [`11ai-clerk-organizations`](./skills/11ai-clerk-organizations/SKILL.md) | Managing organizations, memberships, roles, invitations, and scoping queries by tenant |
| [`11ai-clerk-webhooks`](./skills/11ai-clerk-webhooks/SKILL.md) | Receiving events with signature verification over the raw body and idempotent handling |
| [`11ai-clerk-integrations`](./skills/11ai-clerk-integrations/SKILL.md) | Mirroring users and organizations locally, API boundaries, token templates, and billing |
| [`11ai-clerk-troubleshooting`](./skills/11ai-clerk-troubleshooting/SKILL.md) | Diagnosing wrong instances, middleware errors, redirect loops, undefined orgId, and webhook failures |

The skills are intentionally narrow. Combine them when a task crosses boundaries, such as adding middleware before protecting a route, or fixing a webhook endpoint and then running a reconciliation pass.

## Safety contract

Establish the instance first. `pk_test` and `sk_test` are a development instance; `pk_live` and `sk_live` are production. They hold separate users, organizations, roles, token templates, and webhook secrets, so a missing user is usually the wrong instance. A mixed pair is a real misconfiguration.

`SignedIn`, `SignedOut`, and `Protect` decide what renders. They are not access control — anything they hide is still reachable with `curl`. Every route returning private data must check on the server with `auth()`, and every mutation must check a permission, not just a session.

Take identity from the verified session. Read `userId` and `orgId` through `auth()` and pass them into the query; an identifier accepted from a body, query string, or header is a cross-tenant read. Treat an undefined `orgId` as a normal state that must be handled, never as "no filter". Verify tokens at every API boundary including `authorizedParties`.

Keep `CLERK_SECRET_KEY` and the webhook signing secret server-side. A secret key in a client bundle grants full API access to the instance and must be rotated. Never read a role, plan, or entitlement from `unsafeMetadata` — the user writes that field from the browser.

Verify webhooks against the raw body before parsing, keep the webhook route public in middleware, return 401 rather than 500 on a bad signature, and key idempotency on the event id because retries are normal.

Treat as requiring explicit approval, naming the object: deleting a user or an organization, which is irreversible; banning or removing a membership, after confirming an administrator remains; and sending invitations, which email real people. Removing access means revoking sessions as well as setting a flag — a banned user with a live session still has access.

Never weaken a protection to clear a symptom. Narrowing a middleware matcher, disabling webhook verification, or forcing a redirect to break a loop each trade a safeguard for the error message. Do not print secret keys, signing secrets, tokens, or personal data beyond what the task needs.
