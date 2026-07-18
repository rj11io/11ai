---
name: 11ai-code-quality
description: "Review and improve code quality across a codebase, module, diff, or file so the result is clean, well-structured, human-readable, appropriately commented, maintainable, and protected against regressions. Use for code-quality reviews, cleanup requests, refactors, readability improvements, complexity reduction, naming and structure fixes, comment improvements, or safe rewrites that may require characterization, unit, integration, or end-to-end tests."
---

# 11ai Code Quality

Apply a correctness-first quality review. Preserve observable behavior unless the user explicitly requests a behavior change, and require evidence before claiming a rewrite is regression-safe.

## Choose the operating mode

- For a review, audit, diagnosis, or report, inspect the code and return prioritized findings without editing files.
- For a fix, cleanup, refactor, or rewrite, inspect, edit, and verify the code within the requested scope.
- If the request is ambiguous, begin with the read-only review. Do not infer permission to change public behavior, APIs, schemas, dependencies, or architecture.

## Workflow

1. Establish scope and repository rules.
   Read applicable instructions, manifests, configuration, tests, and the current working-tree status. Preserve unrelated user changes.

2. Map the behavior before judging the implementation.
   Trace callers, consumers, inputs, outputs, side effects, error paths, persistence, public contracts, and important edge cases. For a diff, inspect both the changed code and the surrounding contract.

3. Establish a baseline.
   Discover the repository's own format, lint, typecheck, build, and test commands. Run the smallest relevant checks before editing when practical. Record pre-existing failures separately from failures introduced by the work.

4. Review in priority order.
   Evaluate:
   - correctness, data integrity, security, concurrency, and error handling;
   - cohesion, coupling, responsibility boundaries, control flow, and duplication;
   - naming, types, interfaces, file organization, and local consistency;
   - readability, unnecessary cleverness, dead code, and misleading abstractions;
   - comments and documentation;
   - testability and meaningful coverage of risky behavior.

5. Plan the smallest coherent improvement.
   Fix root causes without widening the change unnecessarily. Prefer simple control flow, explicit contracts, focused functions, descriptive names, and existing project conventions. Avoid speculative abstractions and broad formatting churn.

6. Protect behavior before rewriting.
   List the behaviors that must remain invariant. If important behavior is not already covered, add characterization tests before the rewrite. Separate intentional behavior changes from structural changes so each can be reasoned about and verified.

7. Implement in reviewable increments.
   Keep each patch focused. Re-check call sites and contracts after extractions, renames, signature changes, or moved responsibilities. Do not silently change error semantics, ordering, timing, serialization, null handling, side effects, or compatibility.

8. Validate proportionally to risk.
   Run targeted tests first, then the relevant broader suite plus lint, typecheck, build, or format checks supported by the repo. Inspect the final diff for accidental changes, stale comments, debugging code, and untested branches.

9. Report evidence and residual risk.
   State what was reviewed or changed, which checks ran and their results, any pre-existing failures, and anything that could not be verified. Never describe a rewrite as regression-free solely because it compiles or looks equivalent.

## Regression safeguards

Add or update tests when a change affects behavior, fixes a bug, moves logic across boundaries, alters branching or error handling, touches async or stateful code, changes a public contract, or exposes previously untested critical behavior.

Choose the lowest-cost test that proves the contract:

- Use unit tests for pure logic, edge cases, and error branches.
- Use integration tests for boundaries such as databases, files, queues, services, or framework wiring.
- Use end-to-end tests only for critical user-visible flows that lower-level tests cannot cover adequately.
- Prefer stable assertions on observable behavior over assertions coupled to implementation details.

For a risky rewrite:

1. Capture representative success, boundary, and failure cases.
2. Add characterization tests against the old implementation when coverage is insufficient.
3. Run them before the rewrite and confirm they can detect a meaningful break where feasible.
4. Rewrite in small steps while keeping the tests green.
5. Add tests for any deliberately corrected behavior.
6. Run the broader relevant verification suite.

If adequate verification is impossible, reduce the change or explicitly report the unverified risk. Do not compensate with confidence language.

## Code and comment standard

Require code to be:

- correct and unsurprising;
- organized around clear responsibilities;
- readable without mentally simulating excessive indirection;
- named for domain meaning rather than implementation trivia;
- explicit at boundaries and defensive where external input enters;
- consistent with the repository's established style;
- easy to test and change without unrelated breakage.

Add comments where they preserve information the code cannot express clearly: intent, invariants, non-obvious constraints, compatibility decisions, side effects, workarounds, and public API expectations. Keep comments concise and adjacent to the relevant code. Remove stale, redundant, or commented-out code. Do not add comments that merely translate syntax into prose.

## Review output

For review-only work, lead with actionable findings ordered by severity. For each finding, include:

- a concise title and severity;
- the exact file and line when possible;
- the concrete failure, maintenance cost, or readability problem;
- a specific remediation;
- the test or verification needed when the fix could affect behavior.

Then summarize strengths, coverage gaps, and the recommended order of work. If no material issue is found, say so and identify any remaining verification gaps.

For edits, summarize the resulting quality improvement, changed files, tests added or updated, commands run, results, and residual risks. Keep style-only changes distinct from behavior changes.
