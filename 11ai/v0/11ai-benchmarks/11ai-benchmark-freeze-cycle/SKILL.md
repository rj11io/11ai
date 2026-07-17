---
name: 11ai-benchmark-freeze-cycle
description: "Freeze completed benchmark runs into an immutable interim or final cumulative cycle that is ready for blind judging, without running any AI or human judge. Use after runs finish to audit eligibility, freeze the cohort and coverage snapshot, capture identical evidence, anonymize runs, ensure JUDGE.md, perform preliminary accounting, or resume interrupted judging preparation."
---

# 11ai Benchmark Freeze Cycle

Create the immutable boundary between model execution and judging. Do not score
runs. Read [the lifecycle contract](../references/lifecycle-contract.md) and
shared [artifact contracts](../references/artifact-contracts.md).

## Select eligible cumulative runs

Run lifecycle detection, then inspect every finished run. Invoke
`$11ai-benchmark-compliance-auditor` for missing or stale audits. Include all
comparable, passing runs to date by default; record explicit exclusions and
reasons. Failed or inconclusive required audits remain visible but ineligible.

Choose `interim` for soft publication. Choose `final` only on explicit hard
close intent after validating the run-plan closure policy.

Allocate the next cycle ID once using a stable sequence-based form such as
`cycle-<publication-sequence>`; resume that ID when frozen inputs match instead
of minting a timestamp-based duplicate. Freeze the cohort:

```bash
node <plugin>/scripts/freeze-cycle.mjs \
  <benchmark-root> <cycle-id> <interim|final> [run-id ...]
```

For final cycles pass the script's explicit confirmation and waiver arguments
when applicable. Never mutate an existing cycle to add a run.

## Prepare blind evidence

1. Ensure root `JUDGE.md` exists; if absent, copy the canonical template.
2. Capture every configured evidence surface identically for every included
   run. Reuse a prior content-addressed capture only when its run ref, content,
   environment, surface contract, and bytes still match.
3. Write the private stable anonymization mapping once.
4. Write complete `judging/evidence.json`, including unavailable/error states,
   capture environment, provenance, and hashes.
5. Keep mapping, costs, identities, prior judge output, and aggregate out of the
   judge-visible bundle.
6. Run preliminary `$11ai-benchmark-token-accountant` so benchmark-run and
   operation costs are available. Reconcile judging costs after judges exist.
7. Advance cycle status from `collecting` to `judging` without changing frozen
   membership or input hashes.

Do not allocate judge IDs or create prompt instances until a judge is about to
run; that preserves exact operator intent and avoids abandoned judge records.

## Stop at judging readiness

Validate cycle, evidence, mapping, audits, hashes, and coverage snapshot. Run
the lifecycle detector and require `waiting-for-judges`. Report the cycle ID,
release type, included/excluded/time-gated configurations, reusable evidence,
missing metadata, and the exact JUDGE.md command. Do not invoke either judging
skill.
