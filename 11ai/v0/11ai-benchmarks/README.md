# 11ai-benchmarks

Skills for creating and operating 11ai AI-coding benchmarks: repos where
several agent runs — each a harness + model + effort combination like
`codex-gpt5.5-high` — build the same objective from the same inputs, so
the results compare the models' taste and skill and nothing else.

## The lifecycle

```
create ─► criteria ─► fill content ─► run ─► audit ─► judge ─► cost ─► review ─► report
  │                                                                        │
  └────── (repeat per benchmark) ──── analyze across benchmarks ◄──────────┘
```

Shared data contracts inside each benchmark repo, written and read by
the skills: `benchmark/runs.json` (run ledger), `benchmark/prompts/`
(frozen per-run prompts), `benchmark/rubric.md` (frozen judging
criteria), `benchmark/audits/` (compliance verdicts),
`benchmark/judging/` + `benchmark/results.json` (judgement artifact),
`benchmark/costs/` (cost artifact with run / operations / unrelated
buckets), `benchmark/screenshots/` (evidence), and
`benchmark/report/data.json` (the reviewer's consolidated file that the
READMEs, web app, and HTML report all render from).

## Skills

**Creating benchmarks**

- **`11ai-benchmark-creator-singleapp`** — scaffold a single-app
  benchmark: one Next.js + shadcn repo, one folder per run under `app/`,
  shared read-only markdown content with a dependency-free typed loader,
  a frozen `PROMPT.md` with a `{{RUN_ID}}` token, and a hub page that
  auto-lists runs. For objectives that fit one page/route per run.
- **`11ai-benchmark-creator-multirepo`** — the isolated variant: a
  tagged template with each run on its own branch (or repo/worktree),
  for objectives needing own dependencies, full-app control, a backend,
  or zero contamination between runs.
- **`11ai-benchmark-rubric-creator`** — create and freeze the judging
  criteria (`benchmark/rubric.md`): 4–6 weighted dimensions with
  concrete 1/5/10 anchors, written before any run output exists so the
  criteria can't be fitted to the results. The judge requires this file
  and never writes it.
- **`11ai-benchmark-content-pack-creator`** — turn raw sources
  (screenshots, docs, sites, exports) into the pinned `content/` pack in
  the loader format: transcribed not embellished, gaps flagged as
  placeholders, verified against the repo's parser.

**Operating a benchmark**

- **`11ai-benchmark-runner`** — prepare and record one run: pre-flight
  checks, run id, frozen prompt, ledger entry, handoff or headless
  launch, close-out.
- **`11ai-benchmark-compliance-auditor`** — mechanical post-run rule
  checks (folder isolation, no new deps, content untouched, renders,
  content-edit sentinel test) written to `benchmark/audits/`. Gate
  before judging.
- **`11ai-benchmark-judge`** — score audited runs: same screenshots for
  every run at every surface, the frozen rubric, an anonymized panel of
  independent model judges, and a complete judgement artifact —
  per-judge scores with justifications under `benchmark/judging/`,
  median-aggregated into `benchmark/results.json`.
- **`11ai-benchmark-token-accountant`** — compute what everything cost
  at session → model → token-class granularity: parse the harness's own
  transcripts (Claude Code, Codex, or pasted totals), classify every
  thread as a run, benchmark operations (judging, audits, scaffolding),
  or unrelated, price against a web-verified per-model rate file
  (`references/pricing.json` — never from memory, cache tokens priced
  correctly), and write `benchmark/costs/` with per-bucket and grand
  totals, rates embedded.
- **`11ai-benchmark-reviewer`** — the checkpoint before anything goes
  public: verify the judgement, audit, and cost artifacts are complete
  and agree, consolidate them into `benchmark/report/data.json`, then
  propagate the results into the benchmark README, the parent folder
  README, the root README (via the analyzer's leaderboard), and the web
  app's data files when one exists. Validates and distributes; computes
  nothing.
- **`11ai-benchmark-reporter`** — render the reviewer's consolidated
  data into the shareable thing: an elegant self-contained HTML page
  with verdict, scoreboard, side-by-side gallery, findings, and a
  method note with honest caveats.

**Across benchmarks**

- **`11ai-benchmark-analyzer`** — aggregate several benchmark repos into
  a leaderboard: per-configuration standings by rank and relative score,
  cost-vs-quality frontier, dimension patterns, rule-breaking rates —
  with sample-size caveats printed next to every number. The
  computation layer behind the reviewer's root-README section.
