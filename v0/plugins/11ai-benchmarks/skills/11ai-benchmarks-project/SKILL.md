---
name: 11ai-benchmarks-project
description: "Inspect a repository plus its project-attributed Codex, Claude Code, Claude Cowork, Gemini CLI, Cline, Roo Code, and OpenCode records; detect unavailable remote Cowork sessions; classify harness surfaces and billing modes; normalize provider token counters; calculate attributable USD costs; measure wall and estimated active time; and write matching timestamped Markdown and HTML reports. Use for project LLM spend, token usage, model and effort cost, thread timing, harness coverage, or recursive cost analysis."
---

# 11ai Benchmarks Project

Analyze local LLM activity without depending on a benchmark repository, benchmark schema, or external service. Write every default report package beneath the persistent `11ai-benchmarks-project-reports` folder at the current thread's working-directory root; keep source transcripts and input files read-only.

## Contract

Run the bundled analyzer from the current thread's folder root. The optional positional folder is the project to analyze and does not change the default report destination:

```bash
node <skill>/scripts/analyze-llm-cost-project.mjs <root-folder>
```

The command treats `process.cwd()` as the current thread folder and creates this structure if needed. `{datetime}` is the UTC ISO timestamp for the run with colons and the decimal point replaced by hyphens:

```text
<thread-folder>/11ai-benchmarks-project-reports/
└── 11ai-benchmarks-project-reports-{datetime}/
    ├── 11ai-benchmarks-project-{datetime}.md
    └── 11ai-benchmarks-project-{datetime}.html
```

Generate both files from the same analysis. The HTML must be self-contained with embedded styling and no network dependency. The timestamped default package uses exclusive file creation so it never overwrites existing reports. It accepts:

- `--output <file>` only when the user explicitly requests a different Markdown report path; the analyzer writes the matching HTML sibling automatically;
- `--codex-home <dir>` or `CODEX_HOME` to override the native Codex data directory;
- `--claude-home <dir>` or `CLAUDE_CONFIG_DIR` to override the native Claude Code data directory;
- `--claude-desktop-home <dir>` to override Claude Desktop's metadata-only `claude-code-sessions` directory;
- `--cowork-home <dir>` to override the native Claude Cowork desktop-session directory;
- `--gemini-home <dir>` or `GEMINI_CLI_HOME` to override Gemini CLI discovery (`--gemini-home` points directly to `.gemini`);
- `--cline-tasks <dir>` and `--roo-tasks <dir>` to override their task roots;
- `--opencode-db <file>` to override OpenCode database discovery;
- `--thread <id-or-source>` to restrict the report to one exact logical thread, report thread ID, source label, source filename, or transcript path;
- `--project-only` to disable native session discovery and inspect only the requested root.

The analyzer reads JSON, JSONL, and NDJSON files recursively, while skipping dependency, VCS, cache, and build directories. It also discovers seven harnesses from their native stores. It includes a native record only when its working directory, Cowork selected folders, Gemini project hash/directory, task metadata, or OpenCode session directory associates it with the requested root. Supplemental records may declare attribution through selected-folder arrays, cwd/project/workspace path fields, or an explicit workspace label. It only reports files containing recognized usage.

Read [references/harnesses.md](references/harnesses.md) when native discovery, version compatibility, token semantics, or an override path needs explanation.

## Workflow

1. Establish both the current thread folder (`process.cwd()`) and the project root to analyze. Resolve native transcript homes from CLI options, harness environment variables, or the current user's home directory, and use `<thread-folder>/11ai-benchmarks-project-reports/11ai-benchmarks-project-reports-{datetime}` unless the user explicitly requested another output path.
2. Run the analyzer. Preserve malformed, ambiguous, unpriced, and reported-only records in the report's coverage and limitations sections rather than silently dropping them.
3. Review both generated files for explicit totals, provider/model/harness aggregates, root-versus-child-folder aggregates, `Cost by model by effort`, token-class detail, wall time, estimated active time, per-thread detail, pricing coverage, anomalies, and methodology. Confirm every HTML report section is a native collapsed disclosure control on first load.
4. Leave unmatched models unpriced and make the report direct the user to [`11ai-benchmarks-pricing-update`](https://ai.rj11.io/skills/11ai-benchmarks-pricing-update). Do not research, inject, or persist rates from this reporting skill.
5. Rerun the analyzer after the bundled catalog is updated by the pricing-update skill or after input changes. It is idempotent and does not edit transcripts or pricing.

## Supported usage shapes

The bundled parser handles:

- Codex session JSONL: final cumulative `token_count` usage and the latest model/effort context;
- Claude session JSONL: assistant usage, cache creation/read buckets, cross-file message deduplication, and per-model/per-effort grouping;
- Claude effort: recorded request/configuration fields when present, with `ultracode` normalized to `xhigh`. Native transcript omissions remain `n/a`; never rewrite missing historical effort as the current setting or a model default;
- Gemini CLI chat JSONL: per-response input, output, cached, thought, tool, and total counters;
- Cline and Roo Code task `ui_messages.json`: API request, deleted-request, and subagent usage counters plus harness-reported cost;
- OpenCode SQLite ledgers: current assistant `message.data` usage and legacy session-column schemas;
- OpenAI-style response usage: `input_tokens` or `prompt_tokens`, cached-input details, output/completion tokens, and reasoning details;
- Anthropic-style usage objects and generic `usage`, `token_usage`, or `tokenUsage` records;
- harness-reported `cost`, `cost_usd`, or `total_cost_usd` when token pricing is unavailable.

Generic harnesses remain compatible by placing or exporting a supported JSON usage shape within the requested root.

Provider-native raw usage is retained in the analyzer's in-memory record and normalized with these semantics:

- cached input is a subset of input for OpenAI-style counters;
- Claude-style uncached input, cache writes, and cache reads are disjoint;
- reasoning output is a subset of output;
- missing data is `n/a`, never zero.

Before aggregating Claude usage, deduplicate records across every in-scope project and native file. Prefer `message.id`, fall back to a top-level record ID, group each ID by stable non-output billing fields, and retain the record with the highest output-token count in each group. If one message ID has conflicting model or input/cache billing fields, retain one highest-output record per conflicting variant and surface the conflict in scan coverage and limitations. Leave records without a usable message ID unchanged. Join Claude Desktop metadata to existing Claude transcripts by `cliSessionId`; never count a metadata file as usage. Group Cowork root and sub-agent transcripts as one logical session and count distinct sub-agent transcript identities separately. Detect project-associated remote Cowork indexes and distinguish local measured, remote measured, and remote detected-but-unavailable sessions; preserve numeric measured totals and warn that unavailable remote usage is excluded.

## Timing

Measure wall time from the first to last distinct timestamp observed for a thread. Estimate active time by summing consecutive timestamp gaps while capping each gap at five minutes. Report both as `n/a` when fewer than two distinct timestamps exist. Treat active time as a reproducible estimate of interaction time, not foreground-process telemetry.

## Report requirements

Place `Totals` immediately after `Cost by root and child folder`, and place `Scan coverage` immediately before `Pricing coverage`, in both report formats.

Format every USD value with a dollar sign, comma thousands separators, and exactly four decimal places, such as `$1,234.5678`.

For Cost by tables, the following specific layout supersedes any general metric-order guidance below: put total `Cost` immediately after the provider/model/effort/folder identity columns, then use `Input`, `Cached`, `Input cost`, `Output`, `Output cost`, total `Tokens`, `Cost / 1M tokens`, `Threads`, `Cost / thread`, active time, cost per active hour, wall time, and cost per wall hour. Input cost includes uncached input, cache reads, and supported cache-write classes. Cost per 1M tokens divides known total cost by total measured/provider tokens and multiplies the result by one million; cost per thread divides known cost by all recognized threads, so either may be understated when coverage is incomplete.

Both reports must display explicit grand totals for threads, token classes, measured/provider tokens, known cost, cost coverage, wall time, and estimated active time. Make `Cost by model by effort` a level-two sibling immediately after the level-two `Cost by model` section. Aggregate by provider, model, model and effort, harness, and root/child folder; include a `Total` row in every aggregate table. In every thread-derived table, expand tokens into `Input`, `Cached`, `Output`, and total `Tokens` columns. Immediately after cost, order metrics as active time, cost per active hour, wall time, cost per wall hour, then cost per thread where rows contain multiple threads. Cost per thread divides known cost by all recognized threads and may be understated when cost coverage is incomplete; omit it from thread detail because it duplicates selected cost. Keep harness-specific reported cost, average tokens, and coverage fields after those shared metrics. Do not add hourly metrics to scan, token-composition, or pricing tables because their rows are not disjoint thread groups. In HTML, make every table column sortable while preserving generated row order on initial load. A newly selected column must sort descending first and then toggle direction; keep unavailable values and `Total` rows at the bottom. Use a fluid full-width layout with minimal padding, compact spacing, and no outer report card. Distinguish measured token usage, derived cost, harness-reported cost, and unavailable cost. State that computed subscription usage is an API-equivalent estimate, not necessarily an invoice. Include source-relative paths and timestamps where available, but do not copy prompts, message content, secrets, or full transcripts into the report.

Place `Cowork coverage` immediately after `Harness surface coverage` and immediately before `Scan coverage`. Show local measured, remote detected, remote measured, and remote detected-but-unavailable states separately. When remote usage is unavailable, preserve all numeric measured totals and add a prominent warning that those totals exclude the unavailable sessions.

When one or more unmatched real models have positive measured/provider tokens, add `Models requiring a pricing update` inside `Pricing coverage`. Aggregate those models by provider and model with thread, input, cached-input, output, and total-token counts. State that known-cost totals exclude them and link `11ai-benchmarks-pricing-update` to `https://ai.rj11.io/skills/11ai-benchmarks-pricing-update`, instructing the user to run it and regenerate the report. Omit synthetic, unknown, and zero-token placeholders from this callout. In HTML, open the link in a new tab with `rel="noopener noreferrer"`. Omit the entire callout when no actionable unmatched model exists.

Immediately below the Markdown H1, place `_powered by [11ai-benchmarks-project](https://ai.rj11.io/skills/11ai-benchmarks-project)._`. In HTML, append a smaller inline span to the main title with the exact text `powered by 11ai-benchmarks-project`; link that text to the same skill URL with `target="_blank"` and `rel="noopener noreferrer"`. Render every level-two and level-three report section as a native `<details>` element with a `<summary>`, omit the `open` attribute so all sections are collapsed by default, and keep the report title, generation message, and signature outside those disclosures. Put the generation message after all report sections and immediately before the signature in both formats.

End every Markdown report with this exact linked signature:

```markdown
_AI benchmarks and analysis by [11ai-benchmarks-project](https://ai.rj11.io/skills/11ai-benchmarks-project)._
```

End the HTML report with the same visible signature and a clickable link whose `href` is exactly `https://ai.rj11.io/skills/11ai-benchmarks-project`. Set `target="_blank"` and `rel="noopener noreferrer"` on that signature link so it opens safely in a new tab.

If this skill extends an existing report, preserve its prior skill attribution
and keep all skill signatures together at the end of the combined report.

Do not modify source transcripts, code, benchmark artifacts, ledgers, reviews, or other files. Do not import or invoke the benchmark accountant; this skill is intentionally standalone.

## Pricing

Use only this skill's bundled `references/pricing.json`. Do not accept a pricing override or read, create, update, or recommend `llm-pricing.json`, `.llm-cost/pricing.json`, or `~/.llm-cost/pricing.json`; legacy files at those paths have no effect. Rates are USD per one million tokens. Select the rate effective at the thread finish timestamp, falling back to its start. If aggregated usage crosses a price boundary, use the main finish-time price for the whole thread. If usage predates known history, use the earliest available rate while directing historical research to the pricing-update skill; if usage is undated, use the latest rate active at report generation. Display each applied period, official-or-detected date basis, and temporal fallback. Keep unmatched or stale prices visible as limitations and never turn them into zero-cost rows. Only `11ai-benchmarks-pricing-update` may research official pricing and update the bundled catalogs.

## Completion checks

Before reporting completion:

- confirm the analyzer exits successfully;
- confirm `<thread-folder>/11ai-benchmarks-project-reports/11ai-benchmarks-project-reports-{datetime}` exists and contains matching `11ai-benchmarks-project-{datetime}.md` and `.html` files;
- confirm the Markdown report places the linked `powered by 11ai-benchmarks-project` attribution immediately below its H1;
- confirm the HTML main title includes the smaller inline linked text `powered by 11ai-benchmarks-project` and that its link safely opens in a new tab;
- confirm both reports display the standardized token breakdown and cost-adjacent metric order, aggregate cost per thread, totals, provider/model/model-by-effort/harness/folder aggregates with grand-total rows, scanned files, recognized threads, known and unknown costs, pricing coverage, historical pricing selection, applied rate periods, temporal fallbacks, limitations, and the exact linked signature above;
- confirm `Cost by model by effort` is a level-two sibling immediately after `Cost by model`;
- confirm `Totals` is a level-two sibling immediately after `Cost by root and child folder`;
- confirm `Harness surface coverage`, `Cowork coverage`, `Scan coverage`, and `Pricing coverage` appear in that order, with `Cowork coverage` immediately before `Scan coverage` and `Scan coverage` immediately before `Pricing coverage`;
- confirm every HTML table header is sortable, initial row order is unchanged, a newly selected column starts descending, and `Total` rows remain pinned last;
- confirm every HTML level-two and level-three report section is a `<details>` disclosure without an `open` attribute, so all sections load collapsed;
- confirm the HTML is fluid and compact without an outer card, and the generation message follows all disclosures immediately before the signature in both formats;
- confirm both identify the bundled catalog version and update date, disclose earliest-available, latest-available, and main-price boundary fallbacks, and conditionally show actionable unmatched models, excluded token totals, and the exact pricing-update link without listing synthetic or zero-token placeholders;
- confirm both distinguish every Cowork coverage state and preserve measured totals while warning about excluded unavailable remote usage;
- rerun once with unchanged inputs, confirm it creates a second timestamped report pair, and ensure report content is stable apart from its generated timestamp;
- report the exact output paths and any model/pricing gaps.
