---
name: 11ai-operator-bash-scripting
description: "Write and repair Bash scripts with strict mode, correct quoting, argument parsing and validation, functions and local scope, arrays, cleanup traps, temporary files, clear exit codes, and messages on the right stream. Use when a script must be written or restructured, when a script fails silently or continues past an error, when word splitting breaks on filenames with spaces, or when temporary files are left behind."
---
# 11ai bash scripting

A shell script fails quietly by default: an unset variable expands to nothing, a failing command in a pipe is invisible, and an unquoted expansion splits on whitespace. The job of this skill is to make failure loud and the data handling correct, so a script that reports success actually did the work.

## Start from a safe skeleton

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

main() {
  local target="${1:?usage: script.sh TARGET}"
  echo "$target"
}

main "$@"
```

What each option prevents:

- `-e` stops on the first failing command instead of carrying on with bad state.
- `-u` turns a typo'd variable name into an error rather than an empty string. `rm -rf "$PREFX/build"` with `-u` fails; without it, it can delete `/build`.
- `-o pipefail` makes a pipeline fail when any stage fails. Without it, `curl ... | jq ...` reports success when the download failed.
- `-E` lets an `ERR` trap fire inside functions.

Know the limits of `-e` rather than trusting it blindly. It does not trigger inside a condition, on the left of `&&` or `||`, or in a command substitution used in an assignment. And `local var="$(failing_command)"` masks the failure, because `local` succeeds. Split it:

```bash
local var
var="$(failing_command)"
```

## Quote everything, and handle arrays

```bash
"$var"
"${array[@]}"
"$@"
"$(command)"
```

Every unquoted expansion is word-split on whitespace and then glob-expanded. It works in testing and breaks on the first filename with a space, which is why this is the most common real-world shell bug.

```bash
files=()
while IFS= read -r -d '' file; do
  files+=("$file")
done < <(find . -name '*.log' -print0)

printf '%s\n' "${files[@]}"
```

Use `-print0` with `read -d ''` so newlines in filenames cannot break the loop. Never loop over `$(ls)`, and never build a list as a space-separated string when an array will do. `"${array[@]}"` preserves elements; `"${array[*]}"` joins them into one word.

```bash
if (( ${#files[@]} == 0 )); then
  echo "no files matched" >&2
  exit 1
fi
```

An empty array under `-u` is safe with `"${array[@]}"` in Bash 4.4 and later; on older versions use `"${array[@]:-}"`.

## Validate arguments and report on the right stream

```bash
usage() {
  cat >&2 <<'USAGE'
usage: script.sh [-v] [-o OUT] TARGET
USAGE
  exit 2
}

main() {
  local verbose=0 out=""
  while getopts ':vo:' opt; do
    case "$opt" in
      v) verbose=1 ;;
      o) out="$OPTARG" ;;
      :) echo "option -$OPTARG requires a value" >&2; usage ;;
      *) echo "unknown option -$OPTARG" >&2; usage ;;
    esac
  done
  shift $((OPTIND - 1))

  local target="${1:?target required}"
  [[ -d "$target" ]] || { echo "not a directory: $target" >&2; exit 1; }
}
```

Diagnostics go to standard error, results go to standard output. A script that prints progress to stdout cannot be used in a pipeline. Reserve exit `0` for success, `1` for a runtime failure, and `2` for a usage error, so a caller can tell them apart.

Declare variables `local` inside functions. Without it every assignment is global and two functions using `i` corrupt each other.

## Clean up with traps

```bash
tmpdir=""
cleanup() {
  [[ -n "${tmpdir:-}" ]] && rm -rf -- "$tmpdir"
}
trap cleanup EXIT
trap 'echo "failed at line $LINENO" >&2' ERR

tmpdir="$(mktemp -d)"
```

An `EXIT` trap runs on success, on failure, and on interrupt, which is what makes it the right place for cleanup. Create temporary files with `mktemp`; a fixed path in `/tmp` is a collision and a symlink hazard.

Guard the removal so an unset variable cannot expand into `rm -rf -- ""`, and use `--` so a path beginning with a dash is not read as an option.

## Verify

```bash
bash -n script.sh
shellcheck script.sh
bash -x script.sh TARGET 2>&1 | head -40
./script.sh; echo "exit: $?"
```

`bash -n` parses without running. `shellcheck` catches the quoting and splitting bugs by inspection — run it before running the script, not after.

Test the failure paths deliberately: no arguments, a missing file, a path containing a space, and an interrupt partway through. A script is only as good as its behaviour when something is wrong.

## Guardrails

- Never build a destructive command from an unvalidated variable. Check the path exists and is what you expect before `rm`, and prefer a dry run that prints what would be removed.
- Never pipe a downloaded script into a shell. Fetch it, read it, then run it.
- Do not put secrets in a script or pass them as command line arguments, where they are visible in the process list. Read them from an ignored file or the environment.
- Do not use `eval` on anything derived from input.
- Do not parse the output of `ls`; use globs or `find -print0`.
- Report the files written, the strict-mode options set, the exit codes the script uses and what each means, the shellcheck result, and which failure paths were tested. Hand a still-failing script to `11ai-operator-bash-troubleshooting`, and lint or test setup to `11ai-operator-bash-testing`.
