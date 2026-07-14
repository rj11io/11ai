---
name: 11ai-benchmark-token-accountant
description: "Compute the tokens spent and dollar cost of benchmark work by parsing the harness's own session transcripts (Claude Code, Codex, or reported totals), pricing them against a maintained per-model rate file (web-verified, never from memory), and writing structured cost artifacts to benchmark/costs/ at session-level granularity — every thread classified as a run, benchmark operations (judging, audits, scaffolding), or unrelated, with per-bucket and grand totals. Use when the user asks what a run or benchmark cost, how many tokens were spent, what the benchmark cost beyond the runs, or for cost analytics across runs and models."
---

# 11ai Benchmark Token Accountant

A benchmark result without its cost is half a result. This skill turns
"how much did that run spend" into data: token counts extracted from the
harness's own session files (never estimated), priced with rates that are
web-verified (never recalled from memory), computed by a script (never
mental math).

## Inputs

- One run id, several, or "the whole benchmark". Each should have a
  ledger entry in `benchmark/runs.json` (`startedAt`, `finishedAt`,
  harness, model) — that's how sessions get matched to runs. Without a
  ledger, ask the user which session file belongs to which run.
- The benchmark repo path (for writing `benchmark/costs/`).

## Step 1 — Locate and parse the threads

Session transcripts live on disk per harness; the exact file formats,
field meanings, and traps (dedupe rules, cumulative counters, cache-token
semantics) are documented in
[references/extractors.md](references/extractors.md) — read it before
parsing anything.

- **Claude Code**: `~/.claude/projects/<cwd-slug>/*.jsonl` — per-message
  `usage` blocks, deduped by message id, summed per model.
- **Codex**: `~/.codex/sessions/<yyyy>/<mm>/<dd>/rollout-*.jsonl` —
  cumulative `token_count` events; take the last one's
  `total_token_usage`.
- **Fallback**: harness-reported totals pasted by the user. Record
  `method: "reported"` instead of `"measured"` — never present the two
  as equally solid.

Match sessions to runs by working directory (both harnesses record the
cwd) plus time window from the ledger. A run may span several sessions
(resumed work) — sum them all, and list every source file in the output.
One thread may also contain **several models** (subagents, judge panels):
always report per model, never blended.

**Classify every thread into one of three kinds** — the buckets the
whole accounting is built on:

- **`run`** — a thread counts as a benchmark run only if BOTH hold: its
  kickoff message is the benchmark's frozen prompt (not a chat like
  "review the output"), AND it actually wrote files into that run's
  folder (Claude Code: `Write`/`Edit` tool calls with the run path;
  Codex: patches/writes into it).
- **`operations`** — benchmark work that isn't a run: scaffolding the
  repo, building the content pack, preparing runs, auditing, judging
  panels, reviewing, reporting. These burn real tokens and belong in
  the benchmark's price tag, just not in any run's.
- **`unrelated`** — threads in the same repo/time window that are
  neither (side chats, other work). Costed so the totals reconcile,
  reported separately, never mixed into benchmark figures.

Threads that merely *mention* run folders are not runs. Record the
evidence for each classification in a `verification` field in the cost
file. Two more traps: **renamed repos** split a run's sessions across
two project slugs (search the old name's slug too), and **resumed
sessions** duplicate history into new files (dedupe by message id
across all files, both slugs).

## Step 2 — Resolve prices

The source of truth is [references/pricing.json](references/pricing.json)
in this skill: per-model rate entries with `match` patterns, four rate
dimensions per 1M tokens, an `effectiveDate`, `verifiedAt`, and a
`sourceUrl` pointing at the provider's official pricing page.

Rules, in order:

1. Match the model id against the entries' `match` globs.
2. **Missing model, or `verifiedAt` older than 30 days → verify on the
   web** before computing: fetch the provider's official pricing page
   (OpenAI: developers.openai.com/api/docs/pricing; Anthropic:
   platform.claude.com/docs/en/pricing), update or add the entry with
   the new `verifiedAt` and `sourceUrl`. For Anthropic models, the
   claude-api skill's model table is an acceptable primary source when
   it is fresher than the pricing file.
3. **Never fill a rate from memory.** If the web is unreachable and the
   entry is stale, compute anyway but mark the output
   `pricingStale: true` and say so.
4. Cache tokens are not optional. Anthropic bills cache writes at a
   premium (1.25× input for 5-minute TTL, 2× for 1-hour) and cache reads
   at 0.1× input; OpenAI bills cached input at ~0.1× with no write
   charge. A calculation that prices all input tokens at the base rate
   can be wrong by 5–10× on cache-heavy agent sessions.

## Step 3 — Compute (script, not arithmetic)

Write a small script (run with `npx tsx` or `node`) that reads the
session file(s) and the pricing entries and emits
`benchmark/costs/<run-id>.json`. Granularity is not optional: every
file breaks down to **session → model → token class**, so any total can
be traced back to the transcript lines that produced it.

```json
{
  "runId": "codex-gpt5.6-sol-high",
  "kind": "run",
  "computedAt": "<ISO>",
  "method": "measured",
  "wallTimeMinutes": 42.5,
  "cacheHitRate": 0.91,
  "sources": ["~/.codex/sessions/2026/07/09/rollout-....jsonl"],
  "verification": { "kickoffMatchesFrozenPrompt": true, "wroteIntoRunFolder": true, "evidence": "..." },
  "sessions": [
    {
      "source": "~/.codex/sessions/2026/07/09/rollout-....jsonl",
      "harness": "codex",
      "startedAt": "<ISO>", "endedAt": "<ISO>",
      "messages": 214,
      "byModel": {
        "gpt-5.6-sol": {
          "input": 0, "cachedInput": 0, "cacheWrite": 0, "output": 0,
          "reasoningOutput": 0, "costUsd": 0
        }
      }
    }
  ],
  "byModel": {
    "gpt-5.6-sol": {
      "input": 0, "cachedInput": 0, "cacheWrite": 0, "output": 0,
      "reasoningOutput": 0,
      "costUsd": 0,
      "ratesUsed": { "per1M": { "input": 5.0, "cachedInput": 0.5, "output": 30.0 }, "sourceUrl": "...", "verifiedAt": "..." }
    }
  },
  "totals": { "tokens": 0, "costUsd": 0 },
  "checks": { "harnessReportedUsd": null, "deltaPct": null }
}
```

(`byModel` at the top level is the sum of the per-session blocks; the
per-session detail is what makes a resumed or multi-model run
auditable. On request, go one level deeper — a per-turn timeline within
a session — but don't emit that by default; it makes the files huge for
little decision value.)

The other two buckets get the same treatment:

- **`benchmark/costs/operations.json`** — `kind: "operations"`, one
  `threads` array (each entry: label like `judging-panel` /
  `scaffold` / `audit`, its sessions, byModel, cost), same totals
  block. This is what operating the benchmark cost on top of the runs.
- **`benchmark/costs/non-benchmark.json`** — `kind: "unrelated"`, same
  shape. Exists so the grand total reconciles against everything the
  transcripts show for this repo; its number never joins benchmark
  figures.

Non-negotiables:

- **Embed `ratesUsed` in every file.** Prices change; the file must stay
  reproducible after they do.
- **Backfill the ledger**: set `costUsd` (and `wallTimeMinutes` if the
  session timestamps give it) on the run's entry in
  `benchmark/runs.json`.
- **Sanity check**: when the harness reported its own cost (Claude
  Code's `/cost`, Codex's summary), compare; flag a delta over 5% in
  `checks` and in your report.

## Step 4 — Aggregate

Whenever more than one cost file exists, also write
`benchmark/costs/summary.json` and a readable `benchmark/costs/COSTS.md`.
The summary's spine is the **bucket block** — the three kinds rolled up
so "what did this benchmark cost" has one authoritative answer:

```json
"buckets": {
  "runsUsd": 0,
  "operationsUsd": 0,
  "benchmarkUsd": 0,
  "nonBenchmarkUsd": 0,
  "grandTotalUsd": 0
}
```

(`benchmarkUsd` = runs + operations; `grandTotalUsd` additionally
includes unrelated. The reviewer copies this block verbatim into
`benchmark/report/data.json`.) Around it:

- **Per run**: total cost, tokens in/out, **cache hit rate**
  (cached-or-read input ÷ total input — a real efficiency differentiator
  between harnesses), cost per minute of wall time.
- **Per configuration** across repeats (`-r2`, ...): mean and spread.
- **Per operations thread**: what judging, auditing, and scaffolding
  each cost — operating overhead is a real number worth watching.
- **Joined with `benchmark/results.json`** when it exists: cost per
  rubric point, and the cost-vs-score framing ("2nd place at a fifth of
  the price"). Never invent scores — no results file, no quality joins.
- **Benchmark-wide**: spend per provider, cheapest and most expensive
  run, most cache-efficient harness.

Commit everything (`bench: costs <run-ids>`).

## Step 5 — Report

For a quick console view of everything already computed, run
[scripts/print-costs.sh](scripts/print-costs.sh) — it scans the current
directory (or `$1`) for `benchmark/costs/*.json` and
`benchmark/results.json` across any number of benchmark repos and prints
per-run tables, per-model breakdowns, unmeasured-run notes, and
cost-per-point when judging results exist. It only prints existing data;
it never computes or prices anything.

When writing your own summary, lead with the buckets — benchmark cost
(runs + operations), unrelated cost, grand total — then one line per
run. Then the comparisons that change decisions (cost per point, cache
efficiency, operations overhead, outliers). State the method per run —
measured from which transcripts, or reported — and any stale-pricing or
delta flags. Costs are exact for
API-billed harnesses; for subscription-billed usage (a Claude/ChatGPT
plan), say clearly that the dollar figure is the *API-equivalent* value,
not what the user was billed.

## Integration with sibling skills

- `$11ai-benchmark-runner` close-out calls this instead of hand-filling
  `costUsd`.
- `$11ai-benchmark-reviewer` validates the cost files, copies the
  bucket block into `benchmark/report/data.json`, and propagates the
  numbers to the READMEs and web app; `$11ai-benchmark-reporter`
  renders from that consolidated file.
- `$11ai-benchmark-analyzer` consumes `costs/summary.json` per repo for
  the cross-benchmark cost-quality frontier.
