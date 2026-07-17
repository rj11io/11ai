# Session-transcript extractors

Field-level reference for pulling token usage out of each harness's
session files. Verified against real transcripts on 2026-07-13; if a
parse comes up empty, inspect one file by hand before assuming the
format — harness updates move fields.

Normalize without discarding provider-native fields. For every normalized
field, record whether it was measured, derived, inferred, reported, or
unavailable. Also extract stable session/conversation/turn/message IDs,
timestamps, harness/model/version, effort, cwd/ref, parent/subagent links, tool
calls by type, files touched, errors/retries, compactions, interruption/resume
events, and exit state whenever the transcript exposes them.

## Claude Code

**Location**: `~/.claude/projects/<cwd-slug>/*.jsonl`, where the slug is
the working directory with `/` replaced by `-` (e.g.
`-Users-alice-repos-mybench`). One file per session; a repo can have
many sessions.

**Shape**: one JSON object per line. Token data lives on lines with
`type: "assistant"` under `message.usage`:

```json
"message": {
  "id": "msg_01...",
  "model": "claude-fable-5",
  "usage": {
    "input_tokens": 14730,
    "cache_creation_input_tokens": 30179,
    "cache_read_input_tokens": 0,
    "output_tokens": 192
  }
}
```

Rules:

- **Dedupe by `message.id`.** Streaming writes the same message (same id,
  same usage) on multiple lines; keep one per id (the last).
- The four usage fields are **disjoint**: `input_tokens` here is the
  *uncached* remainder — total prompt = input + cache_creation +
  cache_read. Sum each field separately.
- **Group by `message.model`.** Subagents and panels put several models
  in one session; skip entries with model `"<synthetic>"` (harness
  bookkeeping, not billed API calls).
- `cache_creation` may carry a detail object splitting
  `ephemeral_5m_input_tokens` vs `ephemeral_1h_input_tokens` — they have
  different write premiums (1.25× vs 2× input); use the split when
  present, else assume 5m.
- Sidechain/subagent activity may live in the same file (`isSidechain`
  entries) or in sibling `agent-*.jsonl` files next to the session —
  include both when computing a run's total.
- Session boundaries: first and last line timestamps give wall time;
  the file's `cwd` fields confirm the repo match.

**Billing** (Anthropic): `input×rate + cacheWrite×writeRate +
cacheRead×readRate + output×outputRate`.

Normalized mapping: `inputUncached=input_tokens`,
`cachedInputRead=cache_read_input_tokens`, cache creation splits into
`cacheWrite5m`/`cacheWrite1h`, and `inputTotal` is their sum. Preserve an
unknown TTL as raw cache creation plus an explicit inference rather than
silently calling it 5-minute usage.

## Codex

**Location**: `~/.codex/sessions/<yyyy>/<mm>/<dd>/rollout-<timestamp>-<uuid>.jsonl`.

**Shape**: first line is `type: "session_meta"` with `payload.cwd` (the
repo match) and CLI version. Token data arrives as `type: "token_count"`
events:

```json
"info": {
  "total_token_usage": {
    "input_tokens": 1302160,
    "cached_input_tokens": 1253376,
    "output_tokens": 37558,
    "reasoning_output_tokens": 13443,
    "total_tokens": 1339718
  },
  "last_token_usage": { ... }
}
```

Rules:

- **`total_token_usage` is cumulative — take the LAST `token_count`
  event only.** Summing the stream overcounts massively.
- **Subset semantics, opposite of Claude Code**: `cached_input_tokens`
  is *included in* `input_tokens`, and `reasoning_output_tokens` is
  included in `output_tokens` (`total = input + output`). Billable
  uncached input = `input - cached`.
- Model id: grep the file for `"model":"..."` (it appears in
  turn-context entries; `session_meta` has `model_provider`). A single
  rollout normally uses one model.
- A run interrupted and resumed produces multiple rollout files with the
  same cwd — match by cwd + the ledger's time window and sum the *final*
  totals of each file.

**Billing** (OpenAI): `(input − cached)×inputRate + cached×cachedRate +
output×outputRate`. Reasoning tokens are already inside output — do not
add them again. There is no cache-write charge.

Normalized mapping: `inputTotal=input_tokens`,
`inputUncached=input_tokens-cached_input_tokens`,
`cachedInputRead=cached_input_tokens`, `outputTotal=output_tokens`, and
`reasoningOutput=reasoning_output_tokens`; derive `nonReasoningOutput` only
when both output counters are available.

## Reported totals (fallback)

When transcripts aren't on this machine (cloud runs, another laptop),
accept the harness's own summary (Claude Code `/cost`, Codex's session
footer) pasted by the user. Record the pasted text verbatim in the cost
file's `sources`, set `method: "reported"`, and skip the sanity-check
delta (there's nothing independent to compare against).

## Matching sessions to runs

1. Filter by cwd — the benchmark repo path (Claude Code: the project
   slug and per-entry `cwd`; Codex: `session_meta.payload.cwd`).
2. Intersect with the ledger entry's `[startedAt, finishedAt]` window
   (file timestamps or first/last event timestamps).
3. Ambiguity (two runs in the same repo overlapping in time) is a stop for run
   attribution: ask the user rather than guessing. Still retain the thread in
   canonical accounting as `unidentified` so total discovery reconciles.
