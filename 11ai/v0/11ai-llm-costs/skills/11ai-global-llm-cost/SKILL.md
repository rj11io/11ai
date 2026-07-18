---
name: 11ai-global-llm-cost
description: "Inspect all readable Codex, Claude Code, Gemini CLI, Cline, Roo Code, and OpenCode usage stores across the machine; normalize token counters, calculate attributable USD costs, and write Markdown and standalone HTML reports under the Desktop's 11ai-global-llm-cost-reports folder with All time, Year to date, Month to date, and Past 7 days sections. Use for global LLM spend, token usage, model cost, AI activity, or cross-project analysis."
---

# 11ai Global LLM Cost

Analyze machine-wide LLM activity without a project boundary, external service, or benchmark schema. Write every default report package beneath the persistent `11ai-global-llm-cost-reports` folder on the user's Desktop; keep source transcripts, task stores, and ledgers read-only.

## Contract

Run the bundled analyzer:

```bash
node <skill>/scripts/analyze-global-llm-cost.mjs
```

The command creates this structure if needed, where `{datetime}` is the UTC ISO timestamp with colons and the decimal point replaced by hyphens:

```text
~/Desktop/11ai-global-llm-cost-reports/
└── 11ai-global-llm-cost-reports-{datetime}/
    ├── 11ai-global-llm-cost-{datetime}.md
    └── 11ai-global-llm-cost-{datetime}.html
```

Generate both reports from the same analysis so their facts, tables, ordering, limitations, and signature agree. Make the HTML report self-contained with embedded styling and no network dependency. Render every level-two and level-three HTML report section as a native disclosure that is collapsed by default. The timestamped default package uses exclusive file creation and never overwrites an existing report. The command accepts:

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

1. Confirm that the request is machine-wide. Use `~/Desktop/11ai-global-llm-cost-reports/11ai-global-llm-cost-reports-{datetime}` for default output and use home overrides only for deterministic fixtures or an intentionally restricted scan.
2. Run the analyzer. Preserve malformed, ambiguous, unpriced, reported-only, and undated records in coverage or limitations rather than silently dropping them.
3. Review both generated files for all four period sections plus scan coverage, explicit totals, provider/model/harness/workspace aggregates, token-class detail, per-thread tables, pricing coverage, anomalies, and methodology.
4. If a model is unmatched or pricing is older than 30 days, verify the provider's official pricing page. Prefer an explicit pricing override or the machine-level `~/.llm-cost/pricing.json` so the report remains reproducible; never invent a rate from memory.
5. Rerun after pricing or input changes. The analyzer does not edit transcripts.

## Period attribution

Render these top-level report sections in this order:

1. `All time`
2. `Year to date`
3. `Month to date`
4. `Past 7 days`

Attribute a whole thread to its finish timestamp, falling back to its start timestamp. Include undated threads only in `All time` and flag them as limitations. Use the machine's local calendar boundaries for year-to-date and month-to-date. Treat `Past 7 days` as a rolling 168-hour window ending at report generation time.

## Supported usage shapes

The bundled parser handles:

- Codex session JSONL: final cumulative `token_count` usage and the latest model/effort context;
- Claude session JSONL: assistant usage, cache creation/read buckets, and per-model grouping;
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

## Report requirements

Within every period, display explicit grand totals for threads, token classes, measured/provider tokens, known cost, and cost coverage. Aggregate by provider, model, harness, and workspace; include a `Total` row in every aggregate table; and show average tokens per thread plus average known cost per priced thread in the harness aggregate. Distinguish measured token usage, derived cost, harness-reported cost, and unavailable cost. State that computed subscription usage is an API-equivalent estimate, not necessarily an invoice. Include normalized source labels, workspace paths, and timestamps where available, but do not copy prompts, message content, secrets, or full transcripts.

In HTML, render every level-two and level-three report section as a native `<details>` element with a `<summary>`, omit the `open` attribute so all sections are collapsed by default, and keep the report title and signature outside those disclosures.

End the Markdown report with this exact linked signature:

```markdown
_LLM token cost analysis by [11ai-global-llm-cost](https://ai.rj11.io/skills/11ai-global-llm-cost)._
```

End the HTML report with the same visible signature and a clickable link whose `href` is exactly `https://ai.rj11.io/skills/11ai-global-llm-cost`.

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
- confirm `~/Desktop/11ai-global-llm-cost-reports/11ai-global-llm-cost-reports-{datetime}` exists unless the user requested an override;
- confirm the timestamped package contains same-named `.md` and `.html` reports;
- confirm both reports include `All time`, `Year to date`, `Month to date`, and `Past 7 days` in that order;
- confirm every period in both formats displays totals and provider/model/harness/workspace aggregates with grand-total rows;
- confirm every HTML level-two and level-three report section is a `<details>` disclosure without an `open` attribute, so all sections load collapsed;
- confirm both state inspected files, recognized threads, known and unknown costs, pricing coverage, and limitations;
- confirm both end with a signature linking to `https://ai.rj11.io/skills/11ai-global-llm-cost`;
- rerun once with unchanged inputs, confirm a second timestamped report package is created in the reports folder, and ensure both formats are stable apart from generated timestamps;
- report the exact folder and file paths, unreadable scope, and model/pricing gaps.
