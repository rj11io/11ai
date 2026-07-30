---
name: 11ai-bash-troubleshooting
description: "Diagnose failing or misbehaving Bash scripts from reproducible evidence, covering syntax and interpreter mismatches, unbound variables, word splitting, silent pipeline failures, missing commands and PATH differences, permission and line-ending problems, hangs waiting on input, traps not firing, and exit codes. Use when a script fails, produces wrong output, works in a terminal but not in a script or cron job, or hangs without finishing."
---
# 11ai bash troubleshooting

Separate observed facts from theories. Get the exact error text, the exit status, and the interpreter that actually ran, then identify which layer failed before changing anything. Do not add `|| true`, remove `set -e`, or loosen quoting to make a symptom disappear — each hides the failure rather than fixing it.

## Evidence collection

```bash
bash --version | head -1
head -1 script.sh
ls -la script.sh
bash -n script.sh
shellcheck script.sh
bash -x script.sh ARGS 2>&1 | tail -40
./script.sh ARGS; echo "exit: $?"
```

`bash -x` traces each expanded command before running it, which is the single most useful tool here: it shows what a variable actually held, not what it was supposed to hold. For a long script, narrow the trace:

```bash
set -x
suspect_section
set +x
```

```bash
PS4='+ ${BASH_SOURCE##*/}:${LINENO}: ' bash -x script.sh 2>&1 | tail -40
```

That `PS4` adds the file and line number to every traced line, which turns a wall of output into a location.

Trace output includes expanded variable values, so it can print tokens and connection strings. Redact before quoting it, and never paste a full trace of a script that handles credentials.

Capture the exit status and the pipeline stages separately:

```bash
command1 | command2; echo "${PIPESTATUS[@]}"
```

## Classify the failure

- **`syntax error near unexpected token`, or `bad substitution`** — the interpreter is not the one you think. Read the shebang and the version. A `#!/bin/sh` script gets `dash` on many systems and Bash 3.2 on macOS, neither of which has `[[ ]]` with regex, associative arrays, or `${var^^}`. This is an interpreter problem, not a syntax problem.
- **`unbound variable`** — `set -u` doing its job. The variable is genuinely unset, usually a typo or a missing argument. Fix the source; do not remove `-u`. For a legitimately optional variable use `"${var:-}"`.
- **Wrong behaviour with a filename containing a space** — an unquoted expansion word-split. `shellcheck` names the line. Quote it and pair `find -print0` with `read -d ''`.
- **A pipeline reports success but produced nothing** — no `pipefail`, so only the last command's status was seen. Add `set -o pipefail` and read `PIPESTATUS`.
- **`command not found` in a script but the command works in the terminal** — the script did not read `~/.bashrc`, so a `PATH` addition or a function defined there does not exist. Aliases never work in non-interactive shells. Set `PATH` in the script or use an absolute path.
- **`permission denied` running the script** — the file is not executable. `chmod +x`. If it is executable, the interpreter in the shebang may not exist.
- **`bad interpreter: no such file or directory` on a shebang that looks right** — Windows line endings. The `\r` becomes part of the interpreter path. Confirm with `head -1 script.sh | cat -A` and fix with `tr -d '\r'`.
- **A script hangs with no output** — something is waiting on standard input. A `read` with no input, an `ssh` at a password prompt, or a command expecting a terminal. Add `</dev/null` to identify it, and `BatchMode=yes` for `ssh`.
- **A script continues past a failure** — `set -e` does not fire inside a condition, on the left of `&&` or `||`, or in `local var="$(cmd)"`. Split the assignment from the declaration.
- **An `EXIT` trap did not clean up** — the trap was registered after the failure point, or the process was killed with `SIGKILL`, which cannot be trapped.
- **Exit `137`** — killed by `SIGKILL`, almost always out of memory. Exit `124` is a `timeout` expiry, `126` not executable, `127` not found, `130` user interrupt.
- **Works locally, fails in cron** — cron runs with a minimal environment, no `~/.bashrc`, a different working directory, and no terminal. Set `PATH` explicitly, use absolute paths, `cd` at the top, and redirect output to a log.
- **Different sort order or case behaviour between machines** — locale. Set `LC_ALL=C` where the result must be reproducible.

## Remediation discipline

1. Reproduce with the smallest failing command, in the same interpreter and environment as the failure. A bug that only appears in cron must be reproduced there or with `env -i`.
2. Run `shellcheck` before hand-reading the script. It finds the quoting and splitting classes by inspection.
3. Fix the cause, not the symptom. Adding `|| true`, removing `set -euo pipefail`, or unquoting an expansion makes the script report success while doing the wrong thing.
4. Make one change, then rerun the original failing invocation.
5. State confidence as high, medium, or low and name the evidence you are missing.
6. Before rerunning a script that writes or deletes, check what the failed run already did. A script that failed halfway may have left partial state, and rerunning it can double-apply.

Hand off when the cause is elsewhere: a missing or old Bash to `11ai-bash-setup`, an environment or `PATH` question to `11ai-bash-environment`, a restructure to `11ai-bash-scripting`, and adding coverage so the bug cannot return to `11ai-bash-testing`.

## Report

Conclude with: the interpreter and version that ran, the exact error text and exit status, the traced line where it failed, the root cause or remaining uncertainty, the fix applied or proposed and why it addresses the cause rather than the symptom, any partial state the failed run left behind, and the verification result. Redact credentials from trace output.
