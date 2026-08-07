---
name: 11ai-benchmarks-machine
description: "Inspect all readable Codex, Claude Code, Claude Cowork, Gemini CLI, Cline, Roo Code, and OpenCode usage stores across the machine, plus exported usage files or folders from unsupported harnesses included on request; detect unavailable remote Cowork sessions; classify harness surfaces and billing modes; normalize token counters; calculate attributable USD costs; measure wall and estimated active time; and write Markdown and standalone HTML reports. Use for global LLM spend, token usage, model and effort cost, thread timing, harness coverage, cross-project analysis, or machine-wide reports over exported usage."
---

# 11ai Benchmarks Machine

Analyze machine-wide LLM activity without a project boundary, external service, or benchmark schema. Write every default report package beneath the persistent `11ai-benchmarks-machine-reports` folder on the user's Desktop; keep source transcripts, task stores, and ledgers read-only.

## Contract

Run the bundled analyzer:

```bash
node <skill>/scripts/analyze-llm-cost-global.mjs
```

The command creates this structure if needed, where `{datetime}` is the UTC ISO timestamp with colons and the decimal point replaced by hyphens:

```text
~/Desktop/11ai-benchmarks-machine-reports/
└── 11ai-benchmarks-machine-reports-{datetime}/
    ├── 11ai-benchmarks-machine-{datetime}.md
    ├── 11ai-benchmarks-machine-{datetime}.html
    └── 11ai-benchmarks-machine-{datetime}.json
```

Build one machine-readable dataset from the analysis, write it as the package's `.json` file (`schemaVersion` 1: generator identity, scope, scan coverage, pricing-catalog identity, and every recognized thread with its token classes, costs, pricing state, and timing; never prompts, message content, or transcripts), and render both reports from that dataset so their facts, tables, ordering, limitations, and signature agree. Make the HTML report self-contained with embedded styling and no network dependency. Render every level-two, level-three, and level-four HTML report section as a native disclosure that is collapsed by default. The timestamped default package uses exclusive file creation and never overwrites an existing report. The command accepts:

- `--output <folder>` or `--output-dir <folder>` only when the user explicitly requests a different reports directory;
- `--codex-home <dir>` or `CODEX_HOME` to replace automatic Codex home discovery;
- `--claude-home <dir>` or `CLAUDE_CONFIG_DIR` to replace automatic Claude Code home discovery;
- `--claude-desktop-home <dir>` to replace Claude Desktop's `claude-code-sessions` metadata discovery without treating metadata as usage;
- `--cowork-home <dir>` to replace automatic Claude Cowork desktop-session discovery;
- `--gemini-home <dir>` or `GEMINI_CLI_HOME` to replace Gemini CLI discovery (`--gemini-home` points directly to `.gemini`);
- `--cline-tasks <dir>` and `--roo-tasks <dir>` to replace their automatic task-root discovery;
- repeatable `--opencode-db <file>` arguments to replace automatic OpenCode database discovery;
- repeatable `--include <dir-or-file>` arguments to inspect exported JSON, JSONL, or NDJSON usage records from other harnesses.
- `--from-data <data.json>` to re-render the Markdown and HTML reports from a previously written dataset of this skill without rescanning; scanning options are ignored in that mode.

Without overrides, inspect conventional native stores under every readable local account in the current user's security context. Do not filter native sessions by project or recorded working directory. Unreadable accounts are outside coverage and must not be treated as zero usage.

Read [references/harnesses.md](references/harnesses.md) when native discovery, version compatibility, token semantics, or an override path needs explanation.

For `--include` directories, recurse through JSON-family files while skipping dependency, VCS, cache, virtual-environment, and build directories. Include a file only when it contains a recognized usage record. Prefer selected-folder arrays, cwd/project/workspace path fields, or an explicit workspace label declared by a supplemental record; fall back to the included root only when attribution is absent.

## Workflow

1. Confirm that the request is machine-wide. Use `~/Desktop/11ai-benchmarks-machine-reports/11ai-benchmarks-machine-reports-{datetime}` for default output and use home overrides only for deterministic fixtures or an intentionally restricted scan.
2. Run the analyzer. Preserve malformed, ambiguous, unpriced, reported-only, and undated records in coverage or limitations rather than silently dropping them.
3. Review both generated files for all rolling periods, today, month/quarter/year-to-date, monthly/quarterly/yearly reports, all-time, scan coverage, explicit totals, provider/model/model-by-effort/harness/workspace aggregates, token-class detail, wall time, estimated active time, per-thread tables, pricing coverage, anomalies, and methodology.
4. Leave unmatched models unpriced and make the report direct the user to [`11ai-benchmarks-pricing-update`](https://ai.rj11.io/skills/11ai-benchmarks-pricing-update). Do not research, inject, or persist rates from this reporting skill.
5. Rerun after the bundled catalog is updated by the pricing-update skill or after input changes. The analyzer does not edit transcripts or pricing.

## Period attribution

Render these top-level report sections in this order:

1. `Past 24 hours`
2. `Past 7 days`
3. `Past 30 days`
4. `Past 60 days`
5. `Past 90 days`
6. `Today`
7. `Month to date`
8. `Quarter to date`
9. `Year to date`
10. `Monthly reports`
11. `Quarterly reports`
12. `Yearly reports`
13. `All time`
14. `Response latency`
15. `Harness surface coverage`
16. `Cowork coverage`
17. `Scan coverage`
18. `Pricing coverage`
19. `Anomalies and limitations`
20. `Methodology`

Attribute a whole thread to its finish timestamp, falling back to its start timestamp. Include undated threads only in `All time` and flag them as limitations. Use the machine's local calendar boundaries for `Today`, month/quarter/year-to-date, and monthly/quarterly/yearly reports. Treat `Past 24 hours` and `Past 7/30/60/90 days` as rolling 24/168/720/1,440/2,160-hour windows ending at report generation time. Under each calendar archive, include one level-three subsection for every month, quarter, or year with dated activity, newest first, and render that period's totals and full breakdown as level-four subsections.

## Supported usage shapes

The bundled parser handles:

- Codex session JSONL: final cumulative `token_count` usage and the latest model/effort context;
- Claude session JSONL: assistant usage, cache creation/read buckets, global cross-file message deduplication, per-model/per-effort grouping, and optional metadata-only enrichment from Claude Desktop `claude-code-sessions` joined by `cliSessionId`;
- Claude Cowork audit and sub-agent JSONL: the same usage schema and global deduplication, with session title and selected-folder attribution from adjacent desktop metadata; group all transcripts under one logical Cowork session and count distinct sub-agent transcript identities separately;
- Claude Cowork remote-session indexes: distinguish local measured, remote measured, and remote detected-but-unavailable sessions; keep measured totals numeric and warn that unavailable remote usage is excluded rather than treated as zero;
- Claude effort: recorded request/configuration fields when present, with `ultracode` normalized to `xhigh`. Native transcript omissions remain `n/a`; never rewrite missing historical effort as the current setting or a model default;
- Gemini CLI chat JSONL: per-response input, output, cached, thought, tool, and total counters;
- Cline and Roo Code task `ui_messages.json`: API request, deleted-request, and subagent usage counters plus harness-reported cost;
- OpenCode SQLite ledgers: current assistant `message.data` usage and legacy session-column schemas, without also counting overlapping `part` rows;
- OpenAI-style response usage: input/prompt, cached-input, output/completion, total, and reasoning counters;
- Anthropic-style usage objects and generic `usage`, `token_usage`, or `tokenUsage` records;
- harness-reported `cost`, `cost_usd`, or `total_cost_usd` when token pricing is unavailable.

Retain provider-native usage with these semantics:

- cached input is a subset of input for OpenAI-style counters;
- Claude-style uncached input, cache writes, and cache reads are disjoint;
- reasoning output is a subset of output;
- missing data is `n/a`, never zero.

Before aggregating Claude usage, deduplicate records across every parsed native and supplemental file. Prefer `message.id`, fall back to a top-level record ID, group each ID by stable non-output billing fields, and retain the record with the highest output-token count in each group. If one message ID has conflicting model or input/cache billing fields, retain one highest-output record per conflicting variant and surface the conflict in scan coverage and limitations. Leave records without a usable message ID unchanged.

## Timing

Measure wall time from the first to last distinct timestamp observed for a thread. Estimate active time by summing consecutive timestamp gaps while capping each gap at five minutes. Report both as `n/a` when fewer than two distinct timestamps exist. Treat active time as a reproducible estimate of interaction time, not foreground-process telemetry.

## Report requirements

Within every fixed and calendar-archive period, place `Totals` immediately after `Cost by workspace` at the same heading level.

Format every USD value with a dollar sign, comma thousands separators, and exactly four decimal places, such as `$1,234.5678`.

For Cost by tables, the following specific layout supersedes any general metric-order guidance below: put total `Cost` immediately after the provider/model/effort/workspace identity columns, then use `Input`, `Cached`, `Input cost`, `Output`, `Output cost`, total `Tokens`, `Cost / 1M tokens`, `Threads`, `Cost / thread`, active time, cost per active hour, wall time, and cost per wall hour. Input cost includes uncached input, cache reads, and supported cache-write classes. Cost per 1M tokens divides known total cost by total measured/provider tokens and multiplies the result by one million; cost per thread divides known cost by all recognized threads, so either may be understated when coverage is incomplete.

Within every period, display explicit grand totals for threads, token classes, measured/provider tokens, known cost, cost coverage, wall time, and estimated active time. Aggregate by provider, model, model and effort, harness, and workspace within each period. Make `Cost by model by effort` a same-level sibling immediately after `Cost by model`: level three in fixed period reports and level four within each monthly report. Include a `Total` row in every aggregate table. In every thread-derived table, expand tokens into `Input`, `Cached`, `Output`, and total `Tokens` columns. Immediately after cost, order metrics as active time, cost per active hour, wall time, cost per wall hour, then cost per thread where rows contain multiple threads. Every table built on the shared cost columns ends with blended `Output TPS` and `Active time / response` columns; both are estimates over threads with measured timing and show `n/a` otherwise. Render a `Response latency` section from per-response record timestamps: percentile tables by model and by harness, measured from the last preceding input record to each response's final snapshot. The metric includes network, queue, and decode time, is not time-to-first-token, currently covers Claude-family transcripts, discloses coverage per row, and shows an explicit no-coverage line instead of silently omitting the section. Cost per thread divides known cost by all recognized threads and may be understated when coverage is incomplete; omit it from thread detail because it duplicates selected cost. Keep harness-specific reported cost, average tokens, and coverage fields after those shared metrics. Do not add hourly metrics to scan, token-composition, or pricing tables because their rows are not disjoint thread groups. In HTML, make every table column sortable while preserving generated row order on initial load. A newly selected column must sort descending first and then toggle direction; keep unavailable values and `Total` rows at the bottom. Use a fluid full-width layout with minimal padding, compact spacing, and no outer report card. Distinguish measured token usage, derived cost, harness-reported cost, and unavailable cost. State that computed subscription usage is an API-equivalent estimate, not necessarily an invoice. Include normalized source labels, workspace paths, and timestamps where available, but do not copy prompts, message content, secrets, or full transcripts.

Place `Cowork coverage` immediately after `Harness surface coverage` and immediately before `Scan coverage`. Show local measured, remote detected, remote measured, and remote detected-but-unavailable states separately. When remote usage is unavailable, preserve all numeric measured totals and add a prominent warning that those totals exclude the unavailable sessions.

When one or more unmatched real models have positive measured/provider tokens, add `Models requiring a pricing update` inside `Pricing coverage`. Aggregate those models by provider and model with thread, input, cached-input, output, and total-token counts. State that known-cost totals exclude them and link `11ai-benchmarks-pricing-update` to `https://ai.rj11.io/skills/11ai-benchmarks-pricing-update`, instructing the user to run it and regenerate the report. Omit synthetic, unknown, and zero-token placeholders from this callout. In HTML, open the link in a new tab with `rel="noopener noreferrer"`. Omit the entire callout when no actionable unmatched model exists.

Immediately below the Markdown H1, place `_powered by [11ai-benchmarks-machine](https://ai.rj11.io/skills/11ai-benchmarks-machine)._`. In HTML, append a smaller inline span to the main title with the exact text `powered by 11ai-benchmarks-machine`; link that text to the same skill URL with `target="_blank"` and `rel="noopener noreferrer"`. Render every level-two, level-three, and level-four report section as a native `<details>` element with a `<summary>`, omit the `open` attribute so all sections are collapsed by default, and keep the report title, generation message, and signature outside those disclosures. Put the generation message after all report sections and immediately before the signature in both formats.

End the Markdown report with this exact linked signature:

```markdown
_AI benchmarks and analysis by [11ai-benchmarks-machine](https://ai.rj11.io/skills/11ai-benchmarks-machine)._
```

End the HTML report with the same visible signature and a clickable link whose `href` is exactly `https://ai.rj11.io/skills/11ai-benchmarks-machine`. Set `target="_blank"` and `rel="noopener noreferrer"` on that signature link so it opens safely in a new tab.

If extending an existing report, preserve its prior skill attribution and keep all skill signatures together at the end.

Do not modify source transcripts, code, benchmark artifacts, ledgers, reviews, or other files.

## Pricing

Use only this skill's bundled `references/pricing.json`. Do not accept a pricing override or read, create, update, or recommend `llm-pricing.json`, `.llm-cost/pricing.json`, or `~/.llm-cost/pricing.json`; legacy files at those paths have no effect. Rates are USD per one million tokens. Select the rate effective at the thread finish timestamp, falling back to its start. If aggregated usage crosses a price boundary, use the main finish-time price for the whole thread. If usage predates known history, use the earliest available rate while directing historical research to the pricing-update skill; if usage is undated, use the latest rate active at report generation. Display each applied period, official-or-detected date basis, and temporal fallback. Keep unmatched or stale prices visible as limitations and never turn them into zero-cost rows. Only `11ai-benchmarks-pricing-update` may research official pricing and update the bundled catalogs.

## Completion checks

Before reporting completion:

- confirm the analyzer exits successfully;
- confirm `~/Desktop/11ai-benchmarks-machine-reports/11ai-benchmarks-machine-reports-{datetime}` exists unless the user requested an override;
- confirm the timestamped package contains same-named `.md` and `.html` reports;
- confirm the Markdown report places the linked `powered by 11ai-benchmarks-machine` attribution immediately below its H1;
- confirm the HTML main title includes the smaller inline linked text `powered by 11ai-benchmarks-machine` and that its link safely opens in a new tab;
- confirm both reports use this exact top-level order: `Past 24 hours`, `Past 7 days`, `Past 30 days`, `Past 60 days`, `Past 90 days`, `Today`, `Month to date`, `Quarter to date`, `Year to date`, `Monthly reports`, `Quarterly reports`, `Yearly reports`, `All time`, `Harness surface coverage`, `Cowork coverage`, `Scan coverage`, `Pricing coverage`, `Anomalies and limitations`, `Methodology`;
- confirm monthly, quarterly, and yearly reports contain one newest-first level-three subsection for every corresponding calendar period with dated activity and that every archive period contains the same full breakdown at level four;
- confirm every period in both formats displays the standardized token breakdown and cost-adjacent metric order, aggregate cost per thread, totals, and provider/model/model-by-effort/harness/workspace aggregates with grand-total rows;
- confirm every fixed period contains `Cost by model by effort` as a level-three sibling immediately after `Cost by model`, and every calendar archive report contains the equivalent level-four sibling pair;
- confirm every period places `Totals` immediately after `Cost by workspace` at the same heading level;
- confirm every HTML table header is sortable, initial row order is unchanged, a newly selected column starts descending, and `Total` rows remain pinned last;
- confirm every HTML level-two, level-three, and level-four report section is a `<details>` disclosure without an `open` attribute, so all sections load collapsed;
- confirm the HTML is fluid and compact without an outer card, and the generation message follows all disclosures immediately before the signature in both formats;
- confirm both state inspected files, recognized threads, known and unknown costs, pricing coverage, historical pricing selection, applied rate periods, temporal fallbacks, and limitations;
- confirm both distinguish every Cowork coverage state and preserve measured totals while warning about excluded unavailable remote usage;
- confirm both identify the bundled catalog version and update date, disclose earliest-available, latest-available, and main-price boundary fallbacks, and conditionally show actionable unmatched models, excluded token totals, and the exact pricing-update link without listing synthetic or zero-token placeholders;
- confirm both end with a signature linking to `https://ai.rj11.io/skills/11ai-benchmarks-machine`;
- rerun once with unchanged inputs, confirm a second timestamped report package is created in the reports folder, and ensure both formats are stable apart from generated timestamps;
- report the exact folder and file paths, unreadable scope, and model/pricing gaps.
