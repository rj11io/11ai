---
name: 11ai-llm-cost
description: "Recursively inspect a repository's root and child folders for LLM thread, session, transcript, rollout, and usage records, normalize provider token counters, calculate attributable USD costs, and write a detailed root-level LLM_COST.md report. Use when the user asks for LLM spend, token usage, model cost, thread-cost, AI activity, or recursive cost analysis."
---

# 11ai LLM Cost

Analyze local LLM activity without depending on a benchmark repository, benchmark schema, or external service. The default output is one reproducible `LLM_COST.md` at the scanned root; source transcripts and input files are read-only.

## Contract

Run the bundled analyzer from the target root:

```bash
node <skill>/scripts/analyze-llm-cost.mjs <root-folder>
```

The command writes `<root-folder>/LLM_COST.md`. It accepts:

- `--pricing <file>` to use a repository-specific pricing catalog;
- `--output <file>` only when the user explicitly requests a different report path.

The analyzer reads JSON, JSONL, and NDJSON files recursively, while skipping dependency, VCS, cache, and build directories. It only includes a file in the report when it contains a recognized usage record. Never scan the user's home transcript directories unless they are inside the requested root.

## Workflow

1. Establish the exact root and confirm the output path is inside it unless the user asked otherwise.
2. Run the analyzer. Preserve malformed, ambiguous, unpriced, and reported-only records in the report's coverage and limitations sections rather than silently dropping them.
3. Review the generated `LLM_COST.md` for the executive summary, provider/model rollups, root-versus-child-folder rollups, token-class detail, per-thread table, pricing coverage, anomalies, and methodology.
4. If a model is unmatched or pricing is older than 30 days, verify the provider's official pricing page. Prefer a repository-local `llm-pricing.json` or `.llm-cost/pricing.json` override so the report remains reproducible; never invent a rate from memory.
5. Rerun the analyzer after pricing or input changes. It is idempotent and does not edit transcripts.

## Supported usage shapes

The bundled parser handles:

- Codex session JSONL: final cumulative `token_count` usage and the latest model/effort context;
- Claude session JSONL: assistant usage, cache creation/read buckets, and per-model grouping;
- OpenAI-style response usage: `input_tokens` or `prompt_tokens`, cached-input details, output/completion tokens, and reasoning details;
- Anthropic-style usage objects and generic `usage`, `token_usage`, or `tokenUsage` records;
- harness-reported `cost`, `cost_usd`, or `total_cost_usd` when token pricing is unavailable.

Provider-native raw usage is retained in the analyzer's in-memory record and normalized with these semantics:

- cached input is a subset of input for OpenAI-style counters;
- Claude-style uncached input, cache writes, and cache reads are disjoint;
- reasoning output is a subset of output;
- missing data is `n/a`, never zero.

## Report requirements

The report must distinguish measured token usage, derived cost, harness-reported cost, and unavailable cost. State that computed subscription usage is an API-equivalent estimate, not necessarily an invoice. Include source-relative paths and timestamps where available, but do not copy prompts, message content, secrets, or full transcripts into the report.

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
- confirm `LLM_COST.md` exists at the requested root;
- confirm the report states scanned files, recognized threads, known and unknown costs, pricing coverage, and limitations;
- rerun once with unchanged inputs and ensure the report is stable apart from its generated timestamp;
- report the exact output path and any model/pricing gaps.
