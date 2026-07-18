---
name: 11ai-git-stash
description: "Temporarily shelve selected Git work, inspect existing stashes, and apply or drop a stash deliberately. Use when the user explicitly wants to pause work without committing it."
---
# 11ai Git stash

Use stashes as named, temporary state—not as a silent cleanup mechanism. Inspect the current worktree and the stash list before changing either. This skill never assumes that a stash is disposable.

## Create a focused stash

```bash
git status --short --branch --untracked-files=all
git diff --stat
git stash push -m "short reason" -- path/to/file
git stash push --include-untracked -m "short reason"
```

The first command shelves selected tracked paths. `--include-untracked` also shelves untracked files and must be intentional because it can hide newly created work. Do not use `git stash -a` casually; ignored files may contain valuable local state or secrets. Do not stash unrelated pre-existing changes merely to make another workflow pass.

## Inspect and restore

```bash
git stash list
git stash show --stat stash@{0}
git stash show --patch stash@{0}
git stash apply stash@{0}
git stash pop stash@{0}
```

Prefer `apply` when preserving a recovery copy matters; it leaves the stash in place. `pop` removes it only when the apply succeeds, but conflicts still require careful resolution and verification. Use a path-scoped `git stash push` when only part of the work should be shelved.

## Delete only by request

```bash
git stash drop stash@{0}
git stash clear
```

Show the stash contents and get explicit approval before dropping a stash. `git stash clear` deletes every stash and is a destructive last resort. Finish with `git status --short --branch --untracked-files=all` and report what was preserved, applied, conflicted, or removed.
