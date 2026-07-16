---
name: 11ai-super-security
description: "Audit, remediate, and harden a software project's security through repeated evidence-based review and verification. Use when Codex needs to perform a security audit or secure-code review, fix vulnerabilities, address critical/high/major security findings, harden authentication, authorization, APIs, dependencies, secrets, deployment configuration, or production-facing web controls, and continue improving the project until it meets a high-confidence security bar. Stops and reports when the change set becomes unmanageable or troubleshooting outweighs progress."
---

# 11ai Super Security

Audit the project as an attacker and a defender, fix every confirmed critical and high-severity issue within scope, verify each remediation, and repeat with fresh review lenses until the exit criteria are met. Do not equate one clean scanner run with a secure project.

Read [references/security-review.md](references/security-review.md) before auditing. Use its severity rubric, coverage matrix, and verification guidance.

## Non-negotiable boundaries

- Work only on code, configuration, infrastructure definitions, and environments the user has placed in scope.
- Keep a session change manifest — every file this session creates, modifies, renames, or deletes — and reconcile it after every batch. Preserve concurrent or unrelated work and never use blanket destructive cleanup commands.
- Do not deploy, alter live data, rotate credentials, or change external service settings unless the user explicitly authorizes that action.
- Treat production as read-only by default. Never brute-force, fuzz, exploit, enumerate private data, submit destructive payloads, or run an active scanner against a live origin without explicit authorization and a defined scope.
- Never print secret values. Redact evidence and command output. If a real credential is exposed, remove it from current code, prevent recurrence, and clearly identify revocation/rotation and possible history cleanup as urgent external follow-ups.
- Prefer root-cause fixes, deny-by-default behavior, least privilege, maintained libraries, and framework-native security controls. Do not silence scanners, weaken tests, or add blanket exceptions to obtain a clean report.
- Do not claim that the project is "secure" in absolute terms. State what was inspected, tested, fixed, and what remains unverified.

## Workflow

### 1. Establish context and attack surface

1. Read repository guidance, all relevant READMEs, manifests, lockfiles, environment examples, deployment definitions, CI workflows, entry points, and existing security tooling.
2. Map the project's languages, frameworks, package managers, applications, trust boundaries, public endpoints, authentication flows, roles, tenant boundaries, sensitive data, privileged operations, third-party integrations, background jobs, and deployment targets.
3. Identify and run the project's normal lint, typecheck, test, build, and existing security commands before editing. Record pre-existing code, tooling, or environment failures so they are not misattributed to the security work.
4. Build a finding ledger containing severity, affected asset, evidence, attack preconditions, impact, proposed fix, verification, and status. Keep secret material redacted. The ledger may remain in working notes unless the user requests an artifact.

### 2. Find a production origin only when it adds evidence

If a production-origin check is useful, look for the canonical URL in repository READMEs before using any other source:

```sh
rg -n -i 'https?://|production|deployed|live|origin|site' --glob 'README*'
```

Distinguish the application origin from documentation links, badges, preview deployments, API examples, and local URLs. Confirm it matches the project's identity. If the READMEs do not identify one unambiguously, ask the user or skip the production check; do not guess.

Limit unapproved production checks to ordinary, low-rate, non-mutating requests needed to inspect public behavior, redirects, TLS, cookies, caching, CORS, and security headers. Never infer that deployed configuration matches local code, or that local fixes are live before deployment is verified.

### 3. Run the first audit pass

Use both automated evidence and manual data-flow review:

1. Run the repository's existing security checks and ecosystem-native dependency audit for every lockfile or deployable package. Separate runtime exposure from development-only findings.
2. Check tracked files, examples, generated artifacts, client bundles, logs, and configuration for exposed secrets or sensitive data without echoing candidate values.
3. Trace untrusted input from every public boundary to security-sensitive sinks. Inspect authentication, session handling, authorization, tenant isolation, database access, command execution, rendering, URL fetching, file handling, deserialization, redirects, webhooks, and outbound integrations.
4. Review infrastructure, CI/CD, deployment, runtime permissions, security headers, CORS, caching, error handling, logging, rate limits, and dependency provenance.
5. Review business-logic abuse paths. For AI-enabled systems, also review prompt/data boundaries, retrieval isolation, tool authorization, output handling, and secret exposure.
6. Use current official advisories and vendor documentation when a vulnerability, package version, or security control is time-sensitive. Give known exploitation and demonstrated reachability more weight than a scanner score alone.

Do not report a scanner result as confirmed until package resolution, affected-version range, reachable functionality, environmental controls, and actual impact have been assessed. Do not dismiss a result without equally concrete evidence.

### 4. Prioritize and remediate

Fix confirmed critical issues first, then high issues, then the most consequential medium issues and low-cost defense-in-depth gaps.

For each critical or high finding:

1. Reproduce or establish the vulnerable path with the least risky evidence possible. Prefer source analysis and a focused local test over exploit activity.
2. Add a regression test that fails on the vulnerable behavior when practical. Never add live credentials, weaponized public exploits, or sensitive production data as fixtures.
3. Apply the smallest complete root-cause fix. Enforce controls server-side and at every privileged boundary; client-side checks are only usability controls.
4. Update configuration, environment examples, lockfiles, and focused documentation when they form part of the fix.
5. Run the regression test and the narrowest relevant validation immediately. Review the batch's complete set of changes before moving to the next batch.

For vulnerable dependencies, prefer the smallest maintained compatible version that resolves the advisory. Verify the resolved lockfile version and behavior. Do not use force flags, delete lockfiles, or accept breaking upgrades blindly. If no safe upgrade exists, remove the dependency, disable the reachable feature safely, add a proven mitigation, or document a blocker with compensating controls.

### 5. Verify the whole project

After each remediation batch:

1. Re-run focused security tests and the scanner or audit that found the issue.
2. Run the affected package's lint, typecheck, tests, and build using repository-native commands.
3. Re-review neighboring call sites and alternate routes for bypasses, encoding mistakes, fail-open behavior, race conditions, and cross-tenant variants.
4. Re-scan the complete set of changes for secrets, debug endpoints, weakened checks, overbroad permissions, unsafe suppressions, and accidental unrelated edits.
5. Attribute any failure as introduced, pre-existing, environment-dependent, or blocked. Fix introduced failures before continuing.

After each batch, reconcile the session change manifest with the project's actual changes. Any unexplained path is an abort signal until ownership is established.

### 6. Continue with fresh security passes

Do not stop after the first remediation pass. Repeat the audit using a different lens:

- First fresh pass: attacker paths across trust boundaries, privilege changes, and sensitive data flows.
- Second fresh pass: defensive controls, deployment defaults, dependency/supply-chain state, observability, and regression coverage.
- After any new critical or high finding, fix it and restart the clean-pass count.
- Continue addressing high-value medium findings when the fix is safe, scoped, and verifiable.

Finish only when two consecutive fresh passes find no new confirmed critical or high issue and all exit criteria below are satisfied. Avoid endless cosmetic hardening: record low-risk residual items once further changes have diminishing security value or would require a product decision.

### 7. Abort when work becomes unsafe

Abort instead of continuing when any of these occurs:

- the project gains unexpected, unrelated, or unowned changes;
- the change set becomes too broad to review confidently or no longer maps clearly to confirmed findings;
- the same tooling, environment, build, or dependency problem consumes more than two focused troubleshooting attempts without material security progress;
- debugging and repair work starts to outweigh the security audit itself;
- safe remediation requires destructive production activity, missing authority, or an unapproved product/architecture change.

On abort:

1. Stop running tools and processes started by the session and capture the failure evidence and abort reason for the summary.
2. Compare the project's current state with the session change manifest. Preserve any path whose ownership is uncertain.
3. Stop the audit and return the required aborted-session summary, listing exactly which session changes remain in place. Do not immediately restart the audit.

## Exit criteria

All of the following must be true before declaring the audit complete:

- No confirmed unresolved critical or high-severity finding remains in the authorized scope.
- Every relevant deployable dependency set has been audited; exploitable critical/high advisories are fixed, removed, mitigated with evidence, or explicitly blocked.
- Authentication, authorization, tenant isolation, privileged actions, and untrusted-input paths have focused verification appropriate to the project.
- The final relevant lint, typecheck, test, build, and security checks pass, or pre-existing/environmental failures are clearly separated with evidence.
- No secret, sensitive fixture, debug bypass, weakened control, unsafe suppression, or unrelated edit was introduced.
- The complete change set is intentional, reviewable, and limited to the session change manifest, and two consecutive fresh passes produced no new critical/high finding.
- Residual risk, untested surfaces, production-only settings, and external actions are explicit. A blocker is not a pass.

If a critical/high issue cannot be safely remediated without new authority, missing credentials, an external service change, a breaking product decision, or destructive production activity, stop that path, reduce exposure locally where safe, and report the exact blocker and recommended containment. Continue auditing other in-scope surfaces that are not blocked.

## Session summary

Always end with a concise session summary, whether the operation succeeded, blocked, or aborted. Lead with the security outcome, then report:

- critical/high findings fixed, with affected files, impact, remediation, and verification;
- material defense-in-depth improvements;
- commands and tests run, including any production checks and their limits;
- remaining findings, residual risk, blockers, and required external actions such as secret rotation or deployment;
- final state of the session's changes: the complete manifest of paths created, modified, or deleted;
- for an abort: trigger, which session changes remain in place, and any path preserved because its ownership was uncertain.

Use precise language: `fixed locally`, `verified by test`, `not deployed`, `production not checked`, or `blocked by external configuration`. Never expose a secret in the report.
