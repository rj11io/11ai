---
name: 11ai-benchmark-creator-multirepo
description: "Scaffold an isolated-run AI coding benchmark — a pristine template tagged in git, with each run on its own branch (or its own repo/worktree), for objectives where runs need their own dependencies, full-app control, a backend, or true independence from other runs' code. Use when the single-app structure's trade-offs stop being acceptable; use 11ai-benchmark-creator-singleapp when runs can share one Next.js app and browsable side-by-side routes matter more than isolation."
---

# 11ai Benchmark Creator (multirepo / branch-per-run)

The single-app structure (`$11ai-benchmark-creator-singleapp`) trades
isolation for convenience: every run shares one `package.json`, one root
layout, one deploy, and later runs can read earlier runs' code. This
skill builds the other trade: every run starts from an identical tagged
template and works in total isolation.

## When each structure wins

Pick multirepo when any of these is true; otherwise recommend single-app
and stop:

- Runs need **their own dependencies** (a charting library choice IS the
  test, a PDF pipeline, a CMS client).
- Runs need **full-app control** — root layout, global CSS, fonts,
  `next.config`, middleware, API routes, a database.
- **Contamination must be zero**: later runs must not be able to read
  earlier runs' solutions.
- The objective isn't a page in an app but **the whole app**.

Costs to state honestly: no single hub URL with every run one click
away (each run deploys separately), N × `node_modules`, and comparison
requires checking out branches or visiting separate deploys.

## Step 1 — Define the benchmark

Same interview as the single-app skill: objective, skill under test,
input content, output surfaces, done criteria. Two extra decisions:

- **Isolation mechanism** — default **branch-per-run** in one repo
  (cheapest, single remote, `git diff template-v1..run/<id>` for free).
  Offer repo-per-run only when runs must not even see each other's
  branch names, and worktree-per-run when the user wants parallel local
  runs.
- **Dependency policy** — now that installs are possible: free choice,
  an allowlist, or still frozen. Whatever it is, it goes in the prompt
  verbatim and the audit checks it.

Also capture the full benchmark metadata envelope: stable ID, objective and
tags, canonical repository/deployment/source URLs, stack and versions,
environment constraints, owner/license, creation time, and unavailable fields.
These become the base of every review, report, filter, and visualization.

## Step 2 — Build the template

A complete, minimal app skeleton on the default branch:

- The stack baseline the user wants (e.g. Next.js + shadcn), typecheck
  and lint spotless.
- `content/` + `content/README.md` + a dependency-free typed loader —
  same rationale and same reference implementation as the single-app
  skill's scaffold guide: runs compete on the objective, not on parsing.
  (With installs allowed, agents MAY swap in a library parser — the
  shipped loader is the floor, not a constraint.)
- `PROMPT.md` with `{{RUN_ID}}`, root `JUDGE.md` created from
  `../references/judge-prompt-template.md` with its cycle/judge/type variables,
  `AGENTS.md`, and `README.md`.
- No hub page — the template IS the app each run reshapes.
- `benchmark/benchmark.json` with `mode: "isolated"`, the selected
  `runStrategy`, `baselineRef`, dependency/content policies, protected inputs,
  evidence surfaces, and canonical URLs, plus version-2 ledger/cycle scaffolding
  from [the shared contracts](../references/artifact-contracts.md). Do not
  create a real cycle/current pointer before review. Add optional
  `benchmark/run-plan.json` for desired and time-gated configurations using the
  [lifecycle contract](../references/lifecycle-contract.md).

Tag it: `git tag template-v1`. The tag is the benchmark's identity;
every run branches from it and every audit diffs against it. Template
fixes after runs exist mean a new tag (`template-v2`) and a new,
separately-reported cohort — never retag.

## Step 3 — Adapt the prompt

Start from the single-app skill's `references/prompt-template.md` and
change the rules that isolation makes different:

- Scope: "this whole repo (your branch) is yours" replaces the
  folder-isolation rule. The root layout, global CSS, and config are
  the agent's to change.
- `content/` stays **read-only** — that rule survives every structure.
- Dependency rule: whatever Step 1 decided, stated exactly.
- Keep: render-from-files (zero-code content edits), the quality bar,
  the surface checklist, work-autonomously.
- Add: the app must build (`npm run build`) and boot from a fresh
  `npm install` — each run is judged as a standalone deployable app.

## Step 4 — Run workflow (document in README.md)

1. `git checkout template-v1 && git checkout -b run/<harness>-<model>-<effort>`
2. Freeze the prompt to `benchmark/prompts/<run-id>.md`; record both the
   template hash and exact instance hash, then
   record the ledger entry in `benchmark/runs.json` **on the default
   branch** (the ledger spans runs, so it can't live on run branches);
   note `baselineRef: template-v1`.
3. Hand the frozen prompt to the harness on the run branch.
4. Close out: fill in the ledger.

The mode-aware runner and auditor read `benchmark/benchmark.json` and diff
against `template-v1` (or the configured baseline ref) instead of assuming an
`app/<run-id>` folder:
`$11ai-benchmark-rubric-creator` (freeze the criteria before the first
run), `$11ai-benchmark-compliance-auditor` (skip folder-isolation; check
content-untouched, dependency policy, build-from-clean, render, and the
content-edit sentinel), then `$11ai-benchmark-judge` (check out or
deploy each branch to capture screenshots),
`$11ai-benchmark-token-accountant`, `$11ai-benchmark-reviewer`
(validate, consolidate, update the READMEs and web app), and
`$11ai-benchmark-reporter`.

## Step 5 — Verify before handing over

1. Typecheck + lint clean on the template.
2. Loader runtime test against `content/` (via `npx tsx`).
3. `npm run build` succeeds from a clean install.
4. Dry-run the workflow: create `run/dry-run` from the tag, confirm the
   branch + frozen prompt + ledger steps work, delete the branch.

Report the file map, the tag name, the run workflow, and what the user
still needs to fill in (content placeholders, prompt slots).

Prefer `$11ai-benchmark-initialize` to orchestrate creator selection, rubric,
PROMPT/JUDGE templates, run plan, and lifecycle readiness. Use
`$11ai-benchmark-run-lifecycle` for interim releases, resume, and hard close.

## Pitfalls

- **The ledger on run branches** — it forks and the benchmark loses its
  single source of truth. Keep ledger changes on the default branch;
  when the user authorizes a ledger commit, commit it there only.
- **Retagging** after fixing a template bug silently splits runs into
  incomparable cohorts. New tag, new cohort, reported separately.
- **"Free dependency choice" without recording it** — the audit should
  capture each run's final dependency list into the ledger; which
  libraries a model reached for is itself a result worth reporting.
- Deploy drift: if runs are judged from deployments, pin how they're
  deployed (same platform, same settings) or judge from local checkouts.
