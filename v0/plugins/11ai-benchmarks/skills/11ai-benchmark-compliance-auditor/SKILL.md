---
name: 11ai-benchmark-compliance-auditor
description: "Mechanically audit a finished single-app or isolated benchmark run against its configured hard rules, capture complete runtime and environment evidence, and write an idempotent pass/fail artifact before judging. Use after a run finishes or when resuming an incomplete audit. It verifies compliance only; it never scores quality or fixes violations."
---

# 11ai Benchmark Compliance Auditor

Run every applicable rule check and preserve its evidence. Read
[the shared contracts](../../references/artifact-contracts.md), the ledger, frozen
prompt, and `benchmark/benchmark.json`. Select checks by mode and policy.

## Anchor the audit

Require the run ledger entry, baseline/run refs or working target, template and
instance prompt hashes, content hash, dependency policy, and content mode. If an
anchor is missing, mark the affected checks inconclusive; never fake a pass.

## Mechanical checks

Run all applicable checks even after failures:

1. **Scope/isolation** — in folder mode, every changed path is inside the run
   folder except runner-owned metadata; in isolated mode, diff the configured
   baseline ref against the run ref/worktree/repository.
2. **Dependencies** — enforce frozen, allowlist, or free policy and record the
   final dependency/lockfile inventory.
3. **Content integrity** — verify configured static inputs or pinned manifests
   are unchanged. Skip with an explicit reason for content modes where the rule
   does not apply.
4. **Protected baseline** — check configured protected paths in folder mode.
5. **Repo health** — typecheck, lint, tests, build, and clean-install checks the
   benchmark defines; record command, exit code, duration, and output digest.
6. **Rendering** — load every required route/surface; record HTTP status,
   console/page errors, failed requests, timing, browser/runtime, and body size.
7. **Content-edit regression** — retain the benchmark's existing configured
   hardcode detector for static content; always restore the input and record
   whether the check was applicable, passed, failed, or inconclusive.
8. **Style leakage** — scan folder-mode output for global CSS/import leakage;
   keep it warning-only unless configuration promotes it to failure.

Add objective-specific mechanical checks from the prompt. Do not turn visual
taste or subjective accessibility impressions into audit verdicts.

## Evidence-first report

Write `benchmark/audits/<run-id>.json` with schema version, stable artifact ID,
source digest, config/baseline/prompt/content hashes, timestamps, environment,
commands, checks, warnings, missing evidence, and artifact paths. Each check
records status (`pass`, `fail`, `warning`, `inconclusive`, `not-applicable`),
detail, evidence, duration, and provenance.

Overall pass is the AND of required checks. An inconclusive required check does
not become a pass. Feed runtime evidence into the cycle evidence manifest so
judges can see non-blocking craft issues without learning run identity.

## Rules

- Do not fix, rerun the builder, disqualify, or soften a result.
- Never overwrite a complete audit with different inputs. Mark it stale and
  create a superseding artifact or new cycle as appropriate.
- Re-running with the same source digest produces no duplicate or timestamp-only
  rewrite.
- Lead the user report with verdict, failures, warnings, missing evidence, and
  the exact next owner: runner, creator, accountant, or
  `$11ai-benchmark-freeze-cycle`. Regenerate lifecycle state so a newly eligible
  run can trigger an interim or final cumulative cycle.
