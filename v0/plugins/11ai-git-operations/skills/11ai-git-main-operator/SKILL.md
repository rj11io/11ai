---
name: 11ai-git-main-operator
description: "Wrap any repository task in a safe main-branch Git transaction: verify a clean tree, fetch and pull the latest changes (fast-forwarding or cleanly merging incoming work), perform the requested task, quality-check it, and report everything done. Stages, commits, or pushes only when the user explicitly asks. Aborts, reverts session changes, and restores a clean tree if the worktree becomes unmanageable or Git troubleshooting starts to outweigh the task. Use when working directly on the main branch of a repository and the work needs clean synchronization, disciplined rollback, and a full session report — pair it with any task skill that does the work itself."
---

# Git main-branch operator

Run a task directly on the repository's main branch inside a disciplined Git transaction. This skill owns the repository boundary — synchronization, cleanliness, rollback, and reporting. The task itself comes from the user's request or from another skill; this skill wraps it, it does not replace it.

## Principles

- Synchronize before touching anything. Never start work on a stale or dirty tree.
- Never stash, discard, commit, or absorb pre-existing changes to manufacture a clean state. A dirty starting tree is a stop-and-report, not a cleanup opportunity.
- Do not stage, commit, or push unless the user explicitly asks for that exact action in the current session. A conflict-free merge commit created only to integrate incoming changes during synchronization is the one automatic exception.
- Track every file the session creates or changes. Preserve unrelated and concurrent work; never run blanket destructive commands such as `git reset --hard`, `git clean`, or an unscoped `git restore .`.
- If Git itself becomes the problem, abort the task rather than debugging the repository into a worse state.
- Always end with the session report, including when stopping at the gate or aborting.

## Routine

### 1. Synchronize and record the rollback point

1. Confirm the current directory belongs to the intended Git repository and that the checkout is on the main branch (or the repository's default branch) with a configured upstream. Stop and report if the checkout is detached, on an unexpected branch, or has no usable upstream.
2. Run `git status --porcelain=v1 --untracked-files=all`. If anything appears, stop immediately, list the dirty paths, and do not stash, clean, restore, pull, or edit anything.
3. Run `git fetch --prune`. Stop and report authentication, network, or remote-configuration failures.
4. Run `git pull --ff-only`. If and only if it fails because the local and upstream histories have diverged, merge the fetched upstream with `git merge --no-edit @{upstream}`. Accept the merge only when Git completes it with no conflicts and the tree ends clean.
5. If the merge reports any conflict, run `git merge --abort`, verify the tree returned to its pre-merge state, and stop with a report of the conflicting paths. Never resolve synchronization conflicts.
6. Re-check that the tree is clean and record `git rev-parse HEAD` as the rollback point. Start a session change manifest: every tracked path the session modifies and every untracked path it creates goes in it.

### 2. Perform the intended task

1. Do the work the user requested, following any task-specific skill that covers it.
2. Work in small, coherent batches. After each batch, reconcile the change manifest against `git status --short`. Any changed path the session cannot account for is an abort signal until ownership is established.

### 3. Quality-check the result

1. Run the project's own checks — tests, linters, builds, or validators the repository already defines — scoped to the work done.
2. Verify behavior directly when checks alone cannot prove the change works.
3. Fix what the checks surface, re-run them, and update the manifest.

### 4. Stage, commit, or push only on explicit instruction

1. If the user did not ask, leave everything uncommitted in the working tree and say so in the report.
2. If the user asked, treat stage, commit, and push as three separate permissions. Perform only the ones requested, after the quality checks pass, using the repository's commit conventions.

## Abort conditions

Abort instead of pushing through when any of these occurs:

- the working tree accumulates changes the manifest cannot explain;
- Git operations start failing in ways that need repeated troubleshooting — more than two focused attempts on the same Git problem without progress;
- the task's changes have grown tangled enough that reverting cleanly later would be doubtful.

To abort:

1. Compare `git status --porcelain` with the change manifest.
2. Restore manifest-owned tracked paths from the rollback point with path-scoped `git restore --source=<rollback-commit> --staged --worktree -- <paths>`, and delete only untracked paths the manifest records as session-created.
3. Preserve any change the manifest does not own; report it rather than claiming a clean tree.
4. Verify `HEAD` still equals the rollback point and the tree is clean, then stop.

## Session report

End every session — completed or aborted — with:

- what was synchronized (branch, incoming changes, whether a merge commit was created);
- the task performed and every file created, changed, or deleted;
- quality checks run and their results;
- whether anything was staged, committed, or pushed, and on whose instruction;
- if aborted: the trigger, what was reverted, and the final state of the tree.
