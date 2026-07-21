---
name: 11ai-llm-cost-project
description: "Inspect a repository plus its project-attributed Codex, Claude Code, Gemini CLI, Cline, Roo Code, and OpenCode records; normalize provider token counters, calculate attributable USD costs, measure wall and estimated active time, and write matching timestamped Markdown and HTML reports under the current thread folder's 11ai-llm-cost-project-reports directory. Use for project LLM spend, token usage, model and effort cost, thread timing, AI activity, or recursive cost analysis."
---

# 11ai LLM Cost Project

Analyze local LLM activity without depending on a benchmark repository, benchmark schema, or external service. Write every default report package beneath the persistent `11ai-llm-cost-project-reports` folder at the current thread's working-directory root; keep source transcripts and input files read-only.

## Contract

Run the bundled analyzer from the current thread's folder root. The optional positional folder is the project to analyze and does not change the default report destination:

```bash
node <skill>/scripts/analyze-llm-cost-project.mjs <root-folder>
```

The command treats `process.cwd()` as the current thread folder and creates this structure if needed. `{datetime}` is the UTC ISO timestamp for the run with colons and the decimal point replaced by hyphens:

```text
<thread-folder>/11ai-llm-cost-project-reports/
└── 11ai-llm-cost-project-reports-{datetime}/
    ├── 11ai-llm-cost-project-{datetime}.md
    └── 11ai-llm-cost-project-{datetime}.html
```

Generate both files from the same analysis. The HTML must be self-contained with embedded styling and no network dependency. The timestamped default package uses exclusive file creation so it never overwrites existing reports. It accepts:

- `--pricing <file>` to use a repository-specific pricing catalog;
- `--output <file>` only when the user explicitly requests a different Markdown report path; the analyzer writes the matching HTML sibling automatically;
- `--codex-home <dir>` or `CODEX_HOME` to override the native Codex data directory;
- `--claude-home <dir>` or `CLAUDE_CONFIG_DIR` to override the native Claude Code data directory;
- `--gemini-home <dir>` or `GEMINI_CLI_HOME` to override Gemini CLI discovery (`--gemini-home` points directly to `.gemini`);
- `--cline-tasks <dir>` and `--roo-tasks <dir>` to override their task roots;
- `--opencode-db <file>` to override OpenCode database discovery;
- `--thread <id-or-source>` to restrict the report to one exact logical thread, report thread ID, source label, source filename, or transcript path;
- `--project-only` to disable native session discovery and inspect only the requested root.

The analyzer reads JSON, JSONL, and NDJSON files recursively, while skipping dependency, VCS, cache, and build directories. It also discovers six harnesses from their native stores. It includes a native record only when its working directory, Gemini project hash/directory, task metadata, or OpenCode session directory associates it with the requested root. It only reports files containing recognized usage.

Read [references/harnesses.md](references/harnesses.md) when native discovery, version compatibility, token semantics, or an override path needs explanation.

## Workflow

1. Establish both the current thread folder (`process.cwd()`) and the project root to analyze. Resolve native transcript homes from CLI options, harness environment variables, or the current user's home directory, and use `<thread-folder>/11ai-llm-cost-project-reports/11ai-llm-cost-project-reports-{datetime}` unless the user explicitly requested another output path.
2. Run the analyzer. Preserve malformed, ambiguous, unpriced, and reported-only records in the report's coverage and limitations sections rather than silently dropping them.
3. Review both generated files for explicit totals, provider/model/harness aggregates, root-versus-child-folder aggregates, `Cost by model by effort`, token-class detail, wall time, estimated active time, per-thread detail, pricing coverage, anomalies, and methodology. Confirm every HTML report section is a native collapsed disclosure control on first load.
4. If a model is unmatched or pricing is older than 30 days, verify the provider's official pricing page. Prefer a repository-local `llm-pricing.json` or `.llm-cost/pricing.json` override so the report remains reproducible; never invent a rate from memory.
5. Rerun the analyzer after pricing or input changes. It is idempotent and does not edit transcripts.

## Supported usage shapes

The bundled parser handles:

- Codex session JSONL: final cumulative `token_count` usage and the latest model/effort context;
- Claude session JSONL: assistant usage, cache creation/read buckets, and per-model/per-effort grouping;
- Claude effort: recorded request/configuration fields when present, with `ultracode` normalized to `xhigh`. Native transcript omissions remain `n/a`; never rewrite missing historical effort as the current setting or a model default;
- Gemini CLI chat JSONL: per-response input, output, cached, thought, tool, and total counters;
- Cline and Roo Code task `ui_messages.json`: API request, deleted-request, and subagent usage counters plus harness-reported cost;
- OpenCode SQLite session ledgers: model/provider, workspace, cost, uncached input, output, reasoning, cache-read, and cache-write counters;
- OpenAI-style response usage: `input_tokens` or `prompt_tokens`, cached-input details, output/completion tokens, and reasoning details;
- Anthropic-style usage objects and generic `usage`, `token_usage`, or `tokenUsage` records;
- harness-reported `cost`, `cost_usd`, or `total_cost_usd` when token pricing is unavailable.

Generic harnesses remain compatible by placing or exporting a supported JSON usage shape within the requested root.

Provider-native raw usage is retained in the analyzer's in-memory record and normalized with these semantics:

- cached input is a subset of input for OpenAI-style counters;
- Claude-style uncached input, cache writes, and cache reads are disjoint;
- reasoning output is a subset of output;
- missing data is `n/a`, never zero.

## Timing

Measure wall time from the first to last distinct timestamp observed for a thread. Estimate active time by summing consecutive timestamp gaps while capping each gap at five minutes. Report both as `n/a` when fewer than two distinct timestamps exist. Treat active time as a reproducible estimate of interaction time, not foreground-process telemetry.

## Report requirements

For Cost by tables, the following specific layout supersedes any general metric-order guidance below: put total `Cost` immediately after the provider/model/effort/folder identity columns, then use `Input`, `Cached`, `Input cost`, `Output`, `Output cost`, total `Tokens`, `Cost / 1M tokens`, `Threads`, `Cost / thread`, active time, cost per active hour, wall time, and cost per wall hour. Input cost includes uncached input, cache reads, and supported cache-write classes. Cost per 1M tokens divides known total cost by total measured/provider tokens and multiplies the result by one million; cost per thread divides known cost by all recognized threads, so either may be understated when coverage is incomplete.

Both reports must display explicit grand totals for threads, token classes, measured/provider tokens, known cost, cost coverage, wall time, and estimated active time. Make `Cost by model by effort` a level-two sibling immediately after the level-two `Cost by model` section. Aggregate by provider, model, model and effort, harness, and root/child folder; include a `Total` row in every aggregate table. In every thread-derived table, expand tokens into `Input`, `Cached`, `Output`, and total `Tokens` columns. Immediately after cost, order metrics as active time, cost per active hour, wall time, cost per wall hour, then cost per thread where rows contain multiple threads. Cost per thread divides known cost by all recognized threads and may be understated when cost coverage is incomplete; omit it from thread detail because it duplicates selected cost. Keep harness-specific reported cost, average tokens, and coverage fields after those shared metrics. Do not add hourly metrics to scan, token-composition, or pricing tables because their rows are not disjoint thread groups. In HTML, make every table column sortable while preserving generated row order on initial load. A newly selected column must sort descending first and then toggle direction; keep unavailable values and `Total` rows at the bottom. Use a fluid full-width layout with minimal padding, compact spacing, and no outer report card. Distinguish measured token usage, derived cost, harness-reported cost, and unavailable cost. State that computed subscription usage is an API-equivalent estimate, not necessarily an invoice. Include source-relative paths and timestamps where available, but do not copy prompts, message content, secrets, or full transcripts into the report.

In HTML, render every level-two and level-three report section as a native `<details>` element with a `<summary>`, omit the `open` attribute so all sections are collapsed by default, and keep the report title, generation message, and signature outside those disclosures. Put the generation message after all report sections and immediately before the signature in both formats.

End every Markdown report with this exact linked signature:

```markdown
_LLM token cost analysis by [11ai-llm-cost-project](https://ai.rj11.io/skills/11ai-llm-cost-project)._
```

End the HTML report with the same visible signature and a clickable link whose `href` is exactly `https://ai.rj11.io/skills/11ai-llm-cost-project`. Set `target="_blank"` and `rel="noopener noreferrer"` on that signature link so it opens safely in a new tab.

If this skill extends an existing report, preserve its prior skill attribution
and keep all skill signatures together at the end of the combined report.

Do not modify source transcripts, code, benchmark artifacts, ledgers, reviews, or other files. Do not import or invoke the benchmark accountant; this skill is intentionally standalone.

## Pricing

Pricing lookup order is:

1. explicit `--pricing` file;
2. `<root>/llm-pricing.json`;
3. `<root>/.llm-cost/pricing.json`;
4. this skill's `references/pricing.json`.

Rates are USD per one million tokens. Every priced thread must show the matched model pattern, rate source, effective date, and verification date. Keep unmatched or stale prices visible as limitations and do not turn them into zero-cost rows.

## Completion checks

Before reporting completion:

- confirm the analyzer exits successfully;
- confirm `<thread-folder>/11ai-llm-cost-project-reports/11ai-llm-cost-project-reports-{datetime}` exists and contains matching `11ai-llm-cost-project-{datetime}.md` and `.html` files;
- confirm both reports display the standardized token breakdown and cost-adjacent metric order, aggregate cost per thread, totals, provider/model/model-by-effort/harness/folder aggregates with grand-total rows, scanned files, recognized threads, known and unknown costs, pricing coverage, limitations, and the exact linked signature above;
- confirm `Cost by model by effort` is a level-two sibling immediately after `Cost by model`;
- confirm every HTML table header is sortable, initial row order is unchanged, a newly selected column starts descending, and `Total` rows remain pinned last;
- confirm every HTML level-two and level-three report section is a `<details>` disclosure without an `open` attribute, so all sections load collapsed;
- confirm the HTML is fluid and compact without an outer card, and the generation message follows all disclosures immediately before the signature in both formats;
- rerun once with unchanged inputs, confirm it creates a second timestamped report pair, and ensure report content is stable apart from its generated timestamp;
- report the exact output paths and any model/pricing gaps.
