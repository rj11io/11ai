# Bash setup reference

## Install a current Bash

### macOS

`/bin/bash` is Bash 3.2 and cannot be replaced. Install a current one alongside it:

```bash
brew install bash
```

```bash
/opt/homebrew/bin/bash --version | head -1
command -v -p bash
```

Homebrew installs to `/opt/homebrew/bin` on Apple silicon and `/usr/local/bin` on Intel. For `#!/usr/bin/env bash` to find the new one, that directory must come before `/bin` on `PATH`.

What Bash 4 and later add that 3.2 lacks:

| Feature | Syntax |
| --- | --- |
| Associative arrays | `declare -A map` |
| Read file into array | `mapfile -t lines < FILE` |
| Case conversion | `${var^^}`, `${var,,}` |
| Recursive globbing | `shopt -s globstar; ls **/*.ts` |
| Negative array index | `${arr[-1]}` |

If a script must run on stock macOS, avoid all of these rather than requiring an install.

### Linux

Bash is present and current on nearly every distribution.

```bash
sudo apt-get install -y bash
```

Check what `/bin/sh` actually is, because it is often `dash`:

```bash
ls -la /bin/sh
```

A `#!/bin/sh` script on such a system gets `dash`, which has no arrays, no `[[ ]]`, no `local` in the POSIX sense, and no `${var^^}`. This is the most common cause of a script that works on macOS and fails on a Debian container.

## Script tooling

```bash
brew install shellcheck shfmt
```

```bash
sudo apt-get install -y shellcheck
```

```bash
shellcheck --version
shfmt --version
```

`shellcheck` finds unquoted expansions, word-splitting bugs, useless `cat`, and misused test operators. `shfmt` formats consistently:

```bash
shfmt -i 2 -ci -w script.sh
```

## Startup files

Which file Bash reads depends entirely on how it was started:

| How the shell starts | Files read |
| --- | --- |
| Interactive login (terminal login, `ssh`, `bash -l`) | `/etc/profile`, then the **first** of `~/.bash_profile`, `~/.bash_login`, `~/.profile` |
| Interactive non-login (new terminal tab on Linux) | `/etc/bash.bashrc`, `~/.bashrc` |
| Non-interactive script | none, unless `$BASH_ENV` is set |
| `sh` invocation | `/etc/profile`, `~/.profile` in POSIX mode |

Three consequences that cause most confusion:

1. **Only the first login file is read.** Creating `~/.bash_profile` on a machine that has been using `~/.profile` silently stops the older file being read. Check for an existing one before adding another.
2. **Scripts and cron read nothing.** A `PATH` addition in `~/.bashrc` does not exist in a cron job. Set it in the crontab, in a wrapper script, or in the service definition.
3. **macOS Terminal starts login shells** for every new window, so `~/.bashrc` alone is not read there. Linux terminals usually start non-login shells, so `~/.bash_profile` alone is not read.

The conventional fix for the last point is to source one from the other:

```bash
# ~/.bash_profile
[[ -f ~/.bashrc ]] && . ~/.bashrc
```

Put interactive settings in `~/.bashrc` and this single line in `~/.bash_profile`, so both start-up paths converge.

Guard anything interactive so a non-interactive shell does not break:

```bash
# ~/.bashrc
case $- in
  *i*) ;;
  *) return ;;
esac
```

Without a guard, output from `~/.bashrc` corrupts `scp` and `rsync` sessions, which fail with a confusing protocol error.

## Editing PATH safely

```bash
cp ~/.bashrc ~/.bashrc.backup
printf '\nexport PATH="/opt/homebrew/bin:$PATH"\n' >> ~/.bashrc
```

Rules:

- Always include `$PATH` in the new value. `export PATH="/opt/homebrew/bin"` leaves a shell where almost nothing runs.
- Never add `.` or an empty entry. An empty entry is easy to create by accident with a trailing colon, and it means the current directory is searched — so a file named `ls` in a downloads folder runs instead of the real one.
- Prepend to override, append to extend as a fallback.
- Append to the file, do not rewrite it.

```bash
echo "$PATH" | tr ':' '\n' | grep -n '^$\|^[^/]' || echo "clean"
```

Verify in a fresh shell before closing the current one:

```bash
bash -lc 'echo "$PATH" | tr ":" "\n" | head -5'
bash -lc 'command -v bash; bash --version | head -1'
```

If the new shell is broken, the original terminal is still open and the backup can be restored:

```bash
cp ~/.bashrc.backup ~/.bashrc
```

## Changing the login shell

Only when asked. It affects every future session.

```bash
chsh -s /opt/homebrew/bin/bash
```

The shell must be listed in `/etc/shells` first:

```bash
grep -c '/opt/homebrew/bin/bash' /etc/shells
sudo sh -c 'echo /opt/homebrew/bin/bash >> /etc/shells'
```

Test the shell works before making it the default. A login shell that exits immediately can lock a user out of a graphical session.

## Never put secrets in a startup file

```bash
export API_TOKEN="..."
```

Do not. Startup files are frequently committed to a dotfiles repository, they are readable by anything running as the user, and the value is exported into every child process — so any script, any dependency, and any command that dumps its environment sees it.

Use a credential helper, the platform keychain, or a per-project ignored env file loaded only where needed:

```bash
set -a
. ./.env
set +a
```

## Script skeleton

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat >&2 <<'USAGE'
usage: script.sh [-v] TARGET

  -v  verbose output
USAGE
  exit 2
}

cleanup() {
  [[ -n "${tmpdir:-}" ]] && rm -rf -- "$tmpdir"
}
trap cleanup EXIT

main() {
  local verbose=0
  while getopts ':v' opt; do
    case "$opt" in
      v) verbose=1 ;;
      *) usage ;;
    esac
  done
  shift $((OPTIND - 1))

  local target="${1:?target required}"
  tmpdir="$(mktemp -d)"

  (( verbose )) && echo "working in $tmpdir" >&2
  echo "$target"
}

main "$@"
```

```bash
chmod +x script.sh
bash -n script.sh
shellcheck script.sh
```

`SCRIPT_DIR` resolves the script's own directory so it works from any working directory. The `EXIT` trap removes the temporary directory whether the script succeeds, fails, or is interrupted.

## Shebang choice

| Shebang | Behaviour |
| --- | --- |
| `#!/usr/bin/env bash` | First Bash on `PATH`. Portable; use this by default. |
| `#!/bin/bash` | Fixed path. Bash 3.2 on macOS; absent on some minimal images. |
| `#!/bin/sh` | POSIX shell, often `dash`. No Bash features. |

To require a minimum version, check it and fail with a clear message rather than producing a syntax error:

```bash
if (( BASH_VERSINFO[0] < 4 )); then
  echo "bash 4 or later required, found $BASH_VERSION" >&2
  exit 1
fi
```

That check must come before any Bash 4 syntax in the file, because the whole script is parsed before it runs.
