---
name: 11ai-git-stage
description: "Review and stage only the intended Git paths or hunks, or safely unstage them without committing. Use when the user wants to prepare a commit, inspect the index, or remove a path from staging."
---
# 11ai Git stage

Own the index only. This skill can be used by itself and never creates a commit, pushes, or discards working-tree content.

## Review before staging

Establish the branch and current ownership before changing the index:

```bash
git status --short --branch --untracked-files=all
git diff --stat
git diff -- path/to/file
git diff --cached --stat
```

Check suspicious files for credentials, generated output, large artifacts, and unrelated edits. Ask for a path or hunk boundary when the request is ambiguous; do not infer a commit from all available changes.

## Stage deliberately

Use the narrowest command that matches the request:

```bash
git add -- path/to/file
git add -p -- path/to/file
git restore --staged -- path/to/file
git restore --staged -- .
```

`git add -p` is the preferred choice when a file mixes related and unrelated edits. `git restore --staged` only changes the index; it does not delete the working-tree version. Avoid `git add -A`, `git add .`, and `git add -u` unless the user explicitly selected that scope and the resulting file list was previewed.

## Verify the index

Finish with:

```bash
git status --short --branch --untracked-files=all
git diff --cached --check
git diff --cached --stat
git diff --cached -- path/to/file
```

Report exactly what is staged and what remains unstaged or untracked. Stop before committing; use `11ai-git-commit` only when the user separately asks to commit.
