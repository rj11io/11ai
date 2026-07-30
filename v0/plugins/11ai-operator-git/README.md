# 11ai Git operator

Eighteen standalone Git skills for inspecting, staging, committing, synchronizing, branching, tagging, shelving, recovering, learning, and troubleshooting repository state. Each one does a single Git operation and reports what it observed.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-git-setup`](./skills/11ai-operator-git-setup/SKILL.md) | Configuring identity, defaults, credential helpers, commit signing, ignore rules, and line endings on a new machine |
| [`11ai-operator-git-integrations`](./skills/11ai-operator-git-integrations/SKILL.md) | Connecting a repository to remotes, pull-request tooling, pipeline triggers, hook managers, commit gates, LFS, and submodules |
| [`11ai-operator-git-status`](./skills/11ai-operator-git-status/SKILL.md) | Inspecting repository identity, worktree changes, diffs, history, branches, and upstream state without mutation |
| [`11ai-operator-git-stage`](./skills/11ai-operator-git-stage/SKILL.md) | Reviewing and staging only the intended paths or hunks, or safely unstaging them without committing |
| [`11ai-operator-git-commit`](./skills/11ai-operator-git-commit/SKILL.md) | Creating one reviewed local commit with a clear message, without pushing or amending unless asked |
| [`11ai-operator-git-conventional-commits`](./skills/11ai-operator-git-conventional-commits/SKILL.md) | Choosing and validating a Conventional Commits 1.0.0 message whenever a workflow needs to commit its work |
| [`11ai-operator-git-sync`](./skills/11ai-operator-git-sync/SKILL.md) | Fetching, pulling, comparing with upstream, and pushing a named branch with fast-forward and force-push safeguards |
| [`11ai-operator-git-branches`](./skills/11ai-operator-git-branches/SKILL.md) | Listing, creating, switching, renaming, and deleting local branches safely |
| [`11ai-operator-git-worktrees`](./skills/11ai-operator-git-worktrees/SKILL.md) | Adding, moving, and removing worktrees so two branches can be checked out at once |
| [`11ai-operator-git-tags-and-releases`](./skills/11ai-operator-git-tags-and-releases/SKILL.md) | Creating, signing, publishing, and correcting tags, including the rules for a tag already pushed |
| [`11ai-operator-git-stash`](./skills/11ai-operator-git-stash/SKILL.md) | Shelving selected work temporarily, inspecting stashes, and applying or dropping them deliberately |
| [`11ai-operator-git-submodules`](./skills/11ai-operator-git-submodules/SKILL.md) | Adding, updating, pinning, and removing submodules without leaving clones empty or stale |
| [`11ai-operator-git-hooks`](./skills/11ai-operator-git-hooks/SKILL.md) | Writing, installing, debugging, and bypassing local hooks, and sharing them through a tracked directory |
| [`11ai-operator-git-pull-requests`](./skills/11ai-operator-git-pull-requests/SKILL.md) | Opening, inspecting, reviewing, and landing pull requests from the command line |
| [`11ai-operator-git-bisect`](./skills/11ai-operator-git-bisect/SKILL.md) | Finding the commit that introduced a regression, manually or with an automated check |
| [`11ai-operator-git-recovery`](./skills/11ai-operator-git-recovery/SKILL.md) | Undoing local changes, reverting commits, and recovering reachable history with an explicit risk boundary |
| [`11ai-operator-git-cheatsheet`](./skills/11ai-operator-git-cheatsheet/SKILL.md) | Answering quick Git command, flag, and “what should I use?” questions with a compact safety-aware reference |
| [`11ai-operator-git-troubleshooting`](./skills/11ai-operator-git-troubleshooting/SKILL.md) | Diagnosing Git failures from read-only evidence before proposing the smallest justified repair |

Every skill here stands alone and can be used for a single Git operation, for example: "Use 11ai-operator-git-status to tell me what is ahead of origin/main." Combine them when a task crosses boundaries, such as staging deliberately and then composing a conventional commit message, or bisecting to a commit and then reverting it.

## Shared safety contract

Every skill starts by identifying the repository and current branch, uses path-scoped commands when possible, and reports the exact state it observed. Read-only inspection is the default.

Staging, committing, pulling, pushing, deleting, restoring, resetting, dropping stashes, removing worktrees, and other state-changing actions require the user to have asked for that action.

Treat as requiring explicit approval, naming the target: force-pushing; moving or deleting a tag that has already been published; removing a worktree with uncommitted changes; deleting a submodule's working directory; and merging a pull request, which can deploy.

Never expose credentials, silently stash or discard pre-existing work, use blanket cleanup commands, resolve conflicts by guessing, or weaken a check to get past a finding. A local hook is advisory — `--no-verify` skips it — so anything that must not be bypassed belongs in a server-side check too.
