---
name: 11ai-benchmark-rubric-creator
description: "Create and freeze a benchmark's judging criteria — benchmark/rubric.md, with 4–6 weighted dimensions and concrete 1/5/10 anchors matched to the skill under test — before any run output is seen. Use when the user wants to define, create, or edit judging criteria or a rubric for a benchmark, and right after scaffolding a new benchmark. The judge skill requires this file and never creates it; editing a rubric after judging has happened means a new version and a full re-judge."
---

# 11ai Benchmark Rubric Creator

The rubric is the benchmark's definition of quality, and its value comes
from *when* it is written: criteria fixed before anyone sees a run's
output can't be bent to fit the results. This skill writes that file —
`benchmark/rubric.md` — and freezes it. `$11ai-benchmark-judge` refuses
to run without it and never edits it.

The best moment to invoke this skill is right after the benchmark is
scaffolded, before the first run. The latest safe moment is before the
first judging panel.

## Step 1 — Check the timing

Look at what already exists, in order:

1. **Judging happened** (`benchmark/results.json` or files under
   `benchmark/judging/` exist) — the current rubric is locked. Editing
   it now silently invalidates the scores it produced. The only honest
   path is a new version (`rubric-v2.md` or a versioned heading), a full
   re-judge of every run under the new rubric, and keeping the old
   results files. Say this and get explicit agreement before touching
   anything.
2. **Runs exist but nothing is judged** — creating the rubric is still
   fine *if the author hasn't studied the outputs*. Warn about the fit
   risk (criteria written while looking at results get fitted to
   results) and proceed on the user's say-so, without opening any run's
   pages or screenshots yourself.
3. **No runs yet** — the ideal case; proceed.

## Step 2 — Read what the benchmark measures

Pull from the repo, don't re-ask what it already answers:

- `PROMPT.md` — the "skill under test" paragraph and the quality bar.
  The rubric and the prompt must agree about what is being compared.
- The output surfaces the prompt defines (mobile, desktop, print, dark
  mode, interactions) — every dimension must be judgeable from evidence
  captured at those surfaces.

## Step 3 — Build the dimensions with the user

Work from [references/rubric-template.md](references/rubric-template.md).
Propose a draft; let the user adjust. The constraints:

- **4–6 dimensions, weights summing to 100.** More dimensions and
  judges stop discriminating between them.
- **The heaviest weight goes to the skill under test** named in
  `PROMPT.md`.
- **Every dimension gets 1/5/10 anchors** — concrete descriptions a
  judge can match against a screenshot ("headings weaker than body
  text"), never vibes ("good typography").
- Swap dimensions to fit the objective: a dashboard wants data-viz
  correctness, a landing page wants persuasion structure.

## Step 4 — Sanity-check before freezing

- Each dimension is observable from the defined surfaces. If a
  dimension needs interaction and the judge only captures static
  screenshots, either drop it or note it as unscored — don't leave a
  dimension the evidence can't support.
- No dimension rewards something the prompt forbids (e.g. "library
  choice" in a no-new-dependencies benchmark).
- Anchors describe *visible* differences; a stranger with only the
  screenshots could apply them.

## Step 5 — Freeze

Write `benchmark/rubric.md` with a version and freeze date in the title
(`# Rubric — <benchmark> (v1, frozen <date>)`), commit it
(`bench: rubric v1`), and report the file's sha256 — the judge records
that as `rubricSha` in the results, proving which criteria produced
which scores.

## Rules

- Edits **before** any judging: fine — re-freeze (new commit, same
  version if nothing was judged against it).
- Edits **after** judging: new version + full re-judge of all runs +
  old results kept. Never edit in place.
- This skill writes criteria; it never scores anything. Scoring is
  `$11ai-benchmark-judge`, and only after `$11ai-benchmark-compliance-auditor`
  has passed the runs.
