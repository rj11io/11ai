---
name: 11ai-git-sync
description: "Compare a local branch with its remote, fetch updates, fast-forward or pull deliberately, and push a named branch when explicitly requested. Use when the user asks to synchronize Git state or resolve ahead and behind status."
---
# 11ai Git sync

Handle one synchronization operation at a time. Fetching updates local remote-tracking refs; pulling changes the current branch and worktree; pushing changes a remote repository. Treat these as separate permissions.

## Inspect first

```bash
git rev-parse --show-toplevel
git branch --show-current
git status --short --branch --untracked-files=all
git remote -v
git branch -vv
git rev-list --left-right --count HEAD...@{upstream}
```

Do not pull or rebase over a dirty worktree unless the user explicitly chose a workflow that handles those changes. Confirm the remote, upstream, and target branch before any remote mutation. Never silently stash pre-existing work.

## Fetch and integrate

For a read-oriented refresh:

```bash
git fetch --prune REMOTE
git rev-list --left-right --count HEAD...@{upstream}
```

For a requested pull, prefer a fast-forward-only update:

```bash
git pull --ff-only
```

If histories diverge, stop and report the two sides. Do not choose merge versus rebase, resolve conflicts, or force a reset without explicit direction. If a requested merge or rebase conflicts, preserve the conflict state and report the paths rather than guessing at resolutions.

## Push deliberately

Only push after the user clearly names the branch or confirms the upstream:

```bash
git push REMOTE BRANCH
```

Before pushing, verify `git log --oneline @{upstream}..HEAD`, run relevant checks, and report the remote and branch. Never add `--force` or `--force-with-lease` by implication. A non-fast-forward rejection is a troubleshooting handoff, not permission to overwrite remote history.

## Report

Include the command class used, remote and branch, before/after commit IDs when state changed, ahead/behind result, and any conflicts or rejected updates. Do not claim that a fetch synchronized the working branch; it only refreshed remote-tracking references.
