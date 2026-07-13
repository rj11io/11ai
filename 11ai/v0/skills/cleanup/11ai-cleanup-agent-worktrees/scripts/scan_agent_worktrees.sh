#!/usr/bin/env bash
# scan_agent_worktrees.sh [repo_path] — list every git worktree of a repo
# (default: current directory) except the main one, with the facts needed
# to judge whether it's an abandoned agent worktree.
#
# Output: tab-separated, one line per worktree, oldest first:
#   AGE_D   BRANCH   STATE   FLAGS   PATH
#
#   STATE   clean (no uncommitted changes), dirty (uncommitted changes),
#           or missing (directory gone — git still tracks it)
#
# FLAGS (comma-joined, "-" if none):
#   old       untouched for over 14 days
#   agent     path looks agent-created — matches naming patterns of any known
#             harness (claude, codex, gemini, goose, opencode, cursor, aider,
#             copilot) plus generic worktree/scratchpad/tmp paths
#   dirty     has uncommitted changes — removing loses work, leave alone by default
#   unmerged  has commits not on the main branch — removing the branch loses them
#   prunable  directory is gone; safe to prune the stale registration
#
# Strictly read-only. Works with stock macOS bash 3.2 and on Linux.
set -euo pipefail

REPO="${1:-.}"
now="$(date +%s)"

mtime_of() { stat -f %m "$1" 2>/dev/null || stat -c %Y "$1" 2>/dev/null || echo "$now"; }

git -C "$REPO" rev-parse --git-dir >/dev/null 2>&1 || {
  echo "Not a git repository: $REPO"
  exit 1
}

# One line per worktree from the porcelain blocks: path<TAB>branch<TAB>prunable
wt_list="$(git -C "$REPO" worktree list --porcelain | awk '
  /^worktree / { if (path) print path "\t" branch "\t" prunable
                 path = $2; branch = "detached"; prunable = "no" }
  /^branch /   { branch = $2; sub("refs/heads/", "", branch) }
  /^prunable/  { prunable = "yes" }
  END          { if (path) print path "\t" branch "\t" prunable }
')"

main_wt="$(echo "$wt_list" | head -1 | cut -f1)"
main_branch="$(git -C "$main_wt" branch --show-current 2>/dev/null || echo main)"

results="$(echo "$wt_list" | while IFS="$(printf '\t')" read -r wt branch prunable; do
  [ "$wt" = "$main_wt" ] && continue

  if [ -d "$wt" ]; then
    age_d="$(( (now - $(mtime_of "$wt")) / 86400 ))"
    if [ -n "$(git -C "$wt" status --porcelain 2>/dev/null | head -1)" ]; then
      state="dirty"
    else
      state="clean"
    fi
  else
    age_d="?"
    state="missing"
  fi

  flags=""
  [ "$age_d" != "?" ] && [ "$age_d" -gt 14 ] && flags="old"
  if printf '%s' "$wt" | grep -Eiq 'claude|codex|gemini|goose|opencode|cursor|aider|copilot|worktree|scratchpad|agent|/tmp/|/T/'; then
    flags="${flags:+$flags,}agent"
  fi
  [ "$state" = "dirty" ] && flags="${flags:+$flags,}dirty"
  if [ "$branch" != "detached" ] && \
     [ -n "$(git -C "$REPO" log --oneline "$main_branch..$branch" 2>/dev/null | head -1)" ]; then
    flags="${flags:+$flags,}unmerged"
  fi
  [ "$prunable" = "yes" ] && flags="${flags:+$flags,}prunable"

  printf '%s\t%s\t%s\t%s\t%s\n' "$age_d" "$branch" "$state" "${flags:--}" "$wt"
done)"

if [ -z "$results" ]; then
  echo "No extra worktrees found for $REPO (only the main one)."
  exit 0
fi

printf 'AGE_D\tBRANCH\tSTATE\tFLAGS\tPATH\n'
echo "$results" | sort -rn -k1,1
