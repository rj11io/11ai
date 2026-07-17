---
name: 11ai-benchmark-initialize
description: "Initialize a new single-app or isolated benchmark campaign through ready-for-runs without allocating or launching any benchmark run. Use when creating a benchmark control plane, baseline, PROMPT.md, JUDGE.md, frozen rubric, optional time-gated run plan, empty ledger, or verified campaign before model execution begins."
---

# 11ai Benchmark Initialize

Create the complete benchmark control plane, then stop before the first run.
Read [the lifecycle contract](../references/lifecycle-contract.md) and shared
[artifact contracts](../references/artifact-contracts.md).

## Discover and initialize

1. Inspect the objective, isolation needs, dependencies, content mode, evidence
   surfaces, desired configurations, availability gates, and existing app.
2. Invoke `$11ai-benchmark-creator-singleapp` when shared routes are acceptable;
   otherwise invoke `$11ai-benchmark-creator-multirepo`.
3. Invoke `$11ai-benchmark-rubric-creator` before opening run output.
4. Create frozen `PROMPT.md` with `{{RUN_ID}}`.
5. Create root `JUDGE.md` from
   `../references/judge-prompt-template.md`, preserving `{{CYCLE_ID}}`,
   `{{JUDGE_ID}}`, and `{{JUDGE_TYPE}}`.
6. Write valid `benchmark/benchmark.json`, empty `benchmark/runs.json`, and the
   required directories. Do not create a real cycle before a cohort exists and
   do not point `current.json` at an imaginary review.

## Optional run plan

When desired configurations are known, write `benchmark/run-plan.json` against
`../schemas/run-plan.schema.json`. Use stable target IDs and record planned,
available, or time-gated status plus `notBefore` when known. Default closure to
`target-set` only when the operator supplied a target set; otherwise use
`manual`. Future plan edits do not invalidate frozen cycles.

Never invent model availability or a closing date. Preserve unknown metadata as
null and let the operator add targets later.

## Verify and stop

Run the creator's baseline checks, validate config/rubric/ledger/run plan, then
run:

```bash
node <plugin>/scripts/detect-lifecycle-state.mjs <benchmark-root>
```

Require `ready-for-runs` or the honest `waiting-for-runs` state. Do not allocate
a run ID, instantiate `PROMPT.md`, launch a harness, capture judging evidence,
or create a judge. Report available and time-gated targets plus how to invoke
the lifecycle next.
