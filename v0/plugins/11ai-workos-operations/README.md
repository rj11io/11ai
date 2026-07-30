# 11ai WorkOS operations

Ten standalone skills for common WorkOS authentication and directory work, with read-first checks around environments, tenant scoping, and anything that changes a customer's access.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-workos-cheatsheet`](./skills/11ai-workos-cheatsheet/SKILL.md) | Looking up AuthKit calls, API methods, environment values, and event types |
| [`11ai-workos-setup`](./skills/11ai-workos-setup/SKILL.md) | Configuring keys, the cookie password, redirect URIs, the callback route, and session middleware |
| [`11ai-workos-environment`](./skills/11ai-workos-environment/SKILL.md) | Inspecting which environment is targeted, which values are set, and the state of connections and directories |
| [`11ai-workos-authkit`](./skills/11ai-workos-authkit/SKILL.md) | Wiring sign-in, session refresh, default-deny route protection, server-side authorization, and sign-out |
| [`11ai-workos-sso`](./skills/11ai-workos-sso/SKILL.md) | Setting up enterprise single sign-on connections and verifying the profile that comes back |
| [`11ai-workos-directory-sync`](./skills/11ai-workos-directory-sync/SKILL.md) | Provisioning users from a customer's directory and reconciling when events were missed |
| [`11ai-workos-organizations`](./skills/11ai-workos-organizations/SKILL.md) | Managing organizations, verified domains, memberships, roles, and invitations |
| [`11ai-workos-webhooks`](./skills/11ai-workos-webhooks/SKILL.md) | Receiving events with signature verification over the raw body and idempotent handling |
| [`11ai-workos-integrations`](./skills/11ai-workos-integrations/SKILL.md) | Mirroring users and organizations locally, scoping queries by tenant, and verifying tokens at an API boundary |
| [`11ai-workos-troubleshooting`](./skills/11ai-workos-troubleshooting/SKILL.md) | Diagnosing wrong environments, redirect mismatches, lost sessions, partial listings, and webhook failures |

The skills are intentionally narrow. Combine them when a task crosses boundaries, such as creating an organization before handing over a portal link, or fixing a webhook endpoint and then running a reconciliation pass.

## Safety contract

Establish the environment first. Staging and production are entirely separate — separate keys, organizations, connections, directories, users, and webhook secrets — and an object created in one does not exist in the other. A key prefix of `sk_test` or `sk_live` answers most "missing object" reports before any code is read.

Keep server values server-side. `WORKOS_API_KEY`, the cookie password, and webhook signing secrets must never reach the browser, including behind a client-exposed prefix. A key in a client bundle grants full API access to the environment and must be rotated.

Take identity from the verified session, never from the request. Read the user id, organization id, role, and permissions through the SDK's server helper; an organization id accepted from a body, query string, or header is a cross-tenant read. Verify tokens at every boundary — signature, issuer, audience, and expiry — rather than decoding them to read claims.

Verify webhooks against the raw request body before parsing, reject an unverified event outright, and key idempotency on the event id because retries are normal.

Treat as requiring explicit approval, naming the object: deleting an organization, which removes its connections and memberships and signs out its users; removing or demoting a membership, after confirming an administrator remains; sending invitations, which email real people; and adding a verified domain, which lets everyone at that domain into the tenant.

Deprovisioning means revoking access, not flagging a row. End the user's sessions as part of it, and run a reconciliation pass on a schedule because events do get missed.

Never weaken a protection to clear a symptom. Disabling signature verification, adding a wildcard redirect URI, or trusting an unverified token each trade a real safeguard for the error message. Do not print keys, cookie passwords, signing secrets, tokens, portal links, SCIM tokens, certificates, or event payloads containing personal data.
