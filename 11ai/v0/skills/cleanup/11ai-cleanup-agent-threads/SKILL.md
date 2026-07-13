---
name: 11ai-cleanup-agent-threads
description: Scan for abandoned AI agent threads across harnesses — Claude Code, OpenAI Codex CLI, Gemini CLI, Goose, OpenCode — covering old conversation transcripts and leftover per-session scratchpad directories, report them in a compact table, ask the user which to delete, then remove only what they picked. Use whenever the user wants to clean up agent sessions, threads, transcripts, or old conversations from any coding agent, complains about accumulated session junk or temp directories from agents, or asks how much space their agent history is taking — even if they only mention one session or one tool.
---

# 11ai Cleanup Agent Threads

## Overview

Every agent conversation leaves a trail: a transcript file (the saved conversation) and often a scratchpad directory (the session's temp working space). Sessions end; the trail stays and quietly piles up — and users who run several coding agents accumulate it in several places at once. This skill scans the storage of every harness it knows (Claude Code, OpenAI Codex CLI, Gemini CLI, Goose, OpenCode — each skipped silently if not installed), shows what the leftovers are and how much they weigh, and deletes only what the user picks.

One thing to be clear about up front: **deleting a transcript is permanent** — that conversation history cannot be recovered or resumed. This is not a node_modules situation where a reinstall brings it back.

Two rules that matter: **never remove anything the user did not explicitly pick**, and **never run this skill's delete step — or any test of it — without that same explicit approval.** The scan and report are read-only and free; the cleanup always goes through the user first.

## Workflow

### 1. Scan

Run the bundled scanner. The optional argument filters to artifacts at least that many days old (a sensible default suggestion: 30):

```bash
bash scripts/scan_agent_threads.sh [min_age_days]
```

It prints one line per artifact, oldest first: age in days, size, harness (`claude`, `codex`, `gemini`, `goose`, `opencode`), kind (`transcript` or `scratchpad`), flags, path. The script header documents exactly where each harness keeps its threads. Flags mean:

- `old` — untouched for over 30 days. Likely an abandoned thread.
- `today` — touched within the last day. May be a live session — leave alone.

The scanner deliberately never lists `memory/` directories — persistent agent memory is long-term state, not thread leftovers, and is never a cleanup target here.

If the script fails or is missing, fall back to per-harness finds with `stat`/`du` per hit:

```bash
find ~/.claude/projects -name '*.jsonl' -not -path '*/memory/*'   # Claude Code transcripts
find /private/tmp -maxdepth 2 -type d -name 'claude-*'            # Claude Code scratchpads
find ~/.codex/sessions -name '*.jsonl'                            # Codex CLI transcripts
find ~/.gemini/tmp -maxdepth 1 -type d                            # Gemini CLI session dirs
find ~/.local/share/goose/sessions -name '*.jsonl'                # Goose transcripts
find ~/.local/share/opencode/storage/session -name '*.json'      # OpenCode session records
```

### 2. Judge

Signals that a thread artifact is abandoned:

- `old` flag — a month untouched almost always means the session is dead
- a scratchpad whose matching session transcript is itself old or gone
- transcripts under a project directory that no longer exists on disk

Signals to leave something alone (list it, but don't recommend cleaning it):

- `today` flag — could be a session running right now, including this one; a `today` artifact from *any* harness may belong to a live terminal in another window
- **the current session's own transcript and scratchpad** — check your scratchpad path (it's in your context) and never offer it
- anything under a `memory/` directory or `MEMORY.md` (the scanner already excludes these; keep excluding them in fallback mode) — the same goes for other harnesses' persistent config and auth files (`~/.codex/config.*`, `~/.codex/auth.json`, `~/.gemini/settings.json`, …): only session artifacts are candidates, never configuration

When in doubt, put it in the report with your honest uncertainty rather than guessing a verdict.

### 3. Report

Keep it succinct — group by project, one verdict line per row, and lead with the totals (count and size):

```
| Age  | Size | Kind       | Thread                          | Verdict                        |
|------|------|------------|---------------------------------|--------------------------------|
| 94d  | 41M  | transcript | projects/-old-repo/a1b2….jsonl  | delete — repo no longer exists |
| 62d  | 12M  | scratchpad | tmp/claude-501/…/c3d4…          | delete — session long dead     |
| 0d   | 2M   | transcript | projects/-current/e5f6….jsonl   | leave alone — touched today    |
```

### 4. Ask

Ask which ones to delete before touching anything. If the AskUserQuestion tool is available, use it with `multiSelect: true` — sensible batch options work well here ("all transcripts older than 90 days", "all orphaned scratchpads"), plus per-item options for anything borderline. Otherwise ask in plain chat with a numbered list. Always make "none" an easy answer.

State plainly in the question that **deleting transcripts cannot be undone** — the conversation history is gone for good. Scratchpads are lower-stakes (temp working files) but equally unrecoverable.

If nothing looks abandoned, say so and stop — don't invent candidates to justify the scan.

### 5. Execute

For the selected items only:

```bash
rm "<transcript.jsonl>"        # transcripts are single files
rm -rf "<scratchpad-dir>"      # scratchpads are directories
```

### 6. Verify

Confirm each selected path is gone, report the count and disk space reclaimed, and flag anything that resisted (usually permissions — name the fix). If a whole project directory under `~/.claude/projects/` is now empty except for `memory/`, mention it but leave it — the memory stays.

## Notes

- Transcript filenames are opaque session IDs across all harnesses. To help the user choose, peek at a transcript's first user message (`head -5 <file>` and pull the readable text) when a candidate is borderline — a one-line gist beats a UUID.
- In the report, group by harness — "Codex: 34 transcripts, 210 MB" reads better than an interleaved list, and batch options in the Ask step ("all Codex threads older than 90 days") map naturally onto those groups.
- Some harnesses keep threads in places this scanner doesn't cover: Aider stores chat history per-repo (`.aider.chat.history.md`, `.aider.input.history`), and editor-integrated agents (Cursor, Copilot) keep session state inside the editor's own storage. If the user asks about one of those, find its storage location first, then apply the same judge → ask → execute care — the pattern transfers; only the paths change.
- Harness layouts drift between versions. If a documented path comes up empty but the harness is clearly installed, look around its dot-directory (`ls ~/.codex`, `ls ~/.gemini`) before concluding there's nothing to clean.
