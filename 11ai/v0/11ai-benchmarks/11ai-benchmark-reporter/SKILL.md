---
name: 11ai-benchmark-reporter
description: "Render or synchronize one or every stale reviewed benchmark cycle into self-contained HTML and Markdown reports containing the fullest available scores, judges, evidence, audits, token classes, cost scopes, lifecycle coverage, metadata, provenance, caveats, and visualizations. Use for a benchmark report, comparison write-up, shareable results artifact, or refreshing report code and content from newer canonical review data. It presents reviewed data and never scores or prices."
---

# 11ai Benchmark Reporter

Render the reviewer's cycle-scoped `review/data.json`. If it is missing or
stale, run the reviewer first. Raw-artifact fallback is allowed only when the
user explicitly accepts a prominently labeled unreviewed/partial report.

In sync mode, discover every expected report in scope, compare its embedded
review source digest, and rerender only missing or stale outputs. A newer cycle
never overwrites an older immutable report path.

## Output

Write `benchmark/cycles/<cycle-id>/report/report.html` and `report.md`. HTML is
self-contained: embed the judging evidence used, avoid external requests, and
include the data source digest. Do not overwrite historical cycle reports.

## Information hierarchy

1. Verdict, interim/final state, publication sequence, campaign coverage and
   time-gated targets, cohort, date, freshness, hashes, and measurement limits.
2. Sortable scoreboard: identity/configuration, rank/score/dimensions, audit,
   judge count/composition, wall time, tokens, cost, and cost/point.
3. Same-surface evidence gallery with errors and unavailable states.
4. Judge analysis: medians, dispersion, holistic-versus-score rank, AI/human
   comparison, disagreements, blinding, and justifications.
5. Accounting: benchmark scope, judge scope, every identified-other label,
   unidentified, benchmark+judge, and total; reconcile thread counts/tokens/cost.
6. Token/cost detail: input composition, output/reasoning, per-class pricing,
   models/sessions/tools, cache efficiency, operations overhead, and provenance.
7. Audit and runtime detail: every check, command/evidence, console/page/network
   errors, timings, environments, and warnings.
8. Findings backed by owned artifacts, then method and sample-size caveats.
9. Machine-readable metadata appendix containing every reviewed field that is
   not already visible, including missing/unavailable coverage.

## Visualizations

Use inline SVG/HTML generated from reviewed values: score/dimension comparison,
judge dispersion, cost vs score, token and cost composition, accounting scopes,
cache efficiency, wall time, audit outcomes, and cycle history when available.
Every graphic needs exact values and a table/text fallback. Do not add derived
metrics the owning artifact did not provide.

## Rules

- Every number and claim traces to reviewed data and retains provenance.
- Costs distinguish measured/reported/inferred and API-equivalent billing.
- Failed/disqualified runs remain visible.
- Use judging evidence, never fresh screenshots.
- Treat one run per configuration as an anecdote, not a general model ranking.
- Re-rendering the same source digest produces no content change.
- Refresh existing report structure, copy, charts, and metadata appendix when
  the canonical review contract evolves; do not update only a hidden data blob.
- Confirm before publishing outside the working tree.
