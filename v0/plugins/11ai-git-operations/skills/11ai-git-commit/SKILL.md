---
name: 11ai-git-commit
description: "Create one reviewed local Git commit from explicitly selected staged changes without pushing or amending by default. Use when the user asks to commit work and wants a clear message and post-commit verification."
---
# 11ai Git commit

Create a local commit only when the user asks for a commit. This skill does not decide which files belong in the commit, push it, amend an earlier commit, or rewrite published history.

## Pre-commit gate

Inspect the exact index and repository context:

```bash
git status --short --branch --untracked-files=all
git diff --cached --check
git diff --cached --stat
git diff --cached
git log --oneline --decorate -n 5
```

If nothing is staged, stop and ask whether to use `11ai-git-stage` and which paths or hunks should be included. If unrelated changes are staged, stop rather than absorbing them. Check for secrets, generated files, and accidental environment changes. Use `11ai-git-conventional-commits` to choose and validate a Conventional Commits 1.0.0 message, including any compatible repository-specific types, scopes, or wording rules.

## Create and verify

Create one commit with a message the user has approved or that is unambiguous from the request:

```bash
git commit -m "Describe the focused change"
git show --stat --oneline --decorate HEAD
git status --short --branch --untracked-files=all
```

Respect hooks and report hook failures. Do not add `--no-verify`, `--amend`, `--allow-empty`, or a second commit to work around a failure without explicit direction. Do not push; use `11ai-git-sync` for that as a separate operation.
