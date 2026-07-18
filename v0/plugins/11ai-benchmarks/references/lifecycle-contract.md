# Benchmark lifecycle contract

Treat a benchmark as a long-lived campaign containing immutable runs and
immutable publication cycles. A soft lifecycle publishes current valid data
without closing the campaign. A hard lifecycle publishes a final cycle and
closes the campaign explicitly.

## Scopes

- **Campaign:** stays `open` while desired configurations remain planned,
  available, running, failed, or time-gated. It becomes `hard-closed` only by
  explicit operator intent.
- **Run:** append-only attempt owned by the runner and auditor. Never repeat a
  completed run merely because a later cycle is published.
- **Cycle:** frozen cumulative cohort. A changed cohort always creates a new
  cycle. Published cycles and their URLs remain immutable.

## Operator intent

Store the optional mutable plan at `benchmark/run-plan.json`. Targets use
stable `targetId` values and one of: `planned`, `available`, `running`,
`complete`, `time-gated`, `failed`, or `excluded`. Future-plan changes do not
stale an already frozen cycle; each cycle stores its own coverage snapshot.

With `closurePolicy: target-set`, hard close requires every target to be
`complete` or `excluded`. With `closurePolicy: manual`, require explicit hard
close confirmation and record any coverage waiver. Never infer that an absent
or time-gated target is complete.

## Release cycles

Every new cycle includes all currently eligible, audit-passed comparable runs
unless the operator records an exclusion. Set `releaseType` to `interim` for a
soft lifecycle and `final` for hard close. Record `publicationSequence`,
`previousCycleId`, and a frozen coverage snapshot.

Soft means incomplete configuration coverage, not weak evidence. Apply the
normal audit, evidence, judging, accounting, and review gates. If the operator
explicitly selects a reduced interim judging policy, record it and label the
release provisional everywhere; never present it as equivalent to a final
panel.

Do not carry judge scores or holistic rankings into a changed cohort. Reuse
unchanged raw runs, audits, transcripts, and content-addressed evidence when
their hashes and capture requirements still match, then judge the new cohort.

## Derived state

Generate `benchmark/lifecycle-state.json` from underlying artifacts. It is a
diagnostic cache, not a source of truth. The earliest missing or explicitly
stale prerequisite wins:

```text
initialization-required
ready-for-runs
waiting-for-runs
ready-for-interim-cycle
preparing-judging
waiting-for-judges
ready-to-publish
ready-to-sync
interim-published-open
ready-for-final-cycle
hard-closed
blocked
```

Recompute before and after every lifecycle action. Resume from the earliest
incomplete or stale stage. A matching source digest produces no rewrite.

## Waiting and reopening

Time-gated models and human judges create expected waiting states, not
failures. Record blockers and the next safe action, then stop cleanly.

After hard close, new runs require an explicit reopen. Preserve the final cycle
and record the reopen as a new campaign revision or a deliberate new benchmark
version; never silently turn a final release back into an interim one.
