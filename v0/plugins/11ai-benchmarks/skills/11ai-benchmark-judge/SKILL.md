---
name: 11ai-benchmark-judge
description: "Run one or more independent AI judges over benchmark runs using frozen criteria and anonymized evidence, including partial or error-affected runs when defensible evidence remains. Save immutable judge artifacts and rebuild a partial-aware aggregate after every completed judge. Use when the user asks to judge, score, rank, compare, add an AI judge, or resume AI judging; use 11ai-benchmark-human-judge for a human operator."
---

# 11ai Benchmark Judge

Score quality without leaking model identity or letting later judges anchor on
earlier scores. Treat each judge as an independent observation and rebuild the
aggregate from all completed judges after every addition. Continue through
missing evidence, render failures, and non-blocking errors: score every
dimension that has defensible evidence, mark the rest unavailable, and never
invent a score.

Read [the shared contracts](../../references/artifact-contracts.md) before writing
artifacts. Use `../../schemas/judge.schema.json` and
`../../schemas/judging-aggregate.schema.json`.

## Freeze the operator prompt

Require root `JUDGE.md`. If it is missing, create it from
`../../references/judge-prompt-template.md`; never reconstruct instructions from
existing scores. Allocate the judge ID and freeze the exact instance:

```bash
node <plugin>/scripts/create-judge-prompt.mjs \
  <benchmark-root> <cycle-id> <judge-id> ai
```

Give the operator and judge this instance verbatim. Record
`judgePromptTemplateSha`, `judgePromptInstanceSha`, and
`judgePromptVariables`. Refuse to resume the judge ID when they differ.

## Preconditions

- Require at least two runs in the frozen cohort and a frozen cycle/rubric.
  Audits and evidence may be partial or failed; their availability becomes part
  of the judging input rather than an automatic reason to abandon the pass.
- Require frozen `benchmark/rubric.md` plus machine-readable
  `benchmark/rubric.json`; verify its hash.
- Select or create `benchmark/cycles/<cycle-id>/cycle.json`. Freeze its run
  membership, prompt-template/content/rubric hashes, and evidence surfaces.
- Resume a draft cycle when inputs match. Create a new cycle when membership,
  rubric, evidence requirements, or other frozen inputs changed.

## Capture a complete evidence bundle

Capture every run with identical settings and write cycle-scoped screenshots
plus `judging/evidence.json`. At minimum record:

- mobile 375×812 and desktop 1440×900 full-page screenshots;
- every extra defined surface: print pages, dark mode, states, interactions;
- viewport, media, route, timestamp, browser, OS/runtime, and capture hashes;
- console messages, page errors, failed requests, HTTP status, and timings;
- accessibility, performance, interaction, or visual-diff probes when the
  benchmark requested them;
- missing, failed, or unavailable evidence explicitly. Do not stop capture
  merely because one run fails to render.

Capture as much defensible metadata as tools expose. Do not infer a pass from
missing evidence. Runtime errors that violate hard rules belong in the audit;
non-blocking errors remain visible to judges under the rubric's craft dimension.

## Anonymize once per cycle

Shuffle runs once, write the private mapping to `judging/mapping.json`, and use
stable labels for the entire cycle. The judge-visible evidence must remove run
IDs, paths, model/provider/harness names, code authorship, and cost. Record the
shuffle seed and anonymization method privately.

## Run judges sequentially or as an explicit panel

Default to three judges; use five for consequential comparisons. A user may add
judges later. For each judge:

1. Allocate a stable `judgeId`; never reuse or overwrite a completed ID.
2. Give only the frozen rubric, anonymized evidence for all runs, and its exact
   frozen JUDGE.md instance. Do not reveal previous judge files or aggregate.
3. Judge every dimension against its concrete anchors. Use a 1–10 score with a
   concise visible-evidence justification when possible; otherwise record the
   dimension as explicitly unavailable under the partial-evidence protocol.
4. Collect an independent holistic `overallRanking` over runs with enough
   evidence to compare. Omit runs that cannot be responsibly ranked and record
   them in `unrankedRuns` with a reason.
5. Record judge model/provider/harness/version, effort, timing, both judge
   prompt hashes/variables, evidence/rubric hashes, errors, retries, and
   token-accounting thread IDs.
6. Validate and write
   `judging/judges/<judge-id>.json` with `judgeType: "ai"`.
7. Before starting the next judge, rebuild the partial-aware aggregate from every complete
   judge file using:

   ```bash
   node <plugin>/scripts/aggregate-judges.mjs \
     benchmark/cycles/<cycle-id>/judging/judges \
     benchmark/rubric.json \
     benchmark/cycles/<cycle-id>/judging/aggregate.json
   ```

Rebuilding from raw judge files makes retries and next-day resumes idempotent.

If the judge process itself times out or errors, preserve the draft/error
metadata, retry or resume under the same frozen judge ID when possible, and
continue with another independent judge if the frozen cohort and blinding
remain valid. Never mark an interrupted judge complete or discard completed
judges because one judge failed.

## Partial-evidence judging protocol

For every run and every rubric dimension:

- assign a normal 1–10 score when the recorded UI, interaction trace, error
  output, source artifact, or other frozen evidence supports a judgment;
- if the dimension cannot be judged, write `score: null`, a non-empty
  justification beginning with `Unavailable:`, and `availability: "unavailable"`;
- record the missing surface, failed route, console/runtime error, or evidence
  limitation in `evidenceLimits`/`unscoredDimensions`;
- score the observed impact of a runtime or build error when the rubric covers
  reliability, craft, or completion; do not convert an error into a blanket
  zero for unrelated dimensions;
- never infer what an unseen screen, interaction, or output would have shown.

The judge artifact remains complete when every run has a dimension entry and
every unavailable entry explains why. A run with no defensible score in any
dimension is retained in the artifact but excluded from holistic ranking and
marked in `unrankedRuns`.

## Aggregate and interpret

The script computes dimension medians from available scores, coverage-aware
weighted totals normalized over the available rubric weight, dispersion,
holistic median rank, Borda signal, AI/human counts, deterministic ties, and
score-versus-holistic disagreement. It retains `null` for dimensions with no
available score and marks runs with no score as unrankable. A partial total is
never presented as a full-coverage score; expose its `scoreCoverage`.

Flag rather than hide:

- any dimension range of 4+ points;
- rubric rank versus holistic rank disagreement of 2+ places;
- human versus AI distribution differences when both exist;
- incomplete metadata, failed evidence, or a judge exposed to identities;
- a judge produced by the same session that built a run.

The next judge must not see these flags until after submitting its own artifact.

## Publish handoff

De-anonymize only in reviewed/public artifacts. Report current rank, totals,
judge composition, disagreements, score coverage, unranked runs, missing
evidence, and exactly what was not scored. Scores compare this cohort under
this rubric; they are not absolute model grades. Regenerate lifecycle state,
then hand off to
`$11ai-benchmark-publish-cycle` when the required panel is complete.

## Rejudging and async safety

- Adding a judge to the same frozen cycle appends one judge artifact and rebuilds
  the aggregate.
- Adding runs or changing frozen inputs creates a new cycle; never overwrite the
  prior aggregate or report.
- A draft judge may resume under the same ID. A completed judge is immutable;
  corrections create a superseding ID with an explicit reference.
- Do not abandon the judge because one run, route, surface, or dimension is
  unavailable; stop only when blinding/rubric integrity is compromised or no
  run has any defensible evidence.
- Re-running aggregation with unchanged inputs must produce no file change.
