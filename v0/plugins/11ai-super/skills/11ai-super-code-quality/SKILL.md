---
name: 11ai-super-code-quality
description: "Audit, repair, and repeatedly raise the quality of a codebase, module, diff, or file until it reaches a high, evidence-backed bar, while keeping observable behavior unchanged. Use when Codex must clean up or refactor code, reduce complexity, remove duplication and dead weight, fix misleading names and unclear structure, repair swallowed errors and unsafe boundaries, improve comments, close gaps in test coverage for risky behavior, or keep improving a codebase after an initial cleanup is done. Owns the correctness of what it touches: it protects behavior with characterization tests before any rewrite and never claims a rewrite is safe because it compiles. Every change must retire a countable defect rather than express a style preference. Excludes feature work, architecture redesign, dependency upgrades, and performance tuning, and honors audit-only requests by reporting findings without editing."
---

# 11ai Super Code Quality

## Mission

Leave the code correct, clear, and cheap to change — and prove it. Find defects that cost real money in maintenance or wrong behavior, fix their root causes, protect the behavior that must not move, verify each batch, and keep running fresh passes until nothing worth its risk remains.

Quality here is not taste. Every finding names something countable: a branch nothing covers, a block duplicated in three files, a name that says the wrong thing at a public boundary, an error the code silently swallows. If a change cannot name what it retires, it does not ship. That rule is what lets this skill iterate without turning into churn.

## Operating Rules

- Follow repository instructions, and treat the repository's own conventions as the standard. Derive the convention from the code — neighboring files, the lint and formatter config, the dominant existing pattern — before enforcing anything. Never import an outside style opinion into a codebase that already chose differently.
- Preserve observable behavior unless the user explicitly asks for a behavior change. Observable behavior means anything a caller or user can detect: return values, error types and messages, ordering, timing, side effects, persisted data, serialization, and null handling.
- Do not infer permission to change public contracts, APIs, schemas, dependencies, architecture, or build configuration. A cleanup request is not authorization to redesign.
- Keep a session change manifest — every file this session creates, modifies, renames, or deletes — and reconcile it after every batch.
- Preserve unrelated and concurrent work. Never clean, overwrite, or revert anything that was present before the session or whose ownership is uncertain.
- Apply the admissibility test in [references/code-quality-playbook.md](references/code-quality-playbook.md) to every proposed change. A change that only reads nicer to the agent is not admissible.
- Separate structural changes from behavior changes. Never mix a rename or an extraction into the same patch as a deliberate behavior fix, so each can be reviewed and verified on its own.
- Never buy a green result by weakening assertions, updating snapshots blindly, widening types, suppressing lint rules, swallowing errors, deleting an inconvenient test, or excluding a failing path.
- Record pre-existing failures separately from failures this session introduced, and never present a pre-existing failure as this session's problem or a session failure as pre-existing.
- Treat a rewrite as unverified until a test that could fail has passed. Compiling, type-checking, and looking equivalent are not evidence.
- If the user asks for an audit only, report findings and stop. Otherwise inspect, repair, verify, and iterate — do not stop after producing the audit.
- Always end with the session summary defined below, including when stopping early or aborting.

## Workflow

### 1. Establish Scope, Conventions, and Contracts

Read [references/code-quality-playbook.md](references/code-quality-playbook.md) before judging any code. Use its dimension lenses, severity rubric, admissibility test, and smell catalog.

1. Read repository guidance, manifests, lint and formatter configuration, type configuration, test setup, and the current working-tree status.
2. When the user gives no narrower scope, take all first-party source in the current repository, prioritizing the code that most callers depend on. Exclude dependencies, vendored code, generated output, and build artifacts.
3. Record the repository's dominant conventions as they actually are: naming, file layout, error handling, module boundaries, test style, comment style. These are the bar, not a generic ideal.
4. Discover the commands for format, lint, typecheck, build, and test.

### 2. Map Behavior Before Judging the Implementation

Understand what the code does before deciding what is wrong with it. For every unit in scope, trace callers, consumers, inputs, outputs, side effects, error paths, persisted state, public contracts, and the edge cases that matter. For a diff, read both the changed lines and the contract around them.

Write down the behaviors that must stay invariant. This list is the safety net for everything in step 5, and it is the step most often skipped.

### 3. Build a Baseline and a Finding Ledger

1. Run the repository's format, lint, typecheck, test, and build commands before editing. Capture the result of each, and separate pre-existing failures from everything else.
2. Collect the countable signals the tools already give you: lint and type errors, failing tests, uncovered branches on risky paths, unreferenced exports, duplicated blocks, oversized files and functions, deep nesting, and public surface with no documented contract.
3. Inspect with each dimension lens in the playbook rather than reading top to bottom once.
4. Record every candidate in a finding ledger: location, dimension, severity, the evidence, the countable thing a fix would retire, the proposed repair, the verification it needs, and its status.
5. Confirm candidates before calling them findings. Delete anything that turns out to be the repository's deliberate convention, a preference with no countable cost, or a feature request in disguise.

Rank confirmed findings by severity, then by how much code depends on the affected unit. Prefer one root-cause fix that clears several findings over several local fixes.

### 4. Triage by Real Cost

Assign one severity per confirmed finding, using the rubric in the playbook. In short:

- **Critical**: the code produces or will produce wrong behavior, data loss, or a security exposure — or a rewrite is about to ship with no protection for the behavior it changes.
- **Major**: a concrete maintenance hazard with a traceable failure path — logic duplicated across files that must change together, an untested branch on a risky path, a swallowed error, a misleading name on a public boundary.
- **Moderate**: a local structure, readability, or documentation cost — deep nesting, a stale comment, dead code, an abstraction with one caller.
- **Minor**: cosmetic consistency inside the repository's own convention.

Never inflate a preference into a severity. A finding with no countable cost is a suggestion; record it and leave the code alone.

### 5. Protect Behavior, Then Repair Root Causes

Resolve every critical finding, then every major finding, in batches small enough to diagnose.

Before any rewrite whose behavior is not already covered:

1. Capture representative success, boundary, and failure cases from the current implementation.
2. Add characterization tests — tests that record what the code does today, without judging whether it is right — against the old implementation.
3. Run them and confirm they can actually detect a break. A test that passes when the behavior is deliberately broken is not protection.
4. Rewrite in small steps, keeping those tests green.
5. Add separate tests for any behavior deliberately corrected, in its own patch.

Prefer repairs in this order:

1. the shared root cause that clears several findings at once
2. the contract — make the boundary explicit, validate external input, stop swallowing errors
3. structure — collapse duplication, split a unit with two responsibilities, flatten control flow
4. naming and types — say what the thing means in the domain
5. comments and documentation — record intent, invariants, and constraints the code cannot state
6. dead weight — remove unreferenced code, stale comments, and abstractions with one caller

Apply these repair rules:

- **Re-check every call site.** After an extraction, rename, signature change, or moved responsibility, verify each consumer, including tests, mocks, and dynamic references that a rename tool will miss.
- **Retire, do not relocate.** Moving a problem into a new file is not a fix. Say which countable thing the change removes.
- **Do not trade one dimension for another.** Shortening a function by adding three indirection hops is a regression, not an improvement. Both numbers must be accounted for.
- **Keep the repository's idiom.** Match the surrounding code's comment density, naming, and patterns even when the agent would have chosen otherwise.
- **No broad formatting churn.** Let the repository's formatter own formatting. Never mix reformatting into a substantive patch.
- **Re-check the agent's own additions.** A new helper, type, or test is new code and gets judged by the same bar.

### 6. Verify Each Batch

After every meaningful batch:

- run the narrowest relevant tests first, then the broader suite plus lint, typecheck, format, and build as risk warrants
- confirm each new test fails for the right reason before the fix and passes after it
- read the batch's complete diff and account for every path in the session change manifest
- check the diff for accidental changes, stale comments, debugging code, commented-out code, and newly uncovered branches
- re-check shared consumers of any changed signature, type, or module boundary
- confirm no error message, status code, log line, ordering, or serialized shape moved unintentionally

Do not mark a finding resolved on the strength of a diff, a clean build, or a passing type check alone.

### 7. Run the Improvement Loop

Once no critical or major finding remains, keep raising the floor. Each iteration:

1. Select the weakest dimension in the code that most callers depend on.
2. State the target as a countable thing to retire, in one sentence.
3. Make the smallest change that reaches it.
4. Re-verify per step 6.
5. Keep the change only if it retires what it claimed and regresses no other dimension. Otherwise revise or revert the agent's own change.

Use a different lens on each fresh pass so iteration finds new work instead of re-arguing settled decisions. At minimum, rotate through:

1. **Correctness and contract pass:** error paths, boundary values, null and empty handling, external input validation, async and state transitions, resource cleanup.
2. **Structure and duplication pass:** responsibility boundaries, coupling, logic repeated across files, control flow depth.
3. **Naming and interface pass:** domain meaning, public surface, type precision, argument order and shape.
4. **Readability and comment pass:** unnecessary cleverness, missing intent, stale or redundant comments, misleading abstractions.
5. **Test and coverage pass:** untested risky branches, tests coupled to implementation details, tests that cannot fail.
6. **Dead-weight and consistency pass:** unreferenced exports, unused dependencies, commented-out code, drift from the repository's own convention.

Prefer meaningful improvement over motion. Never restyle merely to keep the loop running — a pass that finds nothing admissible is a valid result and counts toward the gate.

### 8. Apply the Completion Gate

Finish only when all of these hold:

- Every originally reported issue is fixed and verified, or explicitly disproved or blocked with evidence.
- No confirmed critical or major finding remains in the authorized scope.
- Every rewrite that touched uncovered behavior now has a test that was proven able to detect a break.
- Behavior changes are separated from structural changes in the history, and every deliberate behavior change is stated and tested.
- Format, lint, typecheck, tests, and build pass, apart from clearly separated pre-existing or environmental failures.
- Risky paths in the touched code have meaningful coverage, or the gap is recorded with the reason it remains.
- Shared consumers, edge cases, and error paths show no regression introduced by this session.
- Two consecutive fresh passes, using different lenses, find no new confirmed critical or major finding.
- No admissible change remains whose value exceeds its regression risk.
- The complete change set is intentional, reviewable, and limited to the session manifest.

Do not claim the code is now high quality in the abstract. Report the inspected surface, the evidence, and the residual risk precisely. A blocked material finding is not a pass. If a gate cannot be met because verification is impossible, a decision is missing, or an external dependency blocks it, say which gate is unmet, what was completed, and the smallest next action.

### 9. Abort When Work Becomes Unsafe

Abort instead of continuing when any of these occurs:

- the change set contains unexplained or unrelated files, generated output, dependency or lockfile churn, secrets, or edits outside the intended surface
- the change set grows beyond what one reviewer can verify as a single quality-focused session
- the agent cannot explain why every changed path is necessary
- the same finding survives three repair attempts without materially new evidence
- protecting the behavior a fix would touch turns out to be impossible, and the fix cannot be reduced
- reaching the bar would require a feature, architecture, dependency, or product decision the user has not authorized
- troubleshooting the environment, build, or tooling starts to outweigh confirmed quality work
- ownership of a change in the project becomes uncertain

On abort:

1. Stop processes started by the session and capture the failure evidence and abort reason.
2. Compare the project's current state with the session change manifest. Preserve any path whose ownership is uncertain.
3. Stop and return the aborted-session summary, listing exactly which session changes remain. Do not immediately restart the routine.

## Session Summary

Always end with a concise, self-contained summary, including successful, audit-only, blocked, and aborted runs. Lead with the outcome and include:

- the scope inspected, the lenses used, and the conventions taken as the bar
- critical and major findings resolved, grouped by root cause, each with the countable thing it retired
- candidates disproved, downgraded, or recorded as suggestions and left alone
- behavior deliberately changed, stated separately from structural work
- characterization and regression tests added, and the proof each one can detect a break
- commands run and their results, with pre-existing failures listed separately
- the number and result of fresh passes
- residual risk: uncovered paths, findings left open, and anything that could not be verified
- final state of the session's changes: the complete manifest of paths created, modified, renamed, or deleted
- for an abort, the trigger, which session changes remain, and any path preserved because ownership was uncertain

Quote countable evidence rather than adjectives. Use precise language such as `covered by a failing-then-passing test`, `behavior unchanged and verified`, `structural only`, or `not verifiable locally`. Keep style-only changes distinct from behavior changes. Never claim a fix, a test, or a verification without evidence.
