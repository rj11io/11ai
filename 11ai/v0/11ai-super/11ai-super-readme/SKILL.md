---
name: 11ai-super-readme
description: "Audit, update, and repeatedly improve a repository's README files until they meet a high documentation bar — fix existing READMEs that no longer match the code, add missing information, create new READMEs in folders that need one, and keep running fresh review passes until no material issue remains. Use when Codex needs to refresh, audit, fix, or generate READMEs or repository documentation, when docs are stale or out of date, or when the user asks to \"update the readmes\" in any form and wants them iterated to a high-confidence quality bar. Stops and reports when the change set becomes unmanageable or troubleshooting outweighs progress."
---

# 11ai Super Readme

Audit every README against the code it describes, fix what is wrong or missing, create READMEs where folders need one, and repeat with fresh review lenses until the exit criteria are met. Do not equate one improvement pass with finished documentation.

Treat the code as the source of truth. A README's job is to let someone new understand what a folder is for, how to use it, and what to watch out for — without reading the code first. When the code and the README disagree, fix the README.

Read [references/readme-guidelines.md](references/readme-guidelines.md) before auditing. Use its content checklist, issue-severity rubric, review lenses, and "does this folder need a README" test.

## Non-negotiable boundaries

- This is a documentation-only skill. Edit only README files and other pure-documentation files. Never change source code, configuration, scripts, or workflows — if a code problem turns up, record it in the session summary instead of fixing it.
- Keep a session change manifest — every file this session creates, modifies, or deletes — and reconcile it after each editing batch. Preserve concurrent or unrelated work and never use blanket destructive cleanup commands.
- Only state what the code confirms. Never invent commands, options, or behavior — if something cannot be verified from the code, leave it out and record it as an open question in the session summary.
- Do not claim the documentation is "perfect" or "complete" in absolute terms. State what was inspected, changed, verified, and what remains open.

## Workflow

### 1. Map the codebase and its READMEs

1. List every existing README file in the repository, for example `find . -iname 'readme*' -not -path '*/node_modules/*'`.
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
5. After each editing batch, update the change manifest and confirm every changed or created path in the project matches it. Any unexplained path is an abort signal until ownership is established.

### 3. Continue with fresh review passes

Do not stop after the first pass. Re-read the changed documentation with a different lens each time:

- **Newcomer lens**: open each README as someone who has never seen the repo. Can they tell what the folder is for, run the commands, and avoid the gotchas without reading the code?
- **Accuracy lens**: re-verify every command, path, env var, link, and behavioral claim against the current code, including ones the first pass did not touch.
- **Coverage lens**: walk the repository tree again and confirm nothing important is undocumented and no README was missed.
- **Consistency lens**: check that READMEs agree with each other, cross-link instead of duplicating, and index files (a root README that lists its children) match what actually exists.

After any new material finding (severity high or above in the rubric), fix it and restart the clean-pass count. Finish only when two consecutive fresh passes find no new material issue and all exit criteria below are satisfied. Avoid endless cosmetic churn: once further edits are wording preference rather than correction, record any remaining low-value ideas in the summary and stop.

### 4. Abort when the work becomes unsafe

Abort instead of continuing when any of these occurs:

- the change set contains non-documentation files, or unexpected, unrelated, or unowned changes;
- troubleshooting or debugging (broken commands, failed verification, confusing project state) starts to outweigh the documentation work — more than two focused attempts on the same problem without progress;
- the change set has grown so large it can no longer be reviewed confidently.

On abort:

1. Stop processes started by the session and capture the failure evidence and abort reason for the summary.
2. Compare the project's current state with the session change manifest. Preserve any path whose ownership is uncertain.
3. Stop the routine and return the aborted-session summary, listing exactly which session changes remain in place. Do not immediately restart the entire operation.

## Exit criteria

All of the following must be true before declaring the documentation pass complete:

- Every finding in the ledger with severity high or above is fixed, or explicitly recorded as blocked with the reason.
- Every claim in the touched READMEs is verified against the current code — no guessed commands, paths, or behavior.
- Every folder that meets the "needs a README" test has one, and no trivial folder gained one.
- READMEs are consistent with each other: no contradictions, no drifting duplicates, index files match reality.
- Two consecutive fresh passes (step 3) produced no new material finding.
- The complete change set is intentional, reviewable, limited to documentation files, and matches the session manifest.

## Session summary

Always end with a concise plain-language session summary, whether the operation succeeded, blocked, or aborted. Lead with the outcome, then report:

- which READMEs were updated and what changed in each;
- which READMEs were created and why those folders needed one;
- how many review passes ran and what each fresh lens found;
- anything noticed but deliberately not done: code issues, unverifiable claims, folders that might need docs later, remaining low-value polish ideas;
- final state of the session's changes: the complete manifest of paths created, modified, or deleted;
- for an abort: the trigger, which session changes remain in place, and any path preserved because its ownership was uncertain.
