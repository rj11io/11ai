---
name: 11ai-operator-git-worktrees
description: "Add, list, move, and remove Git worktrees, covering a second checkout of the same repository, the one-branch-per-worktree rule, detached and new-branch checkouts, shared versus per-worktree configuration, locking a worktree on removable storage, pruning stale administrative entries, and removing a worktree without losing uncommitted work. Use when two branches must be checked out at once, when a worktree cannot be removed or its branch cannot be checked out, or when stale worktree entries must be cleaned up."
---
# 11ai Git worktrees

A worktree is a second working directory backed by one repository, which is the clean way to have two branches checked out at once without stashing. The rule that governs everything here: a branch can be checked out in only one worktree at a time, and removing a worktree directory by hand leaves the repository believing it still exists.

## Inspect first

```bash
git worktree list
git worktree list --porcelain
git rev-parse --show-toplevel
git rev-parse --git-common-dir
```

`git worktree list` shows every checkout with its branch, and `--porcelain` marks the ones that are `locked` or `prunable`. Read it before adding or removing anything: a branch already checked out elsewhere is the reason `git switch` refuses it, and the error names the other worktree.

`--git-common-dir` points at the shared repository data. A worktree has its own `HEAD`, index, and `HEAD`-relative refs, but shares objects, remotes, branches, and most configuration — which is why a `git fetch` in one worktree updates all of them.

## Add a worktree

```bash
git worktree add ../repo-review BRANCH
git worktree add -b feature/new ../repo-feature
git worktree add --detach ../repo-inspect COMMIT
git worktree add --track -b hotfix ../repo-hotfix origin/hotfix
```

Place worktrees **outside** the main working directory, as sibling directories. A worktree nested inside the repository shows up as untracked content, gets caught by build tooling and by `git clean`, and can be committed by accident.

Use `--detach` to inspect a commit or tag without occupying a branch — that avoids the one-branch rule entirely and is right for a read-only look at history.

Each new worktree starts with a clean index but does **not** copy ignored files. Anything not tracked — `node_modules`, a `.env`, a build cache — has to be installed or created there. That is the usual surprise: the code is present and the project will not build until dependencies are installed.

## Remove and prune

```bash
git -C ../repo-feature status --short
git worktree remove ../repo-feature
git worktree remove --force ../repo-feature
git worktree prune --dry-run
git worktree prune
```

Check the worktree's own status before removing it. `git worktree remove` refuses a dirty worktree, and `--force` discards those changes permanently — so the sequence is: inspect, show what would be lost, get approval for that path, then remove.

Never delete a worktree directory with `rm -rf`. That leaves an administrative entry behind, so the branch stays "checked out somewhere" and cannot be used until the entry is pruned. If it has already happened:

```bash
git worktree prune --verbose
git worktree list
```

`prune` removes entries whose directories are gone. Run `--dry-run` first, because a worktree on an unmounted drive looks missing and would be pruned while its files still exist.

For a worktree on removable or network storage, lock it so pruning cannot discard it:

```bash
git worktree lock ../repo-on-usb --reason "external drive"
git worktree unlock ../repo-on-usb
```

Moving one should also go through Git so the administrative entry follows:

```bash
git worktree move ../repo-feature ../repo-feature-renamed
```

## Verify and report

```bash
git worktree list
git -C ../repo-feature status --short --branch
git branch -vv
```

After adding, confirm the new worktree is on the intended branch and that the branch is not duplicated elsewhere. After removing, confirm the entry is gone from `git worktree list` and the branch is free to check out again.

Report every worktree with its path and branch, what was added or removed, whether any uncommitted change was discarded and on whose approval, any lock applied and why, and what `prune` would have removed if it was run. Say explicitly when a removed worktree needed its dependencies reinstalled elsewhere, and never claim a branch is free without confirming it in `git worktree list`.
