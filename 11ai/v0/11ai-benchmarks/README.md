# 11ai-benchmarks

Thirteen skills for creating, operating, judging, accounting, reviewing,
reporting, analyzing, and publishing reproducible AI-coding benchmarks.

The system freezes inputs, records exact run provenance, gates rule compliance,
supports independent sequential AI and human judges, accounts for every thread
found, and publishes immutable reviewed cycles. Re-running or returning the next
day resumes by stable ID and source digest instead of duplicating work.

## Lifecycle

```text
create → freeze rubric → run → audit → open cycle → capture evidence
       → AI/human judges (aggregate after each) → account every thread
       → review → report → hierarchical websites
       → analyze across reviewed benchmarks
```

Static content-pack conversion is optional and runs only when explicitly
requested. The suite deliberately does not prescribe a sequential-run commit or
worktree policy.

## Shared contracts

The version-2 contracts live in `references/artifact-contracts.md` with JSON
schemas under `schemas/` and deterministic helpers under `scripts/`.

- `benchmark/benchmark.json` — mode, policies, content/evidence configuration.
- `benchmark/runs.json` — exact run ledger with template and instance hashes.
- `benchmark/prompts/` — exact prompt instance per run.
- `benchmark/rubric.md` + `rubric.json` — human and machine-readable criteria.
- `benchmark/audits/` — mechanical compliance and runtime evidence.
- `benchmark/costs/` — every discovered thread, normalized tokens/costs/scopes.
- `benchmark/cycles/<id>/` — immutable cohort, evidence, judges, aggregate,
  review, and report.
- `benchmark/current.json` — latest reviewed-cycle pointer.

Accounting exposes benchmark scope, judge scope, every identified-other scope,
unidentified scope, benchmark+judge scope, and a reconciled total across all
threads found.

## Skills

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

### Review, report, and publish

- `11ai-benchmark-reviewer` — cycle gate, consolidation, freshness, propagation.
- `11ai-benchmark-reporter` — metadata-rich HTML/Markdown report and visuals.
- `11ai-benchmark-www` — benchmark-specific recursive root/parent/benchmark/
  cycle/run websites, compact non-root pages, catalog controls, and shadcn data
  visualizations. It is separate from the general `11ai-www` project-site skill.

### Across benchmarks

- `11ai-benchmark-analyzer` — coverage-aware normalized leaderboard, pairwise,
  cost-quality, compliance, judging, token, metadata, and trend analysis.
