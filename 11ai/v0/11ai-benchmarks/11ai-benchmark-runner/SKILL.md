---
name: 11ai-benchmark-runner
description: "Prepare, launch, resume, and record one run in a configured single-app or isolated benchmark: allocate the run ID, freeze the exact prompt, record template/instance/content hashes and refs, capture available harness and environment metadata, and hand off or launch the harness idempotently. Use when starting, registering, resuming, or closing a benchmark run; not for creating or judging a benchmark."
---

# 11ai Benchmark Runner

Guarantee that each run starts from known inputs and remains traceable. Read
[the shared contracts](../references/artifact-contracts.md) and validate the
ledger against `../schemas/runs.schema.json`.

## Discover configuration

Require `benchmark/benchmark.json`. For legacy repos, infer once and propose the
file without silently changing execution semantics:

- single-app/folder: run target `app/<run-id>/`, shared app baseline;
- isolated/branch, worktree, or repository: full-app target with `baselineRef`;
- dependency/content/evidence policies come from configuration.

This skill deliberately does not prescribe a sequential commit, worktree, or
archive policy. Obey the repo/operator policy when one exists.

## Preflight

- Require frozen `PROMPT.md` with `{{RUN_ID}}`, benchmark configuration, and
  required inputs for the configured content mode.
- Require a known baseline ref and healthy baseline checks appropriate to mode.
- Stop on unrelated working-tree changes that make attribution ambiguous. Do
  not commit, stash, reset, or delete user work.
- If static placeholders remain, warn and ask whether to proceed. Do not invoke
  the content-pack creator unless the user explicitly requests static content.
- Discover harness/model/provider/effort/version, environment, git ref, and
  whether the user wants prepare-only or headless launch.

## Allocate and freeze

Default run ID to `{harness}-{model}-{effort}`; append `-r2`, `-r3`, and so on
for repeats. Never overwrite an ID or artifact.

1. Hash frozen `PROMPT.md` with `{{RUN_ID}}` intact as `promptTemplateSha`.
2. Substitute variables and write `benchmark/prompts/<run-id>.md`.
3. Hash that exact file as `promptInstanceSha`.
4. Hash configured static inputs with canonical path/length delimiters as
   `contentSha`; for external/dynamic content record the pinned snapshot or
   manifest hash, not an invented file hash.
5. Record `promptVariables`, baseline/run refs, target, timestamps, harness and
   environment metadata in the version-2 ledger.

Use `../scripts/hash-inputs.mjs --root <benchmark-root> ...`; do not concatenate
files ambiguously or include clone/worktree-specific absolute paths.
Comparable runs require the same template/content/config hashes. Instance
hashes normally differ because the run ID differs.

## Launch or hand off

- Prepare-only by default: hand the harness the frozen instance verbatim.
- Launch headlessly only when requested and supported. Record command shape,
  process/session/thread identity, start time, and output target without storing
  secrets.
- Never paraphrase or improve the frozen instance at handoff.

## Resume safely

Search by run ID and source digest before creating anything. If a prepared or
running entry exists with matching hashes, resume it. If a complete run exists,
create a repeat ID. If inputs differ, stop and require a new run/cycle decision.

## Close out

Record finish time, exit state, changed paths, run ref when known, console/build
status, and every available harness/session ID. Leave unknown data null. Do not
hand-fill tokens, cost, or derived duration: invoke the token accountant, then
the compliance auditor. A run is eligible for a cycle only after audit passes.

## Idempotency

- Merge ledger entries by run ID; never append duplicates.
- Preserve unknown fields and completed artifacts.
- Re-running preparation with identical inputs produces no change.
- Corrections record supersession/provenance rather than erasing history.
