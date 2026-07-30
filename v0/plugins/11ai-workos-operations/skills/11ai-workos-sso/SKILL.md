---
name: 11ai-workos-sso
description: "Configure and test enterprise single sign-on connections, covering SAML and OpenID Connect connection types, the Admin Portal handoff to a customer's identity provider administrator, connection states, domain verification and identifier-first routing, attribute and profile mapping, just-in-time provisioning, and testing a connection before it goes live. Use when an enterprise customer must sign in with their own identity provider, when a connection is inactive or misconfigured, or when profile attributes arrive wrong or missing."
---
# 11ai WorkOS SSO

A single sign-on connection is configured by the customer's identity provider administrator, not by you. Your job is to create the organization, hand over a portal link, and verify what comes back. Establish which organization and which environment before anything else, because connections are environment-scoped and do not cross over.

## Inspect first

```ts
import { WorkOS } from "@workos-inc/node"

const workos = new WorkOS(process.env.WORKOS_API_KEY!)

const orgs = await workos.organizations.listOrganizations({ limit: 20 })
console.log(orgs.data.map((o) => ({
  id: o.id,
  name: o.name,
  domains: o.domains.map((d) => ({ domain: d.domain, state: d.state })),
})))

const connections = await workos.sso.listConnections({ limit: 20 })
console.log(connections.data.map((c) => ({
  id: c.id,
  org: c.organizationId,
  type: c.connectionType,
  state: c.state,
  name: c.name,
})))
```

Read the connection `state`. Only an active connection authenticates anyone; a draft or inactive one means the identity provider side is unfinished, which is a customer action rather than a code change. Read the domain `state` too — an unverified domain cannot route users by email address.

Run this server-side only. The API key grants full access to the environment.

## Create the organization and hand over a portal link

```ts
const org = await workos.organizations.createOrganization({
  name: "Acme Corporation",
  domainData: [{ domain: "acme.com", state: "verified" }],
})
```

Add only domains the customer actually controls, and verify them. An unverified domain that someone else owns would let their users into this organization, so treat a domain claim as something to confirm rather than accept.

```ts
const link = await workos.portal.generateLink({
  organization: org.id,
  intent: "sso",
  returnUrl: "https://app.example.com/settings/sso",
})
```

The Admin Portal is the right handoff: the customer's administrator configures their own identity provider through it, without you handling their certificates or metadata. Portal links are short-lived and single-use in effect — generate one per request, treat it as a credential for that organization's configuration, and send it over a channel the customer trusts rather than a public one.

Do not attempt to configure a customer's identity provider by collecting their SAML metadata over email and entering it yourself. It puts you in the middle of their security configuration and the portal exists to avoid exactly that.

## Route users to the right connection

Two patterns, and the choice shapes the sign-in page:

**Identifier-first.** Ask for an email address, look up the organization by its verified domain, then send the user to that organization's connection:

```ts
const url = await getSignInUrl({ organizationId })
```

**Explicit organization.** The organization is already known from a subdomain, an invitation, or a tenant path, so pass it directly.

Resolve the organization from the verified domain on the **server**. Accepting an organization id from a query string lets a user aim themselves at another tenant's connection.

Have a fallback for an address that matches no organization. Send those users to the standard AuthKit page rather than an error, or every new prospect hits a dead end.

## Profile attributes and provisioning

After authentication the profile carries attributes the identity provider sent. What arrives varies by provider, so read rather than assume:

```ts
const { user, organizationId, role } = await workos.userManagement.authenticateWithCode({
  clientId: process.env.WORKOS_CLIENT_ID!,
  code,
})
```

Three rules for handling it:

- **Match on the identity provider's stable identifier**, not on email. Email addresses change, and matching on a mutable value lets a renamed account become a new user or, worse, collide with an existing one.
- **Handle missing attributes.** A provider may send no first or last name. Do not fail sign-in over a display field.
- **Never take a role or permission from a raw provider attribute** without mapping it through configuration you control. An identity provider administrator who can set an attribute could otherwise grant themselves any role in your application.

Just-in-time provisioning creates the user on first sign-in. Decide deliberately whether an unknown user from a verified domain should be created automatically or should require an invitation, because automatic creation means anyone with an address at that domain gets an account.

## Test before it goes live

Test with the customer's own identity provider, in a staging environment, before production:

1. Confirm the connection is `active`.
2. Complete a full sign-in as a real user from that provider.
3. Read the returned profile and confirm the identifier, email, and any mapped attributes are what the application expects.
4. Sign in as a second user with a different role and confirm the role maps correctly.
5. Confirm a user whose email domain does not match the organization cannot reach that connection.
6. Confirm the reverse: a user removed from the identity provider can no longer sign in.
7. Confirm the session then behaves normally — refresh and sign-out — which is `11ai-workos-authkit`.

Step 6 is the one that matters to the customer's security team and the one most often untested.

## Report

State the environment, the organization and its verified domains, the connection type and state, how users are routed to it, which profile attributes arrive and which are absent, how the stable identifier maps to your user record, whether just-in-time provisioning is on and what gates it, and the results of all the tests including the negative ones. Never print certificates, metadata, portal links, or the API key. Say plainly which steps remain with the customer's administrator.
