---
name: 11ai-readme-updater
description: Review the entire codebase and bring its README files up to date — update existing READMEs with important or missing information, and create new READMEs in folders that need one, such as packages, apps, skills groups, and script directories. Always starts by pulling the latest changes and confirming the git tree is clean, and only commits or pushes (with Conventional Commits) when the user explicitly asks. Use whenever the user wants to refresh, audit, sync, fix, or generate READMEs or repo documentation, says the docs are stale or out of date, or asks "update the readmes" in any form.
---

# Readme Updater

## Overview

Use this skill to run a full README maintenance pass over the repository: check that every existing README still matches the code it describes, fill in important gaps, and add new READMEs where a folder clearly needs one.

Treat the code as the source of truth. A README's job is to let someone new understand what a folder is for, how to use it, and what to watch out for — without reading the code first. When the code and the README disagree, fix the README.

This is a documentation-only skill. It must never change source code, configs, or workflows. If a code problem turns up along the way, note it in the final summary instead of fixing it.

## Workflow

### 1. Sync and verify a clean starting state

This step is mandatory and comes before anything else.

1. Run `git status --porcelain`. If there is any output (uncommitted changes, untracked files), stop and tell the user the tree is dirty. Do not stash or discard anything on their behalf.
2. Run `git pull` on the current branch to fetch and merge the latest changes. If the pull fails or produces conflicts, stop and report — do not attempt conflict resolution as part of this skill.
3. Record the current commit hash (`git rev-parse HEAD`). This is the rollback point if the session needs to abort later.

### 2. Map the codebase and its READMEs

1. List every existing README: `git ls-files | grep -i readme`.
2. Map the repository layout: top-level folders, packages, apps, skills, scripts, and workflows. Read `package.json` files, CI workflows, and entry points to understand what each area actually does.
3. For each existing README, compare it against the code it describes. Look for:
   - Commands, scripts, or paths that no longer exist or have changed.
   - New features, packages, or folders the README never mentions.
   - Setup steps that are wrong or incomplete.
   - Stale version numbers, badges, or links.
4. Identify folders that deserve a new README. A folder qualifies when someone landing in it would not understand it from the file names alone — typically a publishable package, an app, a group of skills, or a scripts directory with non-obvious usage. Do not add READMEs to trivial folders (a folder with one self-explanatory file, build output, vendored code).

Read [references/readme-guidelines.md](./references/readme-guidelines.md) for what a good README contains and how to decide whether a folder needs one.

### 3. Update and create READMEs

1. Update existing READMEs first. Preserve each file's existing tone, structure, and formatting — extend and correct, don't rewrite from scratch unless the file is badly wrong.
2. Create new READMEs where step 2 found gaps. Keep them short and concrete: purpose, how to use it, anything surprising. A ten-line README that is accurate beats a long one that guesses.
3. Write in plain language: short everyday words, active voice, define any project-specific term the first time it appears.
4. Only state what the code confirms. Never invent commands, options, or behavior — if something can't be verified from the code, leave it out or mark it as a question in the final summary.

### 4. Abort if the session goes off the rails

Watch for these signs and abort rather than push through:

- The diff starts touching non-README files.
- You are troubleshooting or debugging (broken commands, failed verification, confusing repo state) instead of writing documentation — more than a couple of quick checks means the session has drifted.
- The change set has grown so large it can no longer be reviewed at a glance.

To abort: run `git checkout -- .` and `git clean -fd` **limited to the README files this session created or changed** (use the file list from step 3, never a blanket clean of the whole repo), confirm `git status` matches the rollback point from step 1, and tell the user what happened and why.

### 5. Commit and push — only when explicitly instructed

By default, leave the changes uncommitted in the working tree for the user to review. Do not commit or push unless the user has clearly asked for it in this session.

When instructed to push:

1. Group the changes into one commit (or a few logical ones) using Conventional Commits, e.g. `docs: update package readmes with current scripts and setup steps` or `docs(www): add readme for the website app`.
2. Use the `docs` type for all README work.
3. Push to the current branch. If the push is rejected, pull, re-check the tree, and retry once — a second failure means stop and report.

### 6. End with a session summary

Always close with a short plain-language summary covering:

- Which READMEs were updated and what changed in each.
- Which READMEs were created and why those folders needed one.
- Anything noticed but deliberately not done (code issues, unverifiable claims, folders that might need docs later).
- The git state at the end: clean, uncommitted changes pending review, or committed/pushed (with the commit hashes).
- If the session aborted: what triggered the abort and confirmation that the tree was restored.

## Quick Checks

- Tree was clean and pulled before any edit was made
- Every claim in the touched READMEs is backed by the current code
- The diff contains only README (and other pure-documentation) files
- Nothing was committed or pushed without an explicit instruction
- The reply ends with the session summary

## References

Read [references/readme-guidelines.md](./references/readme-guidelines.md) for the README quality checklist, the "does this folder need a README" test, and Conventional Commits examples for documentation changes.
