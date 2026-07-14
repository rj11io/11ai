---
name: 11ai-super-ux
description: Synchronize a clean Git repository, then audit, repair, and iteratively improve a project's user interface and user experience using the running product, source code, and objective quality gates. Use when Codex must review UI/UX, fix critical or major usability and accessibility defects, improve responsive behavior, interaction states, information architecture, visual hierarchy, consistency, or polish, and continue validating improvements until the experience meets a high bar. Abort and restore session-owned changes if the work becomes unmanageably dirty or debugging exceeds safe bounds. Apply to web, mobile, and desktop interfaces; commit and push only when explicitly requested, using conventional commits, and honor audit-only requests by reporting findings without editing.
---

# 11ai Super UX

## Mission

Turn the existing product into a coherent, accessible, responsive, and polished experience. Inspect the real interface, fix root causes in the implementation, verify every change, and repeat until the completion gate is met.

Preserve the product's purpose, working behavior, established brand, and intentional design choices. Improve decisively without replacing the product with a generic redesign.

## Operating Rules

- Follow repository instructions and existing design-system conventions.
- Begin with the Git synchronization and clean-tree preflight. Perform no audit, startup, dependency installation, or source edit before it passes.
- Preserve unrelated and concurrent user changes. Never clean, stash, overwrite, or revert work that was present before the session or whose ownership is uncertain.
- Treat the running interface as the source of truth; do not infer UX quality from source code alone.
- Use the available browser-control or platform-testing skill for interactive inspection when one exists. Read that skill before using it.
- Exercise actual journeys by clicking, typing, scrolling, resizing, using the keyboard, and triggering loading, empty, error, success, disabled, and overflow states where practical.
- Prefer real content and realistic edge cases over placeholder-only inspection.
- Fix shared primitives and systemic causes before patching individual screens.
- Keep changes proportional to the existing product. Ask only when a decision would materially change product strategy, brand direction, or data behavior.
- Do not stop after producing an audit when the request authorizes fixes. Implement, verify, and iterate.
- If the user explicitly requests a read-only audit, do not edit files; complete the discovery, evidence, severity, and recommendation portions only.
- Do not commit or push unless the user explicitly instructs you to do so. Treat commit and push as separate authorization from performing the UX routine.

## Workflow

### 1. Synchronize and Checkpoint Git

Locate the current repository root. Abort with a session summary if the directory is not a Git repository.

Before fetching or pulling:

1. Check for an in-progress merge, rebase, cherry-pick, revert, or bisect. Abort if any exists.
2. Require an attached branch with a configured upstream. Do not guess a branch or remote.
3. Run `git status --porcelain=v1 --untracked-files=all` and require empty output.
4. If the tree is dirty, stop without stashing, deleting, restoring, or modifying anything. Report the dirty paths so the user can resolve them.

Then synchronize the current branch:

1. Run `git fetch --prune` against the configured remote.
2. Run `git pull --ff-only` so synchronization can never create a merge commit or implicit rebase.
3. Abort if authentication fails, the upstream is unavailable, or a fast-forward-only pull is impossible.
4. Require the working tree to remain clean after the pull.
5. Record the branch, upstream, and post-pull `BASE_SHA`. This clean commit is the rollback checkpoint for the session.

Do not continue unless every preflight condition passes. A successful fetch alone does not satisfy the synchronization requirement.

### 2. Establish the Product and Test Surface

Inspect repository guidance, application structure, routes, design tokens, component library, package scripts, and tests.

Identify:

- primary users and the product's core promise
- 3-7 core user journeys and their success conditions
- representative routes, roles, data states, and viewports
- established visual language and reusable UI primitives
- commands needed to run, test, lint, and build the project

Start the application when possible. If startup is blocked, exhaust safe local alternatives before relying on static review, and record the limitation.

### 3. Capture a UX Baseline

Read [references/audit-rubric.md](references/audit-rubric.md) before auditing or scoring.

Walk every core journey on the real interface. Capture concise evidence for problems: route or screen, state, viewport, reproduction steps, and visual or behavioral result. Inspect at minimum:

- one narrow mobile viewport
- one intermediate or tablet viewport when layout behavior changes there
- one desktop viewport
- keyboard-only operation and visible focus
- browser console and failed requests when relevant
- automated accessibility output when suitable tooling already exists or can be run safely

Score the baseline with the rubric. Use the score to expose weak dimensions, not to disguise judgment with false precision.

### 4. Triage by User Harm

Assign one severity to each reproducible issue:

- **Critical**: Prevents a core journey, makes the interface unusable for a representative user or viewport, hides essential content or controls, causes destructive or irreversible mistakes, or creates a severe accessibility barrier with no practical workaround.
- **Major**: Causes frequent failure, serious confusion, substantial friction, broken responsive behavior, inaccessible core interaction, missing essential feedback, or a strong loss of trust, but has a workaround.
- **Moderate**: Creates noticeable friction, inconsistency, or comprehension cost outside the most important path.
- **Minor**: Produces localized polish debt with little effect on task completion.

Prioritize by severity, journey importance, frequency, reach, and confidence. Do not inflate aesthetic preferences into critical issues.

### 5. Fix Critical and Major Issues

Resolve every confirmed critical issue first, then every confirmed major issue. Work in coherent batches small enough to diagnose regressions.

Prefer changes in this order:

1. broken journeys, navigation, data entry, and action semantics
2. accessibility blockers and keyboard/focus failures
3. responsive layout, overflow, occlusion, and touch-target failures
4. missing loading, empty, error, success, and destructive-action feedback
5. hierarchy, content clarity, information architecture, and interaction discoverability
6. design-system consistency and visual polish

Reuse or improve existing components and tokens. Avoid scattered one-off values when a shared primitive is the real repair surface. Keep semantics, tests, and accessibility intact while changing appearance.

### 6. Verify Each Batch

After every meaningful batch:

- inspect `git status --short`, `git diff --stat`, and `git diff --check`
- account for every modified and untracked path and keep a ledger of files created during this session
- rerun the affected journeys in the real interface
- retest the original reproduction at all relevant viewports and input modes
- check nearby states and shared-component consumers for regressions
- inspect console output when applicable
- run the narrowest relevant automated checks, then broader lint, type, test, and build checks as risk warrants
- compare current screenshots or recordings with the baseline when visual judgment is involved

Do not mark an issue resolved based only on a code diff or successful build.

### 7. Control Scope and Abort Safely

Treat the session as too dirty and abort when any of these conditions occurs:

- the diff contains unexplained or unrelated files, broad generated output, accidental dependency or lockfile churn, secrets, build artifacts, or changes outside the intended repair surface
- the change set grows beyond what can be reviewed and verified confidently as one UX-focused session
- the agent cannot explain why every changed path is necessary
- the same problem survives three consecutive repair attempts without materially new evidence
- debugging is dominated by environment, infrastructure, backend, dependency, or product-decision failures outside the UI/UX scope
- tests or neighboring journeys regress repeatedly and the root cause cannot be isolated safely
- ownership of a new working-tree change is uncertain

On an abort after the clean checkpoint:

1. Stop processes started by the session.
2. Capture the failure evidence and current changed-path list for the summary.
3. Verify that all changes being reverted are session-owned. Preserve uncertain or concurrent work and report that automatic cleanup could not safely complete.
4. Restore tracked files and the index to `BASE_SHA`.
5. Remove only untracked files and directories recorded as created by this session. Never use a broad clean command when ownership is uncertain.
6. If a session commit exists locally but has not been pushed, move the branch back to `BASE_SHA`, then restore the tree. Never rewrite or force-push a remote branch.
7. Verify that `HEAD` equals `BASE_SHA` and `git status --porcelain=v1 --untracked-files=all` is empty.
8. Stop the routine and return an aborted-session summary. Do not immediately retry the whole operation.

Never create intermediate commits. Commit only after the completion gate passes, so rollback normally operates on uncommitted session changes. Make push the final repository mutation; perform no further code changes after a successful push.

### 8. Run the Improvement Loop

Once no critical or major issue remains, improve the highest-impact weakness still visible in the rubric:

1. Select one coherent opportunity with clear user benefit.
2. State the intended improvement in one sentence.
3. Implement the smallest systemic change that realizes it.
4. Re-run relevant journeys and checks.
5. Re-score only the dimensions supported by new evidence.
6. Keep the change if it materially improves the experience without regression; revise or revert the agent's own change if it does not.

Repeat across comprehension, efficiency, accessibility, responsiveness, consistency, trust, and delight. Prefer meaningful improvements over ornamental churn. Never redesign merely to keep the loop moving.

### 9. Apply the Completion Gate

Stop only when all of the following are true:

- Every defined core journey completes and communicates success or failure clearly.
- No confirmed critical or major UI/UX issue remains.
- The weighted rubric score is at least 90/100, with no dimension below 4/5.
- Narrow mobile, intermediate when relevant, and desktop layouts have been exercised with no blocking clipping, overlap, overflow, or unreachable controls.
- Core interactions work by keyboard, focus is visible and logical, essential content has sufficient contrast, motion respects user preferences, and semantics are appropriate.
- Loading, empty, error, success, disabled, and destructive states relevant to core journeys are understandable and recoverable.
- Relevant tests and static checks pass, and the inspected interface has no new actionable console errors.
- A final saturation pass finds no additional high-confidence change with meaningful user benefit relative to its complexity or regression risk.
- The final diff contains only intentional, reviewed changes and passes `git diff --check`.

If a gate cannot be met because of missing credentials, unavailable dependencies, absent product decisions, or another external blocker, do not claim satisfaction. Report the unmet gate, evidence, work completed, and the smallest next action needed.

## Optional Commit and Push

Perform this section only when the user explicitly requested commit or push.

1. Apply the completion gate and review the complete diff before committing.
2. Do not create an empty commit or include unrelated files.
3. Follow repository-specific commit rules when present; otherwise use Conventional Commits in the form `<type>(optional-scope): <imperative summary>`.
4. Prefer `fix(ui): ...` or `fix(ux): ...` for defect repairs and `feat(ui): ...` only for genuine new behavior. Split commits only when each remains coherent and independently valid.
5. If only commit was requested, stop before pushing.
6. If push was explicitly requested, push the current branch to its configured upstream without force. Do not create or retarget an upstream unless explicitly instructed.
7. Verify the final working tree is clean and record the commit SHA and push result.

If commit or push fails, do not improvise history edits. If nothing reached the remote, apply the safe rollback procedure when the operation must be aborted. If the remote changed, preserve remote history and report the exact state.

## Session Summary

Always end with a concise summary of the complete session, including successful, blocked, audit-only, and aborted runs. Lead with the outcome and include:

- synchronization result, branch, upstream, and whether the tree passed the clean preflight
- the core journeys and viewports verified
- critical and major issues fixed, grouped by user impact
- the most valuable iterative improvements beyond defect repair
- validation commands and interactive checks performed
- final rubric score and any evidence-backed residual limitations
- final Git state, changed files, and commit or push status
- for an abort, the trigger, rollback result, restored `BASE_SHA`, and any path that could not safely be cleaned

Keep the report concise. Reference changed files directly and distinguish verified facts from judgment.
