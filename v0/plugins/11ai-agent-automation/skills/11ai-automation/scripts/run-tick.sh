#!/usr/bin/env bash
#
# run-tick.sh — fires ONE conductor tick with whatever agent CLI you use.
# Provider-agnostic: set AGENT_CMD (and optionally REVIEWER_CMD / MODEL_TIER)
# in the environment or in scripts/runner.conf. See references/runner.md.
#
# Each invocation = exactly one milestone, per CONDUCTOR.md. Strictly serial.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Optional local config (git-ignored): defines AGENT_CMD etc.
# Example runner.conf:
#   AGENT_CMD='claude -p'                       # Claude Code
#   AGENT_CMD='codex exec --sandbox workspace-write'   # Codex CLI
#   AGENT_CMD='gemini --approval-mode auto_edit -p'    # Gemini CLI
#   AGENT_CMD='opencode run'                    # opencode
[ -f "$SCRIPT_DIR/runner.conf" ] && . "$SCRIPT_DIR/runner.conf"
: "${AGENT_CMD:?Set AGENT_CMD to your headless agent CLI (see references/runner.md)}"

LOG_DIR="$REPO_ROOT/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/tick-$(date +%Y%m%d-%H%M%S).log"

echo "[$(date -Is)] tick start (cwd=$REPO_ROOT, agent=${AGENT_CMD%% *})" | tee "$LOG"

# Single-instance lock. flock is kernel-released on process death (no stale
# locks). Fallback to noclobber where flock is unavailable (macOS, Git Bash).
LOCK="$REPO_ROOT/.tick.lock"
if command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK"
  if ! flock -n 9; then
    echo "[$(date -Is)] another tick is running — exiting" | tee -a "$LOG"; exit 1
  fi
else
  if ! ( set -o noclobber; echo "$$" > "$LOCK" ) 2>/dev/null; then
    echo "[$(date -Is)] another tick is running (lock: $LOCK) — exiting" | tee -a "$LOG"; exit 1
  fi
  trap 'rm -f "$LOCK"' EXIT
fi

# Thin trigger prompt — all real instruction lives in CONDUCTOR.md.
PROMPT='Read CONDUCTOR.md in full and follow it exactly; it is authoritative.
Start with the sync. Then ship EXACTLY ONE milestone: author its failing
checks, implement to green, run one evidence-backed review, pass the quality
gate including the depth probes, persist ledger + work in one commit, push.
If anything prevents a clean baseline or a green gate, abort cleanly: commit
nothing, log why. One milestone, then stop.'

$AGENT_CMD "$PROMPT" 2>&1 | tee -a "$LOG"

echo "[$(date -Is)] tick end" | tee -a "$LOG"
