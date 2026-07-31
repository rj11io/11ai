# Vercel Passport integrations reference

These patterns are standalone and do not require another 11ai plugin.

## Identity mapping

Key local principals by provider issuer and `external_sub`. Treat email, name, and other profile fields as optional display attributes, not stable authorization keys.

## Authorization

Passport authenticates deployment visitors. Enforce application roles and resource permissions independently on the server, using the local principal mapped from the trusted header.

## Sessions

Document Passport session and application session lifetimes separately. Deprovisioning at the identity provider may not immediately invalidate every application session; verify the actual flow.

## Audit

Correlate team, project, deployment, external subject hash, outcome, and time. Never store raw tokens or unnecessary profile claims in logs.

## Preview and CI

Use an assigned test identity for protected previews and keep automation credentials separate from human visitor sessions. Do not disable protection for CI convenience.

## Incident response

If a project was unexpectedly public or a token was exposed, preserve evidence, restore protection, rotate affected secrets, identify deployments and sessions, and follow the organization's incident process.
