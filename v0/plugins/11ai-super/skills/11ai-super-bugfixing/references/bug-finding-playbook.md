# Bug-Finding Playbook

Use this reference to decide what qualifies as a bug, rank confirmed defects, and vary inspection lenses between passes.

## Evidence ladder

Prefer evidence from higher levels. Require stronger evidence as a proposed fix becomes broader or riskier.

1. **Deterministic reproduction:** A focused test, command, request, or interaction reliably produces behavior that contradicts an established contract or invariant.
2. **Direct runtime evidence:** A trace, exception, invalid output, corrupted state, failed request, leak, deadlock, or observable workflow failure identifies the defective path.
3. **Existing check failure:** A relevant test, typecheck, build, linter, schema validator, or contract check fails for a product reason rather than tooling or environment drift.
4. **Conclusive source proof:** Reachable control or data flow necessarily violates a contract for a concrete input, state, timing, role, or environment.
5. **Correlated symptom:** Logs, reports, or intermittent behavior strongly suggest a defect but do not yet isolate it. Investigate; do not patch yet.
6. **Code smell or preference:** Suspicious complexity, style, or hypothetical risk without a reachable failure. Do not label it a bug.

Establish intended behavior from tests, public API contracts, schemas, user-facing copy, repository documentation, standards the project explicitly follows, and consistent neighboring behavior. When sources disagree, identify the ambiguity instead of choosing the easiest implementation.

## Bug versus change request

Treat an issue as a bug when actual behavior violates supported and intended behavior. Treat it as a feature, refactor, or product decision when it mainly asks for:

- new capability or a new supported input
- different product semantics with no existing contract
- aesthetic preference without usability or accessibility failure
- speculative future-proofing
- framework migration or architectural redesign
- performance optimization without a failed budget or material measured harm

Fix adjacent issues only when they are confirmed defects in the authorized scope. Record broader opportunities separately.

## Severity rubric

- **Critical:** Causes data loss or corruption, security boundary failure, outage, irreversible destructive action, systemic crash, or complete failure of a core workflow with no practical workaround.
- **Major:** Breaks or materially misbehaves on a core workflow, role, supported environment, or common input; creates serious incorrect results or repeated failure; or has broad reach with only a costly workaround.
- **Moderate:** Produces incorrect behavior in a secondary path, edge case, or limited environment with a reasonable workaround and contained impact.
- **Minor:** Causes a localized defect with low impact, rare reachability, or trivial recovery.

Do not assign severity from alarming code alone. Combine demonstrated impact, reachability, frequency, affected users or systems, irreversibility, workaround quality, and confidence.

## Finding ledger

Record enough information to reproduce and verify each candidate:

- identifier and short symptom
- evidence level and confidence
- severity and impact
- affected workflow, component, environment, role, and input
- expected behavior and its source
- actual behavior and reproduction steps
- earliest known incorrect state or invariant
- root-cause hypothesis and sibling paths to inspect
- planned regression evidence
- status: candidate, confirmed, fixing, fixed, disproved, duplicate, or blocked

Merge duplicate symptoms under a shared root cause. Preserve the original reproductions so the repair can be checked against every manifestation.

## Inspection lenses

Choose lenses relevant to the project and use a different combination on each fresh pass.

### Existing signals

- failing tests, type errors, build failures, linter diagnostics, warnings, and deprecations
- issue-linked TODO or FIXME comments and disabled or skipped tests
- error logs, uncaught exceptions, unhandled rejections, console errors, failed network requests, and crash reports
- recent changes around fragile code, without assuming recency proves causation

### Inputs and boundaries

- empty, missing, null, malformed, duplicated, oversized, Unicode, locale, timezone, and boundary numeric values
- parsing, serialization, encoding, precision, normalization, validation, and default-value mismatches
- API status and error contracts, schema evolution, pagination, retries, idempotency, and partial responses
- filesystem, URL, path, environment-variable, and platform differences

### State and control flow

- loading, empty, error, success, disabled, stale, offline, and recovery states
- early returns, fallthrough, inverted conditions, precedence, off-by-one logic, and incomplete exhaustive handling
- initialization order, stale closures, shared mutable state, cache invalidation, and state reset
- role, tenant, ownership, and permission variants

### Time and concurrency

- races, duplicate submission, reentrancy, ordering, cancellation, timeout, retry, debounce, and polling behavior
- cold start versus warm state, clock boundaries, date rollover, daylight saving, expiry, and scheduling
- transactions, optimistic updates, eventual consistency, lost updates, and partial failure

### Resources and lifecycle

- listeners, timers, subscriptions, streams, handles, connections, workers, and temporary files
- cleanup on success, failure, cancellation, remount, retry, restart, and shutdown
- bounded memory, CPU, disk, request, queue, and recursion growth

### Integration and user workflow

- complete representative journeys rather than isolated components
- client/server, service/service, database/schema, provider, webhook, and deployment boundaries
- alternate supported browsers, devices, runtimes, package versions, and configuration modes
- keyboard, focus, responsive, and assistive-technology behavior when interface correctness is in scope

### Regression and diff review

- every consumer of changed shared code
- preserved public API, data, error, and compatibility contracts
- tests that fail before and pass after for the intended reason
- new silent catches, suppressions, skips, broad fallbacks, magic values, and duplicated fixes
- unrelated paths, generated artifacts, secrets, debug code, and accidental dependency churn

## Repair evidence

Prefer this chain:

```text
reproduce -> isolate invariant -> capture regression -> apply root-cause fix
          -> pass focused check -> inspect siblings -> pass broad checks
          -> rerun real workflow -> review final diff
```

If the defect is nondeterministic, make timing and state observable before changing behavior. Control clocks, randomness, concurrency, network responses, and external dependencies when possible. Never add arbitrary delays as the final repair unless the contract itself requires waiting.

If no automated regression is practical, record the exact manual or analytical proof, why automation is disproportionate, and what remains unverified. Do not overstate confidence.
