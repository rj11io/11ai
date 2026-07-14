# Runner — provider-agnostic scheduling

The routine turns the conductor into an unattended loop. The runner is a
contract, not a vendor: **any agent CLI that can (a) run headless with a
prompt, (b) read and edit files and run shell commands, and (c) grant those
permissions non-interactively** can drive the conductor. The conductor never
names a CLI; only this layer knows which one is installed.

Build the runner **last** — after one manual tick is boringly reliable.

---

## 1. The contract

The runner script resolves two variables (from env or a `runner.conf` next to
the script) and knows nothing else about the provider:

```bash
AGENT_CMD    # a command that takes the trigger prompt and runs one headless session
MODEL_TIER   # "fast" | "capable" — mapped to a real model id here, and only here
```

The conductor's `config.modelTier` names a tier; this file maps tiers to model
ids per provider. Never write a model id in the conductor or the ledger —
models change monthly, specs should not.

## 2. Adapter table (verify flags against your CLI's current docs)

| CLI | Headless invocation | Non-interactive permissions |
| --- | ------------------- | --------------------------- |
| Claude Code | `claude -p "$PROMPT" --output-format text` | `.claude/settings.local.json` allow-list (keep destructive commands in `deny`) |
| OpenAI Codex CLI | `codex exec "$PROMPT"` | `--sandbox workspace-write` (or `--full-auto`) |
| Gemini CLI | `gemini -p "$PROMPT"` | `--approval-mode auto_edit` (or `--yolo`, broader) |
| opencode | `opencode run "$PROMPT"` | permissions block in `opencode.json` |
| Cursor CLI | `cursor-agent -p "$PROMPT"` | `--force` / project permission config |
| aider | `aider --message "$PROMPT" --yes-always` | `--yes-always` auto-confirms |

Principles that hold for every provider:

- **Least privilege.** Allow file edits, git, and your build/test commands;
  deny force-push and recursive delete. Prefer an allow-list over a
  skip-all-permissions flag for anything running unattended.
- **Auth must be non-interactive.** Export the provider's credential the way
  its docs say (env var or keychain) in the scheduler's environment — cron
  does not read your shell rc files.
- **A fresh session per tick.** No provider's session memory substitutes for
  the ledger.

## 3. The runner script

A complete, provider-agnostic `run-tick.sh` ships next to this skill in
[`scripts/run-tick.sh`](../scripts/run-tick.sh). The load-bearing parts:

```bash
# Single-instance lock — flock beats noclobber: the kernel releases it when
# the process dies (even SIGKILL), so there is no stale-lock failure mode.
exec 9>"$REPO_ROOT/.tick.lock"
flock -n 9 || { echo "another tick is running"; exit 0; }

PROMPT='Read CONDUCTOR.md in full and follow it exactly. Sync, ship EXACTLY
ONE milestone with its review and quality gate, persist on success or abort
cleanly, then stop.'

$AGENT_CMD "$PROMPT" 2>&1 | tee -a "$LOG_DIR/tick-$(date +%Y%m%d-%H%M%S).log"
```

The trigger prompt stays thin — all real instruction lives in the conductor.
(On hosts without `flock` — macOS by default, Git Bash — fall back to the
noclobber pattern and see operations.md §2 for stale-lock cleanup.)

## 4. Scheduling (pick one, and only one)

- **cron (Linux/macOS):** `0 * * * * /path/to/repo/scripts/run-tick.sh >> /path/to/repo/logs/cron.log 2>&1`.
  Mind DST if you schedule inside 01:00–03:00. Cron's PATH is bare — the
  script must use absolute paths or set its own. Test with
  `env -i HOME="$HOME" PATH=/usr/bin:/bin bash run-tick.sh`.
- **launchd (macOS) / systemd user timer (Linux):** same script, survives
  reboots better than cron; `loginctl enable-linger $USER` for systemd so
  timers run while logged out.
- **Windows Task Scheduler:** a `.bat` wrapper that calls Git Bash with
  `-lc "…/run-tick.sh"` so the CLI, git, and node resolve. Set
  `core.autocrlf` so a CRLF sweep never shows as a whole-tree diff.
- **CI (GitHub Actions or similar):** `schedule:` cron + `workflow_dispatch`.
  The cloud lock is a concurrency group with **cancel-in-progress: false**
  (true would kill a tick mid-work). Commit back with a PAT — the default
  workflow token often does not re-trigger workflows — and put `[skip ci]` in
  tick commits so a tick never triggers itself. CI cron is best-effort; treat
  the interval as approximate.

**Exactly one scheduler points at the runner.** A forgotten second scheduler
reintroduces the concurrency the lock exists to prevent.

## 5. The reviewer without sub-agents

Invariant #5 needs a fresh context, not a self-check. If the CLI has
sub-agents (Claude Code's Agent tool, for example), use one. If not, the
conductor's review step shells out to a second headless call:

```bash
$REVIEWER_CMD "You are an independent reviewer. Criteria: <…>. Deliverable:
<paths>. Run the checks yourself; verify one red→green independently. Return
verdict, evidence (commands + results), numbered notes."
```

`REVIEWER_CMD` defaults to `AGENT_CMD`, but pointing it at a **different
provider** is cheap and makes the review genuinely independent — a second
model family rubber-stamps far less than the author's own.

## 6. Git auth for headless pushes

The remote must never prompt: a tokenized HTTPS remote or the OS credential
manager. If fetch/push errors with "could not read Username", auth is missing
— the tick logs and exits; it never attempts interactive auth and never
force-pushes.

## 7. First-week checklist

- One manual tick proven before scheduling.
- Watch the first three scheduled fires in the logs.
- Confirm the idle tick (nothing actionable) exits with no changes.
- Confirm two overlapping fires: second one exits on the lock immediately.
