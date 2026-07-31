# 11ai Clerk Core 3 operator

Eleven standalone skills for Clerk Core 3 authentication and user work, including first-party native-skill compatibility. The API baseline is `2026-05-12`; each framework SDK must satisfy Clerk's documented Core 3 compatibility mapping.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-clerk-core-3-cheatsheet`](./skills/11ai-operator-clerk-core-3-cheatsheet/SKILL.md) | Looking up components, hooks, server helpers, backend API calls, and metadata scope |
| [`11ai-operator-clerk-core-3-setup`](./skills/11ai-operator-clerk-core-3-setup/SKILL.md) | Adding keys, the provider, default-deny middleware, sign-in routes, and a protected page |
| [`11ai-operator-clerk-core-3-native-skills`](./skills/11ai-operator-clerk-core-3-native-skills/SKILL.md) | Selecting and installing first-party Clerk skills only after checking Core 3, API, and framework-SDK compatibility |
| [`11ai-operator-clerk-core-3-environment`](./skills/11ai-operator-clerk-core-3-environment/SKILL.md) | Inspecting which instance is targeted, the wiring, redirect paths, and where authorization actually happens |
| [`11ai-operator-clerk-core-3-authentication`](./skills/11ai-operator-clerk-core-3-authentication/SKILL.md) | Wiring sign-in and sign-up flows, redirects, social connections, and an enforced onboarding step |
| [`11ai-operator-clerk-core-3-sessions`](./skills/11ai-operator-clerk-core-3-sessions/SKILL.md) | Protecting routes, reading the session on the server, permission checks, and verifying a bearer token |
| [`11ai-operator-clerk-core-3-users`](./skills/11ai-operator-clerk-core-3-users/SKILL.md) | Reading and changing user records, metadata, and banning or deleting with session revocation |
| [`11ai-operator-clerk-core-3-organizations`](./skills/11ai-operator-clerk-core-3-organizations/SKILL.md) | Managing organizations, memberships, roles, invitations, and scoping queries by tenant |
| [`11ai-operator-clerk-core-3-webhooks`](./skills/11ai-operator-clerk-core-3-webhooks/SKILL.md) | Receiving events with signature verification over the raw body and idempotent handling |
| [`11ai-operator-clerk-core-3-integrations`](./skills/11ai-operator-clerk-core-3-integrations/SKILL.md) | Mirroring users and organizations locally, API boundaries, token templates, and billing |
| [`11ai-operator-clerk-core-3-troubleshooting`](./skills/11ai-operator-clerk-core-3-troubleshooting/SKILL.md) | Diagnosing wrong instances, middleware errors, redirect loops, undefined orgId, and webhook failures |

The skills are intentionally narrow. Combine them when a task crosses boundaries, such as adding middleware before protecting a route, or fixing a webhook endpoint and then running a reconciliation pass.

## Safety contract

Establish the instance first. `pk_test` and `sk_test` are a development instance; `pk_live` and `sk_live` are production. They hold separate users, organizations, roles, token templates, and webhook secrets, so a missing user is usually the wrong instance. A mixed pair is a real misconfiguration.

Core 3's `Show` component decides what renders. It is not access control — anything it hides is still reachable with `curl`. Every route returning private data must check on the server with `auth()`, and every mutation must check a permission, not just a session.

Take identity from the verified session. Read `userId` and `orgId` through `auth()` and pass them into the query; an identifier accepted from a body, query string, or header is a cross-tenant read. Treat an undefined `orgId` as a normal state that must be handled, never as "no filter". Verify tokens at every API boundary including `authorizedParties`.

Keep `CLERK_SECRET_KEY` and the webhook signing secret server-side. A secret key in a client bundle grants full API access to the instance and must be rotated. Never read a role, plan, or entitlement from `unsafeMetadata` — the user writes that field from the browser.

Verify webhooks against the raw body before parsing, keep the webhook route public in middleware, return 401 rather than 500 on a bad signature, and key idempotency on the event id because retries are normal.

Treat as requiring explicit approval, naming the object: deleting a user or an organization, which is irreversible; banning or removing a membership, after confirming an administrator remains; and sending invitations, which email real people. Removing access means revoking sessions as well as setting a flag — a banned user with a live session still has access.

Never weaken a protection to clear a symptom. Narrowing a middleware matcher, disabling webhook verification, or forcing a redirect to break a loop each trade a safeguard for the error message. Do not print secret keys, signing secrets, tokens, or personal data beyond what the task needs.
