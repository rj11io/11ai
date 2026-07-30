---
name: 11ai-bash-integrations
description: "Wire Bash scripts into the systems that run them, covering package scripts, continuous integration steps, Git hooks, cron and systemd timers, container entrypoints, argument and environment contracts, exit codes as gates, logging to a collector, and locking so two runs cannot overlap. Use when a script must run on a schedule, in a pipeline, on commit, or as a container entrypoint, or when a script works by hand but not where it is actually invoked."
---
# 11ai bash integrations

A script that works in your terminal and fails where it is scheduled is the normal outcome, not bad luck: the caller supplies a different environment, a different working directory, no terminal, and no startup files. Establish the calling contract first — arguments, environment, working directory, exit codes — then wire it.

## Name the caller

- **Package scripts** — `npm run` and friends, which add the local binary directory to `PATH` and pass arguments after `--`.
- **Pipeline steps** — a non-interactive shell where a non-zero exit fails the build, and where secrets arrive as environment variables.
- **Git hooks** — a script run on commit or push, which must be fast and must be reproduced by a server-side check to actually enforce anything.
- **Cron and systemd timers** — a minimal environment with no startup files and no terminal, where overlapping runs are a real hazard.
- **Container entrypoints** — where the script becomes process one and must forward signals.

## Wire one deliberately

1. Read what already exists: the `scripts` block, the pipeline configuration, `core.hooksPath` and any hook manager, the crontab or unit files, and the image's entrypoint.
2. Make the contract explicit at the top of the script. Require what it needs and fail loudly if absent, rather than assuming an inherited value:

   ```bash
   set -Eeuo pipefail
   : "${DATABASE_URL:?DATABASE_URL is required}"
   cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
   ```

3. Never rely on `~/.bashrc`. Cron, pipelines, hooks, and containers do not read it, so set `PATH` in the script or use absolute paths.
4. Use exit codes as the interface. `0` for success, non-zero for failure, and a distinct code for a usage error so the caller can tell them apart. Anything that swallows a failure with `|| true` turns a red build green.
5. Add locking to anything scheduled, so a slow run cannot overlap the next one. Read [references/integrations.md](references/integrations.md) for the package script and pipeline shapes, hook managers, cron and timer entries with locking, and the container entrypoint pattern.
6. Send diagnostics to standard error and results to standard output, so the script composes in a pipeline and the collector captures both streams.

## Verify end to end

Prove the script runs where it is actually called, not just in your shell:

- Reproduce the caller's environment: `env -i PATH=/usr/bin:/bin bash -c ./script.sh` for cron, or run the pipeline step itself.
- Make the script fail on purpose and confirm the caller notices — the build goes red, the hook blocks the commit, the timer records a failure.
- For a scheduled job, run it twice concurrently and confirm the lock prevents the second one.
- For a container, send `SIGTERM` and confirm the process exits promptly rather than waiting out the timeout.
- Check the logs actually arrive where the collector looks, with both streams captured.

## Report

State the caller wired, the argument and environment contract, the working directory the script assumes, the exit codes and what each means, where output goes, whether a lock is in place, the files changed, and the verification evidence including the deliberate failure. Never place a secret in a script, a crontab, or a command line where it is visible in the process list. Call out anything that swallows a failure, and anything a person must configure on their own machine or on the server for the change to take effect.
