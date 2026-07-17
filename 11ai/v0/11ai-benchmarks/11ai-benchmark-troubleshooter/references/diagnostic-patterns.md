# Diagnostic patterns

## Transcript shapes

Codex session JSONL normally identifies the repository in
`session_meta.payload.cwd`. Model and effort are in `turn_context.payload`.
The authoritative cumulative usage is the last
`event_msg.payload.info.total_token_usage` event. Do not sum cumulative events.

Claude project JSONL can expose usage at top-level `usage` or under
`message.usage`, depending on the transcript producer. Deduplicate by message
ID when present; otherwise deduplicate exact model-plus-usage records. Group
usage by model before matching pricing.

## Accounting checks

For every usage-bearing thread, confirm:

1. provider, model, effort, and source transcript are recorded;
2. input, cached input, cache writes, output, and provider total have explicit
   semantics or explicit nulls;
3. pricing matched a verified model alias and effective date;
4. `totalUsd` is numeric only when every required priced class is numeric;
5. benchmark-run, judge, and operation scopes reconcile without double-counting.

Synthetic or unpriced operations remain measured-token rows with unavailable
costs. Do not turn the complete accounting scope into zero or a fabricated
subtotal. Prefer separate known benchmark-run, judge, and priced-operation
subtotals.

## Lifecycle and review checks

The current pointer must identify an existing cycle and its
`review/data.json`. Its `reviewSourceDigest` must equal the review's
`sourceDigest`. A repaired review should update its own digest after accounting
changes, then update the pointer. Preserve historical published cycles.

Use the exact interrupted directory the user names. Do not treat a date/version
cycle such as `cyber-dashboard-2026-07-17-v2` as an exact `cycle-2`.

## Website compatibility checks

Adapters must support both common review forms:

- legacy: `runs[].id`;
- v2 wrapped: `runs[].runId` with the reviewed run under `runs[].run.id`.

Never coerce missing token or cost values to zero. Use an explicit unavailable
state. Site indexes must use stable IDs and must never emit `run:undefined`.
Their source digest should include a generator version when code changes must
invalidate an otherwise unchanged source snapshot.
