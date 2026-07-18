---
name: 11ai-benchmark-run-lifecycle
description: "Run or resume an entire benchmark campaign from its earliest incomplete or stale prerequisite through runs, interim or final judging cycles, accounting, review, reports, synchronization, and benchmark websites. Use when the user asks to run the benchmark lifecycle end to end, rush a valid interim publication while models remain time-gated, hard-close a completed campaign, resume next-day work, or continue from or through a named lifecycle stage."
---

# 11ai Benchmark Run Lifecycle

Orchestrate existing benchmark skills without duplicating their domain logic.
Read [the lifecycle contract](../../references/lifecycle-contract.md) and
[artifact contracts](../../references/artifact-contracts.md) first.

## Detect before acting

Run the deterministic detector:

```bash
node <plugin>/scripts/detect-lifecycle-state.mjs <benchmark-root>
```

Trust validated source artifacts over the derived state file. Restart at the
earliest missing or explicitly stale prerequisite, even when a downstream file
exists. Recompute state after every stage. Matching source digests must produce
no duplicate run, cycle, judge, marker section, report, or website node.

## Select the lifecycle mode

- **resume:** default; continue from the detected stage.
- **soft:** process all currently eligible data, publish an `interim` cumulative
  cycle, and leave the campaign open for planned or time-gated models.
- **hard:** require satisfied closure policy or an explicit recorded waiver,
  publish a `final` cumulative cycle, and mark the campaign hard-closed.
- **from:** accept an explicit starting stage only after validating every prior
  prerequisite; backfill safe missing prerequisites instead of skipping them.
- **through:** stop cleanly at the named boundary and record the next action.

Soft relaxes configuration coverage only. It does not silently reduce audit,
evidence, judging, accounting, or review quality. Record any explicitly reduced
interim judging policy and label the result provisional everywhere.

## Drive the stages

1. `initialization-required` → invoke `$11ai-benchmark-initialize`.
2. `ready-for-runs` or `waiting-for-runs` → launch only authorized, available
   targets through `$11ai-benchmark-runner`; wait when a harness, model, or
   human operator is unavailable.
3. `ready-for-interim-cycle` or `ready-for-final-cycle` → invoke
   `$11ai-benchmark-freeze-cycle` with the selected release type.
4. `preparing-judging` → resume freeze-cycle; do not run a judge inside it.
5. `waiting-for-judges` → allocate each AI or human judge, freeze its JUDGE.md
   instance, run the matching judge skill, and aggregate after every completion.
6. `ready-to-publish` → invoke `$11ai-benchmark-publish-cycle`.
7. `ready-to-sync` → invoke `$11ai-benchmark-sync`; then recompute state. If
   the latest release is final and the detector requests hard-close
   bookkeeping, resume `$11ai-benchmark-publish-cycle` so the atomic finalizer
   runs.
   Do not loop through sync when its source digests are already current.
8. `interim-published-open` → stop successfully until new targets become
   available, unless the operator explicitly requests another action.
9. `hard-closed` → stop; require explicit reopen into a new campaign revision.

Never fabricate progress across an operator boundary. A time-gated model or
human judge is an expected waiting state, not a failed lifecycle.

## Cumulative releases

Do not rerun completed models merely to publish again. When new eligible runs
appear, create a new cycle containing all comparable eligible runs to date.
Reuse unchanged raw runs, audits, transcripts, and evidence by hash where the
cycle requirements permit, but run fresh judging for the changed cohort. Keep
every old cycle and URL immutable; move `current.json` only after review passes.

## Safety and completion

- Prepare-only remains the runner default; headless launch requires existing
  operator authorization.
- Do not commit, deploy, publish externally, or mutate unrelated work without
  authorization.
- A hard close requires every target complete or excluded under `target-set`,
  or explicit confirmation under `manual`; unresolved targets require a
  recorded waiver.
- End by rerunning the detector and reporting campaign state, cycle/release,
  coverage, blockers, updated projections, and the exact next safe action.
