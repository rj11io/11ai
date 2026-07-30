---
name: 11ai-operator-git-hooks
description: "Write, install, debug, and bypass local Git hooks, covering the hook events and their arguments, why hooks are not committed and how hooksPath changes that, staged-file-only checks, exit codes and blocking behaviour, reading stdin for pre-push and pre-receive, keeping hooks fast, and diagnosing a hook that does not fire. Use when a hook must be added or repaired, when a hook blocks work incorrectly, or when a hook is silently not running."
---
# 11ai Git hooks

Two facts govern every hook problem. Hooks live in `.git/hooks`, which is not committed, so a hook that works on your machine does not exist on anyone else's. And a hook is advisory: `--no-verify` skips it, so anything that must not be bypassed has to run server-side as well.

## Inspect first

```bash
ls -la "$(git rev-parse --git-dir)/hooks"
git config --get core.hooksPath
ls -la "$(git config --get core.hooksPath 2>/dev/null || echo .git/hooks)"
git config --list --show-origin | grep -i hook
```

Check `core.hooksPath` before anything else. When it is set, Git reads hooks from **that** directory only and ignores `.git/hooks` entirely — which is why a hook placed in `.git/hooks` silently never fires on a repository managed by a hook manager.

Then check the three things that stop a hook running:

```bash
test -x .git/hooks/pre-commit && echo "executable" || echo "NOT executable"
head -1 .git/hooks/pre-commit
head -1 .git/hooks/pre-commit | cat -A | head -1
```

A hook must be executable, must have a valid shebang, and must not be named with a `.sample` suffix. Windows line endings in the shebang produce `bad interpreter` — visible only with `cat -A` as a trailing `^M`.

## Know the events and their inputs

| Hook | Fires | Input | Blocks on non-zero |
| --- | --- | --- | --- |
| `pre-commit` | before the message editor | none | yes |
| `prepare-commit-msg` | before editing | message file path | yes |
| `commit-msg` | after the message is written | message file path | yes |
| `post-commit` | after the commit | none | no |
| `pre-push` | before a push | refs on stdin | yes |
| `pre-rebase` | before a rebase | upstream, branch | yes |
| `post-checkout` | after checkout | old ref, new ref, flag | no |
| `post-merge` | after a merge | squash flag | no |

A non-zero exit blocks the operation for the `pre-` and `-msg` hooks. `post-` hooks cannot block anything, so validation belongs before, not after.

## Write a hook that people keep

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

mapfile -t staged < <(git diff --cached --name-only --diff-filter=ACM -z | tr '\0' '\n')
(( ${#staged[@]} == 0 )) && exit 0

shell_files=()
for f in "${staged[@]}"; do [[ "$f" == *.sh ]] && shell_files+=("$f"); done
(( ${#shell_files[@]} == 0 )) && exit 0

if ! shellcheck "${shell_files[@]}"; then
  echo "pre-commit: shellcheck failed; fix or re-run with --no-verify" >&2
  exit 1
fi
```

The rules that decide whether a hook survives contact with a team:

- **Staged files only**, via `git diff --cached --name-only --diff-filter=ACM`. The `ACM` filter excludes deletions, which would otherwise be passed to a linter as missing files.
- **Exit early when nothing matches.** A hook that runs a whole-repository check on every commit gets bypassed permanently.
- **Under a couple of seconds.** Tests belong in the pipeline.
- **Check, do not rewrite.** A hook that reformats files changes what is being committed after the author reviewed it, and the commit no longer matches what they saw.
- **A message naming the fix**, on standard error. A hook that blocks with no explanation gets disabled.

For `commit-msg`, the message file is the first argument:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
grep -qE '^(feat|fix|docs|test|refactor|perf|build|ci|chore)(\(.+\))?!?: .+' "$1" || {
  echo "commit-msg: use a Conventional Commits subject" >&2
  exit 1
}
```

For `pre-push`, refs arrive on standard input as `local_ref local_sha remote_ref remote_sha`, one per line, with an all-zero local sha meaning a deletion:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
while read -r local_ref local_sha remote_ref remote_sha; do
  [[ "$local_sha" =~ ^0+$ ]] && continue
  if git log --format=%s "$local_sha" --not --remotes | grep -q '^fixup!'; then
    echo "pre-push: fixup commits present; squash before pushing" >&2
    exit 1
  fi
done
```

## Share hooks across the team

Hooks are not committed, so point Git at a tracked directory:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/*
git update-index --chmod=+x .githooks/pre-commit
git ls-files -s .githooks
```

Mode `100755` in `git ls-files -s` is required; a hook committed as `100644` is not executable on a fresh clone and silently never runs.

`core.hooksPath` is local configuration, so each contributor still has to set it once. Put that one command in the contributing instructions or in a setup script — there is no way to make it automatic from the repository alone.

## Bypass and debug

```bash
git commit --no-verify
git push --no-verify
```

`--no-verify` skips `pre-commit`, `commit-msg`, and `pre-push`. It is legitimate for an emergency, and it is exactly why a hook is not a security control. Do not disable a hook to get past a genuine finding; fix the finding, or bypass once and say so.

```bash
bash -x .git/hooks/pre-commit
git config --get core.hooksPath
GIT_TRACE=1 git commit -m "test" 2>&1 | grep -i hook
```

When a hook does not fire, check in this order: `core.hooksPath` pointing elsewhere, the file not executable, a `.sample` suffix, a bad or carriage-return-terminated shebang, and the hook running in a non-interactive shell with a different `PATH` than your terminal.

## Verify and report

Test both directions: make a change the hook should reject and confirm it blocks with a clear message, then a clean one and confirm it passes. A hook that has only been seen passing has not been tested.

Report which hooks exist and where they are read from, what each one checks and on which files, its measured runtime, the exit codes and messages, whether it is advisory only and what enforces the same rule server-side, and the result of both the blocking and passing tests. State what each contributor must run on their own machine for the hooks to take effect.
