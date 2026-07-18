---
name: 11ai-super-bugfixing
description: "Continuously inspect, reproduce, prioritize, fix, verify, and re-audit software defects until the project reaches a high-confidence quality bar. Use when Codex must find and fix bugs across a project, debug failing tests or builds, eliminate regressions, repair runtime, type, API, data, integration, UI, state, concurrency, or resource-lifecycle errors, or keep hunting for additional defects after a known bug is resolved. Stops and reports when the change set becomes unmanageable or troubleshooting outweighs progress."
---

# 11ai Super Bugfixing

## Mission

Find real defects, fix their root causes, prove the repairs, and keep inspecting with fresh lenses until no confirmed critical or major bug remains and further work has low evidence-based value.

Read [references/bug-finding-playbook.md](references/bug-finding-playbook.md) before inspecting for bugs. Use its evidence ladder, severity rubric, finding ledger, and audit lenses.

## Operating Rules

- Follow repository instructions and preserve the project's intended behavior, public contracts, security, accessibility, data integrity, and established architecture.
- When the user gives no narrower scope, inspect all first-party code and deployable packages in the current repository, prioritizing core workflows. Exclude dependencies, vendored code, generated or build output, and external systems.
- Treat a bug as an evidence-backed mismatch between actual and intended behavior, not a style preference, speculative smell, desired feature, or broad refactor opportunity.
- Reproduce a defect or establish strong code-level proof before changing behavior. Do not patch a symptom whose root cause remains unknown.
- Prefer the running system, deterministic tests, traces, rendered output, and real integration contracts over source-only assumptions.
- Never obtain a green result by weakening assertions, blindly updating snapshots, suppressing diagnostics, widening types, swallowing errors, disabling working behavior, or excluding failing paths.
- Keep fixes minimal and complete. Add regression coverage when practical and inspect neighboring consumers for the same defect class.
- Preserve unrelated and concurrent work. Keep a session change manifest — every file this session creates, modifies, renames, or deletes — and reconcile it after every batch.
- Treat production as read-only unless the user explicitly authorizes a narrowly scoped mutation. Do not fuzz, load-test, corrupt data, or exercise destructive paths on live systems.
- Honor audit-only requests by reporting reproducible findings without editing.
- Always end with the required session summary, including when stopped early or aborted.

## Workflow

### 1. Establish intended behavior and the test surface

1. Read repository guidance, READMEs, manifests, lockfiles, entry points, schemas, API contracts, configuration, deployment definitions, and existing tests relevant to the requested scope.
2. Identify the project's primary workflows, public contracts, supported environments, important data invariants, and commands for lint, typecheck, test, build, and end-to-end verification.
3. Translate any reported symptom into exact reproduction steps, inputs, expected behavior, actual behavior, environment, frequency, and impact. Verify assumptions against code or product evidence.
4. Map representative happy paths, boundary values, failure paths, state transitions, roles, integrations, and lifecycle events. Prioritize core and irreversible workflows.
5. If a production origin adds useful evidence, find it in repository documentation and limit unapproved checks to ordinary low-rate, non-mutating behavior. Never guess an origin or assume local fixes are deployed.

If intended behavior is genuinely ambiguous and competing interpretations would materially change users, data, compatibility, or architecture, ask for the smallest missing decision. Continue inspecting unambiguous surfaces in the meantime.

### 2. Build a reproducible baseline and bug ledger

1. Run the project's normal lint, typecheck, tests, build, and existing diagnostic commands before editing when feasible.
2. Exercise representative workflows in the real application or closest reliable test environment. Capture console errors, failed requests, logs, stack traces, invalid states, and observable contract violations without exposing secrets.
3. Separate pre-existing tooling or environment failures from product defects and record both without conflating them.
4. Inspect systematically using the playbook's static, runtime, boundary, state, lifecycle, data, and regression lenses.
5. Record each candidate in a finding ledger with evidence strength, severity, affected surface, reproduction, expected and actual behavior, root-cause hypothesis, proposed verification, and status.
6. Confirm candidates before calling them bugs. Delete or downgrade findings disproved by tests, contracts, supported-environment policy, or intended product behavior.

Rank confirmed bugs by severity, user or system reach, frequency, irreversibility, confidence, and dependency order. Fix root causes that explain multiple symptoms before isolated manifestations.

### 3. Fix confirmed bugs in impact order

Resolve confirmed critical bugs first, then major bugs, then high-confidence moderate defects whose fixes are safe and proportionate.

For each bug:

1. Reduce it to the smallest reliable reproduction. Add a regression test that fails for the right reason before the fix when practical.
2. Trace the failing value, state, event, or control flow to the earliest incorrect assumption or invariant violation. Inspect sibling call sites and alternate paths for the same defect class.
3. State the root cause and the expected repair evidence in one concise sentence.
4. Apply the smallest complete fix at the correct ownership boundary. Preserve compatibility unless the user authorizes a breaking correction.
5. Run the focused reproduction or regression test and confirm it now passes for the intended reason.
6. Test nearby edge cases, alternate roles or states, error handling, and shared consumers. Run the broader relevant lint, typecheck, test, build, and integration checks as risk warrants.
7. Review the batch's complete set of changes. Update the session change manifest and explain every path.

If a deterministic regression test is impractical, use the strongest available alternative evidence and state the limitation. Never invent a test that merely mirrors the implementation or passes before the defect is fixed.

### 4. Continue inspecting after each repair

Do not stop after the reported bug or first green test. Re-run the affected workflow, then start a fresh inspection from the repaired behavior:

```text
inspect -> reproduce -> rank -> fix -> verify -> inspect neighboring paths -> inspect again
```

Use meaningfully different lenses across fresh passes. At minimum:

1. **Deterministic correctness pass:** tests, types, build, static control/data flow, boundary values, and error branches.
2. **Runtime and integration pass:** representative workflows, state transitions, async timing, retries, cancellation, persistence, external contracts, and resource cleanup.
3. **Regression and saturation pass:** the complete change set, shared consumers, previously passing behavior, missing coverage, logs, and any remaining high-confidence defect signal.

When a pass reveals a new confirmed critical or major bug, add it to the ledger, fix it, verify it, and restart the clean-pass count. Continue addressing moderate bugs when their evidence is strong and the repair is scoped, safe, and verifiable. Stop speculative hunting when signals are weak or changes would become redesign work.

### 5. Apply the completion gate

Finish only when all of these are true:

- every originally reported bug is fixed and verified, or explicitly disproved or blocked with evidence
- no confirmed unresolved critical or major bug remains within the authorized scope
- each critical and major repair has focused regression evidence or a documented reason why automated coverage is impractical
- relevant lint, typecheck, tests, build, and representative workflows pass, apart from clearly separated pre-existing or environmental failures
- neighboring consumers, edge cases, failure paths, and state transitions show no regression introduced by the fixes
- two consecutive fresh inspection passes reveal no new confirmed critical or major bug
- further candidates are minor, weakly evidenced, externally blocked, or require a product or architecture decision
- the complete change set is intentional, reviewable, and limited to the session manifest

Do not claim the project is bug-free. Report the inspected surface, evidence, residual risk, and untested environments precisely. A blocked material bug is not a pass.

### 6. Abort when work becomes unsafe

Abort instead of continuing when any of these occurs:

- the project gains unexpected, unrelated, unowned, or unexplained changes
- generated output, dependency churn, logs, caches, secrets, or artifacts make the change set too dirty to review confidently
- the change set grows beyond a coherent set of evidence-backed bug fixes
- two focused attempts on the same bug or tooling blocker fail without materially new evidence or progress
- troubleshooting, environment repair, or speculative debugging starts to outweigh confirmed bug work
- repeated regressions make correctness, security, data integrity, compatibility, or file ownership uncertain
- safe completion requires missing authority or an unapproved product or architecture change

On abort:

1. Stop processes started by the session and capture the failure evidence and abort reason for the summary.
2. Compare the project's current state with the session change manifest. Preserve any path whose ownership is uncertain.
3. Stop the routine and return the required aborted-session summary, listing exactly which session changes remain in place. Do not immediately restart the routine.

## Required Session Summary

Always end with a concise, self-contained summary. Lead with the bug-fixing outcome and include:

- scope, environments, workflows, and bug-finding lenses inspected
- confirmed bugs fixed, ordered by severity, with symptoms, root causes, important paths, and verification evidence
- candidates disproved, downgraded, or blocked and the evidence or missing authority
- regression tests and broader checks run, including pre-existing or environmental failures
- number and results of fresh inspection passes
- remaining lower-severity defects, untested surfaces, and residual risk
- final state of the session's changes: the complete manifest of paths created, modified, or deleted
- for an abort: trigger, which session changes remain in place, and any path preserved because its ownership was uncertain

Use precise language such as `reproduced`, `fixed locally`, `verified by regression test`, `not deployed`, or `blocked by external dependency`. Never claim a bug, fix, test, deployment, or cleanup without evidence.
