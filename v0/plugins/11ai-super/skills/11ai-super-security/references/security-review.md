# Security Review Reference

Use this reference as a coverage guide, not a substitute for project-specific threat modeling. Prefer the latest stable OWASP ASVS, OWASP Cheat Sheet Series, vendor advisories, and platform documentation when exact requirements are time-sensitive.

## Contents

- [Severity and prioritization](#severity-and-prioritization)
- [Audit coverage matrix](#audit-coverage-matrix)
- [Automated evidence](#automated-evidence)
- [Manual review method](#manual-review-method)
- [Production-safe checks](#production-safe-checks)
- [Verification patterns](#verification-patterns)
- [Common false confidence](#common-false-confidence)

## Severity and prioritization

Use CVSS v4 as an input when a score is useful, not as the sole decision. Combine exploitability, privileges, user interaction, exposure, data sensitivity, blast radius, business impact, compensating controls, reachability, and evidence of active exploitation. Prioritize vulnerabilities listed in CISA's Known Exploited Vulnerabilities catalog when the affected component and path are present.

Treat a tool's `major` category as high priority unless that tool defines it differently. Preserve the tool's original label in the finding ledger and record how it maps to the rubric below.

### Critical

Likely or demonstrated compromise of the whole service, production environment, privileged control plane, or a large body of sensitive data with little attacker friction. Examples include:

- unauthenticated remote code execution or command injection on an internet-facing path;
- authentication bypass granting administrative or cross-tenant control;
- exposed production credentials that enable high-impact system access;
- broadly reachable injection that permits sensitive database extraction or destructive writes;
- insecure update/build mechanisms enabling supply-chain execution for users or production.

### High

Serious confidentiality, integrity, or availability impact that is realistically exploitable but has more constraints or a narrower blast radius than critical. Examples include:

- horizontal or vertical authorization bypass involving sensitive records or privileged actions;
- stored XSS affecting administrators, session theft, or meaningful account takeover;
- SSRF reaching cloud metadata, internal control planes, or credential-bearing services;
- destructive CSRF, insecure password reset, token validation failure, or long-lived session compromise;
- reachable critical/high dependency advisory in production code;
- tenant data leakage, unsafe file upload, path traversal, or sensitive cache poisoning.

### Medium

Meaningful weakness requiring additional access, interaction, chaining, unusual configuration, or limited impact. Examples include missing rate limits on abuse-prone operations, reflected XSS with constraints, information disclosure useful for chaining, overly broad CORS without credentials, or incomplete hardening on a sensitive path.

### Low / informational

Limited practical impact, hygiene gaps, or defense-in-depth improvements. Examples include low-value banner disclosure, redundant headers, or a best-practice improvement with no demonstrated attack path.

Do not lower severity merely because exploitation has not been attempted. Do not raise it based only on a tool label. Record the evidence and assumptions behind the rating.

## Audit coverage matrix

### 1. Architecture and trust boundaries

- Identify all public interfaces: pages, APIs, RPC, GraphQL, WebSockets, webhooks, callbacks, file imports, workers, queues, cron jobs, CLIs, admin surfaces, and health/debug endpoints.
- Mark where browser, user, tenant, third-party, model-generated, file, and network data becomes trusted.
- Identify crown jewels: credentials, personal data, payment data, private content, model/provider keys, administrative actions, build/publish rights, and backups.
- Verify each trust transition has authentication, authorization, validation, and safe failure behavior appropriate to its risk.

### 2. Secrets, configuration, and supply chain

- Check tracked `.env*` files, examples, source maps, client-exposed environment variables, fixtures, logs, screenshots, generated output, Docker layers, CI files, and package scripts.
- Distinguish placeholders from working credentials without revealing values. Treat client-side bundles and public environment-variable prefixes as public.
- Verify secrets are obtained at runtime from an appropriate store, scoped minimally, never logged, and rotatable.
- Inspect lockfiles, registries, install hooks, lifecycle scripts, Git dependencies, unpinned actions/images, package provenance, typo-squatting risk, and abandoned libraries.
- Review CI tokens, workflow triggers, pull-request trust, artifact permissions, cache poisoning, branch protection assumptions, and release/publish credentials.

### 3. Authentication and sessions

- Verify identity on the server using maintained framework/provider libraries; never trust user IDs, roles, email verification, or organization IDs supplied by the client.
- Validate OIDC/OAuth issuer, audience, signature, expiry, state, nonce, PKCE, and redirect URI as applicable. Reject algorithm/key confusion and untrusted callback targets.
- Review signup, login, logout, password reset, email change, account linking, invitation, MFA/passkey recovery, impersonation, and reauthentication flows.
- Use secure, HttpOnly, appropriately scoped SameSite cookies over TLS. Rotate sessions after login or privilege change; invalidate them on logout and security-sensitive account changes.
- Prevent account enumeration where it materially increases risk. Apply throttling and abuse controls without creating trivial denial of service.

### 4. Authorization and tenant isolation

- Enforce authorization server-side on every object and action, including indirect routes, downloads, exports, search, batch APIs, background jobs, and WebSockets.
- Default deny. Derive actor and tenant context from the verified session, not request parameters.
- Test horizontal access with two same-role users in different tenants and vertical access across roles. Cover read, create, update, delete, list, metadata, and side-channel behavior.
- Recheck authorization after resolving indirect identifiers and immediately before sensitive state changes. Avoid time-of-check/time-of-use gaps.
- Keep administrative, support, impersonation, billing, and organization-transfer actions explicit, narrow, logged, and reauthenticated where warranted.

### 5. Input, output, and server-side execution

- Trace every untrusted value to database, shell, template, HTML/DOM, URL, filesystem, parser, deserializer, regular expression, email, log, and response-header sinks.
- Use parameterized queries and structured APIs. Avoid constructing SQL/NoSQL queries, shell commands, templates, or paths with string concatenation.
- Validate type, length, range, format, cardinality, and business invariants at the server boundary. Use allowlists when the value space is known.
- Apply context-specific output encoding. Sanitize only when rich content is required; do not treat generic filtering as a substitute for safe sinks.
- Protect URL fetchers against SSRF with scheme/host/port allowlists, DNS and redirect revalidation, private/link-local/metadata address blocking, network egress controls, and response limits.
- Constrain uploads by size, count, content, extension, storage location, generated name, access control, and downstream parser behavior. Never execute or serve active content from a trusted origin by accident.
- Normalize and anchor filesystem paths; reject traversal and symlink escapes. Bound decompression, parsing, recursion, regex, and payload size to prevent resource exhaustion.
- Verify webhook signatures against the raw body, enforce timestamp/replay windows, and make state-changing processing idempotent.

### 6. Browser, API, and transport controls

- Apply CSRF protection to cookie-authenticated state changes. Do not use GET for mutations.
- Keep CORS origins explicit. Never combine arbitrary reflected origins with credentials. Scope methods and headers narrowly.
- Establish a practical Content Security Policy and clickjacking defense for web surfaces; avoid unsafe allowances unless evidence shows they are required.
- Set secure caching rules for personalized or sensitive responses. Prevent shared-cache confusion and authenticated data from entering public caches.
- Use TLS and validate upstream certificates/hostnames. Inspect HSTS, content type sniffing, referrer policy, permissions policy, and cookie attributes in deployed responses when relevant.
- Bound pagination, query cost, body size, concurrency, and expensive endpoints. Apply actor-aware rate limits to login, reset, invitations, messaging, uploads, exports, AI usage, and financial actions.
- Review WebSocket origin/authentication, reconnect behavior, per-message authorization, and subscription isolation.

### 7. Data protection and cryptography

- Minimize collection and retention of sensitive data. Verify deletion/export workflows, backups, analytics, telemetry, and third-party sharing.
- Keep sensitive data out of URLs, client storage, logs, error messages, cache keys, and model prompts unless explicitly required and protected.
- Use modern maintained cryptographic libraries and platform primitives. Never invent encryption, signing, password hashing, nonce generation, or key derivation.
- Use cryptographically secure randomness and purpose-specific keys. Verify key scope, storage, versioning, rotation, and fail-closed behavior.
- Compare secrets with safe library functions where timing matters. Verify signatures before trusting claims; encryption alone does not establish authenticity.

### 8. Infrastructure, deployment, and operations

- Run as non-root with minimal filesystem, network, cloud, database, and service permissions. Remove debug/profiling/admin interfaces from public exposure.
- Inspect container base images, exposed ports, health endpoints, serverless permissions, storage policies, database rules, infrastructure-as-code defaults, and environment separation.
- Keep development fallbacks from activating in production. Fail closed when required secrets, issuers, origins, or policies are missing.
- Ensure errors sent to clients are generic while server logs retain useful redacted context. Avoid logging tokens, cookies, passwords, authorization headers, private prompts, or sensitive records.
- Confirm security-significant events are auditable: login/recovery, role changes, key changes, organization transfers, exports, destructive actions, and repeated authorization failures.

### 9. Business logic and abuse

- Model how an attacker can gain money, quota, influence, access, or denial of service without violating a schema.
- Check duplicate/replayed requests, negative or extreme values, race conditions, coupon/credit reuse, state-machine skips, confused-deputy flows, invitation abuse, and ownership transfer.
- Bind approvals and transaction authorization to the exact action and values being approved. Recheck authorization at execution.
- Treat email, background jobs, webhooks, and asynchronous steps as attacker-controlled reorder/retry boundaries.

### 10. AI and agent systems, when present

- Treat model output, retrieved content, tool results, and indirect instructions as untrusted data.
- Keep system prompts and hidden metadata from becoming authorization controls or secret stores.
- Enforce tool permissions, tenant scope, parameter validation, budgets, and confirmation outside the model. The model must not be able to grant itself authority.
- Separate retrieval indexes and caches by tenant and authorization context. Prevent cross-user prompt, conversation, attachment, and vector-store leakage.
- Constrain rendered model output against XSS, unsafe Markdown/URL handling, data exfiltration, and automatic action execution.
- Test prompt injection and tool-confusion paths locally with benign canaries; do not insert sensitive production data into prompts.

## Automated evidence

Select commands from repository manifests and installed tooling. Use the project's package manager and avoid global installs unless necessary and authorized.

- JavaScript/TypeScript: use the package manager's audit command, resolved lockfile inspection, existing lint/typecheck/tests, and configured SAST or secret scanning. For npm production exposure, `npm audit --omit=dev` is often more relevant than an undifferentiated report.
- Python: inspect resolved dependencies and use an existing `pip-audit`, `uv`, Poetry, or environment-native audit flow when available.
- Rust: use existing Cargo checks and `cargo audit` when installed or project-standard.
- Go: use `go test`, `go vet`, and an existing `govulncheck` workflow when available.
- Ruby, PHP, Java, .NET, mobile, and infrastructure projects: use their lockfile-aware, ecosystem-supported audit and test tooling.
- Containers and infrastructure: prefer existing repository scanners and linters; verify findings against the actual deployed/base-image version.

Run tools per deployable workspace when monorepo commands do not cover every lockfile. Capture versions and command results. A tool that failed to execute is not a passing check.

## Manual review method

1. Start at each untrusted boundary and trace data to sensitive sinks.
2. Start at each privileged action or sensitive record and trace backward to identity and authorization enforcement.
3. Search for alternate entry points, shared helpers, direct database calls, bypass flags, fallback branches, and client-only checks.
4. Review negative paths: missing/expired tokens, wrong tenant, wrong role, malformed values, duplicate requests, provider outage, partial failure, and concurrent execution.
5. Read tests to learn intended invariants, then add adversarial cases for missing enforcement.
6. Inspect the final diff as a new attack surface, not merely as confirmation of the intended fix.

## Production-safe checks

Only perform low-rate, non-mutating checks against a production origin unless the user explicitly authorizes more. Suitable checks include:

- ordinary `HEAD` or `GET` requests to public pages;
- redirect and HTTPS behavior;
- response security, caching, CORS, and content-type headers;
- cookie flags generated during a normal user-authorized flow without exposing cookie values;
- public source-map or debug artifact availability where checking requires no enumeration or exploitation.

Do not create accounts, trigger password resets, submit forms, probe hidden paths, vary identifiers, test injection payloads, stress rate limits, or inspect another user's data without explicit authorization. If active testing is approved, agree on origin, accounts, paths, rate, time window, and prohibited actions first.

## Verification patterns

- Authorization: use two users/tenants and at least one higher role; assert both allowed and denied operations at the server boundary.
- Injection: test malicious metacharacters as inert data locally and assert the sink uses structured parameters.
- XSS: test rendering with benign payload markers and verify contextual encoding or a maintained sanitizer.
- CSRF: assert missing/invalid tokens or origins fail while legitimate requests pass.
- SSRF: assert disallowed schemes, redirects, loopback, private, link-local, metadata, encoded, and DNS-rebinding-relevant cases are rejected before network access.
- Uploads: test size, count, MIME/extension disagreement, traversal names, active content, parser failure, and unauthorized retrieval.
- Sessions/tokens: test expiry, issuer/audience, logout invalidation, privilege-change rotation, replay boundaries, and cookie attributes.
- Dependencies: verify the fixed version in the resolved lockfile, rerun the advisory check, and exercise the affected feature.
- Secrets: verify the value is absent from tracked/current artifacts and ignored going forward; separately identify rotation and history-remediation status.

## Common false confidence

- A clean dependency audit does not cover first-party code, business logic, cloud configuration, or untracked runtime components.
- A high scanner score does not prove reachability or impact; a low score does not make an exposed credential safe.
- Client-side route guards, hidden buttons, TypeScript types, schemas used only in the browser, and UI role checks are not server authorization.
- Escaping, validation, sanitization, parameterization, and authorization solve different problems and are not interchangeable.
- Security headers do not compensate for broken access control or injection.
- Removing a secret from the current file does not revoke it or erase Git history, caches, build artifacts, logs, or deployed bundles.
- Local success does not prove production configuration or deployment state.
- Adding a test that mirrors the implementation without exercising the security boundary does not prove the vulnerability is fixed.
