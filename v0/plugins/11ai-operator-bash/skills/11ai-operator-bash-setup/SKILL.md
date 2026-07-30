---
name: 11ai-operator-bash-setup
description: "Install a current Bash alongside the system shell, choose the right startup file for a setting, extend PATH without breaking it, add shellcheck and shfmt, and set up an executable script skeleton with a shebang that resolves to the intended interpreter. Use when Bash is too old for a needed feature, when a PATH or environment change must persist, when script tooling is missing, or when a new script must be scaffolded."
---
# 11ai Bash setup

Two things get changed here, and both are shared state: the machine's shells, and the user's startup files. A wrong edit to a startup file can leave a shell that will not open, so read the current state first and append rather than rewrite. `11ai-operator-bash-environment` inspects without touching; run it first.

## Read the current state

```bash
bash --version | head -1
echo "${BASH_VERSINFO[0]}"
command -v bash shellcheck shfmt
ls -la ~/.bashrc ~/.bash_profile ~/.profile 2>/dev/null
echo "$PATH" | tr ':' '\n' | cat -n
```

Decide whether an install is actually needed. Bash 4 or later brings associative arrays, `mapfile`, `${var^^}`, and `**` globbing; on macOS `/bin/bash` is 3.2 and has none of them.

Do not replace or remove the system shell. Other software depends on it, and on macOS it cannot be replaced. Install a current Bash alongside it and point scripts at that.

## Install Bash and the script tooling

```bash
brew install bash shellcheck shfmt
```

```bash
sudo apt-get install -y bash shellcheck
```

```bash
command -v -p bash
bash --version | head -1
```

Read [references/setup.md](references/setup.md) for the per-platform installs, the startup file decision table, safe `PATH` editing, the login shell change, and the script skeleton.

`shellcheck` is worth installing in every case. It catches unquoted expansions and word-splitting bugs that only appear when a filename contains a space, which is exactly the class of bug that reaches production.

## Choose the right startup file

This is the decision that matters, because the same line in the wrong file silently does nothing:

- **`~/.bashrc`** — interactive settings: aliases, prompt, shell options, completion. Read by interactive non-login shells.
- **`~/.bash_profile`** — login shell settings, and the conventional place to source `~/.bashrc` so a login shell also gets it.
- **Neither is read by a non-interactive script.** A `PATH` change needed by a cron job or a script must be set in that job, in a wrapper, or in the service definition — not in `~/.bashrc`.

Bash reads only the **first** of `~/.bash_profile`, `~/.bash_login`, `~/.profile` that exists. Creating `~/.bash_profile` on a machine that used `~/.profile` silently stops the older file being read; check before adding one.

## Extend PATH safely

```bash
export PATH="/opt/homebrew/bin:$PATH"
```

Three rules. Always include the existing `$PATH` — an assignment without it breaks every command in that shell. Never add a relative or empty entry, which makes the current directory searchable. And append the new line rather than rewriting the file:

```bash
cp ~/.bashrc ~/.bashrc.backup
printf '\nexport PATH="/opt/homebrew/bin:$PATH"\n' >> ~/.bashrc
```

Take the backup first, then verify in a **new** shell before closing the working one, so a mistake is still recoverable.

## Scaffold a script

```bash
cat > script.sh <<'SCRIPT'
#!/usr/bin/env bash
set -Eeuo pipefail

main() {
  local target="${1:?usage: script.sh TARGET}"
  echo "$target"
}

main "$@"
SCRIPT
chmod +x script.sh
```

`#!/usr/bin/env bash` finds Bash on `PATH` rather than assuming a location, which is what makes a script portable between macOS and Linux. Use `#!/bin/bash` only when the path is known and fixed. Never use `#!/bin/sh` for a script using Bash features; on many systems that is `dash`.

## Verify

```bash
bash -n script.sh
shellcheck script.sh
./script.sh TARGET; echo "exit: $?"
bash -lc 'echo "$PATH" | tr ":" "\n" | head -5'
bash -ic 'command -v COMMAND'
```

`bash -n` parses without executing. Verify a startup file change in a fresh login shell with `bash -lc` and an interactive one with `bash -ic`, since the two read different files. Open a genuinely new terminal before closing the current one.

## Guardrails

- Do not replace, remove, or overwrite the system shell or `/bin/sh`. Install alongside.
- Do not rewrite a startup file. Append, after taking a backup, and keep unrelated lines untouched.
- Do not change the user's login shell with `chsh` unless asked; it changes every future session and can lock someone out of a working environment.
- Do not put a secret, token, or password in a startup file. It is world-readable in many setups and lands in every process environment.
- Do not add `.` or an empty entry to `PATH`.
- Do not `sudo` an install without saying what it changes.
- Report the Bash version before and after, the tooling installed, the exact file and line appended with the backup path, the resulting `PATH` order, and the verification output from a fresh shell.
