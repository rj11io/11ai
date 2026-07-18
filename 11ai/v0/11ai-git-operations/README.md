# 11ai Git operations

Small, standalone Git skills for inspecting, staging, committing, synchronizing, branching, shelving, recovering, learning, and troubleshooting repository state. The two operators remain the higher-level wrappers for running a complete repository task on main or through a reviewed pull request.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-git-main-operator`](./11ai-git-main-operator/SKILL.md) | Working directly on the main branch: sync a clean tree, do the task, quality-check, and report — committing or pushing only when explicitly asked |
| [`11ai-git-branch-operator`](./11ai-git-branch-operator/SKILL.md) | Landing work through a branch and pull request: branch from a clean tree, do the task, open a detailed PR, run two review subagents, address their comments — merging or closing only when explicitly asked |
| [`11ai-git-status`](./11ai-git-status/SKILL.md) | Inspecting repository identity, worktree changes, diffs, history, branches, and upstream state without mutation |
| [`11ai-git-stage`](./11ai-git-stage/SKILL.md) | Reviewing and staging only the intended paths or hunks, or safely unstaging them without committing |
| [`11ai-git-commit`](./11ai-git-commit/SKILL.md) | Creating one reviewed local commit with a clear message, without pushing or amending unless asked |
| [`11ai-git-sync`](./11ai-git-sync/SKILL.md) | Fetching, pulling, comparing with upstream, and pushing a named branch with fast-forward and force-push safeguards |
| [`11ai-git-branches`](./11ai-git-branches/SKILL.md) | Listing, creating, switching, renaming, and deleting local branches safely |
| [`11ai-git-stash`](./11ai-git-stash/SKILL.md) | Shelving selected work temporarily, inspecting stashes, and applying or dropping them deliberately |
| [`11ai-git-recovery`](./11ai-git-recovery/SKILL.md) | Undoing local changes, reverting commits, and recovering reachable history with an explicit risk boundary |
| [`11ai-git-cheatsheet`](./11ai-git-cheatsheet/SKILL.md) | Answering quick Git command, flag, and “what should I use?” questions with a compact safety-aware reference |
| [`11ai-git-troubleshooting`](./11ai-git-troubleshooting/SKILL.md) | Diagnosing Git failures from read-only evidence before proposing the smallest justified repair |

## Shared workflow

Both operators start from a clean, synchronized tree and refuse to stash, discard, or absorb pre-existing changes. Both keep a session change manifest, preserve unrelated work, and abort — reverting their own changes and restoring a clean tree — when the worktree becomes unmanageable or Git troubleshooting starts to outweigh the task. Both end every session, completed or aborted, with a full report of everything that happened.

The operators wrap a task; they do not define one. Name the task (or the task skill) in the same request, for example: "Use 11ai-git-branch-operator with 11ai-super-ux to improve the dashboard's accessibility." The focused skills can be used alone for a single Git operation, for example: "Use 11ai-git-status to tell me what is ahead of origin/main."

## Shared safety contract

Every focused skill starts by identifying the repository and current branch, uses path-scoped commands when possible, and reports the exact state it observed. Read-only inspection is the default. Staging, committing, pulling, pushing, deleting, restoring, resetting, dropping stashes, and other state-changing actions require the user to have asked for that action. Never expose credentials, silently stash or discard pre-existing work, use blanket cleanup commands, resolve conflicts by guessing, or force-push without explicit approval.

## Good next skills

The next useful additions would be narrow skills for Git worktrees, tags and releases, bisect-based regression hunting, submodules, hooks and configuration, and provider-neutral pull-request review. Each should remain a single-purpose workflow and hand off to the existing branch operator when the work becomes a full repository task.
