---
name: 11ai-llm-cost
description: "Inspect a repository plus its project-attributed Codex, Claude Code, Gemini CLI, Cline, Roo Code, and OpenCode records; normalize provider token counters, calculate attributable USD costs, and write a timestamped root-level Markdown report. Use for project LLM spend, token usage, model cost, thread cost, AI activity, or recursive cost analysis."
---

# 11ai LLM Cost

Analyze local LLM activity without depending on a benchmark repository, benchmark schema, or external service. Write each default report as a new timestamped Markdown file at the scanned root; keep source transcripts and input files read-only.

## Contract

Run the bundled analyzer from the target root:

```bash
node <skill>/scripts/analyze-llm-cost.mjs <root-folder>
```

The command writes `<root-folder>/11ai-llm-cost-{datetime}.md`, where `{datetime}` is the UTC ISO timestamp for the run with colons and the decimal point replaced by hyphens (for example, `11ai-llm-cost-2026-07-18T14-30-45-123Z.md`). The default write is exclusive so it never overwrites an existing report. It accepts:

- `--pricing <file>` to use a repository-specific pricing catalog;
- `--output <file>` only when the user explicitly requests a different report path;
- `--codex-home <dir>` or `CODEX_HOME` to override the native Codex data directory;
- `--claude-home <dir>` or `CLAUDE_CONFIG_DIR` to override the native Claude Code data directory;
- `--gemini-home <dir>` or `GEMINI_CLI_HOME` to override Gemini CLI discovery (`--gemini-home` points directly to `.gemini`);
- `--cline-tasks <dir>` and `--roo-tasks <dir>` to override their task roots;
- `--opencode-db <file>` to override OpenCode database discovery;
- `--project-only` to disable native session discovery and inspect only the requested root.

The analyzer reads JSON, JSONL, and NDJSON files recursively, while skipping dependency, VCS, cache, and build directories. It also discovers six harnesses from their native stores. It includes a native record only when its working directory, Gemini project hash/directory, task metadata, or OpenCode session directory associates it with the requested root. It only reports files containing recognized usage.

Read [references/harnesses.md](references/harnesses.md) when native discovery, version compatibility, token semantics, or an override path needs explanation.

## Workflow

1. Establish the exact root, resolve native transcript homes from CLI options, harness environment variables, or the current user's home directory, and confirm the output path is inside the root unless the user asked otherwise.
2. Run the analyzer. Preserve malformed, ambiguous, unpriced, and reported-only records in the report's coverage and limitations sections rather than silently dropping them.
3. Review the generated `11ai-llm-cost-{datetime}.md` for explicit totals, provider/model/harness aggregates, root-versus-child-folder aggregates, token-class detail, per-thread table, pricing coverage, anomalies, and methodology.
4. If a model is unmatched or pricing is older than 30 days, verify the provider's official pricing page. Prefer a repository-local `llm-pricing.json` or `.llm-cost/pricing.json` override so the report remains reproducible; never invent a rate from memory.
5. Rerun the analyzer after pricing or input changes. It is idempotent and does not edit transcripts.

## Supported usage shapes

The bundled parser handles:

- Codex session JSONL: final cumulative `token_count` usage and the latest model/effort context;
- Claude session JSONL: assistant usage, cache creation/read buckets, and per-model grouping;
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

## Report requirements

The report must display explicit grand totals for threads, token classes, measured/provider tokens, known cost, and cost coverage. It must aggregate by provider, model, harness, and root/child folder; include a `Total` row in every aggregate table; and show average tokens per thread plus average known cost per priced thread in the harness aggregate. Distinguish measured token usage, derived cost, harness-reported cost, and unavailable cost. State that computed subscription usage is an API-equivalent estimate, not necessarily an invoice. Include source-relative paths and timestamps where available, but do not copy prompts, message content, secrets, or full transcripts into the report.

End every Markdown report with this exact linked signature:

```markdown
_LLM token cost analysis by [11ai-llm-cost](https://ai.rj11.io/skills/11ai-llm-cost)._
```

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
- confirm a new `11ai-llm-cost-{datetime}.md` exists at the requested root;
- confirm the report displays totals, provider/model/harness/folder aggregates with grand-total rows, scanned files, recognized threads, known and unknown costs, pricing coverage, limitations, and the exact linked signature above;
- rerun once with unchanged inputs, confirm it creates a second timestamped report, and ensure report content is stable apart from its generated timestamp;
- report the exact output path and any model/pricing gaps.
