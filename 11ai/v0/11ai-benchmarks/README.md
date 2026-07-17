# 11ai-benchmarks

Nineteen skills for lifecycle orchestration, creating, operating, judging,
accounting, reviewing, reporting, analyzing, synchronizing, and publishing
reproducible AI-coding benchmarks.

The system freezes inputs, records exact run provenance, gates rule compliance,
supports independent sequential AI and human judges, accounts for every thread
found, and publishes immutable reviewed cycles. Re-running or returning the next
day resumes by stable ID and source digest instead of duplicating work.

A benchmark campaign can stay open for weeks while models are time-gated. A
soft lifecycle publishes fully reviewed interim cumulative cycles; a hard
lifecycle publishes a final cycle only after explicit closure. Older cycles
never change.

## Lifecycle

```text
initialize → run/audit available targets → freeze cumulative cycle
           → AI/human judges (aggregate after each) → publish cycle
         → account → review → analyze → report → sync websites
         → interim-published-open ↺ new time-gated targets
         → final cycle → hard-closed
```

Static content-pack conversion is optional and runs only when explicitly
requested. The suite deliberately does not prescribe a sequential-run commit or
worktree policy.

## Shared contracts

The version-2 contracts live in `references/artifact-contracts.md` with JSON
schemas under `schemas/` and deterministic helpers under `scripts/`.

- `benchmark/benchmark.json` — mode, policies, content/evidence configuration.
- `benchmark/run-plan.json` — optional desired/available/time-gated targets and
  manual or target-set closure policy.
- `benchmark/lifecycle-state.json` — deterministic derived stage and blockers.
- `benchmark/runs.json` — exact run ledger with template and instance hashes.
- `benchmark/prompts/` — exact prompt instance per run.
- root `JUDGE.md` plus cycle `judging/prompts/` — frozen operator template and
  exact AI/human judge instances with template/instance hashes.
- `benchmark/rubric.md` + `rubric.json` — human and machine-readable criteria.
- `benchmark/audits/` — mechanical compliance and runtime evidence.
- `benchmark/costs/` — every discovered thread, normalized tokens/costs/scopes.
- `benchmark/cycles/<id>/` — immutable cohort, evidence, judges, aggregate,
  review, and report.
- `benchmark/current.json` — latest reviewed-cycle pointer, release type,
  publication sequence, and review digest.

Accounting exposes benchmark scope, judge scope, every identified-other scope,
unidentified scope, benchmark+judge scope, and a reconciled total across all
threads found.

## Skills

### Orchestrate the lifecycle

- `11ai-benchmark-run-lifecycle` — soft, hard, resume, from, and through modes
  across the entire campaign.
- `11ai-benchmark-initialize` — initialize through ready-for-runs without
  running a model.
- `11ai-benchmark-freeze-cycle` — freeze, audit, and evidence a cumulative
  cohort through ready-for-judging without running a judge.
- `11ai-benchmark-publish-cycle` — turn judging into accounting, review,
  reports, sync, and an interim-open or final hard-close state.
- `11ai-benchmark-sync` — refresh every stale derived domain without running a
  benchmark or judge.

### Create and configure

- `11ai-benchmark-creator-singleapp` — shared Next.js app, one run folder each.
- `11ai-benchmark-creator-multirepo` — isolated branch/worktree/repository runs.
- `11ai-benchmark-rubric-creator` — frozen weighted criteria and rubric JSON.
- `11ai-benchmark-content-pack-creator` — explicitly requested static content
  conversion only.

### Operate and evaluate

- `11ai-benchmark-runner` — mode-aware run registration, hashes, launch/resume.
- `11ai-benchmark-compliance-auditor` — configured hard-rule and runtime audit.
- `11ai-benchmark-judge` — sequential blind AI judges and aggregate rebuilds.
- `11ai-benchmark-human-judge` — guided blind human scoring using the same
  criteria/evidence/artifact schema.
- `11ai-benchmark-token-accountant` — exhaustive granular transcript, token,
  metadata, price, scope, efficiency, and cost-quality accounting.
- `11ai-benchmark-troubleshooter` — evidence-first diagnosis and repair of
  transcript, accounting, lifecycle, review, report, index, and non-run UI
  regressions without modifying benchmark run artifacts.

### Review, report, and publish

- `11ai-benchmark-reviewer` — cycle gate, consolidation, freshness, propagation.
- `11ai-benchmark-reporter` — metadata-rich HTML/Markdown report and visuals.
- `11ai-benchmark-www` — benchmark-specific recursive root/parent/benchmark/
  cycle/run websites, compact non-root pages, catalog controls, and shadcn data
  visualizations. It is separate from the general `11ai-www` project-site skill.

### Across benchmarks

- `11ai-benchmark-analyzer` — coverage-aware normalized leaderboard, pairwise,
  cost-quality, compliance, judging, token, lifecycle, metadata, and trend
  analysis.
