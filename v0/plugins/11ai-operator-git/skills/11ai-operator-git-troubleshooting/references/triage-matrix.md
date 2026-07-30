# Git troubleshooting triage matrix

Use the first matching symptom, collect the evidence in the middle column, and only then choose a repair. Preserve the current state until the user confirms a state-changing action.

| Symptom | Evidence | Common boundary | Safe next step |
| --- | --- | --- | --- |
| `not a git repository` | `git rev-parse --show-toplevel`, `pwd` | Wrong directory or missing repository | Locate the intended root; do not initialize a new repository without confirmation |
| Pull or switch says local changes would be overwritten | `git status --short`, `git diff --stat`, `git diff --cached --stat` | Dirty worktree | Review, commit, or explicitly shelve the named paths |
| `You are in the middle of a merge` | `git status`, `git diff --name-only --diff-filter=U` | Unfinished merge | Identify the merge owner and conflict paths; do not run a second pull |
| `You are currently rebasing` | `git status`, `git reflog -n 10` | Unfinished rebase | Inspect the todo/conflicts and ask whether to continue or abort |
| Push rejected as non-fast-forward | `git branch -vv`, `git log --oneline HEAD..@{upstream}`, `git log --oneline @{upstream}..HEAD` | Remote has commits not in local history | Ask merge versus rebase; never force-push implicitly |
| Branch is detached | `git branch --show-current`, `git log -1 --decorate`, `git reflog -n 10` | HEAD points at a commit, not a local branch | Preserve work with a new branch before switching if needed |
| Commit seems lost | `git reflog --date=local -n 30`, `git fsck --no-reflogs --unreachable` | Ref moved or commit became unreachable | Create a recovery branch at the confirmed commit |
| File is not shown by status | `git status --untracked-files=all`, `git check-ignore -v -- PATH` | Ignore rule or path mismatch | Confirm intent before changing `.gitignore` or force-adding |
| Remote cannot be reached | `git remote -v`, `git config --show-origin --get-regexp '^remote\.'`, exact error | URL, DNS, TLS, credential, or authorization | Classify the failing layer; do not disable verification |
