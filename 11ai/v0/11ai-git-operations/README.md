# 11ai Git operations

Two standalone skills that own the Git side of any repository task — synchronization, branch hygiene, rollback, pull requests, and reporting — so task skills can stay focused on the work itself. Pick the operator that matches how the work should land, and combine it with whichever task skill does the actual job.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-git-main-operator`](./11ai-git-main-operator/SKILL.md) | Working directly on the main branch: sync a clean tree, do the task, quality-check, and report — committing or pushing only when explicitly asked |
| [`11ai-git-branch-operator`](./11ai-git-branch-operator/SKILL.md) | Landing work through a branch and pull request: branch from a clean tree, do the task, open a detailed PR, run two review subagents, address their comments — merging or closing only when explicitly asked |

## Shared workflow

Both operators start from a clean, synchronized tree and refuse to stash, discard, or absorb pre-existing changes. Both keep a session change manifest, preserve unrelated work, and abort — reverting their own changes and restoring a clean tree — when the worktree becomes unmanageable or Git troubleshooting starts to outweigh the task. Both end every session, completed or aborted, with a full report of everything that happened.

The operators wrap a task; they do not define one. Name the task (or the task skill) in the same request, for example: "Use 11ai-git-branch-operator with 11ai-super-ux to improve the dashboard's accessibility."
