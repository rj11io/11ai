---
name: 11ai-git-recovery
description: "Recover or undo Git work using restore, revert, reflog, and carefully scoped reset decisions. Use when the user asks to discard local edits, undo a commit, recover a lost tip, or repair a mistaken local Git action."
---
# 11ai Git recovery

Treat recovery as a state-preservation problem. First capture evidence; then select the least destructive operation that matches whether the change is unstaged, staged, local-only, or already shared.

## Capture evidence

```bash
git status --short --branch --untracked-files=all
git diff --stat
git diff --cached --stat
git log --oneline --decorate --graph -n 15
git reflog --date=local -n 20
```

If a target commit is uncertain, create a temporary safety branch before moving any ref:

```bash
git branch recovery-safety-YYYYMMDD HEAD
```

Never quote a commit from a truncated log when the user has not confirmed it.

## Choose the smallest operation

| Situation | Safer first choice | Boundary |
| --- | --- | --- |
| Remove one staged path from the index | `git restore --staged -- PATH` | Keeps the working-tree edit |
| Discard an unstaged path | `git restore -- PATH` | Permanently removes that local edit; require explicit confirmation |
| Undo a shared commit | `git revert COMMIT` | Adds a new inverse commit; does not rewrite shared history |
| Move a local branch back but keep edits staged | `git reset --soft COMMIT` | Moves `HEAD`; inspect the index afterward |
| Move a local branch back and leave edits unstaged | `git reset COMMIT` | Moves `HEAD`; inspect the worktree afterward |
| Find a prior branch tip | `git reflog` then `git branch RECOVERY COMMIT` | Preserve the commit before attempting other repair |

Do not use `git reset --hard`, `git clean`, `git push --force`, or broad `git restore` as a shortcut. Those operations can destroy uncommitted or shared work and require an explicit, informed request with a path or commit boundary. Do not rewrite a public branch to undo a change when `git revert` fits.

## Verify

```bash
git status --short --branch --untracked-files=all
git log --oneline --decorate --graph -n 10
git diff --stat
git diff --cached --stat
```

Report what was preserved, what changed, the exact commit or path boundary, and what remains uncertain. If a conflict exists, stop and hand off to `11ai-git-troubleshooting` rather than resolving by guesswork.
