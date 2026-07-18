---
name: 11ai-git-troubleshooting
description: "Diagnose Git and repository-state failures from reproducible evidence, covering dirty trees, conflicts, detached HEAD, upstream divergence, rejected pushes, remotes, credentials, and recovery. Use when Git reports an error or the repository behaves unexpectedly."
---
# 11ai Git troubleshooting

Separate observed facts from hypotheses. Preserve the current state while diagnosing: do not reset, clean, stash, force-push, delete branches, rewrite history, or alter credentials unless the user explicitly asks for that repair after the impact is clear.

## Collect focused evidence

Start with the failure text and the repository boundary:

```bash
git --version
git rev-parse --show-toplevel
git branch --show-current
git status --short --branch --untracked-files=all
git remote -v
git branch -vv
git log --oneline --decorate --graph -n 15
```

Choose only the probes relevant to the failure:

```bash
git diff --check
git diff --name-only --diff-filter=U
git ls-files -u
git rev-list --left-right --count HEAD...@{upstream}
git config --show-origin --get-regexp '^(branch\.|remote\.|user\.|credential\.)'
git reflog --date=local -n 20
git check-ignore -v -- path/to/file
```

Redact tokens, passwords, credential-helper output, private remote URLs, and sensitive filesystem paths. Preserve exact error text, command, exit code, branch, and relevant commit IDs.

## Classify before fixing

- **Not a repository or wrong directory:** verify the root and worktree before editing or changing directories.
- **Dirty tree blocks an operation:** identify which paths are staged, unstaged, untracked, or conflicted; never silently stash or discard them.
- **Detached HEAD:** locate the intended branch and current commit; preserve the detached work with a branch before switching if the user wants to keep it.
- **Merge or rebase conflict:** list unmerged paths with `git diff --name-only --diff-filter=U` and inspect conflict stages; do not invent resolutions.
- **Diverged histories:** compare both sides and ask whether the user wants merge, rebase, or a separate branch; do not reset one side.
- **Non-fast-forward push rejection:** identify local and remote commits; do not force-push as a shortcut.
- **Authentication, DNS, TLS, or remote failure:** separate URL/configuration, network, credential, and authorization evidence; never disable TLS verification or print secrets.
- **Missing or ignored file:** use `git status --untracked-files=all` and `git check-ignore -v`; check `.gitignore` before changing it.
- **Unexpected commit or missing work:** inspect `reflog`, then create a recovery branch before attempting reset or restore.

## Remediation discipline

Give a confidence level and the smallest next command. If the proposed fix changes local or remote state, state its scope and require confirmation when it was not already requested. After a repair, rerun the original failing command or a direct equivalent and verify branch, worktree, and upstream state.

Conclude with the failing boundary, evidence, root cause or remaining uncertainty, exact fix applied or proposed, and verification result. Hand off to `11ai-git-recovery` for undo/recovery decisions and `11ai-git-sync` for explicit synchronization choices.
