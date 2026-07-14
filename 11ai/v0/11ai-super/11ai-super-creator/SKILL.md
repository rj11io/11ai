---
name: 11ai-super-creator
description: >-
  Execute any clearly specified repository task as a long-running,
  evidence-driven routine: synchronize a clean current branch with origin
  first, permit an automatic conflict-free merge of incoming changes when
  fast-forwarding is impossible, perform and verify the requested work, and
  repeat fresh improvement passes until the result meets a high-confidence
  completion bar. Use when Codex should keep creating, changing, fixing,
  migrating, documenting, testing, or auditing a project until materially
  satisfied instead of stopping after one pass. Abort and restore
  session-owned changes if the worktree becomes unmanageably dirty or
  troubleshooting outweighs progress. Commit or push only when explicitly
  instructed, using Conventional Commits.
---

# 11ai Super Creator

## Mission

Turn the user's specified task into a bounded, repeatable routine and own it through implementation, verification, and fresh review until no material high-confidence improvement remains.

The user's request defines the outcome and scope. This skill defines the repository transaction, iteration, rollback, and reporting rules around that work. Treat "continuously" as sustained progress toward an evidence-based completion gate, not an endless loop or permission to expand scope.

## Operating Rules

- Run the Git synchronization gate before inspecting implementation files, installing dependencies, starting services, or performing the intended routine.
- Start only from a clean working tree. Never stash, discard, commit, or absorb pre-existing work to manufacture a clean state.
- Follow repository instructions and use applicable specialist skills after the Git gate passes.
- Preserve unrelated work, project conventions, product behavior, security, accessibility, data integrity, and maintainability.
- Honor read-only, audit-only, file, system, environment, and external-service boundaries in the user's request.
- Prefer root-cause changes in small, coherent batches. Verify behavior rather than inferring success from a plausible diff.
- Keep a session change manifest and reconcile it with Git status after every batch.
- Do not deploy, mutate production data, alter external services, or broaden authority unless the user explicitly requests it.
- Do not create task-result commits or push by default. A conflict-free merge commit created only to synchronize incoming origin changes is the sole automatic commit exception.
- Treat commit and push as separate permissions and defer both until the completion gate and final diff review pass.
- Always end with the required session summary, including when stopped at preflight or aborted.

## Workflow

### 1. Synchronize and establish the rollback baseline

Complete this gate before the intended routine:

1. Locate the repository root and confirm the current directory belongs to the intended Git worktree.
2. Check for an in-progress merge, rebase, cherry-pick, revert, or bisect. Stop and report if one exists.
3. Require an attached current branch with an unambiguous configured upstream on `origin`. Do not guess, create, or retarget a branch, remote, or upstream. Record the branch, upstream, and current commit as `PRE_SYNC_HEAD`.
4. Run `git status --porcelain=v1 --untracked-files=all`. If it returns any entry, stop immediately and list the dirty paths. Do not stash, clean, restore, pull, or edit anything.
5. Run `git fetch origin --prune`. Stop and report authentication, network, missing-ref, or remote-configuration failures.
6. Pull the current origin upstream with fast-forward only. If and only if this fails because the local and fetched upstream histories have diverged, verify the tree is still clean and merge the fetched upstream into the current branch with a non-interactive merge message.
7. Accept the synchronization merge only when Git completes it automatically without conflicts and the index and working tree are clean. If any conflict occurs, run `git merge --abort`, verify `HEAD` equals `PRE_SYNC_HEAD` and the tree is clean, then stop and report the conflict paths. Never resolve synchronization conflicts as part of this skill.
8. Do not rebase, autostash, squash, amend, force, rewrite history, or fall back to a merge for failures unrelated to branch divergence.
9. Re-run the complete clean-tree check. Record the synchronized commit as `BASELINE_HEAD`; a clean incoming merge is part of this baseline and must survive any later task rollback.
10. Start a session change manifest. Record every tracked path modified, renamed, or deleted and every untracked path created by this session.

A successful fetch is not a substitute for pulling the current origin upstream. Do not begin the requested task unless synchronization completes and the post-sync tree is clean.

### 2. Define the intended routine and completion evidence

Translate the request into a compact working contract:

- the concrete outcome and authorized scope
- explicit exclusions and actions requiring separate authority
- repository or user constraints
- observable acceptance criteria
- relevant validation commands, behavioral checks, or review evidence
- likely material failure classes and regression risks

Inspect repository guidance, manifests, architecture, tests, and the exact implementation surface needed to form this contract. If another available skill directly covers the task or an artifact type, read and follow it for the task-specific routine while retaining this skill's stricter Git boundary, rollback rules, and completion loop.

Make reasonable, reversible assumptions when evidence supports them. Ask only when a missing decision would materially change scope, behavior, data, architecture, or external state. If the request is audit-only or otherwise read-only, define findings and evidence as the output and do not edit.

### 3. Establish a baseline

Before changing files:

1. Map the affected system, important consumers, and representative workflows or artifacts.
2. Run the narrowest useful existing checks and reproduce the target problem or establish the current quality level.
3. Separate pre-existing failures from failures caused by the session.
4. Create a finding or work ledger ranked by correctness, safety, user impact, reach, confidence, and dependency order.

Use the strongest practical evidence for the task: running behavior, tests, rendered output, measurements, schemas, fixtures, or authoritative project configuration. Source inspection alone is sufficient only when the result is inherently source-based or stronger verification is unavailable and the limitation is reported.

### 4. Execute in coherent batches

Work through the ledger in impact and dependency order:

1. State the batch's intended outcome and success evidence.
2. Make the smallest complete change that addresses the root cause.
3. Add or update focused tests or validation artifacts when appropriate.
4. Run focused checks, inspect the result, and verify affected neighboring behavior.
5. Inspect `git status --short`, `git diff --stat`, `git diff --check`, and the scoped diff.
6. Update the session change manifest and explain every changed path before continuing.

Revert a session-owned experiment when it does not improve the result, cannot be verified, or introduces disproportionate regression risk. Do not keep speculative churn merely to show activity.

### 5. Continue until materially satisfied

After the first implementation pass, start a fresh review from the resulting behavior or artifacts rather than from the original ledger. Repeat:

```text
inspect -> rank -> change -> verify -> review the diff -> inspect again
```

Use a meaningfully different lens on each fresh pass, such as correctness and edge cases, user or consumer experience, safety and failure handling, integration consistency, maintainability, or final polish. Choose only lenses relevant to the task.

When a fresh pass reveals a material issue, add it to the ledger, fix it, verify it, and restart the clean-pass count. Continue while any of these remain:

- an unmet acceptance criterion
- a confirmed critical or major defect within scope
- a regression or validation failure introduced by the session
- an unexplained changed path
- a high-confidence improvement with meaningful benefit relative to its cost and risk

Finish only when all of these are true:

- the requested outcome and every evidence-based acceptance criterion are met
- no confirmed critical or major in-scope issue remains, except an explicitly documented external blocker
- relevant focused and broad checks pass, with pre-existing or environmental failures clearly separated
- two consecutive fresh review passes reveal no new material issue
- further changes would be speculative, cosmetic, externally blocked, or subject to diminishing returns
- the complete diff is intentional, reviewable, limited to the session manifest, and passes `git diff --check`

Do not claim satisfaction when a material gate is blocked. Report the exact evidence, impact, and smallest next action needed.

### 6. Abort and restore when work becomes unsafe

Abort instead of continuing when any of these occurs:

- the worktree gains unexpected, unrelated, unowned, or unexplained changes
- generated output, dependency churn, logs, caches, secrets, or artifacts make the diff too dirty to review confidently
- the change set grows beyond a coherent, verifiable implementation of the specified task
- two focused attempts on the same blocker fail without materially new evidence or progress
- troubleshooting or debugging starts to outweigh progress on the intended routine
- repeated regressions make correctness, safety, data integrity, or repository ownership uncertain
- safe completion requires destructive Git operations, history rewriting, force pushing, missing authority, or an unapproved scope expansion

On abort:

1. Stop processes started by the session and capture the status, scoped diff, failure evidence, and abort reason for the summary.
2. Compare Git status with the session change manifest. Preserve any path whose ownership is uncertain.
3. Confirm no task-result commit exists and `HEAD` still equals `BASELINE_HEAD`; task commits are deferred until completion.
4. Restore only session-owned tracked paths with path-scoped `git restore --source="$BASELINE_HEAD" --staged --worktree -- <paths>`.
5. Remove only untracked files and directories explicitly recorded as created by this session. Never use blanket `git clean`, `git reset --hard`, blanket restore, force checkout, or history rewriting.
6. Verify `git rev-parse HEAD` equals `BASELINE_HEAD` and the complete porcelain status is empty.
7. If concurrent or unexplained changes prevent full restoration, preserve them and report the exact paths; do not risk user work or falsely claim a clean state.
8. Stop the routine and return the required aborted-session summary. Do not immediately restart the entire operation.

### 7. Commit and push only when explicitly instructed

Run this section only after the completion gate and final diff review:

1. Confirm the current request explicitly authorizes a commit, a push, or both. Permission to edit does not imply either; permission to commit does not imply push; a push request does not silently authorize creating an unrequested commit.
2. Stage only reviewed paths from the session change manifest and inspect the staged diff.
3. Create no empty or intermediate commit. Use a focused Conventional Commit in the form `<type>(optional-scope): <imperative summary>` that accurately describes the work.
4. If commit alone was requested, stop after verifying the commit and report its hash.
5. Push only when explicitly requested, to the configured current-branch upstream, without force or upstream retargeting. Make push the final repository mutation.
6. If commit or push fails, do not amend, rebase, force, rewrite history, or enter extended troubleshooting. Preserve any successful local commit, report the exact state, and stop.

The synchronization merge from step 1 is exempt from task-result commit authorization because it only establishes the latest clean baseline. It never authorizes pushing by itself.

## Required Session Summary

Always end with a concise, self-contained session summary. Lead with the outcome and include:

- task outcome: completed, blocked, stopped at preflight, or aborted and rolled back
- synchronization result: branch, origin upstream, `PRE_SYNC_HEAD`, fetch result, integration method (`no-op`, fast-forward, or clean merge), `BASELINE_HEAD`, and clean-start confirmation
- intended routine and acceptance criteria used
- material work completed, grouped by root cause or outcome, with important changed paths
- iteration count and what each fresh review lens found
- validation commands, behavioral checks, and results, distinguishing verified facts from inference
- remaining limitations, lower-value opportunities, or blockers with their exact impact and required next action
- final Git state: clean or changed, manifest paths, uncommitted or committed state, commit hash, and push destination/result when applicable
- for an abort: trigger, paths restored or preserved, final `HEAD`, and whether the clean baseline was fully restored

Keep the report evidence-based. Never claim checks, measurements, deployment, production behavior, commit, push, cleanup, or restoration that was not actually verified.
