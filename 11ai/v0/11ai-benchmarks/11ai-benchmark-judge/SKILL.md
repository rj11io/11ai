---
name: 11ai-benchmark-judge
description: "Score audited benchmark runs on quality — capture screenshots of every run at every output surface, have a panel of model judges score anonymized runs against the frozen rubric, and leave a complete judgement artifact (per-judge scores with justifications, mapping, aggregated benchmark/results.json). Use when the user asks to judge, score, rank, or compare finished runs. Requires passed compliance audits (auditor skill) and an existing frozen benchmark/rubric.md (rubric-creator skill — this skill never writes criteria); the reviewer skill validates and publishes what this produces."
---

# 11ai Benchmark Judge

Judging is where benchmarks usually go soft: unpinned criteria, judges
who know which model made what, scores that drift between sessions. This
skill keeps it honest with three mechanisms: a rubric frozen before
scoring, anonymized runs, and a panel of independent judges whose scores
are aggregated rather than negotiated.

## Preconditions

- At least two runs to compare (judging one run alone produces a number
  with nothing to anchor it — warn the user).
- Every run to be judged has a passing report in `benchmark/audits/`.
  Refuse to judge unaudited or failed runs; list them and point to
  `$11ai-benchmark-compliance-auditor`.

## Step 1 — Require the frozen rubric

`benchmark/rubric.md` must already exist. Use it unchanged — record its
sha256 (it becomes `rubricSha` in the results) and never edit it here;
mid-benchmark rubric edits invalidate earlier scores. If the file is
missing, stop and point to `$11ai-benchmark-rubric-creator`: criteria
must be written before anyone studies run output, and writing them
inside a judging session is exactly the fitted-to-results failure that
skill exists to prevent.

## Step 2 — Capture evidence

Boot the dev server once. For each run, capture every output surface the
benchmark defines, using whatever browser automation is available (e.g.
Playwright via `npx playwright`):

- **mobile** — 375×812 viewport, full-page screenshot
- **desktop** — 1440×900 viewport, full-page screenshot
- **print** (if the benchmark has a print surface) — render with print
  media emulation, or export via the browser's PDF printing, one image
  per page

Save to `benchmark/screenshots/<run-id>/<surface>.png`. Same viewport
sizes, same pages, same order for every run — judges must compare like
with like. Also record per run: any console errors on load (they feed
the craft dimension).

## Step 3 — Anonymize

Assign each run a letter (Run A, Run B, ...) by shuffled order and write
the mapping to `benchmark/judging/<session>/mapping.json`. Judges see
letters and screenshots only — never run ids, folder names, or code
authorship hints. This matters most when the judges are models: a judge
must not be able to favor its own family.

## Step 4 — Panel scoring

Spawn 3 independent judge subagents (5 for a high-stakes comparison).
Each judge gets: the rubric, the anonymized screenshot sets for ALL
runs, and instructions to:

- score every run on every dimension, 1–10, using the rubric anchors;
- justify each score in one or two sentences pointing at something
  visible ("Run C's desktop hierarchy buries the section headings");
- rank the runs overall at the end, independent of the arithmetic.

Judges must not see each other's scores. Collect each judge's output as
`benchmark/judging/<session>/judge-<n>.json` in this pinned shape — the
per-judge files, `mapping.json`, and `results.json` together are the
judgement artifact that `$11ai-benchmark-reviewer` later validates, so
none of these fields are optional:

```json
{
  "judge": 1,
  "judgeModel": "<model id that did the scoring>",
  "scoredAt": "<ISO timestamp>",
  "runs": [
    {
      "anonymizedAs": "A",
      "dimensions": {
        "hierarchy": { "score": 8, "justification": "one or two sentences pointing at something visible" }
      }
    }
  ],
  "overallRanking": ["C", "A", "B"]
}
```

## Step 5 — Aggregate

- Per run per dimension: the **median** across judges (robust to one
  eccentric judge).
- Per run total: weighted sum of dimension medians, per the rubric
  weights.
- Flag any dimension where judges disagree by 4+ points — quote the
  conflicting justifications in the results notes instead of silently
  averaging the disagreement away.
- De-anonymize and write `benchmark/results.json`:

```json
{
  "rubricSha": "<sha256 of benchmark/rubric.md>",
  "judgedAt": "<ISO timestamp>",
  "session": "benchmark/judging/<session>/",
  "judges": 3,
  "runs": [
    {
      "id": "codex-gpt5.5-high",
      "anonymizedAs": "B",
      "dimensions": { "hierarchy": 8, "typography": 7, "responsiveness": 9, "craft": 6 },
      "total": 7.6,
      "rank": 1,
      "notes": "Judges split 4 vs 8 on typography: ..."
    }
  ]
}
```

Commit everything (`bench: judge <n> runs`).

## Step 6 — Report to the user

The ranking with totals, the biggest per-dimension gaps between runs,
any judge disagreements worth a human look, and the next step:
`$11ai-benchmark-reviewer` validates this judgement artifact together
with the audits and costs and propagates the results (READMEs, web
app), and `$11ai-benchmark-reporter` renders the shareable page from
what the reviewer consolidates. State clearly what was and wasn't
judged (e.g. "screenshots only — interaction feel was not scored").

## Rules

- Never let the same session both build a run and judge it against
  others without saying so in the results notes.
- Re-judging after adding new runs: reuse the frozen rubric, capture the
  new runs the same way, and re-run the full panel over ALL runs (old
  scores don't transfer across panels); keep prior results files, don't
  overwrite them.
- Scores are for comparison within this benchmark, not absolute grades —
  say so whenever reporting them.
