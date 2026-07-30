# Git command matrix

Use this as a quick reference. `READ` means the command reports state; `LOCAL` changes only the local repository; `REMOTE` changes a remote; `RISK` can remove or rewrite work.

| Intent | Command | Class | Notes |
| --- | --- | --- | --- |
| Identify repository | `git rev-parse --show-toplevel` | READ | Fails clearly when the directory is not inside a repository |
| Summarize changes | `git status --short --branch --untracked-files=all` | READ | Shows branch, staged, unstaged, conflicted, and untracked paths |
| Review unstaged patch | `git diff -- PATH` | READ | Does not include staged changes |
| Review staged patch | `git diff --cached -- PATH` | READ | Exact content that the next commit would include |
| Find recent commits | `git log --oneline --decorate -n 12` | READ | Add `--graph --all` for branch topology |
| Compare with upstream | `git rev-list --left-right --count HEAD...@{upstream}` | READ | Confirm an upstream exists first |
| Stage a path | `git add -- PATH` | LOCAL | Review the path before adding it |
| Stage selected hunks | `git add -p -- PATH` | LOCAL | Keeps unrelated edits out of the index |
| Unstage a path | `git restore --staged -- PATH` | LOCAL | Leaves the working-tree edit in place |
| Commit staged work | `git commit -m "MESSAGE"` | LOCAL | Does not push; respect hooks |
| Refresh remote refs | `git fetch --prune REMOTE` | LOCAL | Does not update the checked-out branch |
| Fast-forward pull | `git pull --ff-only` | LOCAL | Refuses divergence instead of choosing a strategy |
| Push a branch | `git push REMOTE BRANCH` | REMOTE | Confirm target and run checks first |
| Create and switch | `git switch --create TOPIC START_POINT` | LOCAL | Prefer `switch` over legacy checkout |
| Switch branch | `git switch BRANCH` | LOCAL | Refuses if local edits would be overwritten |
| Save selected work | `git stash push -m "REASON" -- PATH` | LOCAL | Use `--include-untracked` only intentionally |
| Restore a stash copy | `git stash apply stash@{0}` | LOCAL | Keeps the stash for recovery |
| Undo a shared commit | `git revert COMMIT` | LOCAL | Creates an inverse commit instead of rewriting history |
| Find moved or lost refs | `git reflog` | READ | Create a recovery branch before moving anything |
| Discard one local path | `git restore -- PATH` | RISK | Permanently removes its unstaged edit |
| Remove untracked files | `git clean -nd` then `git clean -d PATH` | RISK | Preview first; never use blanket cleanup casually |

## Flag reminders

- `--short` makes status machine-friendly; `--branch` adds the branch header.
- `--cached` means the index, also called the staging area.
- `--stat` summarizes a patch; omit it when the exact patch matters.
- `--ff-only` refuses an implicit merge or rebase when histories diverge.
- `--prune` removes stale remote-tracking refs; it does not delete local branches.
- `--include-untracked` adds untracked files to a stash; ignored files need `--all`.
- `--force` and `--force-with-lease` rewrite remote history and are never implied by a push request.
