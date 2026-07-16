---
name: 11ai-super-creator
description: "Execute any clearly specified repository task as a long-running, evidence-driven routine: perform and verify the requested work, then repeat fresh improvement passes until the result meets a high-confidence completion bar. Use when Codex should keep creating, changing, fixing, migrating, documenting, testing, or auditing a project until materially satisfied instead of stopping after one pass. Stops and reports when the change set becomes unmanageable or troubleshooting outweighs progress."
---

# 11ai Super Creator

## Mission

Turn the user's specified task into a bounded, repeatable routine and own it through implementation, verification, and fresh review until no material high-confidence improvement remains.

The user's request defines the outcome and scope. This skill defines the iteration, verification, and reporting rules around that work. Treat "continuously" as sustained progress toward an evidence-based completion gate, not an endless loop or permission to expand scope.

## Operating Rules

- Follow repository instructions and use applicable specialist skills.
- Preserve unrelated work, project conventions, product behavior, security, accessibility, data integrity, and maintainability.
- Honor read-only, audit-only, file, system, environment, and external-service boundaries in the user's request.
- Prefer root-cause changes in small, coherent batches. Verify behavior rather than inferring success from a plausible diff.
- Keep a session change manifest — every file this session creates, modifies, renames, or deletes — and reconcile it after every batch.
- Do not deploy, mutate production data, alter external services, or broaden authority unless the user explicitly requests it.
- Always end with the required session summary, including when stopped early or aborted.

## Workflow

### 1. Define the intended routine and completion evidence

Translate the request into a compact working contract:

- the concrete outcome and authorized scope
- explicit exclusions and actions requiring separate authority
- repository or user constraints
- observable acceptance criteria
- relevant validation commands, behavioral checks, or review evidence
- likely material failure classes and regression risks

Inspect repository guidance, manifests, architecture, tests, and the exact implementation surface needed to form this contract. If another available skill directly covers the task or an artifact type, read and follow it for the task-specific routine while retaining this skill's completion loop.

Make reasonable, reversible assumptions when evidence supports them. Ask only when a missing decision would materially change scope, behavior, data, architecture, or external state. If the request is audit-only or otherwise read-only, define findings and evidence as the output and do not edit.

### 2. Establish a baseline

Before changing files:

1. Map the affected system, important consumers, and representative workflows or artifacts.
2. Run the narrowest useful existing checks and reproduce the target problem or establish the current quality level.
3. Separate pre-existing failures from failures caused by the session.
4. Create a finding or work ledger ranked by correctness, safety, user impact, reach, confidence, and dependency order.

Use the strongest practical evidence for the task: running behavior, tests, rendered output, measurements, schemas, fixtures, or authoritative project configuration. Source inspection alone is sufficient only when the result is inherently source-based or stronger verification is unavailable and the limitation is reported.

### 3. Execute in coherent batches

Work through the ledger in impact and dependency order:

1. State the batch's intended outcome and success evidence.
2. Make the smallest complete change that addresses the root cause.
3. Add or update focused tests or validation artifacts when appropriate.
4. Run focused checks, inspect the result, and verify affected neighboring behavior.
5. Review the batch's complete set of changes.
6. Update the session change manifest and explain every changed path before continuing.

Revert a session-owned experiment when it does not improve the result, cannot be verified, or introduces disproportionate regression risk. Do not keep speculative churn merely to show activity.

### 4. Continue until materially satisfied

After the first implementation pass, start a fresh review from the resulting behavior or artifacts rather than from the original ledger. Repeat:

```text
inspect -> rank -> change -> verify -> review the diff -> inspect again
```

Use a meaningfully different lens on each fresh pass, such as correctness and edge cases, user or consumer experience, safety and failure handling, integration consistency, maintainability, or final polish. Choose only lenses relevant to the task.

When a fresh pass reveals a material issue, add it to the ledger, fix it, verify it, and restart the clean-pass count. Continue while any of these remain:

- an unmet acceptance criterion
- a confirmed critical or major defect within scope
- a regression or validation failure introduced by the session
- an unexplained changed path
- a high-confidence improvement with meaningful benefit relative to its cost and risk

Finish only when all of these are true:

- the requested outcome and every evidence-based acceptance criterion are met
- no confirmed critical or major in-scope issue remains, except an explicitly documented external blocker
- relevant focused and broad checks pass, with pre-existing or environmental failures clearly separated
- two consecutive fresh review passes reveal no new material issue
- further changes would be speculative, cosmetic, externally blocked, or subject to diminishing returns
- the complete change set is intentional, reviewable, and limited to the session manifest

Do not claim satisfaction when a material gate is blocked. Report the exact evidence, impact, and smallest next action needed.

### 5. Abort when work becomes unsafe

Abort instead of continuing when any of these occurs:

- the project gains unexpected, unrelated, unowned, or unexplained changes
- generated output, dependency churn, logs, caches, secrets, or artifacts make the change set too dirty to review confidently
- the change set grows beyond a coherent, verifiable implementation of the specified task
- two focused attempts on the same blocker fail without materially new evidence or progress
- troubleshooting or debugging starts to outweigh progress on the intended routine
- repeated regressions make correctness, safety, data integrity, or file ownership uncertain
- safe completion requires missing authority or an unapproved scope expansion

On abort:

1. Stop processes started by the session and capture the failure evidence and abort reason for the summary.
2. Compare the project's current state with the session change manifest. Preserve any path whose ownership is uncertain.
3. Stop the routine and return the required aborted-session summary, listing exactly which session changes remain in place. Do not immediately restart the entire operation.

## Required Session Summary

Always end with a concise, self-contained session summary. Lead with the outcome and include:

- task outcome: completed, blocked, stopped early, or aborted
- intended routine and acceptance criteria used
- material work completed, grouped by root cause or outcome, with important changed paths
- iteration count and what each fresh review lens found
- validation commands, behavioral checks, and results, distinguishing verified facts from inference
- remaining limitations, lower-value opportunities, or blockers with their exact impact and required next action
- final state of the session's changes: the complete manifest of paths created, modified, or deleted
- for an abort: trigger, which session changes remain in place, and any path preserved because its ownership was uncertain

Keep the report evidence-based. Never claim checks, measurements, deployment, production behavior, or cleanup that was not actually verified.
