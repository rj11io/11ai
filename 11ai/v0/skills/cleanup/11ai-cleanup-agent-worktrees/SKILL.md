---
name: 11ai-cleanup-agent-worktrees
description: Scan a git repository for abandoned worktrees — the isolated working copies AI agents (Claude Code, Codex CLI, Gemini CLI, Cursor, Aider, or any other harness) create and leave behind — report each one's age, branch, and safety in a compact table, ask the user which to remove, then clean up only what they picked. Use whenever the user wants to clean up worktrees, mentions leftover / stale / agent-created worktrees or branches, notices `git worktree list` is full of junk, or complains about mystery sibling directories of their repo — even if they only mention one.
---

# 11ai Cleanup Agent Worktrees

## Overview

A worktree is an extra working copy of a git repository, sharing the same history but living in its own directory on its own branch. AI agents create them constantly for isolation — one per experiment, review, or parallel task — and abandoned ones pile up as mystery directories with orphaned branches. This skill lists them, separates the safely-removable from the ones holding real work, and removes only what the user picks.

The stakes vary by worktree, and the report must make that visible: a clean, merged worktree is free to remove (the branch and history stay in the repo); a **dirty** worktree has uncommitted changes that are **gone forever** if force-removed; an **unmerged** branch has commits that survive worktree removal but die with branch deletion.

Two rules that matter: **never remove anything the user did not explicitly pick**, and **never run this skill's execute step — or any test of it — without that same explicit approval.** The scan and report are read-only and free; everything destructive goes through the user first.

## Workflow

### 1. Scan

Run the bundled scanner against the repo (default: current directory):

```bash
bash scripts/scan_agent_worktrees.sh [repo_path]
```

It prints one line per non-main worktree — age in days, branch, state (`clean` / `dirty` / `missing`), disk size, flags, path — followed by a TOTALS footer: overall count and disk usage, the clean-and-merged reclaimable subtotal, and the dirty subtotal. Flags mean:

- `old` — untouched for over 14 days.
- `agent` — the path matches the naming patterns of any known harness (claude, codex, gemini, goose, opencode, cursor, aider, copilot) or generic worktree/scratchpad/temp paths. Worktrees themselves are harness-agnostic — `git worktree list` sees them all regardless of which agent made them; this flag only helps attribute them.
- `dirty` — uncommitted changes inside. Removing it destroys that work — leave alone by default.
- `unmerged` — the branch has commits not on the main branch. Worktree removal keeps them; branch deletion loses them.
- `prunable` — the directory is already gone; only git's stale registration remains. Always safe to prune.

If the user has several repos with agent worktrees, run the scan once per repo and merge the report.

If the script fails or is missing, fall back to `git worktree list --porcelain` plus `git -C <wt> status --porcelain` and `git log main..<branch>` per worktree.

### 2. Judge

Signals that a worktree is abandoned and safe to remove:

- `clean` state with `old` and/or `agent` flags, no `unmerged` — nothing is lost by removing it
- `prunable` — the directory is already gone; recommend pruning unconditionally
- `unmerged` but the branch's work clearly landed elsewhere (squash-merged PR, cherry-picked) — verify with `git log` before claiming this

Signals to leave something alone (list it, but don't recommend removing it):

- `dirty` — uncommitted work would be destroyed; only the user can decide that's disposable
- **the worktree this session is running in** — check the current working directory against each candidate path
- young worktrees (days, not weeks) without agent-pattern paths — probably the user's own active work

When in doubt, put it in the report with your honest uncertainty rather than guessing a verdict.

### 3. Report

Keep it succinct — headline numbers first (quote the scanner's TOTALS footer, don't estimate), then a table with one verdict line per row, no essay:

```
Found 4 extra worktrees using 1.9 GB — removing the clean, merged one reclaims 420 MB; pruning costs nothing.

| Age | Branch            | State   | Size | Verdict                                      |
|-----|-------------------|---------|------|----------------------------------------------|
| 41d | wt-fix-auth       | clean   | 420M | remove — merged, agent-created               |
| —   | wt-old-experiment | missing | —    | prune — directory already gone               |
| 22d | wt-refactor       | dirty   | 890M | leave alone — has uncommitted changes        |
| 9d  | review-pr-142     | clean   | 610M | remove? — unmerged commits, check first      |
```

### 4. Ask

Ask which ones to remove before touching anything. If the AskUserQuestion tool is available, use it with `multiSelect: true` — one option per worktree labeled with branch and age, recommended ones first. Otherwise ask in plain chat with a numbered list. Always make "none" an easy answer.

Spell out the stakes per item in the question: clean+merged ones lose nothing; dirty ones **permanently lose their uncommitted changes**; deleting an unmerged branch loses its commits. Ask about branch deletion separately from worktree removal — they're different decisions.

If nothing looks abandoned, say so and stop — don't invent candidates to justify the scan.

### 5. Execute

Only after the user's selection — never as a test, demo, or dry-run against real worktrees. For the selected items:

```bash
git worktree remove "<path>"           # refuses if dirty — that's the safety net
git worktree remove --force "<path>"   # only if the user explicitly accepted losing the dirty state
git worktree prune                     # clears 'prunable' registrations
git branch -d "<branch>"               # only if the user opted into branch deletion; -d refuses unmerged
git branch -D "<branch>"               # only if the user explicitly accepted losing unmerged commits
```

Let git's own refusals (`remove` on dirty, `-d` on unmerged) work for you — escalate past them only with the user's explicit, per-item acknowledgment of what gets lost.

### 6. Verify

Run `git worktree list` again and confirm the removed ones are gone, then report the headline number — "disk space saved by removing the selected worktrees: 1.0 GB" — with the per-worktree breakdown (sizes come from the scan; use them rather than re-measuring what no longer exists). Flag anything that resisted with the likely reason (usually a process with its working directory inside the worktree — an editor or a still-running agent).

## Notes

- Removing a worktree never touches the repo's history — commits on the branch remain until the branch itself is deleted. Make sure the user understands worktree removal and branch deletion are separate, differently-risky actions.
- A `missing`-state worktree can't be judged dirty or clean (the directory is gone, and whatever was uncommitted in it is already lost) — pruning just cleans up git's bookkeeping.
- Some agent harnesses auto-remove their worktrees when unchanged; the leftovers this skill finds are typically the ones where something was written and never merged. That's exactly why the `unmerged` check matters — the leftover may be the only copy of that work.
