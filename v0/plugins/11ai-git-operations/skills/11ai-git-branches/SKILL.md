---
name: 11ai-git-branches
description: "List, create, switch, rename, and delete local Git branches with upstream and unmerged-work safeguards. Use for one focused branch-management operation, not a full pull-request workflow."
---
# 11ai Git branches

Manage local branch names and pointers as a standalone operation. The existing `11ai-git-branch-operator` owns an end-to-end branch-and-pull-request task; this skill handles the small branch command itself.

## Inspect

```bash
git branch --show-current
git status --short --branch --untracked-files=all
git branch -vv --sort=-committerdate
git log --oneline --decorate -n 8
```

Before switching, identify staged and unstaged work and confirm that the target branch exists or the requested starting point is explicit. Never hide dirty work with a stash unless the user asked for that separately.

## Common operations

```bash
git branch --list
git switch --create TOPIC START_POINT
git switch EXISTING_BRANCH
git branch --move NEW_NAME
git branch --delete BRANCH
```

Use `git switch --create` rather than legacy checkout for a new branch. Preserve the repository's branch naming convention and prefer a short, specific name. `git branch --delete` refuses to remove an unmerged branch; do not replace it with `-D` without explicit confirmation after showing the branch tip and merge status. Remote branch deletion belongs to `11ai-git-sync` and must never be inferred from deleting a local branch.

## Verify

```bash
git branch --show-current
git status --short --branch --untracked-files=all
git branch -vv
```

Report the old and new branch, starting point, upstream tracking, and any work that prevented or remained outside the operation.
