---
name: 11ai-benchmark-reviewer
description: "Review a benchmark's finished artifacts (judging results, audits, costs) for completeness and consistency, consolidate them into one canonical benchmark/report/data.json, and propagate the results outward — into the benchmark's README, the parent folder's README, the root README, and the web app's data files when one exists. Use when the user asks to review, publish, sync, or propagate benchmark results, or to update the READMEs or site with results. Runs after the judge and token accountant, before the reporter; it validates and distributes but never computes a score or a cost itself."
---

# 11ai Benchmark Reviewer

The judge, auditor, and accountant each leave their own artifact. This
skill is the checkpoint between those artifacts and anything public: it
verifies they are complete and agree with each other, merges them into
one canonical data file, and only then propagates the results into the
READMEs and the web app. If the gate fails, nothing propagates.

It computes nothing new. Every number it writes is copied from an
artifact under `benchmark/`; a missing number is reported as missing,
never derived on the spot.

## Step 1 — The review gate

Run every check; report all failures together, not just the first:

1. **Results exist and are anchored** — `benchmark/results.json` exists
   and its `rubricSha` equals the sha256 of the current
   `benchmark/rubric.md`. A mismatch means the rubric changed after
   judging: stop, this needs a re-judge, not a publish.
2. **Every judged run has a passing audit** in `benchmark/audits/`.
   Failed-audit runs may appear in results only as disqualified; a
   judged run with *no* audit file is a gate failure.
3. **Every judged run has a ledger entry** in `benchmark/runs.json`
   with `finishedAt` filled, and one `promptSha`/`contentSha` shared by
   all runs (differing shas mean the runs did different tasks — stop).
4. **Costs are present and labeled** — each judged run has
   `benchmark/costs/<run-id>.json` with `method` set (`measured` or
   `reported`). Missing cost files are a warning, not a failure: the
   run publishes with its cost marked "not measured", never with a
   guessed number.
5. **No artifact disagrees with another** — the ledger's `costUsd`
   matches the cost file's total; the runs in results, audits, and
   ledger are the same set; screenshots referenced by the judging
   session exist on disk.
6. **Judgement artifact is complete** — the judging session folder has
   `mapping.json` and one `judge-<n>.json` per judge (see the judge
   skill's schema).

On failure: list what's wrong, point at the skill that owns the fix
(`$11ai-benchmark-judge`, `$11ai-benchmark-compliance-auditor`,
`$11ai-benchmark-token-accountant`), and stop. Do not propagate a
partial picture.

## Step 2 — Consolidate into data.json

Write `benchmark/report/data.json` — the single source everything
downstream (READMEs, web app, the reporter's HTML) renders from:

```json
{
  "benchmark": {
    "id": "<repo folder name>",
    "objective": "<from PROMPT.md>",
    "skillUnderTest": "<from PROMPT.md>",
    "promptSha": "…", "contentSha": "…", "rubricSha": "…",
    "generatedAt": "<ISO timestamp>"
  },
  "gate": { "pass": true, "checks": [ { "name": "…", "pass": true, "detail": "" } ] },
  "runs": [
    {
      "id": "codex-gpt5.5-high",
      "harness": "codex", "model": "gpt-5.5", "effort": "high",
      "rank": 1, "total": 7.6,
      "dimensions": { "hierarchy": 8, "typography": 7 },
      "audit": { "pass": true, "failedChecks": [] },
      "disqualified": false,
      "cost": { "usd": 1.87, "method": "measured", "tokens": 412000,
                "cacheHitRate": 0.91, "costPerPoint": 0.25 },
      "wallTimeMinutes": 42,
      "screenshots": { "mobile": "benchmark/screenshots/…/mobile.png" },
      "notes": "<judge disagreement notes worth surfacing>"
    }
  ],
  "costs": { "runsUsd": 0, "operationsUsd": 0, "benchmarkUsd": 0,
             "nonBenchmarkUsd": 0, "grandTotalUsd": 0 },
  "judging": { "judges": 3, "session": "benchmark/judging/<session>/" },
  "publishTargets": { "benchmarkReadme": "…", "parentReadme": "…",
                      "rootReadme": "…", "webApp": "…" }
}
```

The `costs` block is copied from the accountant's
`benchmark/costs/summary.json` buckets. `publishTargets` records where
Step 3–4 wrote, so re-runs hit the same places without re-asking.

## Step 3 — Propagate to the READMEs

Three levels, all updated the same way: a **marker-delimited section**
this skill owns and replaces wholesale, leaving everything outside the
markers untouched. If the markers don't exist yet, append the section
(benchmark README: after the intro; parent/root: at a `## Results`
heading). Never edit prose outside your own markers.

```
<!-- 11ai-bench-results:<benchmark-id>:start -->
…generated section…
<!-- 11ai-bench-results:<benchmark-id>:end -->
```

At each of the three README levels, end this benchmark's marker section,
immediately before its closing marker, with this exact signature and
link:

```markdown
> Benchmark created, audited, ran, judged, accounted, and reviewed by the 11ai-benchmarks skills: [https://github.com/rj11io/11ai/tree/main/11ai/v0/11ai-benchmarks](https://github.com/rj11io/11ai/tree/main/11ai/v0/11ai-benchmarks)
```

Keep the signature inside the markers so rerunning the reviewer replaces
it idempotently. Add it only after the review gate passes: its presence
asserts that the complete benchmark lifecycle was successfully reviewed,
not merely that a benchmark README was scaffolded. In the root README,
put it in the benchmark-specific marker section, not the aggregate
leaderboard section, so it appears exactly once per reviewed benchmark.

1. **Benchmark README** (the repo's own `README.md`) — this
   benchmark's standalone results: a one-line verdict, the scoreboard
   table (rank, run id, total, audit verdict, cost, cost/point, wall
   time), disqualified runs struck through, the shas, and a link to
   `benchmark/report/report.html` (the path is deterministic; the
   reporter fills it).
2. **Parent folder README** — the directory that groups this benchmark
   with its siblings (repeats, versions, or cohorts of the same
   objective). Update only this benchmark's marker section, so each
   benchmark's results sit alongside the others': one compact table per
   benchmark (top 3 + run count + date + link to the full repo README).
3. **Root README** — the top of the benchmarks tree: this benchmark's
   summary alongside **all** benchmarks. When two or more benchmarks
   have results, do not aggregate here yourself — run or refresh
   `$11ai-benchmark-analyzer` and render its `leaderboard.json`
   (standings, mean rank, relative score, N printed next to every
   aggregate) inside a `<!-- 11ai-bench-results:leaderboard:… -->` section,
   plus one marker section per benchmark. With a single benchmark,
   render just its table and say the leaderboard starts at two.

Finding the levels: benchmark repo is where `benchmark/` lives; the
parent is the nearest ancestor directory containing sibling benchmark
repos (a folder counts when it has `benchmark/runs.json`); the root is
the top of that tree (usually the git root of the collection, or the
directory the user names). If the layout is ambiguous — e.g. parent and
root are the same directory — ask once, write both sections to that one
README, and record the answer in `publishTargets`.

## Step 4 — Propagate to the web app

Look for an app in this order: the benchmark repo itself when it's a
single-app benchmark (the hub), a `www/` folder in the benchmark repo,
a `www/` folder at the parent, a `www/` folder at the root. If none
exists, skip and say so.

The update is **data-driven, never hardcoded into components**:

1. Copy `benchmark/report/data.json` to the app's data convention —
   `<app>/data/benchmarks/<benchmark-id>.json` (create the folder on
   first use; for a Next.js app that reads at build time, `public/` or
   a server-read `data/` folder both work — follow whatever the app
   already does).
2. If the app already renders that folder, done — the new file shows
   up.
3. If the app has no results page yet, propose adding one minimal page
   that lists every `data/benchmarks/*.json` and renders each file's
   scoreboard — and get the user's OK before adding pages to their app.
   In a single-app benchmark repo, that page must live outside `app/`
   run folders and must not touch the shared baseline (`lib/`,
   `globals.css`) — treat the hub's isolation rules as binding on you
   too.

## Step 5 — Hand off and commit

Commit everything (`bench: review <benchmark-id> <date>`): data.json,
README sections, web app data. Then point to (or, if the user asked for
the full chain, invoke) `$11ai-benchmark-reporter` — it renders
`benchmark/report/report.html` from the same data.json, so the README
links resolve.

Publishing beyond the working tree (pushing, deploying the app) names
models, ranks, and costs publicly — confirm with the user before
pushing anything outward.

## Rules

- **Gate first, always.** No propagation on a failed gate, and no
  "publish what we have" override without the user explicitly accepting
  the listed gaps.
- **Copy, never compute.** Scores come from results.json, costs from
  the accountant's files, cross-benchmark aggregates from the
  analyzer's leaderboard.json. If a number isn't in an artifact, the
  output says so.
- **Idempotent.** Re-running replaces marker sections and data files in
  place; it never appends duplicates or touches content outside its
  markers.
- **Sign every reviewed README section.** Include the exact Step 3
  signature once in the benchmark's own README, parent README, and root
  README marker sections; never add it to the aggregate leaderboard
  marker or when the review gate fails.
- Repeated for every new judging session or cost update — the READMEs
  and app should never be older than the artifacts.
