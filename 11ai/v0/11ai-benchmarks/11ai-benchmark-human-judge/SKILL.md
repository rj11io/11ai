---
name: 11ai-benchmark-human-judge
description: "Guide a human operator through blind benchmark scoring with the same frozen rubric and anonymized evidence used by AI judges, checkpoint drafts safely, write one human judge artifact, and rebuild the aggregate across all AI and human judges. Use when a person wants to score, review, or add a human vote to an existing benchmark judging cycle."
---

# 11ai Benchmark Human Judge

Drive a human through the same evidence and criteria as an AI judge without
changing the rubric or exposing previous scores. Read
[the shared contracts](../references/artifact-contracts.md) first.

## Freeze the operator prompt

Require root `JUDGE.md`. If it is missing, create it from
`../references/judge-prompt-template.md`. After allocating the human judge ID,
freeze its exact instance:

```bash
node <plugin>/scripts/create-judge-prompt.mjs \
  <benchmark-root> <cycle-id> <judge-id> human
```

Guide the operator from that instance without paraphrasing it. Record both
judge-prompt hashes and variables in drafts and the completed artifact; refuse
resume when they differ.

## Prepare

1. Select a cycle with passing audits, frozen `rubric.md`/`rubric.json`, private
   mapping, and complete anonymized `evidence.json`.
2. Verify rubric/evidence hashes. Never silently refresh screenshots mid-cycle.
3. Allocate a stable human `judgeId`. Ask for an optional non-sensitive display
   label; do not require a real name.
4. Record whether the operator already knows run identities. Continue if the
   user wants, but set `identityBlinded: false` and surface it in review.

## Guide scoring

Present one dimension at a time with its definition and 1/5/10 anchors. Show
all anonymized runs at the same surface together, then other surfaces in the
same order. For every run and dimension:

- request an integer or decimal score from 1–10;
- require one short justification tied to visible or recorded evidence;
- allow correction before the dimension is locked;
- record confidence and any missing evidence when the operator provides it.

After all dimensions, ask for an independent overall ranking. Do not show
weighted totals, prior judges, costs, model identities, or the current aggregate
until submission is complete.

## Checkpoint and resume

Write drafts only to `judging/judges/<judge-id>.json` with `status: "draft"`,
completed fields, timestamps, rubric/evidence and both judge-prompt hashes,
prompt variables, and resume position.
Resume only when hashes match. Never count drafts in aggregation.

## Complete and aggregate

Validate that every run has every dimension, every score is in range, every
justification is non-empty, and the ranking contains each run exactly once.
Set `judgeType: "human"`, `status: "complete"`, completion time, blinding state,
and all available operator/session metadata.

Immediately rebuild the aggregate from all complete AI and human artifacts:

```bash
node <plugin>/scripts/aggregate-judges.mjs \
  benchmark/cycles/<cycle-id>/judging/judges \
  benchmark/rubric.json \
  benchmark/cycles/<cycle-id>/judging/aggregate.json
```

Only after the artifact and aggregate are saved may the operator see models,
costs, prior scores, disagreements, and the updated ranking. Regenerate
lifecycle state; hand off to `$11ai-benchmark-publish-cycle` when the panel is
complete.

## Rules

- Never translate a conversation into scores without confirming each score.
- Never fill missing scores from prose, averages, or AI suggestions.
- Completed judge artifacts are immutable; corrections supersede them.
- Adding a human judge updates the existing frozen cycle. Changed runs, rubric,
  or evidence require a new cycle.
- Record unavailable metadata instead of omitting it.
