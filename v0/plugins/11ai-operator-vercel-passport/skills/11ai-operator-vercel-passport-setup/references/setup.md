# Vercel Passport setup reference

Use the current official guide at <https://vercel.com/kb/guide/vercel-passport> as the source of truth.

## Prerequisites

Confirm an Enterprise team, authorized administrator, compatible OAuth or OpenID Connect provider, confidential client support, pilot project, test identities, and break-glass owner.

## Provider application

Register the exact redirect URI `https://connect.vercel.com/callback`. Use the authorization-code grant and include `openid`. Discovery endpoints must share one issuer. Store the client secret only in protected dashboard fields.

## Vercel configuration

Create or select the provider application in Passport settings, enable it for one pilot project, and record prior deployment-protection configuration. A team default applies to new projects; assign existing projects separately.

## Application identity

Read `x-vercel-oidc-passport-token` only in server-side code. Use issuer plus `external_sub` for local identity and apply application authorization independently. Do not log or send the raw token to a client.

## Verification

Test signed out, assigned, unassigned, unknown local identity, forbidden local role, expired session, and direct deployment URL. Verify rollback before bulk assignment.

## Report

List team, provider, scopes, pilot project, protected deployments, identities by role, server mapping, checks, and rollback without secrets or personal claims.
