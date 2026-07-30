---
name: 11ai-operator-git-pull-requests
description: "Open, inspect, review, and land pull requests from the command line, covering a reviewable branch and description, draft state, reading check results and failing logs, review comments and approvals, keeping a branch current without losing review context, merge strategies and what each does to history, and cleaning up after a merge. Use when a pull request must be created, when its checks or reviews must be read, when review feedback must be addressed, or when it is ready to land."
---
# 11ai Git pull requests

Opening, approving, and merging a pull request are outward-facing actions: they notify people and can deploy code. Each one needs explicit instruction for that specific pull request — never open or merge one because it seems ready.

## Inspect first

```bash
git status --short --branch
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
gh auth status
gh pr status
gh pr list --limit 10 --json number,title,isDraft,reviewDecision,statusCheckRollup
```

Note `...` in the diff — three dots compares against the merge base, which is what a reviewer sees. Two dots compares against the current tip of main and shows unrelated changes as if they were yours.

Read the commits before opening anything. A branch with `fixup!` commits, an unrelated change, or a merge commit from main is harder to review than it needs to be.

## Open a reviewable pull request

```bash
git push -u origin BRANCH
gh pr create --base main --title "TITLE" --body-file .github/pr-body.md --draft
gh pr create --base main --fill
gh pr ready NUMBER
```

Open as a draft when the work is not finished. A draft does not request review, so nobody spends attention on something still moving.

The description should say what changed, why, how it was verified, and anything a reviewer should look at closely. Write it into a file rather than a long shell argument so newlines survive.

Two details that decide whether the pull request is easy to land:

- **Confirm the base branch.** A pull request opened against the wrong base shows a huge unrelated diff.
- **The title becomes the commit subject** when the repository squash-merges, so it must satisfy any commit-message convention the repository enforces.

Never push a branch containing a secret, even to a draft. Once pushed it is in the remote's history and rotating the credential is the only real fix.

## Read checks and reviews

```bash
gh pr checks NUMBER
gh pr checks NUMBER --watch
gh run list --branch BRANCH --limit 5
gh run view RUN_ID --log-failed
gh pr view NUMBER --json reviewDecision,mergeable,mergeStateStatus,reviews
gh pr diff NUMBER
```

`gh run view --log-failed` prints only the failing step, which is far faster than opening the run in a browser.

Read `mergeable` and `mergeStateStatus` together. `BLOCKED` means a required review or check is missing; `DIRTY` means a conflict with the base; `BEHIND` means the base moved and the repository requires the branch to be current.

A red check is information, not a reason to rerun. Read the log, decide whether it is a real failure or an unreliable test, and fix the cause.

## Address feedback and stay current

```bash
gh pr view NUMBER --comments
gh api "repos/:owner/:repo/pulls/NUMBER/comments" --jq '.[] | "\(.path):\(.line) \(.user.login): \(.body)"'
git commit -m "fix: address review feedback on validation"
git push
```

Push additional commits rather than force-pushing while review is in progress. A force-push discards the diff a reviewer was reading and their in-progress comments lose their anchors. Save any history tidying for just before merge, and say you are about to do it.

To bring in a moved base, prefer a merge during review because it preserves what reviewers have already seen:

```bash
git fetch origin
git merge origin/main
git push
```

A rebase produces cleaner history and rewrites every commit, so use it before review starts or after it finishes, not in the middle.

Never resolve a conflict by guessing. If a merge conflicts in code you do not understand, stop and report the paths.

## Land it

```bash
gh pr merge NUMBER --squash --delete-branch
gh pr merge NUMBER --merge --delete-branch
gh pr merge NUMBER --rebase --delete-branch
```

- **Squash** collapses the branch into one commit. The pull-request title becomes the subject, so it must be conventional.
- **Merge** keeps every commit plus a merge commit, preserving the true shape of the work.
- **Rebase** replays commits onto the base with no merge commit, and each one must stand on its own.

Use whichever the repository already uses — read recent history on the base branch rather than choosing.

Merge only when explicitly told to, for that pull request. Confirm first: checks green, required reviews approved, the base correct, and no unresolved conversations. Merging can deploy, so say what will happen.

```bash
gh pr view NUMBER --json state,mergedAt,mergeCommit
git checkout main && git pull --ff-only
git branch -d BRANCH
git remote prune origin
```

## Report

State the pull request number and URL, its base and head branches, the commit and file summary against the merge base, its draft state, every check with its result and the failing step's cause, the review decision and any unresolved conversations, what was pushed to address feedback, whether history was rewritten and when, the merge strategy used and on whose instruction, and the post-merge cleanup. Never include a secret found in a diff — report that it exists and must be rotated.
