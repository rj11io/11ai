---
name: 11ai-benchmark-judge
description: "Run one or more independent AI judges over audited benchmark runs using frozen criteria and identical anonymized evidence, save one immutable artifact per judge, and rebuild the cycle's aggregate after every completed judge. Use when the user asks to judge, score, rank, compare, add an AI judge, or resume AI judging. Requires passed audits, a frozen rubric, and a benchmark cycle; use 11ai-benchmark-human-judge for a human operator."
---

# 11ai Benchmark Judge

Score quality without leaking model identity or letting later judges anchor on
earlier scores. Treat each judge as an independent observation and rebuild the
aggregate from all completed judges after every addition.

Read [the shared contracts](../references/artifact-contracts.md) before writing
artifacts. Use `../schemas/judge.schema.json` and
`../schemas/judging-aggregate.schema.json`.

## Freeze the operator prompt

Require root `JUDGE.md`. If it is missing, create it from
`../references/judge-prompt-template.md`; never reconstruct instructions from
existing scores. Allocate the judge ID and freeze the exact instance:

```bash
node <plugin>/scripts/create-judge-prompt.mjs \
  <benchmark-root> <cycle-id> <judge-id> ai
```

Give the operator and judge this instance verbatim. Record
`judgePromptTemplateSha`, `judgePromptInstanceSha`, and
`judgePromptVariables`. Refuse to resume the judge ID when they differ.

## Preconditions

- Require at least two eligible runs and passing audit artifacts.
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
- missing, failed, or unavailable evidence explicitly.

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
3. Score every dimension 1–10 against its concrete anchors. Require a concise
   visible-evidence justification for every score.
4. Collect an independent holistic `overallRanking` after dimension scoring.
5. Record judge model/provider/harness/version, effort, timing, both judge
   prompt hashes/variables, evidence/rubric hashes, errors, retries, and
   token-accounting thread IDs.
6. Validate and write
   `judging/judges/<judge-id>.json` with `judgeType: "ai"`.
7. Before starting the next judge, rebuild the aggregate from every complete
   judge file using:

   ```bash
   node <plugin>/scripts/aggregate-judges.mjs \
     benchmark/cycles/<cycle-id>/judging/judges \
     benchmark/rubric.json \
     benchmark/cycles/<cycle-id>/judging/aggregate.json
   ```

Rebuilding from raw judge files makes retries and next-day resumes idempotent.

## Aggregate and interpret

The script computes dimension medians, weighted totals, dispersion, holistic
median rank, Borda signal, AI/human counts, deterministic ties, and
score-versus-holistic disagreement. Weighted rubric total remains official.

Flag rather than hide:

- any dimension range of 4+ points;
- rubric rank versus holistic rank disagreement of 2+ places;
- human versus AI distribution differences when both exist;
- incomplete metadata, failed evidence, or a judge exposed to identities;
- a judge produced by the same session that built a run.

The next judge must not see these flags until after submitting its own artifact.

## Publish handoff

De-anonymize only in reviewed/public artifacts. Report current rank, totals,
judge composition, disagreements, missing evidence, and exactly what was not
scored. Scores compare this cohort under this rubric; they are not absolute
model grades. Regenerate lifecycle state, then hand off to
`$11ai-benchmark-publish-cycle` when the required panel is complete.

## Rejudging and async safety

- Adding a judge to the same frozen cycle appends one judge artifact and rebuilds
  the aggregate.
- Adding runs or changing frozen inputs creates a new cycle; never overwrite the
  prior aggregate or report.
- A draft judge may resume under the same ID. A completed judge is immutable;
  corrections create a superseding ID with an explicit reference.
- Re-running aggregation with unchanged inputs must produce no file change.
