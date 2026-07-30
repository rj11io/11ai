---
name: 11ai-bash-environment
description: "Inspect which shell is running and which one a script will use, the Bash version and available features, enabled shell options, PATH and command resolution, exported variables, startup file order, and locale settings, without changing anything. Use before writing or running a script, when a command behaves differently in a script than in a terminal, when a Bash feature is unavailable, or when the user asks whether the shell is set up."
---
# 11ai Bash environment

The shell running your terminal and the shell running a script are often not the same program, and that difference explains most surprising behaviour. Establish which interpreter, which version, and which `PATH` before writing or diagnosing anything. Keep this pass read-only.

## Identify the shell and version

```bash
echo "$SHELL"
ps -p $$ -o comm=
bash --version | head -1
echo "${BASH_VERSINFO[0]}.${BASH_VERSINFO[1]}"
command -v bash sh
ls -la /bin/sh
```

Three different questions, each with a different answer:

- `$SHELL` is the login shell recorded for the user. It is not necessarily what is running now.
- `ps -p $$ -o comm=` is the process actually interpreting this session.
- A script's interpreter is its shebang line, and nothing else. A `#!/bin/sh` script does not get Bash features even when Bash is installed.

On macOS, `/bin/bash` is Bash 3.2, which has no associative arrays, no `mapfile`, no `${var^^}`, and no `**` globbing. A current Bash installed by Homebrew lives elsewhere and is reached with `#!/usr/bin/env bash` only if it comes first on `PATH`. On many Linux distributions `/bin/sh` is a link to `dash`, which is not Bash at all.

```bash
grep -rn '^#!' --include='*.sh' . | head -20
```

## Read PATH and command resolution

```bash
echo "$PATH" | tr ':' '\n' | cat -n
command -v COMMAND
type -a COMMAND
hash -r
```

`type -a` lists every match in order, which is how a shell function or an alias shadowing a real command is found. `command -v` gives the one that will actually run.

Two `PATH` problems worth checking for: a relative or empty entry, which makes the current directory searchable and is a real hazard; and a directory appearing before the one the user expects.

```bash
echo "$PATH" | tr ':' '\n' | grep -n '^$\|^[^/]' || echo "no relative or empty PATH entries"
```

## Check options, variables, and startup files

```bash
echo "$-"
shopt -p | head -20
set -o | grep -E 'errexit|nounset|pipefail|xtrace'
env | cut -d= -f1 | sort | head -40
locale
umask
```

`echo "$-"` shows the single-letter options in force; `i` means interactive, `e` means errexit. A script that inherits nothing sees none of the interactive settings from your terminal.

List variable **names** with `env | cut -d= -f1`, not values. A full `env` dump prints tokens, keys, and connection strings into this transcript. To confirm one variable is set:

```bash
[[ -v MY_VAR ]] && echo "MY_VAR is set" || echo "MY_VAR is unset"
grep -c '^MY_VAR=' .env 2>/dev/null
```

Startup files are read in a different order depending on how the shell was started, which is why a variable present in a terminal is missing in a cron job or a script:

- **Interactive login shell** — `/etc/profile`, then the first of `~/.bash_profile`, `~/.bash_login`, `~/.profile`.
- **Interactive non-login shell** — `~/.bashrc`.
- **Non-interactive script** — none of them. Only `$BASH_ENV` if it is set.

```bash
ls -la ~/.bashrc ~/.bash_profile ~/.profile ~/.bash_login 2>/dev/null
```

## Interpretation

- **A command found in the terminal but not in a script** — the script did not read `~/.bashrc`, so a `PATH` addition or an alias defined there does not exist. Aliases are not available in non-interactive shells at all.
- **`bad substitution` or an unrecognised syntax error** — the interpreter is older Bash or is `dash`. Check the shebang and the version, not the syntax.
- **A script works when run as `bash script.sh` but not as `./script.sh`** — the shebang names a different interpreter, or the file is not executable.
- **Different sort or case behaviour between machines** — the locale differs. `LC_ALL=C` makes sorting and character ranges byte-based and reproducible.
- **Files created with unexpected permissions** — read `umask`; it subtracts from the default mode.
- **`command not found` for something clearly installed** — a stale hash table, fixed by `hash -r`, or a `PATH` that the current shell has not picked up.

## Report

State the interpreting shell and its version, the feature level available, which options are enabled, the `PATH` in order with any relative or empty entries flagged, whether the target command resolves and to what, the startup files that exist, the locale, and the umask. List variable names only, never values. End with the smallest next safe step, and hand off to `11ai-bash-setup` if a current Bash is missing or to `11ai-bash-troubleshooting` if a script is already failing.
