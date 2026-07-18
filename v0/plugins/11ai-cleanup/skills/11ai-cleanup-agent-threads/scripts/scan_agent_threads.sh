#!/usr/bin/env bash
# scan_agent_threads.sh [min_age_days] — find leftover AI agent session
# artifacts across the common harnesses: saved conversation transcripts and
# per-session scratchpad directories. Default min_age_days is 0 (list all).
#
# Harnesses covered (each source is skipped silently if not installed):
#   claude    Claude Code — transcripts in ~/.claude/projects/<slug>/*.jsonl,
#             scratchpads in /private/tmp/claude-*/ (macOS) or /tmp/claude-*/
#   codex     OpenAI Codex CLI — transcripts in ~/.codex/sessions/YYYY/MM/DD/*.jsonl
#   gemini    Gemini CLI — per-project session dirs in ~/.gemini/tmp/<hash>/
#   goose     Goose — transcripts in ~/.local/share/goose/sessions/*.jsonl
#   opencode  OpenCode — session records in ~/.local/share/opencode/storage/session/
#
# Output: tab-separated, one line per artifact, oldest first:
#   AGE_D   SIZE   HARNESS   KIND   FLAGS   PATH
# followed by a TOTALS footer: overall count and size, per-harness
# subtotals, and the old->reclaimable subtotal, so reports can quote
# exact "disk space reclaimable" numbers.
#
#   KIND    transcript (a saved agent conversation)
#           scratchpad (a per-session temp working directory)
#
# FLAGS (comma-joined, "-" if none):
#   old     untouched for over 30 days — likely an abandoned thread
#   today   touched within the last day — may be a live session, leave alone
#
# Memory directories (persistent agent memory) are deliberately never listed —
# they are long-term state, not thread leftovers.
#
# Strictly read-only. Works with stock macOS bash 3.2 and on Linux.
set -euo pipefail

MIN_AGE_D="${1:-0}"
now="$(date +%s)"

mtime_of() { stat -f %m "$1" 2>/dev/null || stat -c %Y "$1" 2>/dev/null || echo "$now"; }

# Each row carries a hidden leading size-in-KB field for the TOTALS footer;
# it is cut away before display.
emit() { # harness kind path
  harness="$1"; kind="$2"; path="$3"
  age_d="$(( (now - $(mtime_of "$path")) / 86400 ))"
  [ "$age_d" -lt "$MIN_AGE_D" ] && return 0
  size_kb="$(du -sk "$path" 2>/dev/null | awk '{print $1}')"
  size="$(du -sh "$path" 2>/dev/null | awk '{print $1}')"
  flags=""
  [ "$age_d" -gt 30 ] && flags="old"
  [ "$age_d" -lt 1 ] && flags="${flags:+$flags,}today"
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "${size_kb:-0}" "$age_d" "${size:-?}" "$harness" "$kind" "${flags:--}" "$path"
}

results="$(
  # Claude Code — one .jsonl per session under ~/.claude/projects/<slug>/.
  # The memory/ subdirectory of each project is skipped on purpose.
  for f in "$HOME"/.claude/projects/*/*.jsonl; do
    [ -f "$f" ] || continue
    emit claude transcript "$f"
  done

  # Claude Code per-session scratchpad directories.
  for d in /private/tmp/claude-*/* /tmp/claude-*/*; do
    [ -d "$d" ] || continue
    emit claude scratchpad "$d"
  done

  # OpenAI Codex CLI — rollout transcripts nested in date directories.
  if [ -d "$HOME/.codex/sessions" ]; then
    find "$HOME/.codex/sessions" -type f -name '*.jsonl' 2>/dev/null | while read -r f; do
      emit codex transcript "$f"
    done
  fi

  # Gemini CLI — one temp dir per project hash, holding logs and checkpoints.
  for d in "$HOME"/.gemini/tmp/*; do
    [ -d "$d" ] || continue
    emit gemini scratchpad "$d"
  done

  # Goose — one .jsonl per session.
  for f in "$HOME"/.local/share/goose/sessions/*.jsonl; do
    [ -f "$f" ] || continue
    emit goose transcript "$f"
  done

  # OpenCode — one session record per file under storage/session/.
  if [ -d "$HOME/.local/share/opencode/storage/session" ]; then
    find "$HOME/.local/share/opencode/storage/session" -type f -name '*.json' 2>/dev/null | while read -r f; do
      emit opencode transcript "$f"
    done
  fi
)"

if [ -z "$results" ]; then
  echo "No agent thread artifacts found (min age: ${MIN_AGE_D}d)."
  exit 0
fi

printf 'AGE_D\tSIZE\tHARNESS\tKIND\tFLAGS\tPATH\n'
echo "$results" | sort -rn -k2,2 | cut -f2-
echo ""
echo "$results" | awk -F'\t' '
  function human(kb) {
    if (kb >= 1048576) return sprintf("%.1fG", kb/1048576)
    if (kb >= 1024)    return sprintf("%.0fM", kb/1024)
    return kb "K"
  }
  { n++; total += $1
    hn[$4]++; hs[$4] += $1
    if ($6 ~ /old/)   { no++; so += $1 }
    if ($6 ~ /today/) { nt++ } }
  END {
    printf "TOTALS: %d thread artifacts, %s on disk\n", n, human(total)
    for (h in hn) printf "  %s: %d artifacts, %s\n", h, hn[h], human(hs[h])
    if (no) printf "  old >30d (reclaim candidates): %d, %s reclaimable\n", no, human(so)
    if (nt) printf "  touched today (possibly live, leave alone): %d\n", nt
  }'
