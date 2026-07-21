---
name: 11ai-llm-cost-single-thread
description: "Inspect one project-attributed Codex, Claude Code, Gemini CLI, Cline, Roo Code, OpenCode, or exported usage thread plus recursively spawned Codex sub-agent threads; normalize token counters, calculate attributable USD cost, measure wall time and estimated active time, and write matching timestamped Markdown and HTML reports under the current thread folder's 11ai-llm-cost-single-thread-reports directory. Use for the cost, tokens, effort level, wall time, or active time of the current Codex thread tree or one explicitly identified root thread."
---

# 11ai LLM Cost Single Thread

Analyze one exactly selected logical LLM root thread plus every recursively linked Codex sub-agent descendant using the bundled analyzer, pricing catalog, and harness reference. Keep source transcripts and input files read-only.

## Contract

Run the bundled analyzer from the current thread's folder root. The optional positional folder is the project to scan and does not change the default report destination:

```bash
node <skill>/scripts/analyze-llm-cost-single-thread.mjs <root-folder>
```

Use `CODEX_THREAD_ID` automatically when the active harness exposes it. For another thread or harness, pass an exact logical thread ID, report thread ID, source label, source filename, or transcript path:

```bash
node <skill>/scripts/analyze-llm-cost-single-thread.mjs <root-folder> --thread <id-or-source>
```

Create this structure by default, where `{datetime}` is the UTC ISO timestamp with colons and the decimal point replaced by hyphens:

```text
<thread-folder>/11ai-llm-cost-single-thread-reports/
└── 11ai-llm-cost-single-thread-reports-{datetime}/
    ├── 11ai-llm-cost-single-thread-{datetime}.md
    └── 11ai-llm-cost-single-thread-{datetime}.html
```

Accept `--pricing`, `--output`, `--codex-home`, `--claude-home`, `--gemini-home`, `--cline-tasks`, `--roo-tasks`, `--opencode-db`, and `--project-only`. Reject a missing selector, an unmatched selector, or a selector that directly spans multiple logical root threads instead of emitting a zero-cost report. After exact root selection, recursively include Codex sessions explicitly marked as sub-agents whose `parent_thread_id` points to the selected root or an included descendant. Do not infer relationships from shared folders, timestamps, or fork metadata alone. Retain explicitly linked sub-agent sessions with unavailable usage and display their token and cost fields as `n/a`.

Read [the bundled harness reference](references/harnesses.md) when native discovery, token semantics, or override paths need explanation. The default catalog is [bundled pricing](references/pricing.json); override it only with a reproducible provider-verified file.

## Workflow

1. Establish the current thread folder and scan root. Prefer the active `CODEX_THREAD_ID`; otherwise obtain an exact selector from the native transcript filename, logical thread ID, or a prior report's `Thread detail` table.
2. Run the analyzer and confirm the returned `threadSelector` matches the intended logical root, `rootThreads` identifies the selected root records, and `subagentThreads` reflects all recursively linked Codex descendants.
3. Review both reports for explicit root/sub-agent counts, token and cost totals, provider/model/harness/folder aggregates, `Cost by model by effort`, wall time, estimated active time, pricing coverage, anomalies, and methodology.
4. If a model is unmatched or pricing is stale, verify the provider's official pricing and rerun with a reproducible pricing override. Never invent a rate from memory.
5. Report the exact output paths and any timing, model, or pricing gaps.

## Timing semantics

Measure wall time independently for the selected root and every included sub-agent from each task's first to last distinct timestamp, then sum known task durations in aggregates. Estimate each task's active time by summing consecutive timestamp gaps while capping every gap at five minutes, then sum known estimates. This suppresses long idle periods without pretending to observe foreground activity. Report both metrics as `n/a` for a task when fewer than two distinct timestamps exist.

Capture Claude effort only from recorded request/configuration fields when present, normalize Claude Code `ultracode` to `xhigh`, and group native usage by both model and recorded effort. Native transcript omissions remain unavailable; never substitute the current setting or a model default for missing history.

## Report requirements

For Cost by tables, the following specific layout supersedes any general metric-order guidance below: put total `Cost` immediately after the provider/model/effort/folder identity columns, then use `Input`, `Cached`, `Input cost`, `Output`, `Output cost`, total `Tokens`, `Cost / 1M tokens`, `Threads`, `Cost / thread`, active time, cost per active hour, wall time, and cost per wall hour. Input cost includes uncached input, cache reads, and supported cache-write classes. Cost per 1M tokens divides known total cost by total measured/provider tokens and multiplies the result by one million; cost per thread divides known cost by all recognized threads, so either may be understated when coverage is incomplete.

Generate Markdown and self-contained HTML from the same analysis. Display the selected root identity, root and included sub-agent counts, relationship depth and parent identity for every task, token classes, measured/provider tokens, known cost, cost coverage, effort, wall time, estimated active time, cost per wall hour, and cost per active hour when calculable. Make `Cost by model by effort` a level-two sibling immediately after the level-two `Cost by model` section. In every thread-derived table, expand tokens into `Input`, `Cached`, `Output`, and total `Tokens` columns. Immediately after cost, order metrics as active time, cost per active hour, wall time, cost per wall hour, then cost per thread where rows aggregate multiple threads. Cost per thread divides known cost by all recognized threads and may be understated when coverage is incomplete; omit it from thread detail because it duplicates selected cost. Do not add hourly metrics to scan, token-composition, or pricing tables because their rows are not disjoint thread groups. Include `Total` rows in every aggregate table. In HTML, make every table column sortable while preserving generated row order on initial load. A newly selected column must sort descending first and then toggle direction; keep unavailable values and `Total` rows at the bottom. Keep every HTML level-two and level-three section in a native `<details>` disclosure without an `open` attribute. Use a fluid full-width compact layout with minimal padding and no outer report card. Put the generation message after all sections and immediately before the signature in both formats.

Do not copy prompts, message content, secrets, or full transcripts. Do not modify transcripts, code, ledgers, pricing inputs, or other source files.

End the Markdown report with this exact signature:

```markdown
_LLM token cost analysis by [11ai-llm-cost-single-thread](https://ai.rj11.io/skills/11ai-llm-cost-single-thread)._
```

End the HTML report with the same visible linked signature. Set `target="_blank"` and `rel="noopener noreferrer"` on its link.

## Completion checks

Before reporting completion:

- confirm the analyzer exits successfully, selects only the intended logical root, recursively includes its explicitly linked Codex sub-agents, and excludes unrelated siblings;
- confirm the default timestamped package contains matching `.md` and `.html` files;
- confirm both formats contain root/sub-agent counts and relationship detail, the standardized token breakdown and cost-adjacent metric order, aggregate cost per thread, plus `Cost by model by effort` as a level-two sibling immediately after `Cost by model`, totals, pricing coverage, limitations, and the exact linked signature;
- confirm every Cost by table contains total, input, output, per-1M-token, and per-thread costs in the required order, with a grand-total row;
- confirm every HTML level-two and level-three section is collapsed by default;
- confirm the HTML is fluid and compact without an outer card, and the generation message follows all disclosures immediately before the signature in both formats;
- confirm every HTML table header is sortable, initial row order is unchanged, a newly selected column starts descending, and `Total` rows remain pinned last;
- confirm no prompt or transcript content appears in either report;
- report the selector, root and sub-agent counts, exact paths, and unavailable timing, usage, or pricing fields.
