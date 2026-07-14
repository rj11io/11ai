---
name: 11ai-super-bugfixing
description: "Synchronize a clean Git repository from origin, allowing an automatic conflict-free merge of incoming changes when fast-forwarding is impossible, then continuously inspect, reproduce, prioritize, fix, verify, and re-audit software defects until the project reaches a high-confidence quality bar. Use when Codex must find and fix bugs across a project, debug failing tests or builds, eliminate regressions, repair runtime, type, API, data, integration, UI, state, concurrency, or resource-lifecycle errors, or keep hunting for additional defects after a known bug is resolved. Abort and restore session-owned changes when the diff becomes unsafe or troubleshooting outweighs progress. Commit or push only when explicitly instructed, using Conventional Commits."
---

# 11ai Super Bugfixing

## Mission

Find real defects, fix their root causes, prove the repairs, and keep inspecting with fresh lenses until no confirmed critical or major bug remains and further work has low evidence-based value.

Read [references/bug-finding-playbook.md](references/bug-finding-playbook.md) before inspecting for bugs. Use its evidence ladder, severity rubric, finding ledger, and audit lenses.

## Operating Rules

- Run the Git synchronization gate before inspecting implementation files, installing dependencies, starting services, or beginning the bug routine.
- Start only from a clean working tree. Never stash, discard, commit, or absorb pre-existing work to manufacture a clean state.
- Follow repository instructions and preserve the project's intended behavior, public contracts, security, accessibility, data integrity, and established architecture.
- When the user gives no narrower scope, inspect all first-party code and deployable packages in the current repository, prioritizing core workflows. Exclude dependencies, vendored code, generated or build output, and external systems.
- Treat a bug as an evidence-backed mismatch between actual and intended behavior, not a style preference, speculative smell, desired feature, or broad refactor opportunity.
- Reproduce a defect or establish strong code-level proof before changing behavior. Do not patch a symptom whose root cause remains unknown.
- Prefer the running system, deterministic tests, traces, rendered output, and real integration contracts over source-only assumptions.
- Never obtain a green result by weakening assertions, blindly updating snapshots, suppressing diagnostics, widening types, swallowing errors, disabling working behavior, or excluding failing paths.
- Keep fixes minimal and complete. Add regression coverage when practical and inspect neighboring consumers for the same defect class.
- Preserve unrelated and concurrent work. Maintain a session change manifest and reconcile every changed path after each batch.
- Treat production as read-only unless the user explicitly authorizes a narrowly scoped mutation. Do not fuzz, load-test, corrupt data, or exercise destructive paths on live systems.
- Honor audit-only requests by reporting reproducible findings without editing.
- Do not commit bug fixes or push unless explicitly instructed. A clean merge commit created solely to integrate incoming origin changes is the only automatic commit exception.
- Always end with the required session summary, including when stopped at preflight or aborted.

## Workflow

### 1. Synchronize and establish the rollback baseline

Complete this gate before the intended bug-fixing routine:

1. Locate the repository root and confirm the current directory belongs to the intended Git worktree.
2. Check for an in-progress merge, rebase, cherry-pick, revert, or bisect. Stop and report if one exists.
3. Require an attached current branch with an unambiguous configured upstream on `origin`. Do not guess, create, or retarget a branch, remote, or upstream. Record the branch, upstream, and current commit as `PRE_SYNC_HEAD`.
4. Run `git status --porcelain=v1 --untracked-files=all`. If it returns any entry, stop immediately and list the dirty paths. Do not stash, clean, restore, pull, or edit anything.
5. Run `git fetch origin --prune`. Stop and report authentication, network, missing-ref, or remote-configuration failures.
6. Run `git pull --ff-only origin <upstream-branch>`. If and only if it fails because the local and fetched upstream histories have diverged, verify the tree remains clean and run `git merge --no-edit <origin-upstream-ref>`.
7. Accept the synchronization merge only when it completes automatically without conflicts and leaves the index and working tree clean. If a conflict occurs, run `git merge --abort`, verify `HEAD` equals `PRE_SYNC_HEAD` and the tree is clean, then stop and report the conflict paths. Never resolve synchronization conflicts as part of this skill.
8. Do not rebase, autostash, squash, amend, force, rewrite history, or fall back to a merge for failures unrelated to branch divergence.
9. Re-run the complete clean-tree check and record the synchronized commit as `BASELINE_HEAD`. A clean incoming merge belongs to this baseline and must survive any later bug-work rollback.
10. Start a session change manifest containing every tracked path modified, renamed, or deleted and every untracked path created by this session.

A successful fetch is not a substitute for pulling the current origin upstream. Do not begin bug inspection unless synchronization completes and the post-sync tree is clean.

### 2. Establish intended behavior and the test surface

1. Read repository guidance, READMEs, manifests, lockfiles, entry points, schemas, API contracts, configuration, deployment definitions, and existing tests relevant to the requested scope.
2. Identify the project's primary workflows, public contracts, supported environments, important data invariants, and commands for lint, typecheck, test, build, and end-to-end verification.
3. Translate any reported symptom into exact reproduction steps, inputs, expected behavior, actual behavior, environment, frequency, and impact. Verify assumptions against code or product evidence.
4. Map representative happy paths, boundary values, failure paths, state transitions, roles, integrations, and lifecycle events. Prioritize core and irreversible workflows.
5. If a production origin adds useful evidence, find it in repository documentation and limit unapproved checks to ordinary low-rate, non-mutating behavior. Never guess an origin or assume local fixes are deployed.

If intended behavior is genuinely ambiguous and competing interpretations would materially change users, data, compatibility, or architecture, ask for the smallest missing decision. Continue inspecting unambiguous surfaces in the meantime.

### 3. Build a reproducible baseline and bug ledger

1. Run the project's normal lint, typecheck, tests, build, and existing diagnostic commands before editing when feasible.
2. Exercise representative workflows in the real application or closest reliable test environment. Capture console errors, failed requests, logs, stack traces, invalid states, and observable contract violations without exposing secrets.
3. Separate pre-existing tooling or environment failures from product defects and record both without conflating them.
4. Inspect systematically using the playbook's static, runtime, boundary, state, lifecycle, data, and regression lenses.
5. Record each candidate in a finding ledger with evidence strength, severity, affected surface, reproduction, expected and actual behavior, root-cause hypothesis, proposed verification, and status.
6. Confirm candidates before calling them bugs. Delete or downgrade findings disproved by tests, contracts, supported-environment policy, or intended product behavior.

Rank confirmed bugs by severity, user or system reach, frequency, irreversibility, confidence, and dependency order. Fix root causes that explain multiple symptoms before isolated manifestations.

### 4. Fix confirmed bugs in impact order

Resolve confirmed critical bugs first, then major bugs, then high-confidence moderate defects whose fixes are safe and proportionate.

For each bug:

1. Reduce it to the smallest reliable reproduction. Add a regression test that fails for the right reason before the fix when practical.
2. Trace the failing value, state, event, or control flow to the earliest incorrect assumption or invariant violation. Inspect sibling call sites and alternate paths for the same defect class.
3. State the root cause and the expected repair evidence in one concise sentence.
4. Apply the smallest complete fix at the correct ownership boundary. Preserve compatibility unless the user authorizes a breaking correction.
5. Run the focused reproduction or regression test and confirm it now passes for the intended reason.
6. Test nearby edge cases, alternate roles or states, error handling, and shared consumers. Run the broader relevant lint, typecheck, test, build, and integration checks as risk warrants.
7. Inspect `git status --short`, `git diff --stat`, `git diff --check`, and the scoped diff. Update the session change manifest and explain every path.

If a deterministic regression test is impractical, use the strongest available alternative evidence and state the limitation. Never invent a test that merely mirrors the implementation or passes before the defect is fixed.

### 5. Continue inspecting after each repair

Do not stop after the reported bug or first green test. Re-run the affected workflow, then start a fresh inspection from the repaired behavior:

```text
inspect -> reproduce -> rank -> fix -> verify -> inspect neighboring paths -> inspect again
```

Use meaningfully different lenses across fresh passes. At minimum:

1. **Deterministic correctness pass:** tests, types, build, static control/data flow, boundary values, and error branches.
2. **Runtime and integration pass:** representative workflows, state transitions, async timing, retries, cancellation, persistence, external contracts, and resource cleanup.
3. **Regression and saturation pass:** final diff, shared consumers, previously passing behavior, missing coverage, logs, and any remaining high-confidence defect signal.

When a pass reveals a new confirmed critical or major bug, add it to the ledger, fix it, verify it, and restart the clean-pass count. Continue addressing moderate bugs when their evidence is strong and the repair is scoped, safe, and verifiable. Stop speculative hunting when signals are weak or changes would become redesign work.

### 6. Apply the completion gate

Finish only when all of these are true:

- every originally reported bug is fixed and verified, or explicitly disproved or blocked with evidence
- no confirmed unresolved critical or major bug remains within the authorized scope
- each critical and major repair has focused regression evidence or a documented reason why automated coverage is impractical
- relevant lint, typecheck, tests, build, and representative workflows pass, apart from clearly separated pre-existing or environmental failures
- neighboring consumers, edge cases, failure paths, and state transitions show no regression introduced by the fixes
- two consecutive fresh inspection passes reveal no new confirmed critical or major bug
- further candidates are minor, weakly evidenced, externally blocked, or require a product or architecture decision
- the complete diff is intentional, reviewable, limited to the session manifest, and passes `git diff --check`

Do not claim the project is bug-free. Report the inspected surface, evidence, residual risk, and untested environments precisely. A blocked material bug is not a pass.

### 7. Abort and restore when work becomes unsafe

Abort instead of continuing when any of these occurs:

- the worktree gains unexpected, unrelated, unowned, or unexplained changes
- generated output, dependency churn, logs, caches, secrets, or artifacts make the diff too dirty to review confidently
- the change set grows beyond a coherent set of evidence-backed bug fixes
- two focused attempts on the same bug or tooling blocker fail without materially new evidence or progress
- troubleshooting, environment repair, or speculative debugging starts to outweigh confirmed bug work
- repeated regressions make correctness, security, data integrity, compatibility, or repository ownership uncertain
- safe completion requires destructive Git operations, history rewriting, force pushing, missing authority, or an unapproved product or architecture change

On abort:

1. Stop processes started by the session and capture status, scoped diff, failure evidence, and the abort reason for the summary.
2. Compare Git status with the session change manifest and preserve any path whose ownership is uncertain.
3. Confirm no bug-fix commit exists and `HEAD` still equals `BASELINE_HEAD`; bug-fix commits are deferred until completion.
4. Restore only session-owned tracked paths with `git restore --source="$BASELINE_HEAD" --staged --worktree -- <paths>`.
5. Remove only untracked files and directories explicitly recorded as created by this session. Never use blanket `git clean`, `git reset --hard`, blanket restore, force checkout, or history rewriting.
6. Verify `git rev-parse HEAD` equals `BASELINE_HEAD` and complete porcelain status is empty.
7. If concurrent or unexplained changes prevent full restoration, preserve them and report the exact paths. Do not risk user work or falsely claim a clean state.
8. Stop and return the required aborted-session summary. Do not immediately restart the routine.

### 8. Commit and push only when explicitly instructed

Run this section only after the completion gate and final diff review:

1. Confirm the current request explicitly authorizes a commit, a push, or both. Permission to fix bugs does not imply either; permission to commit does not imply push.
2. Stage only reviewed session-manifest paths and inspect the staged diff.
3. Use focused Conventional Commits, normally `fix(<scope>): <imperative summary>`. Split commits only when each repair is coherent and independently verified.
4. If commit alone was requested, stop after verifying the commit and report its hash.
5. Push only when explicitly requested, to the configured current-branch upstream, without force or upstream retargeting. Make push the final repository mutation.
6. If commit or push fails, do not amend, rebase, force, rewrite history, or enter extended troubleshooting. Preserve any successful local commit, report the exact state, and stop.

The synchronization merge from step 1 is exempt from bug-fix commit authorization because it only establishes the latest clean baseline. It never authorizes pushing by itself.

## Required Session Summary

Always end with a concise, self-contained summary. Lead with the bug-fixing outcome and include:

- synchronization result: branch, origin upstream, `PRE_SYNC_HEAD`, fetch result, integration method, `BASELINE_HEAD`, and clean-start confirmation
- scope, environments, workflows, and bug-finding lenses inspected
- confirmed bugs fixed, ordered by severity, with symptoms, root causes, important paths, and verification evidence
- candidates disproved, downgraded, or blocked and the evidence or missing authority
- regression tests and broader checks run, including pre-existing or environmental failures
- number and results of fresh inspection passes
- remaining lower-severity defects, untested surfaces, and residual risk
- final Git state: clean or changed, manifest paths, uncommitted or committed state, commit hash, and push destination/result when applicable
- for an abort: trigger, paths restored or preserved, final `HEAD`, and whether the clean baseline was fully restored

Use precise language such as `reproduced`, `fixed locally`, `verified by regression test`, `not deployed`, or `blocked by external dependency`. Never claim a bug, fix, test, deployment, cleanup, commit, or push without evidence.
