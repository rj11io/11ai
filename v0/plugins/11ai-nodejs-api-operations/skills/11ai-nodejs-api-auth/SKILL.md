---
name: 11ai-nodejs-api-auth
description: "Add, inspect, or troubleshoot authentication and authorization for Node.js APIs using existing API-key, bearer-token, JWT, session, or framework middleware patterns. Use when an endpoint needs protection, returns 401 or 403 unexpectedly, or authentication behavior must be reviewed without exposing credentials."
---

# 11ai Node.js API authentication

Authentication is a security-sensitive public contract. Identify the existing identity provider, token format, middleware order, claims, audience/issuer rules, key source, and authorization model before changing code. Never ask the user to paste a secret and never print credentials while diagnosing.

## Distinguish the decisions

- **Authentication** answers who the caller is: API key, bearer token, JWT, session, mTLS, or another mechanism.
- **Authorization** answers whether that identity may perform this action on this resource.
- `401` normally means credentials are missing or invalid; `403` normally means valid identity without permission. Follow the project's established contract.

Inspect whether the route uses global middleware, a router guard, a decorator, or an explicit handler check. Verify the middleware runs before validation or business side effects when the project requires that order.

## Implement or review

1. Reuse the established verification library and key/configuration path. Do not write cryptography or JWT parsing from scratch.
2. Keep secrets in the project's approved secret or environment mechanism. Do not put tokens in source, URLs, Git history, shell history, snapshots, or logs.
3. For JWTs, verify the signature and expected algorithm, issuer, audience, expiry, not-before, and required claims. Do not trust decoded payloads before verification.
4. For API keys, compare safely using the project's supported approach, store only a hash when the system supports key management, and define rotation/revocation behavior.
5. Enforce authorization at the resource/action boundary. Never rely only on a client-supplied user ID, role, or tenant ID.
6. Return safe failure responses that do not reveal whether a protected resource exists when that would create an information leak.
7. Add tests for missing, malformed, expired, wrong-audience, revoked, insufficient-role, and valid credentials. Use test-only keys or fixtures.

## Troubleshoot without secrets

Collect the route, method, status, middleware order, safe claim names, token source, key identifier, clock/time-zone context, and server logs with values redacted. Compare the token's non-secret metadata to verifier expectations. Do not decode or paste a production token into chat; a locally generated test token or redacted header is enough.

## Reporting

State the auth mechanism, protected routes, verification rules, authorization decision, safe error behavior, tests, and any compatibility or rollout concern. If credentials, key rotation, identity-provider configuration, or production access is required, stop at the code/config boundary and name the external prerequisite.
