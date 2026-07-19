---
name: 11ai-git-branch-operator
description: "Wrap any repository task in a branch-and-pull-request Git workflow: identify the task, create or reuse a well-named dedicated branch from a clean tree, perform and quality-check the work, open a pull request with full details and screenshots when applicable, run two independent review subagents that critique the PR in review comments, address their feedback, and re-verify. Merges or closes the pull request only when the user explicitly asks. Aborts, reverts session changes, and restores a clean tree if the worktree becomes unmanageable or Git troubleshooting starts to outweigh the task. Use when repository work should land through a branch and reviewed pull request rather than directly on main — pair it with any task skill that does the work itself."
---

# Git branch operator

Run a task on a dedicated branch and land it through a reviewed pull request. This skill owns the repository boundary — branching, cleanliness, the PR lifecycle, review, rollback, and reporting. The task itself comes from the user's request or from another skill; this skill wraps it, it does not replace it.

## Principles

- One branch per task. Never mix unrelated work on the same branch.
- Never stash, discard, commit, or absorb pre-existing changes to manufacture a clean state. A dirty starting tree is a stop-and-report, not a cleanup opportunity.
- Open the pull request yourself, but never merge or close it unless the user explicitly asks for that exact action in the current session.
- Track every file the session creates or changes. Preserve unrelated and concurrent work; never run blanket destructive commands such as `git reset --hard`, `git clean`, or an unscoped `git restore .`.
- If Git itself becomes the problem, abort the task rather than debugging the repository into a worse state.
- Always end with the session report, including when stopping at the gate or aborting.

## Routine

### 1. Identify the task and the branch

1. State the task in one sentence. This drives the branch name and later the PR description.
2. Check the current branch. If the session is already on a branch dedicated to this exact task, keep it. Otherwise create one from the up-to-date default branch.
3. Name new branches with the repository's existing convention when one is visible in recent branches. When none exists, use `<type>/<short-kebab-summary>` — for example `feat/session-export`, `fix/login-redirect`, `docs/api-quickstart` — short, lowercase, hyphenated, and specific to the task.

### 2. Require a clean, synchronized starting tree

1. Run `git status --porcelain=v1 --untracked-files=all`. If anything appears, stop immediately, list the dirty paths, and do not stash, clean, restore, pull, or edit anything.
2. Run `git fetch --prune`, update the default branch, and create or fast-forward the task branch from it so the work starts from the latest state. Stop and report fetch or remote-configuration failures.
3. Record `git rev-parse HEAD` as the rollback point and start a session change manifest: every tracked path the session modifies and every untracked path it creates goes in it.

### 3. Perform the intended task

1. Do the work the user requested, following any task-specific skill that covers it.
2. Work in small, coherent batches. After each batch, reconcile the change manifest against `git status --short`. Any changed path the session cannot account for is an abort signal until ownership is established.
3. Commit the work to the task branch in focused commits. For every task commit, use `11ai-git-conventional-commits` to choose and validate a Conventional Commits 1.0.0 message that also respects compatible repository rules. Branch commits are part of this workflow; pushing the branch to open the PR is too. Merging is not.

### 4. Quality-check the result

1. Run the project's own checks — tests, linters, builds, or validators the repository already defines — scoped to the work done.
2. Verify behavior directly when checks alone cannot prove the change works.
3. Fix what the checks surface, re-run them, and update the manifest.

### 5. Open the pull request

1. Push the task branch and open a PR against the default branch.
2. Write the PR description from the session's actual record: the task, the approach, every notable change, how it was verified, and anything reviewers should look at first.
3. Attach screenshots or recordings when the change is visual or user-facing and capturing them is possible in the environment.

### 6. Review with two independent subagents

1. Spin up two review subagents with different lenses — for example one on correctness and edge cases, one on design, clarity, and consistency with the codebase.
2. Have each post its findings as PR review comments on the relevant lines or files.
3. When both finish, address every comment: fix what is right, and reply with a short reasoned answer where the code should stand as written.
4. Re-run the quality checks from step 4 after the fixes, and push the follow-up commits to the same branch.

### 7. Merge or close only on explicit instruction

1. If the user did not ask, leave the PR open and reviewed, and say so in the report.
2. If the user asked, make and execute the merge-or-close decision they requested, honoring the repository's merge conventions.

## Abort conditions

Abort instead of pushing through when any of these occurs:

- the working tree accumulates changes the manifest cannot explain;
- Git or PR operations start failing in ways that need repeated troubleshooting — more than two focused attempts on the same problem without progress;
- the task's changes have grown tangled enough that reverting cleanly later would be doubtful.

To abort:

1. Compare `git status --porcelain` with the change manifest.
2. Restore manifest-owned tracked paths from the rollback point with path-scoped `git restore --source=<rollback-commit> --staged --worktree -- <paths>`, and delete only untracked paths the manifest records as session-created.
3. Preserve any change the manifest does not own; report it rather than claiming a clean tree.
4. If a PR was already opened, leave it open with a comment explaining the abort; close it only if the user asks.
5. Verify the tree is clean, return to the branch the session started on, and stop.

## Session report

End every session — completed or aborted — with:

- the task, the branch used or created, and why;
- every file created, changed, or deleted, and the commits made;
- quality checks run and their results, before and after review;
- the PR link, its description summary, both subagents' findings, and how each comment was addressed;
- whether the PR was merged or closed, and on whose instruction;
- if aborted: the trigger, what was reverted, and the final state of the tree and PR.
