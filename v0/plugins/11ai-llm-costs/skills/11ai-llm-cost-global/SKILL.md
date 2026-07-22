---
name: 11ai-llm-cost-global
description: "Inspect all readable Codex, Claude Code, Gemini CLI, Cline, Roo Code, and OpenCode usage stores across the machine; normalize token counters, calculate attributable USD costs, measure wall and estimated active time, and write Markdown and standalone HTML reports under the Desktop's 11ai-llm-cost-global-reports folder with rolling, calendar-to-date, monthly, and all-time sections. Use for global LLM spend, token usage, model and effort cost, AI timing, or cross-project analysis."
---

# 11ai LLM Cost Global

Analyze machine-wide LLM activity without a project boundary, external service, or benchmark schema. Write every default report package beneath the persistent `11ai-llm-cost-global-reports` folder on the user's Desktop; keep source transcripts, task stores, and ledgers read-only.

## Contract

Run the bundled analyzer:

```bash
node <skill>/scripts/analyze-llm-cost-global.mjs
```

The command creates this structure if needed, where `{datetime}` is the UTC ISO timestamp with colons and the decimal point replaced by hyphens:

```text
~/Desktop/11ai-llm-cost-global-reports/
└── 11ai-llm-cost-global-reports-{datetime}/
    ├── 11ai-llm-cost-global-{datetime}.md
    └── 11ai-llm-cost-global-{datetime}.html
```

Generate both reports from the same analysis so their facts, tables, ordering, limitations, and signature agree. Make the HTML report self-contained with embedded styling and no network dependency. Render every level-two, level-three, and level-four HTML report section as a native disclosure that is collapsed by default. The timestamped default package uses exclusive file creation and never overwrites an existing report. The command accepts:

- `--pricing <file>` to use an explicit pricing catalog;
- `--output <folder>` or `--output-dir <folder>` only when the user explicitly requests a different reports directory;
- `--codex-home <dir>` or `CODEX_HOME` to replace automatic Codex home discovery;
- `--claude-home <dir>` or `CLAUDE_CONFIG_DIR` to replace automatic Claude Code home discovery;
- `--gemini-home <dir>` or `GEMINI_CLI_HOME` to replace Gemini CLI discovery (`--gemini-home` points directly to `.gemini`);
- `--cline-tasks <dir>` and `--roo-tasks <dir>` to replace their automatic task-root discovery;
- repeatable `--opencode-db <file>` arguments to replace automatic OpenCode database discovery;
- repeatable `--include <dir-or-file>` arguments to inspect exported JSON, JSONL, or NDJSON usage records from other harnesses.

Without overrides, inspect conventional native stores under every readable local account in the current user's security context. Do not filter native sessions by project or recorded working directory. Unreadable accounts are outside coverage and must not be treated as zero usage.

Read [references/harnesses.md](references/harnesses.md) when native discovery, version compatibility, token semantics, or an override path needs explanation.

For `--include` directories, recurse through JSON-family files while skipping dependency, VCS, cache, virtual-environment, and build directories. Include a file only when it contains a recognized usage record.

## Workflow

1. Confirm that the request is machine-wide. Use `~/Desktop/11ai-llm-cost-global-reports/11ai-llm-cost-global-reports-{datetime}` for default output and use home overrides only for deterministic fixtures or an intentionally restricted scan.
2. Run the analyzer. Preserve malformed, ambiguous, unpriced, reported-only, and undated records in coverage or limitations rather than silently dropping them.
3. Review both generated files for both rolling periods, month-to-date, year-to-date, monthly reports, all-time, scan coverage, explicit totals, provider/model/model-by-effort/harness/workspace aggregates, token-class detail, wall time, estimated active time, per-thread tables, pricing coverage, anomalies, and methodology.
4. If a model is unmatched or pricing is older than 30 days, verify the provider's official pricing page. Prefer an explicit pricing override or the machine-level `~/.llm-cost/pricing.json` so the report remains reproducible; never invent a rate from memory.
5. Rerun after pricing or input changes. The analyzer does not edit transcripts.

## Period attribution

Render these top-level report sections in this order:

1. `Past 7 days`
2. `Past 30 days`
3. `Month to date`
4. `Year to date`
5. `Monthly reports`
6. `All time`
7. `Scan coverage`
8. `Pricing coverage`
9. `Anomalies and limitations`
10. `Methodology`

Attribute a whole thread to its finish timestamp, falling back to its start timestamp. Include undated threads only in `All time` and flag them as limitations. Use the machine's local calendar boundaries for year-to-date, month-to-date, and calendar-month reports. Treat `Past 7 days` and `Past 30 days` as rolling 168-hour and 720-hour windows ending at report generation time. Under `Monthly reports`, include one level-three subsection for every calendar month with dated activity, newest first, and render that month's totals and full breakdown as level-four subsections.

## Supported usage shapes

The bundled parser handles:

- Codex session JSONL: final cumulative `token_count` usage and the latest model/effort context;
- Claude session JSONL: assistant usage, cache creation/read buckets, and per-model/per-effort grouping;
- Claude effort: recorded request/configuration fields when present, with `ultracode` normalized to `xhigh`. Native transcript omissions remain `n/a`; never rewrite missing historical effort as the current setting or a model default;
- Gemini CLI chat JSONL: per-response input, output, cached, thought, tool, and total counters;
- Cline and Roo Code task `ui_messages.json`: API request, deleted-request, and subagent usage counters plus harness-reported cost;
- OpenCode SQLite session ledgers: model/provider, workspace, cost, uncached input, output, reasoning, cache-read, and cache-write counters;
- OpenAI-style response usage: input/prompt, cached-input, output/completion, total, and reasoning counters;
- Anthropic-style usage objects and generic `usage`, `token_usage`, or `tokenUsage` records;
- harness-reported `cost`, `cost_usd`, or `total_cost_usd` when token pricing is unavailable.

Retain provider-native usage with these semantics:

- cached input is a subset of input for OpenAI-style counters;
- Claude-style uncached input, cache writes, and cache reads are disjoint;
- reasoning output is a subset of output;
- missing data is `n/a`, never zero.

## Timing

Measure wall time from the first to last distinct timestamp observed for a thread. Estimate active time by summing consecutive timestamp gaps while capping each gap at five minutes. Report both as `n/a` when fewer than two distinct timestamps exist. Treat active time as a reproducible estimate of interaction time, not foreground-process telemetry.

## Report requirements

Format every USD value with a dollar sign, comma thousands separators, and exactly four decimal places, such as `$1,234.5678`.

For Cost by tables, the following specific layout supersedes any general metric-order guidance below: put total `Cost` immediately after the provider/model/effort/workspace identity columns, then use `Input`, `Cached`, `Input cost`, `Output`, `Output cost`, total `Tokens`, `Cost / 1M tokens`, `Threads`, `Cost / thread`, active time, cost per active hour, wall time, and cost per wall hour. Input cost includes uncached input, cache reads, and supported cache-write classes. Cost per 1M tokens divides known total cost by total measured/provider tokens and multiplies the result by one million; cost per thread divides known cost by all recognized threads, so either may be understated when coverage is incomplete.

Within every period, display explicit grand totals for threads, token classes, measured/provider tokens, known cost, cost coverage, wall time, and estimated active time. Aggregate by provider, model, model and effort, harness, and workspace within each period. Make `Cost by model by effort` a same-level sibling immediately after `Cost by model`: level three in fixed period reports and level four within each monthly report. Include a `Total` row in every aggregate table. In every thread-derived table, expand tokens into `Input`, `Cached`, `Output`, and total `Tokens` columns. Immediately after cost, order metrics as active time, cost per active hour, wall time, cost per wall hour, then cost per thread where rows contain multiple threads. Cost per thread divides known cost by all recognized threads and may be understated when coverage is incomplete; omit it from thread detail because it duplicates selected cost. Keep harness-specific reported cost, average tokens, and coverage fields after those shared metrics. Do not add hourly metrics to scan, token-composition, or pricing tables because their rows are not disjoint thread groups. In HTML, make every table column sortable while preserving generated row order on initial load. A newly selected column must sort descending first and then toggle direction; keep unavailable values and `Total` rows at the bottom. Use a fluid full-width layout with minimal padding, compact spacing, and no outer report card. Distinguish measured token usage, derived cost, harness-reported cost, and unavailable cost. State that computed subscription usage is an API-equivalent estimate, not necessarily an invoice. Include normalized source labels, workspace paths, and timestamps where available, but do not copy prompts, message content, secrets, or full transcripts.

Immediately below the Markdown H1, place `_powered by [11ai-llm-cost-global](https://ai.rj11.io/skills/11ai-llm-cost-global)._`. In HTML, append a smaller inline span to the main title with the exact text `powered by 11ai-llm-cost-global`; link that text to the same skill URL with `target="_blank"` and `rel="noopener noreferrer"`. Render every level-two, level-three, and level-four report section as a native `<details>` element with a `<summary>`, omit the `open` attribute so all sections are collapsed by default, and keep the report title, generation message, and signature outside those disclosures. Put the generation message after all report sections and immediately before the signature in both formats.

End the Markdown report with this exact linked signature:

```markdown
_LLM token cost analysis by [11ai-llm-cost-global](https://ai.rj11.io/skills/11ai-llm-cost-global)._
```

End the HTML report with the same visible signature and a clickable link whose `href` is exactly `https://ai.rj11.io/skills/11ai-llm-cost-global`. Set `target="_blank"` and `rel="noopener noreferrer"` on that signature link so it opens safely in a new tab.

If extending an existing report, preserve its prior skill attribution and keep all skill signatures together at the end.

Do not modify source transcripts, code, benchmark artifacts, ledgers, reviews, or other files.

## Pricing

Pricing lookup order is:

1. explicit `--pricing` file;
2. `llm-pricing.json` in the invocation's current working directory;
3. `~/.llm-cost/pricing.json`;
4. this skill's `references/pricing.json`.

Rates are USD per one million tokens. Every priced thread must show the matched model pattern, rate source, effective date, and verification date. Keep unmatched or stale prices visible as limitations and do not turn them into zero-cost rows.

## Completion checks

Before reporting completion:

- confirm the analyzer exits successfully;
- confirm `~/Desktop/11ai-llm-cost-global-reports/11ai-llm-cost-global-reports-{datetime}` exists unless the user requested an override;
- confirm the timestamped package contains same-named `.md` and `.html` reports;
- confirm the Markdown report places the linked `powered by 11ai-llm-cost-global` attribution immediately below its H1;
- confirm the HTML main title includes the smaller inline linked text `powered by 11ai-llm-cost-global` and that its link safely opens in a new tab;
- confirm both reports use this exact top-level order: `Past 7 days`, `Past 30 days`, `Month to date`, `Year to date`, `Monthly reports`, `All time`, `Scan coverage`, `Pricing coverage`, `Anomalies and limitations`, `Methodology`;
- confirm `Monthly reports` contains one newest-first level-three subsection for every calendar month with dated activity and that every month contains the same full breakdown at level four;
- confirm every period in both formats displays the standardized token breakdown and cost-adjacent metric order, aggregate cost per thread, totals, and provider/model/model-by-effort/harness/workspace aggregates with grand-total rows;
- confirm every fixed period contains `Cost by model by effort` as a level-three sibling immediately after `Cost by model`, and every monthly report contains the equivalent level-four sibling pair;
- confirm every HTML table header is sortable, initial row order is unchanged, a newly selected column starts descending, and `Total` rows remain pinned last;
- confirm every HTML level-two, level-three, and level-four report section is a `<details>` disclosure without an `open` attribute, so all sections load collapsed;
- confirm the HTML is fluid and compact without an outer card, and the generation message follows all disclosures immediately before the signature in both formats;
- confirm both state inspected files, recognized threads, known and unknown costs, pricing coverage, and limitations;
- confirm both end with a signature linking to `https://ai.rj11.io/skills/11ai-llm-cost-global`;
- rerun once with unchanged inputs, confirm a second timestamped report package is created in the reports folder, and ensure both formats are stable apart from generated timestamps;
- report the exact folder and file paths, unreadable scope, and model/pricing gaps.
