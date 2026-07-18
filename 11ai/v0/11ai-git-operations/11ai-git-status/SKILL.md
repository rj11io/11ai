---
name: 11ai-git-status
description: "Inspect a Git repository's identity, worktree, diffs, history, branches, and upstream state without changing files or refs. Use when the user asks what changed, whether the tree is clean, where HEAD points, or what should happen next."
---
# 11ai Git status

Use this skill for read-only repository orientation. It is standalone: do not assume that another Git skill has already established the current branch, remote, or ownership of changes.

## Inspect in layers

Start with the repository boundary and current checkout:

```bash
git rev-parse --show-toplevel
git rev-parse --show-prefix
git branch --show-current
git status --short --branch --untracked-files=all
git remote -v
git branch -vv
```

Then answer the smallest useful question with focused evidence:

```bash
git diff --stat
git diff -- path/to/file
git diff --cached --stat
git diff --cached -- path/to/file
git log --oneline --decorate -n 12
git log --oneline --decorate --graph --all -n 20
git rev-list --left-right --count HEAD...@{upstream}
git log --oneline @{upstream}..HEAD
git log --oneline HEAD..@{upstream}
```

`git diff` is unstaged work, `git diff --cached` is staged work, and the two `log` commands show local commits not yet upstream and upstream commits not yet local. Only use `@{upstream}` after confirming the branch has one; report that it is unavailable otherwise.

## Report

Separate observed facts from interpretation. Include the current repository root, branch or detached-HEAD state, upstream if any, clean/dirty status, staged and unstaged summaries, untracked paths, and ahead/behind counts when available. Do not edit, stage, stash, fetch, pull, or reset while using this skill. If the user wants a state change, hand off to the smallest matching Git skill.
