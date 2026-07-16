---
name: 11ai-benchmark-reporter
description: "Render a benchmark's results into an elegant, self-contained HTML report — verdict, scoreboard, side-by-side screenshot gallery, findings, method note. Use when the user asks for a benchmark report, comparison write-up, results page, or wants to share how the models did. Primary input is benchmark/report/data.json, the consolidated file the reviewer skill validates and writes; falls back to the raw artifacts (runs.json, audits/, results.json, costs/, screenshots/) when no data.json exists. It does not run, audit, score, or price anything itself."
---

# 11ai Benchmark Reporter

The other skills produce data, and `$11ai-benchmark-reviewer` validates
and consolidates it; this one produces the thing you show someone. It
never generates new scores or verdicts — if the data is missing, it
says what's missing instead of inventing it.

## Inputs and gaps

The primary input is **`benchmark/report/data.json`** — the
consolidated, gate-checked file `$11ai-benchmark-reviewer` writes from
the ledger, audits, results, and costs. When it exists and is newer
than the artifacts it summarizes, render from it alone: one source of
truth means this report can never disagree with the READMEs the
reviewer updated from the same file.

When it's missing or stale, say so and offer to run the reviewer first
(the normal path). If the user wants a report anyway, fall back to
reading the raw files under `benchmark/` and classify:

- **Full report** — runs + audits + results + screenshots all present.
- **Partial report** — runs exist but no judging yet: report facts only
  (who ran, cost/time, audit verdicts, screenshots side by side) and
  label it explicitly as "not yet judged". Never rank unjudged runs.

Tell the user which one they're getting and why.

## The report

Default output: a single self-contained HTML page (all screenshots
embedded as data URIs, no external requests) rendered as an Artifact
when available, saved to `benchmark/report/report.html` either way, with
a markdown twin `benchmark/report/report.md` for the repo. Structure:

1. **Header** — benchmark name, objective, skill under test (pull the
   phrasing from `PROMPT.md`), date, prompt/content/rubric versions
   (the shas from the ledger — they prove all runs got the same task).
2. **Verdict up top** — one paragraph: who won, by how much, and the
   single most interesting difference. Written for someone who reads
   nothing else.
3. **Scoreboard** — one row per run: rank, run id (harness / model /
   effort), total, per-dimension medians, audit verdict, wall time,
   cost, and cost per rubric point. Costs come from `data.json` (which
   carries the accountant's numbers) — or, in fallback mode, from
   `benchmark/costs/` directly, preferred over the bare ledger field.
   Note per row whether the cost was measured or reported. Mark rule-breaking runs clearly (audit failed → shown but
   struck through or badged "disqualified", never silently dropped —
   that a model broke the rules IS a result).
4. **Gallery** — per surface (mobile / desktop / print), all runs' 
   screenshots side by side in the same order, labeled with run ids
   (the report is de-anonymized; anonymity was for judging).
5. **Findings** — 3–6 short observations backed by evidence: judge
   disagreements worth quoting, a dimension where one model ran away
   from the pack, cost-vs-score outliers ("second place at a fifth of
   the cost"), recurring failure patterns across models.
6. **Method note** — how many judges, rubric version, what was NOT
   measured (interactions, accessibility, performance — whatever the
   rubric skipped), and the sample-size caveat when there's one run per
   configuration: this is an anecdote about these runs, not a general
   model ranking.

## Rules

- Every number in the report must trace to `benchmark/report/data.json`
  (or, in fallback mode, to a raw file under `benchmark/`) — no
  recomputed or remembered values.
- Screenshots in the gallery must be the ones judging used, not fresh
  captures (the report documents what was scored).
- Keep the writing plain: name the models, say what happened, skip the
  drama. The screenshots carry the persuasion.
- If publishing beyond the repo (artifact link, hosted page), confirm
  with the user first — results name models and costs, and once shared
  they're out.
