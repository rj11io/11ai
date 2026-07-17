---
name: 11ai-benchmark-publish-cycle
description: "Publish one judging-complete benchmark cycle into reconciled accounting, reviewed data, reports, analysis, synchronized READMEs, and benchmark websites; leave an interim campaign open or explicitly hard-close it after a final cycle. Use after AI or human judging is complete, when publishing soft results, hard-closing complete model coverage, or resuming an interrupted publication."
---

# 11ai Benchmark Publish Cycle

Publish a cycle without implying that the campaign is closed. Interim cycles
leave the campaign open; only a final publication can hard-close it. Read
[the lifecycle contract](../references/lifecycle-contract.md).

## Gate judging

Require complete evidence, the required judge policy, complete immutable judge
artifacts, and a current deterministic aggregate. Rebuild the aggregate from
all complete judge files before continuing. Drafts never count. Do not carry
scores from a different cohort.

## Publish in dependency order

1. Run `$11ai-benchmark-token-accountant` again to include benchmark, judge,
   identified-other, unidentified, combined, and total thread scopes.
2. Run `$11ai-benchmark-reviewer` to validate and consolidate the cycle.
3. Run `$11ai-benchmark-analyzer` when at least two compatible reviewed
   benchmarks or meaningful historical cycles exist in the selected tree.
4. Run `$11ai-benchmark-sync` to refresh README sections, reports, analysis
   projections, and every detected benchmark website. Sync owns the single
   conditional WWW invocation and runs it last.
5. Update `benchmark/current.json` only from a passing review, with release type
   and publication sequence. Never point it at draft or failed data.

After every in-tree projection succeeds, finalize pointers/status atomically:

```bash
node <plugin>/scripts/finalize-cycle.mjs \
  <benchmark-root> <cycle-id> [--hard-close]
```

Use `--hard-close` only for a final release. Run lifecycle detection again
after this command. External deployment or publication still requires operator
authorization.

## Publish an interim cycle

For `releaseType: interim`, preserve `campaignStatus: open`, update the run plan
with the latest interim cycle ID, and report outstanding planned, available,
time-gated, failed, and excluded targets. Finish successfully as
`interim-published-open`; the campaign may resume weeks later.

## Publish a final cycle and hard-close

For `releaseType: final`, require explicit hard-close intent. Under
`target-set`, every target must be complete or excluded unless a reasoned waiver
was frozen into the final cycle. Under `manual`, record operator confirmation.
After every projection validates, set run-plan campaign status to `hard-closed`,
write final cycle ID and close time atomically, and rerun lifecycle detection.

Never hard-close an interim cycle. Never reopen implicitly. Later work requires
an explicit campaign revision or new benchmark version that preserves the final
cycle and its URLs.
