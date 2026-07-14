---
name: 11ai-benchmark-runner
description: Prepare, launch, and record a single benchmark run in an existing single-app benchmark repo — pick the run id, freeze the exact prompt given to the agent, write the run ledger entry (benchmark/runs.json), and hand off or launch the harness. Use when the user says to start, kick off, or register a benchmark run for a given harness + model + effort. Not for creating a benchmark (use the creator skills) or checking a finished run (use the compliance auditor).
---

# 11ai Benchmark Runner

A benchmark result is only comparable if every run started from the same
state with the same prompt. This skill makes that guarantee mechanical:
it prepares one run, records exactly what the agent was given, and leaves
a ledger entry that the auditor, judge, and reporter build on.

Vocabulary: a **harness** is the agent CLI (codex, claude code, ...), a
**run** is one attempt by one harness + model + effort combination, and
the **baseline** is the shared repo state runs must not edit.

## Inputs to collect

- Harness, model, and effort (e.g. `codex`, `gpt-5.5`, `high`), plus the
  harness version if discoverable (`<harness> --version`).
- Whether to launch the harness headless from here or just prepare the
  handoff (ask if unclear; default to prepare-only).

## Step 1 — Pre-flight checks

Refuse to start (and tell the user why) unless all of these hold:

1. The repo is a single-app benchmark: `PROMPT.md` with a `{{RUN_ID}}`
   token, a `content/` folder, and a hub `app/page.tsx` exist.
2. `git status` is clean. Uncommitted changes mean the run can't be
   diffed against a known baseline later — commit or stash first.
3. `npm run typecheck` and `npm run lint` pass. A dirty baseline becomes
   every run's failure.
4. `content/` has no leftover scaffold placeholders (grep for obvious
   markers like `example.com`, `Placeholder`, `Your Name`). Warn and ask
   before proceeding if any remain — content edits after the first run
   invalidate comparisons.

## Step 2 — Pick the run id

Default `{harness}-{model}-{effort}` with dots kept (`codex-gpt5.5-high`).
If `app/<id>/` already exists, this is a repeat: append `-r2`, `-r3`, ...
Never delete or overwrite an existing run folder.

## Step 3 — Freeze the prompt

Replace every `{{RUN_ID}}` in `PROMPT.md` and save the result to
`benchmark/prompts/<run-id>.md`. That file — not `PROMPT.md` — is what
the agent receives, and it is the permanent record of what this run was
asked to do.

## Step 4 — Write the ledger entry

Append to `benchmark/runs.json` (create as `[]` if missing):

```json
{
  "id": "codex-gpt5.5-high",
  "harness": "codex",
  "harnessVersion": "1.2.3",
  "model": "gpt-5.5",
  "effort": "high",
  "baselineCommit": "<git rev-parse HEAD before the agent starts>",
  "promptSha": "<sha256 of benchmark/prompts/<run-id>.md>",
  "contentSha": "<sha256 of all content/*.md concatenated in name order>",
  "startedAt": "<ISO timestamp>",
  "finishedAt": null,
  "wallTimeMinutes": null,
  "costUsd": null,
  "notes": ""
}
```

`baselineCommit` is the anchor everything downstream diffs against.
Commit the ledger + frozen prompt (`bench: prepare <run-id>`) so the
agent's later diff contains only its own work.

## Step 5 — Launch or hand off

- **Prepare-only (default)**: tell the user the run is ready and print
  the exact handoff: open the harness in this repo and give it the
  contents of `benchmark/prompts/<run-id>.md` as the task.
- **Headless launch (only if the user asked and the harness CLI is
  available)**: run it non-interactively in this repo with the frozen
  prompt as the task (e.g. `codex exec` / `claude -p` style invocation,
  in the background), and note in the ledger that the run was launched
  headless.

Never paraphrase, trim, or "improve" the frozen prompt at handoff.

## Step 6 — Close out the run

When the agent finishes (same session or a later one):

1. Fill in `finishedAt`; leave unknown fields null rather than guessing.
2. Commit the run's work as `run: <run-id>` — the agent's changes only,
   nothing else mixed in.
3. Invoke `$11ai-benchmark-token-accountant` to compute the run's tokens
   and cost from the harness's session transcript — it backfills
   `costUsd` and `wallTimeMinutes` in the ledger. Don't hand-fill those
   fields.
4. Invoke `$11ai-benchmark-compliance-auditor` for this run id. A run is
   not eligible for judging until its audit passes.

## Rules

- One run at a time per repo clone: two agents in the same working tree
  contaminate each other's diffs.
- Repeats are new runs with new ids (`-r2`), new ledger entries, and the
  same frozen prompt content — never reuse a ledger entry.
- If `promptSha` or `contentSha` differs from earlier entries in the
  ledger, the prompt or content changed between runs. Stop and tell the
  user: results across that change are not comparable, and the honest
  options are reverting the change or treating this as a new benchmark
  version.
