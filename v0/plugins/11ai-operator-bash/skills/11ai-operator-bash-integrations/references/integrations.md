# Bash integrations reference

## Package scripts

```json
{
  "scripts": {
    "db:seed": "./scripts/seed.sh",
    "check": "./scripts/check.sh"
  }
}
```

```bash
npm run db:seed
npm run db:seed -- --dry-run
```

Arguments after `--` reach the script. Without it, npm consumes them.

The script needs the execute bit committed, or it fails on a fresh clone:

```bash
git update-index --chmod=+x scripts/seed.sh
git ls-files -s scripts/seed.sh
```

Mode `100755` is correct; `100644` means the file was committed without the bit and every contributor gets a permission error.

Package managers put the project's local binaries first on `PATH`, so a script invoked this way can call project tools directly. A script run any other way cannot — do not depend on it unless the only caller is a package script.

## Pipeline steps

```yaml
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run checks
        shell: bash
        run: ./scripts/check.sh
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Points that decide whether this behaves:

- Set `shell: bash` explicitly. The default varies by runner, and on some it is `sh`.
- GitHub Actions runs `bash` steps with `-e` but **not** `-u` or `-o pipefail`. Set them in the script rather than relying on the runner.
- Secrets arrive as environment variables. Never echo one, and never run the step with `set -x` when secrets are present — the trace prints their values.
- A non-zero exit fails the job. That is the interface; do not wrap the script in `|| true`.

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
```

The `cd` matters because a pipeline's working directory is not always the repository root, and a script that assumes it silently operates on nothing.

To reproduce a pipeline failure locally, strip the environment:

```bash
env -i PATH=/usr/local/bin:/usr/bin:/bin HOME="$HOME" bash ./scripts/check.sh
```

## Git hooks

Hooks in `.git/hooks` are not committed, so a hook manager such as husky or lefthook is what makes them shared. The script side is what matters here.

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

mapfile -t staged < <(git diff --cached --name-only --diff-filter=ACM -z | tr '\0' '\n')
(( ${#staged[@]} == 0 )) && exit 0

shell_files=()
for file in "${staged[@]}"; do
  [[ "$file" == *.sh ]] && shell_files+=("$file")
done

(( ${#shell_files[@]} == 0 )) && exit 0
shellcheck "${shell_files[@]}"
```

Three rules for a hook that survives:

- **Staged files only.** `--diff-filter=ACM` excludes deletions, which would otherwise be passed to a linter as missing files.
- **Exit early when nothing matches.** A hook that runs a whole-repository check on every commit gets bypassed with `--no-verify`.
- **Under a couple of seconds.** Tests belong in the pipeline.

A local hook is advisory: `--no-verify` skips it. Anything that must not be bypassed needs the same check in the pipeline.

## Cron

```bash
crontab -l
```

```cron
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
MAILTO=""

0 3 * * * /usr/local/bin/flock -n /tmp/backup.lock /srv/app/scripts/backup.sh >> /var/log/backup.log 2>&1
```

Cron is the environment most different from a terminal, and each of these lines addresses one of its surprises:

- **No startup files.** `PATH` is minimal — often just `/usr/bin:/bin`. Set it in the crontab or use absolute paths for everything.
- **Absolute paths only.** Cron's working directory is the user's home, not the repository. `cd` at the top of the script.
- **Both streams redirected.** Without `2>&1` the error output is emailed or discarded, and a failure leaves no trace in the log.
- **A percent sign must be escaped.** `%` is special in a crontab, so `date +\%F` — an unescaped one truncates the command.
- **No terminal.** Anything expecting input hangs forever.

Install without clobbering the existing entries:

```bash
crontab -l > /tmp/cron.bak
{ crontab -l; echo "0 3 * * * ..."; } | crontab -
crontab -l
```

`crontab file` replaces everything. Always read the current one first and keep the backup.

Never put a secret in a crontab. It is readable by the user and appears in the process list when the job runs. Have the script read from a file with mode `600`.

Test with the real cron environment rather than your shell:

```bash
env -i SHELL=/bin/bash PATH=/usr/bin:/bin HOME="$HOME" /bin/bash -c '/srv/app/scripts/backup.sh'
```

## systemd timers

Better than cron on a Linux server: real logging, dependency ordering, and no environment surprises.

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Nightly backup
After=network-online.target

[Service]
Type=oneshot
User=deploy
WorkingDirectory=/srv/app
EnvironmentFile=/etc/app/backup.env
ExecStart=/srv/app/scripts/backup.sh
```

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Run nightly backup

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backup.timer
systemctl list-timers backup.timer
sudo systemctl start backup.service
journalctl -u backup.service -n 50 --no-pager
```

What this buys over cron: `Persistent=true` runs a missed job after a reboot, `RandomizedDelaySec` spreads load across machines, `EnvironmentFile` keeps secrets out of the unit and out of the process list, and output goes to the journal automatically. Enabling a timer and starting a service are state changes on a host — get approval.

## Locking against overlap

A scheduled job that occasionally runs longer than its interval will overlap itself, and two concurrent runs of a backup or a migration corrupt state.

```bash
flock -n /tmp/job.lock /path/to/script.sh || { echo "already running" >&2; exit 0; }
```

`-n` fails immediately rather than waiting. Exit `0` when the lock is held, or a monitor treats a normal skip as a failure.

Self-locking, so the protection travels with the script:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

exec 9>/var/lock/job.lock
flock -n 9 || { echo "another run holds the lock" >&2; exit 0; }
```

The lock is released when the process exits, including on a crash, because the file descriptor closes. A lock implemented as "create a file, delete it at the end" leaks on a crash and blocks every later run.

On macOS, `flock` is not present by default; `shlock` or a `mkdir`-based lock with a trap is the fallback.

## Container entrypoints

```dockerfile
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
```

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

until pg_isready -d "$DATABASE_URL" -q; do
  echo "waiting for database" >&2
  sleep 1
done

npm run migrate

exec "$@"
```

`exec "$@"` is the critical line. It replaces the shell with the real process, so the application becomes process one and receives `SIGTERM` directly. Without `exec`, the shell stays as process one, does not forward signals, and every container stop waits out the timeout and then kills the application mid-request.

Use exec form for `ENTRYPOINT` and `CMD` in the Dockerfile for the same reason — shell form wraps the command in `/bin/sh -c`.

Use a base image that actually has Bash. `alpine` ships `busybox` `sh`, so a Bash script needs `#!/bin/sh` and POSIX syntax, or `apk add --no-cache bash`.

```bash
docker run -d --name app -e DATABASE_URL=... app:local
time docker stop app
```

A stop taking ten seconds means signals are not reaching the process.

## Logging

```bash
log() { printf '%s [%s] %s\n' "$(date -u +%FT%TZ)" "$1" "${*:2}" >&2; }

log info "starting"
log error "upstream returned 500"
```

Diagnostics on standard error, results on standard output. That split is what lets the script be used in a pipeline while still reporting progress.

For a collector that parses structured lines:

```bash
log() {
  printf '{"ts":"%s","level":"%s","msg":"%s"}\n' \
    "$(date -u +%FT%TZ)" "$1" "${*:2}" >&2
}
```

Never log a secret. When a script must echo a variable for diagnosis, print whether it is set rather than its value:

```bash
log info "DATABASE_URL is ${DATABASE_URL:+set}${DATABASE_URL:-unset}"
```
