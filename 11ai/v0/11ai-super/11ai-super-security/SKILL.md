---
name: 11ai-super-security
description: "Audit, remediate, and harden a software project's security through repeated evidence-based review and verification. Always fetches and pulls the latest repository changes, permits a conflict-free upstream merge when fast-forwarding is impossible, requires a clean Git tree before editing, restores its changes if the operation becomes unsafe or troubleshooting-heavy, and commits or pushes with Conventional Commits only when explicitly instructed. Use when Codex needs to perform a security audit or secure-code review, fix vulnerabilities, address critical/high/major security findings, harden authentication, authorization, APIs, dependencies, secrets, deployment configuration, or production-facing web controls, and continue improving the project until it meets a high-confidence security bar."
---

# 11ai Super Security

Synchronize the repository and establish a clean rollback point first. Then audit the project as an attacker and a defender, fix every confirmed critical and high-severity issue within scope, verify each remediation, and repeat with fresh review lenses until the exit criteria are met. Do not equate one clean scanner run with a secure project.

Read [references/security-review.md](references/security-review.md) before auditing. Use its severity rubric, coverage matrix, and verification guidance.

## Non-negotiable boundaries

- Work only on code, configuration, infrastructure definitions, and environments the user has placed in scope.
- Refuse to edit unless the repository has been fetched, pulled or cleanly merged with its upstream when necessary, and confirmed clean. Never stash, discard, or overwrite pre-existing work to manufacture a clean starting state.
- Track every file created or changed by the audit. Preserve concurrent or unrelated work and never use blanket destructive cleanup commands.
- Do not commit or push unless the user explicitly requests that exact action in the current session. Defer any authorized commit or push until the audit and all verification are complete.
- Do not deploy, alter live data, rotate credentials, rewrite Git history, or change external service settings unless the user explicitly authorizes that action.
- Treat production as read-only by default. Never brute-force, fuzz, exploit, enumerate private data, submit destructive payloads, or run an active scanner against a live origin without explicit authorization and a defined scope.
- Never print secret values. Redact evidence and command output. If a real credential is exposed, remove it from current code, prevent recurrence, and clearly identify revocation/rotation and possible history cleanup as urgent external follow-ups.
- Prefer root-cause fixes, deny-by-default behavior, least privilege, maintained libraries, and framework-native security controls. Do not silence scanners, weaken tests, or add blanket exceptions to obtain a clean report.
- Do not claim that the project is "secure" in absolute terms. State what was inspected, tested, fixed, and what remains unverified.

## Workflow

### 0. Sync and require a clean starting state

Complete this gate before reading deeply, installing dependencies, running mutating commands, or editing any file:

1. Confirm the current directory belongs to the intended Git repository. Run `git status --porcelain`. If it returns any tracked, staged, or untracked change, stop and report the dirty paths. Do not stash, discard, commit, or absorb them into the audit.
2. Record the current branch, upstream, and `git rev-parse HEAD` as `SYNC_START_HEAD`. Run `git fetch --prune`, then try `git pull --ff-only` on the current branch. If the repository is detached, has no usable upstream, or the fetch fails, stop before editing and report the blocker.
3. If the fast-forward pull fails only because the local and upstream branches have diverged, merge the fetched upstream into the current branch with `git merge --no-edit @{upstream}`. A conflict-free merge commit is explicitly allowed as part of synchronization even when the user did not request an audit-results commit. Do not amend, squash, or rewrite that merge.
4. If the merge reports conflicts, do not resolve them as part of this skill. Run `git merge --abort`, verify that `HEAD` equals `SYNC_START_HEAD` and `git status --porcelain` is empty, then stop and report the conflict. If aborting fails, preserve the repository state and report it immediately.
5. Run `git status --porcelain` after the pull or merge. Continue only if it is empty. Record `git rev-parse HEAD` as `ROLLBACK_HEAD` and record whether synchronization fast-forwarded or created a merge commit.
6. Maintain a change manifest containing every tracked path modified and every untracked path created during the security routine. Update it after each remediation batch.

The post-pull `ROLLBACK_HEAD` and clean tree are the exact local state to restore if the operation aborts. Do not begin the security routine without both.

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
2. Add a regression test that fails on the vulnerable behavior when practical. Never commit live credentials, weaponized public exploits, or sensitive production data as fixtures.
3. Apply the smallest complete root-cause fix. Enforce controls server-side and at every privileged boundary; client-side checks are only usability controls.
4. Update configuration, environment examples, lockfiles, and focused documentation when they form part of the fix.
5. Run the regression test and the narrowest relevant validation immediately. Inspect the diff before moving to the next batch.

For vulnerable dependencies, prefer the smallest maintained compatible version that resolves the advisory. Verify the resolved lockfile version and behavior. Do not use force flags, delete lockfiles, or accept breaking upgrades blindly. If no safe upgrade exists, remove the dependency, disable the reachable feature safely, add a proven mitigation, or document a blocker with compensating controls.

### 5. Verify the whole project

After each remediation batch:

1. Re-run focused security tests and the scanner or audit that found the issue.
2. Run the affected package's lint, typecheck, tests, and build using repository-native commands.
3. Re-review neighboring call sites and alternate routes for bypasses, encoding mistakes, fail-open behavior, race conditions, and cross-tenant variants.
4. Re-scan the final diff for secrets, debug endpoints, weakened checks, overbroad permissions, unsafe suppressions, and accidental unrelated edits.
5. Attribute any failure as introduced, pre-existing, environment-dependent, or blocked. Fix introduced failures before continuing.

After each batch, compare `git status --porcelain` with the change manifest. Any unexplained path is an abort signal until ownership is established.

### 6. Continue with fresh security passes

Do not stop after the first remediation pass. Repeat the audit using a different lens:

- First fresh pass: attacker paths across trust boundaries, privilege changes, and sensitive data flows.
- Second fresh pass: defensive controls, deployment defaults, dependency/supply-chain state, observability, and regression coverage.
- After any new critical or high finding, fix it and restart the clean-pass count.
- Continue addressing high-value medium findings when the fix is safe, scoped, and verifiable.

Finish only when two consecutive fresh passes find no new confirmed critical or high issue and all exit criteria below are satisfied. Avoid endless cosmetic hardening: record low-risk residual items once further changes have diminishing security value or would require a product decision.

### 7. Abort and restore the clean state when necessary

Abort instead of pushing through when any of these occurs:

- the diff contains unexpected, unrelated, or unowned changes;
- the change set becomes too broad to review confidently or no longer maps clearly to confirmed findings;
- the same tooling, environment, build, or dependency problem consumes more than two focused troubleshooting attempts without material security progress;
- debugging and repair work starts to outweigh the security audit itself;
- safe remediation requires destructive production activity, missing authority, or an unapproved product/architecture change.

On abort:

1. Stop running tools and inspect `git status --porcelain` against the change manifest.
2. If every change belongs to this session, restore tracked paths from `ROLLBACK_HEAD` with path-scoped `git restore --source="$ROLLBACK_HEAD" --staged --worktree -- <paths>`, then remove only untracked paths recorded as created by this session.
3. Never use `git reset --hard`, blanket `git restore .`, blanket `git clean`, or any command that can erase an unowned or concurrent change.
4. If an unexplained concurrent change exists, preserve it. Restore only manifest-owned paths, report the remaining path, and do not falsely claim the tree is clean.
5. Verify that `git rev-parse HEAD` still equals `ROLLBACK_HEAD` and `git status --porcelain` is empty. If either check fails, report the exact difference and stop.
6. End with the session summary, including the abort trigger and restoration result.

Do not create audit-results commits during the audit, even when the user requested one, because commits complicate safe rollback. The conflict-free synchronization merge described in step 0 is the sole exception. Commit audit results only after every exit criterion passes.

### 8. Commit and push only when explicitly instructed

By default, leave successful security changes uncommitted for review.

If the user explicitly requests a commit after the audit succeeds:

1. Stage only paths in the change manifest and inspect the staged diff.
2. Use a focused Conventional Commit such as `fix(security): enforce tenant authorization` or `chore(security): update vulnerable runtime dependencies`.
3. Confirm the commit succeeded and the worktree has the expected state.

Push only if the user explicitly requests a push in the current session. Push the current branch without force. If the push is rejected or requires conflict resolution, stop and report it; never force-push or rewrite history as part of this skill.

## Exit criteria

All of the following must be true before declaring the audit complete:

- No confirmed unresolved critical or high-severity finding remains in the authorized scope.
- Every relevant deployable dependency set has been audited; exploitable critical/high advisories are fixed, removed, mitigated with evidence, or explicitly blocked.
- Authentication, authorization, tenant isolation, privileged actions, and untrusted-input paths have focused verification appropriate to the project.
- The final relevant lint, typecheck, test, build, and security checks pass, or pre-existing/environmental failures are clearly separated with evidence.
- No secret, sensitive fixture, debug bypass, weakened control, unsafe suppression, or unrelated edit was introduced.
- Every changed or created path appears in the session change manifest, the final diff has been manually reviewed, and two consecutive fresh passes produced no new critical/high finding.
- Residual risk, untested surfaces, production-only settings, and external actions are explicit. A blocker is not a pass.

If a critical/high issue cannot be safely remediated without new authority, missing credentials, an external service change, a breaking product decision, or destructive production activity, stop that path, reduce exposure locally where safe, and report the exact blocker and recommended containment. Continue auditing other in-scope surfaces that are not blocked.

## Session summary

Always end with a concise session summary, whether the operation succeeded, blocked, or aborted. Lead with the security outcome, then report:

- starting branch, `SYNC_START_HEAD`, post-sync `ROLLBACK_HEAD`, fetch/pull/merge result, and clean-start confirmation;
- critical/high findings fixed, with affected files, impact, remediation, and verification;
- material defense-in-depth improvements;
- commands and tests run, including any production checks and their limits;
- remaining findings, residual risk, blockers, and required external actions such as secret rotation or deployment;
- final Git state and the audit's changed files;
- commit and push status, explicitly stating when neither was requested;
- for an abort, the trigger, paths reverted, final `HEAD`, and whether the clean state was fully restored.

Use precise language: `fixed locally`, `verified by test`, `not deployed`, `production not checked`, or `blocked by external configuration`. Never expose a secret in the report.
