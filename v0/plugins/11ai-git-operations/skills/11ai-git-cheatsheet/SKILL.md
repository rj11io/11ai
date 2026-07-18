---
name: 11ai-git-cheatsheet
description: "Answer quick Git command, flag, and workflow questions with a compact safety-aware reference. Use when the user asks what command to run, what a Git flag means, or which simple operation fits a situation."
---
# 11ai Git cheatsheet

Use this skill as a reference, not as permission to run a command. Give the smallest useful command, explain its effect in plain language, and label whether it reads state, changes local state, changes the remote, or can destroy work. Ask one focused question when the target branch, path, or commit is missing.

The expanded command matrix is in [references/command-matrix.md](./references/command-matrix.md). Use it to answer follow-up questions about flags, common sequences, and safety boundaries.

## Quick decision guide

| User intent | Start with |
| --- | --- |
| “What changed?” | `git status --short` and `git diff` |
| “What is staged?” | `git diff --cached` |
| “Prepare only these files” | `git add -- PATH` |
| “Save a focused local checkpoint” | `git commit -m "..."` after reviewing the index |
| “See remote updates” | `git fetch --prune` then compare with `git log` |
| “Bring my branch up to date” | `git pull --ff-only` on a clean tree |
| “Send my named branch” | `git push REMOTE BRANCH` after checks |
| “Start isolated work” | `git switch --create TOPIC START_POINT` |
| “Pause work temporarily” | `git stash push -m "reason" -- PATH` |
| “Undo something already shared” | `git revert COMMIT` |
| “Find a lost commit” | `git reflog` then create a recovery branch |

## Safety shorthand

- Read-only: `status`, `diff`, `log`, `show`, `branch --list`, `remote -v`, `reflog`, and `fetch` (local remote-tracking refs change).
- Local mutation: `add`, `restore`, `commit`, `switch`, `merge`, `rebase`, `stash`, `reset`, and `revert`.
- Remote mutation: `push`, remote branch deletion, tag publication, and release operations.
- High risk: `reset --hard`, `clean`, `restore` over uncommitted edits, `stash clear`, and force-push variants.

For any state-changing command, first show the target path, branch, or commit and finish by checking `git status --short --branch`. For errors or surprising state, use `11ai-git-troubleshooting` instead of guessing from one command.
