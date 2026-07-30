# 11ai Bash operator

Ten standalone skills for common Bash shell and scripting work, with previewed and scoped commands around anything that deletes, overwrites, or stops a process.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-bash-cheatsheet`](./skills/11ai-operator-bash-cheatsheet/SKILL.md) | Looking up Bash syntax, expansions, test operators, redirection, and exit codes |
| [`11ai-operator-bash-setup`](./skills/11ai-operator-bash-setup/SKILL.md) | Installing a current Bash, choosing the right startup file, extending PATH, and adding shellcheck |
| [`11ai-operator-bash-environment`](./skills/11ai-operator-bash-environment/SKILL.md) | Inspecting which shell runs, its version and options, PATH resolution, and startup file order |
| [`11ai-operator-bash-scripting`](./skills/11ai-operator-bash-scripting/SKILL.md) | Writing and repairing scripts with strict mode, quoting, argument validation, and cleanup traps |
| [`11ai-operator-bash-text-processing`](./skills/11ai-operator-bash-text-processing/SKILL.md) | Filtering and transforming text with grep, sed, awk, sort, jq, and xargs |
| [`11ai-operator-bash-files`](./skills/11ai-operator-bash-files/SKILL.md) | Finding, copying, moving, and deleting files with a previewed and scoped command |
| [`11ai-operator-bash-processes`](./skills/11ai-operator-bash-processes/SKILL.md) | Running, backgrounding, monitoring, and stopping processes, and reading exit status |
| [`11ai-operator-bash-testing`](./skills/11ai-operator-bash-testing/SKILL.md) | Linting with shellcheck and covering scripts with bats tests, including failure paths |
| [`11ai-operator-bash-integrations`](./skills/11ai-operator-bash-integrations/SKILL.md) | Wiring scripts into package scripts, pipelines, Git hooks, cron, systemd timers, and containers |
| [`11ai-operator-bash-troubleshooting`](./skills/11ai-operator-bash-troubleshooting/SKILL.md) | Diagnosing syntax, interpreter, quoting, PATH, hanging, and cron-only failures |

The skills are intentionally narrow. Combine them when a task crosses boundaries, such as inspecting the interpreter before writing a script, or linting a script before wiring it into a scheduled job.

## Safety contract

Start with read-only inspection. Confirm which interpreter will run — the shebang, not the terminal's shell — before writing or diagnosing anything, because Bash 3.2 on macOS and `dash` as `/bin/sh` explain most portability failures.

Preview before you act. List what a destructive command would affect, show that list, and get approval for the exact paths or processes: `rm -rf`, `find -delete`, `rsync --delete`, an in-place `sed`, a `chmod -R`, and any signal sent to a process the user did not ask to stop. Never `pkill` or `killall` on a broad name, and never escalate to `SIGKILL` before `SIGTERM` has been given time.

Guard paths built from variables. An unset or empty variable turns a scoped command into a destructive one, so check the value before using it and quote every expansion.

Never fix a symptom by weakening the script. Removing `set -euo pipefail`, adding a blanket `|| true`, unquoting an expansion, or `chmod -R 777` each make a script report success while doing the wrong thing.

Do not put secrets in scripts, startup files, crontabs, or command line arguments, where they are visible in the process list to every user on the machine. Redact credentials from `bash -x` trace output before quoting it, and list variable names rather than dumping the environment.
