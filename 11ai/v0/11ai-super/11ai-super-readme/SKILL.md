---
name: 11ai-super-readme
description: Audit, update, and repeatedly improve a repository's README files until they meet a high documentation bar — fix existing READMEs that no longer match the code, add missing information, create new READMEs in folders that need one, and keep running fresh review passes until no material issue remains. Always fetches and pulls the latest repository changes (merging incoming changes cleanly when a fast-forward is not possible), requires a clean Git tree before editing, restores its changes if the operation becomes unsafe or troubleshooting-heavy, and commits or pushes with Conventional Commits only when explicitly instructed. Use when Codex needs to refresh, audit, sync, fix, or generate READMEs or repository documentation, when docs are stale or out of date, or when the user asks to "update the readmes" in any form and wants them iterated to a high-confidence quality bar.
---

# 11ai Super Readme

Synchronize the repository and establish a clean rollback point first. Then audit every README against the code it describes, fix what is wrong or missing, create READMEs where folders need one, and repeat with fresh review lenses until the exit criteria are met. Do not equate one improvement pass with finished documentation.

Treat the code as the source of truth. A README's job is to let someone new understand what a folder is for, how to use it, and what to watch out for — without reading the code first. When the code and the README disagree, fix the README.

Read [references/readme-guidelines.md](references/readme-guidelines.md) before auditing. Use its content checklist, issue-severity rubric, review lenses, and "does this folder need a README" test.

## Non-negotiable boundaries

- This is a documentation-only skill. Edit only README files and other pure-documentation files. Never change source code, configuration, scripts, or workflows — if a code problem turns up, record it in the session summary instead of fixing it.
- Refuse to edit unless the repository has been fetched, pulled, and confirmed clean. Never stash, commit, discard, or overwrite pre-existing work to manufacture a clean starting state.
- Track every file created or changed by the session in a change manifest. Preserve concurrent or unrelated work and never use blanket destructive cleanup commands.
- Only state what the code confirms. Never invent commands, options, or behavior — if something cannot be verified from the code, leave it out and record it as an open question in the session summary.
- Do not commit or push unless the user explicitly requests that exact action in the current session.
- Do not claim the documentation is "perfect" or "complete" in absolute terms. State what was inspected, changed, verified, and what remains open.

## Workflow

### 0. Sync and require a clean starting state

Complete this gate before reading deeply or editing any file:

1. Confirm the current directory belongs to the intended Git repository. Run `git status --porcelain`. If it returns any tracked, staged, or untracked change, stop and report the dirty paths. Do not stash, discard, commit, or absorb them into the session.
2. Record the current branch and upstream. Run `git fetch --prune`, then `git pull --ff-only` on the current branch. If a fast-forward is impossible because the local and remote branches have diverged, a clean merge of the incoming changes is allowed to proceed: run `git pull --no-rebase` and let Git create the merge commit on its own. "Clean" means Git completes the merge with no conflicts — if any conflict appears, run `git merge --abort`, stop before editing, and report the conflicting paths. Never resolve merge conflicts as part of this gate. Also stop and report if the repository is detached, has no usable upstream, or the fetch/pull fails.
3. Run `git status --porcelain` again. Continue only if it is empty.
4. Record `git rev-parse HEAD` as `ROLLBACK_HEAD` — after the pull, and after the merge commit if one was created, so the rollback point already includes the incoming changes. Maintain a change manifest containing every tracked path modified and every untracked path created during the session. Update it after each editing batch.

The post-pull `ROLLBACK_HEAD` and clean tree are the exact local state to restore if the operation aborts. Do not begin the README routine without both.

### 1. Map the codebase and its READMEs

1. List every existing README: `git ls-files | grep -i readme`.
2. Map the repository layout: top-level folders, packages, apps, skills, scripts, and workflows. Read `package.json` files, CI workflows, entry points, and configuration to understand what each area actually does — the audit is only as good as this map.
3. Build a finding ledger. For each existing README, compare it against the code it describes and record every issue with its severity from the rubric in the reference file:
   - Commands, scripts, or paths that no longer exist or have changed.
   - New features, packages, or folders the README never mentions.
   - Setup steps that are wrong or incomplete.
   - Stale version numbers, badges, or links.
   - Duplicated content that will drift apart across files.
4. Identify folders that deserve a new README. A folder qualifies when someone landing in it would not understand it from the file names alone — typically a publishable package, an app, a group of skills, or a scripts directory with non-obvious usage. Do not add READMEs to trivial folders (a folder with one self-explanatory file, build output, vendored code).

### 2. Update and create READMEs

Work from the finding ledger, highest severity first.

1. Update existing READMEs first. Preserve each file's existing tone, structure, and formatting — extend and correct, don't rewrite from scratch unless the file is badly wrong.
2. Create new READMEs where the audit found gaps. Keep them short and concrete: purpose, how to use it, anything surprising. A ten-line README that is accurate beats a long one that guesses.
3. Write in plain language: short everyday words, active voice, define any project-specific term the first time it appears.
4. Verify every claim before writing it: commands against `package.json` or the script file, paths against the tree, environment variables against the code that reads them.
5. After each editing batch, update the change manifest and compare it with `git status --porcelain`. Any unexplained path is an abort signal until ownership is established.

### 3. Continue with fresh review passes

Do not stop after the first pass. Re-read the changed documentation with a different lens each time:

- **Newcomer lens**: open each README as someone who has never seen the repo. Can they tell what the folder is for, run the commands, and avoid the gotchas without reading the code?
- **Accuracy lens**: re-verify every command, path, env var, link, and behavioral claim against the current code, including ones the first pass did not touch.
- **Coverage lens**: walk the repository tree again and confirm nothing important is undocumented and no README was missed.
- **Consistency lens**: check that READMEs agree with each other, cross-link instead of duplicating, and index files (a root README that lists its children) match what actually exists.

After any new material finding (severity high or above in the rubric), fix it and restart the clean-pass count. Finish only when two consecutive fresh passes find no new material issue and all exit criteria below are satisfied. Avoid endless cosmetic churn: once further edits are wording preference rather than correction, record any remaining low-value ideas in the summary and stop.

### 4. Abort and restore the clean state when necessary

Abort instead of pushing through when any of these occurs:

- the diff contains non-documentation files, or unexpected, unrelated, or unowned changes;
- troubleshooting or debugging (broken commands, failed verification, confusing repo state) starts to outweigh the documentation work — more than two focused attempts on the same problem without progress;
- the change set has grown so large it can no longer be reviewed confidently.

On abort:

1. Stop and inspect `git status --porcelain` against the change manifest.
2. If every change belongs to this session, restore tracked paths from `ROLLBACK_HEAD` with path-scoped `git restore --source="$ROLLBACK_HEAD" --staged --worktree -- <paths>`, then remove only untracked paths recorded as created by this session.
3. Never use `git reset --hard`, blanket `git restore .`, blanket `git clean`, or any command that can erase an unowned or concurrent change.
4. If an unexplained concurrent change exists, preserve it. Restore only manifest-owned paths, report the remaining path, and do not falsely claim the tree is clean.
5. Verify that `git rev-parse HEAD` still equals `ROLLBACK_HEAD` and `git status --porcelain` is empty. If either check fails, report the exact difference and stop.
6. End with the session summary, including the abort trigger and restoration result.

### 5. Commit and push only when explicitly instructed

By default, leave the changes uncommitted in the working tree for the user to review. Do not commit or push unless the user has clearly asked for it in this session, and defer any authorized commit until the exit criteria pass.

When instructed:

1. Stage only paths in the change manifest and inspect the staged diff.
2. Group the changes into one commit (or a few logical ones) using Conventional Commits with the `docs` type, e.g. `docs: update package readmes with current scripts and setup steps` or `docs(www): add readme for the website app`.
3. Push the current branch without force, only if a push was explicitly requested. If the push is rejected, pull again under the same rules as the sync gate (fast-forward first, a conflict-free merge is allowed, any conflict means abort the merge and stop), re-check the tree, and retry once — a second failure means stop and report. Never force-push or rewrite history as part of this skill.

## Exit criteria

All of the following must be true before declaring the documentation pass complete:

- Every finding in the ledger with severity high or above is fixed, or explicitly recorded as blocked with the reason.
- Every claim in the touched READMEs is verified against the current code — no guessed commands, paths, or behavior.
- Every folder that meets the "needs a README" test has one, and no trivial folder gained one.
- READMEs are consistent with each other: no contradictions, no drifting duplicates, index files match reality.
- Two consecutive fresh passes (step 3) produced no new material finding.
- The diff contains only documentation files, and every changed or created path appears in the change manifest.
- Nothing was committed or pushed without an explicit instruction.

## Session summary

Always end with a concise plain-language session summary, whether the operation succeeded, blocked, or aborted. Lead with the outcome, then report:

- starting branch, post-pull `ROLLBACK_HEAD`, fetch/pull result (including whether a merge commit was created to absorb incoming changes), and clean-start confirmation;
- which READMEs were updated and what changed in each;
- which READMEs were created and why those folders needed one;
- how many review passes ran and what each fresh lens found;
- anything noticed but deliberately not done: code issues, unverifiable claims, folders that might need docs later, remaining low-value polish ideas;
- final Git state: clean, uncommitted changes pending review, or committed/pushed with hashes — explicitly stating when neither was requested;
- for an abort, the trigger, paths reverted, final `HEAD`, and whether the clean state was fully restored.
