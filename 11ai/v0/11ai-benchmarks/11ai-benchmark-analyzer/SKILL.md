---
name: 11ai-benchmark-analyzer
description: "Aggregate results across multiple 11ai benchmark repos into a cross-benchmark leaderboard — per-model and per-harness standings, cost-vs-quality profiles, and trends over time — with honest sample-size caveats. Use when the user asks how models compare across benchmarks, wants a leaderboard, or wants patterns spanning several benchmark repos. Needs at least two benchmarks with results; for one benchmark's write-up use the reporter skill."
---

# 11ai Benchmark Analyzer

## Commit authorization

Do not create a git commit unless the user explicitly asks for a commit
in the current request. Requests to run, audit, judge, finish, report,
publish, or complete a benchmark lifecycle are not commit authorization.
Leave changed files uncommitted and report their status. If the user
explicitly asks for a commit, stage only the in-scope files.

One benchmark says who designed the better page that day. Several
benchmarks start to say something about the models. This skill reads
every benchmark repo's data and produces the cross-benchmark view — and
is strict about the difference between those two sentences.

## Step 1 — Discover and load

The user names a parent directory of benchmark repos (or lists repos).
A repo counts when it has `benchmark/runs.json`; it contributes scores
when it also has `benchmark/results.json`. For each, load:

- the ledger (`runs.json`): harness, model, effort, cost, wall time
- `costs/summary.json` when present (written by the token accountant):
  per-run token breakdowns, cache hit rates, and measured costs — prefer
  these over the ledger's bare `costUsd`
- results (`results.json`): totals, dimensions, ranks, rubric sha
- audits: disqualifications
- the objective and skill under test (from `PROMPT.md`), so benchmarks
  can be grouped by what they measure

Report what was found and what was skipped (no results yet, failed
audits) before any analysis.

## Step 2 — Normalize before comparing

Raw totals are not comparable across benchmarks — different rubrics,
different score spreads. Within each benchmark convert to **rank** and
to **relative score** (percent of that benchmark's top total). Aggregate
only those. Group by configuration (harness + model + effort); keep
repeat runs (`-r2`, ...) as separate observations of the same
configuration.

## Step 3 — Compute the standings

- **Leaderboard** — per configuration: benchmarks entered, mean rank,
  mean relative score, wins, disqualifications. Sort by mean rank.
- **Cost-vs-quality** — relative score against cost and wall time; name
  the efficient frontier ("model X reaches 90% of the winner at a third
  of the cost").
- **Dimension patterns** — where rubrics share dimension names
  (typography, hierarchy, craft...), per-model strengths and weaknesses
  across benchmarks.
- **Trends** — when the ledger spans model or harness versions, how a
  configuration's standing moved over time.
- **Rule-breaking rate** — audit failures per configuration; a model
  that ignores constraints is a finding, not a footnote.

## Step 4 — Say what the data can't

Every output must carry its caveats inline, not in fine print:

- N is tiny. "2 wins in 3 benchmarks" is a lean, not a law — print the
  N next to every aggregate.
- Configurations that entered different benchmark subsets aren't
  directly comparable; mark partial-coverage rows.
- Mixed rubric versions or prompt versions within a benchmark's history
  mean those runs were different tasks — segment, don't blend.
- These are design-and-build benchmarks scored by model judges; say so
  once, clearly.

## Step 5 — Write the output

`leaderboard.json` (the tables as data) and `LEADERBOARD.md` (the
readable version: standings table, cost-quality chart description or
embedded chart, per-model one-paragraph profiles, caveats) at the parent
directory the user pointed at. Lead the markdown with the three-sentence
version: who leads, who's the value pick, what's the most consistent
pattern. Offer an Artifact rendering when the user wants to share it.

This skill is the *computation* layer for cross-benchmark numbers; the
*distribution* layer is `$11ai-benchmark-reviewer`, which renders
`leaderboard.json` into the root README's results section and the web
app. Keep that split: the reviewer never re-aggregates, and this skill
never edits READMEs outside its own two output files.

## Rules

- Read-only toward the benchmark repos — never edit their data files.
- Every aggregate must be recomputable from the repos' JSON; no numbers
  from memory or from prior conversations.
- When two benchmarks disagree sharply about a model, surface the
  disagreement (with both screenshots' worth of context via the repos'
  reports) rather than letting the mean hide it.
