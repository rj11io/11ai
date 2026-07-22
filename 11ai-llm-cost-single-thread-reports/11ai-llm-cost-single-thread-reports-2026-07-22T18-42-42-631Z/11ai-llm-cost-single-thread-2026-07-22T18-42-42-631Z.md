# Single-Thread LLM Cost Report

_powered by [11ai-llm-cost-single-thread](https://ai.rj11.io/skills/11ai-llm-cost-single-thread)._

## Totals

| Metric | Value |
| --- | --- |
| Threads recognized | 3 |
| Selected root threads | 1 |
| Included sub-agent threads | 2 |
| Threads with measured tokens | 3 / 3 |
| Threads with derived cost | 3 / 3 |
| Threads with reported-only cost | 0 |
| Threads with unavailable or partial cost | 0 |
| Measured/provider tokens | 53,019,763 |
| Known cost | $42.6404 |
| Estimated active time | 3h 11m 11s |
| Cost / active hour | $13.3825 |
| Sum of thread wall time | 101h 32m 59s |
| Cost / wall hour | $0.4199 |
| Cost / thread | $14.2135 |
| Cost coverage | 100.0% |
| Input tokens | 52,740,024 |
| Cached input | 50,989,312 (96.7%) |
| Output tokens | 279,739 |
| Reasoning output | 62,866 (22.5%) |
| Threads with measurable wall time | 3 / 3 |
| Threads with estimated active time | 3 / 3 |
| Active / wall time | 3.1% |

The known-cost total includes derived API-equivalent prices and harness-reported costs. It is not necessarily an invoice, especially for subscription, enterprise, batch, priority, or negotiated usage.

## Scan coverage

| Coverage | Value |
| --- | --- |
| Files visited | 148 |
| JSON/JSONL/NDJSON files inspected | 148 |
| Project JSON-family files | 59 |
| Native session files metadata-checked | 471 |
| Project-associated native sessions | 89 |
| Codex sessions | 54 |
| Claude sessions | 35 |
| Gemini CLI sessions | 0 |
| Cline tasks | 0 |
| Roo Code tasks | 0 |
| OpenCode sessions | 0 |
| Files containing usage records | 89 |
| Malformed records | 0 |
| Pricing catalog | v0/plugins/11ai-llm-costs/skills/11ai-llm-cost-single-thread/references/pricing.json |
| Oldest observed thread | 2026-07-18T14:12:52.124Z |
| Newest observed thread | 2026-07-22T18:42:42.523Z |

## Cost by provider

| Provider | Cost | Input | Cached | Input cost | Output | Output cost | Tokens | Cost / 1M tokens | Threads | Cost / thread | Active time | Cost / active hour | Wall time | Cost / wall hour | Priced | Unpriced |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| openai | $42.6404 | 52,740,024 | 50,989,312 | $34.2482 | 279,739 | $8.3922 | 53,019,763 | $0.8042 | 3 | $14.2135 | 3h 11m 11s | $13.3825 | 101h 32m 59s | $0.4199 | 3 | 0 |
| Total | $42.6404 | 52,740,024 | 50,989,312 | $34.2482 | 279,739 | $8.3922 | 53,019,763 | $0.8042 | 3 | $14.2135 | 3h 11m 11s | $13.3825 | 101h 32m 59s | $0.4199 | 3 | 0 |

## Cost by harness

| Harness | Cost | Input | Cached | Input cost | Output | Output cost | Tokens | Cost / 1M tokens | Threads | Cost / thread | Active time | Cost / active hour | Wall time | Cost / wall hour | Reported-cost sum | Average tokens / thread | Priced | Unpriced |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| codex | $42.6404 | 52,740,024 | 50,989,312 | $34.2482 | 279,739 | $8.3922 | 53,019,763 | $0.8042 | 3 | $14.2135 | 3h 11m 11s | $13.3825 | 101h 32m 59s | $0.4199 | n/a | 17,673,254 | 3 | 0 |
| Total | $42.6404 | 52,740,024 | 50,989,312 | $34.2482 | 279,739 | $8.3922 | 53,019,763 | $0.8042 | 3 | $14.2135 | 3h 11m 11s | $13.3825 | 101h 32m 59s | $0.4199 | n/a | 17,673,254 | 3 | 0 |

## Cost by model

| Provider / model | Cost | Input | Cached | Input cost | Output | Output cost | Tokens | Cost / 1M tokens | Threads | Cost / thread | Active time | Cost / active hour | Wall time | Cost / wall hour |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| openai / gpt-5.6-sol | $42.6404 | 52,740,024 | 50,989,312 | $34.2482 | 279,739 | $8.3922 | 53,019,763 | $0.8042 | 3 | $14.2135 | 3h 11m 11s | $13.3825 | 101h 32m 59s | $0.4199 |
| Total | $42.6404 | 52,740,024 | 50,989,312 | $34.2482 | 279,739 | $8.3922 | 53,019,763 | $0.8042 | 3 | $14.2135 | 3h 11m 11s | $13.3825 | 101h 32m 59s | $0.4199 |

## Cost by model by effort

| Provider / model | Effort | Cost | Input | Cached | Input cost | Output | Output cost | Tokens | Cost / 1M tokens | Threads | Cost / thread | Active time | Cost / active hour | Wall time | Cost / wall hour |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| openai / gpt-5.6-sol | high | $42.6404 | 52,740,024 | 50,989,312 | $34.2482 | 279,739 | $8.3922 | 53,019,763 | $0.8042 | 3 | $14.2135 | 3h 11m 11s | $13.3825 | 101h 32m 59s | $0.4199 |
| Total | All efforts | $42.6404 | 52,740,024 | 50,989,312 | $34.2482 | 279,739 | $8.3922 | 53,019,763 | $0.8042 | 3 | $14.2135 | 3h 11m 11s | $13.3825 | 101h 32m 59s | $0.4199 |

## Cost by root and child folder

The folder is the direct child of the scanned root; files directly in the root are grouped as `.`.

| Folder | Cost | Input | Cached | Input cost | Output | Output cost | Tokens | Cost / 1M tokens | Threads | Cost / thread | Active time | Cost / active hour | Wall time | Cost / wall hour | Priced | Unpriced |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| . | $42.6404 | 52,740,024 | 50,989,312 | $34.2482 | 279,739 | $8.3922 | 53,019,763 | $0.8042 | 3 | $14.2135 | 3h 11m 11s | $13.3825 | 101h 32m 59s | $0.4199 | 3 | 0 |
| Total | $42.6404 | 52,740,024 | 50,989,312 | $34.2482 | 279,739 | $8.3922 | 53,019,763 | $0.8042 | 3 | $14.2135 | 3h 11m 11s | $13.3825 | 101h 32m 59s | $0.4199 | 3 | 0 |

## Token composition

| Token class | Tokens | Share of available total | Meaning |
| --- | --- | --- | --- |
| Uncached input | 1,750,712 | 3.3% | Input billed at the base input rate |
| Cached input read | 50,989,312 | 96.7% | Provider cache-hit tokens |
| 5-minute cache write | 0 | n/a | Anthropic-style ephemeral cache writes |
| 1-hour cache write | 0 | n/a | Anthropic-style extended cache writes |
| Output | 279,739 | 0.5% | Generated output, including reasoning where exposed |
| Reasoning output | 62,866 | 22.5% | Subset of output, never added twice |

## Thread detail

| Thread | Relationship | Parent thread | Source | Provider / model / effort | Input | Cached | Output | Tokens | Selected cost | Active time | Cost / active hour | Wall time | Cost / wall hour | Harness reported | Method |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| openai:b90c8759c7ac9b6e06ed | Selected task | n/a | codex-session/sessions/2026/07/18/rollout-2026-07-18T15-12-51-019f7592-a1a9-7483-9faf-032197cf0ae6.jsonl | openai / gpt-5.6-sol / high | 49,937,891 | 48,338,432 | 253,687 | 50,191,578 | $39.7771 | 2h 43m 10s | $14.6268 | 100h 29m 50s | $0.3958 | n/a | derived |
| openai:86b1f46cabd873732081 | Sub-agent (depth 1) | 019f7592-a1a9-7483-9faf-032197cf0ae6 | codex-session/sessions/2026/07/18/rollout-2026-07-18T15-20-32-019f7599-ab06-72d0-9af7-b1f32ddea450.jsonl | openai / gpt-5.6-sol / high | 1,600,961 | 1,522,176 | 14,832 | 1,615,793 | $1.6000 | 14m 56s | $6.4279 | 36m 11s | $2.6526 | n/a | derived |
| openai:8150af688b89a472d4ee | Sub-agent (depth 1) | 019f7592-a1a9-7483-9faf-032197cf0ae6 | codex-session/sessions/2026/07/18/rollout-2026-07-18T15-29-11-019f75a1-9522-7ff1-ac8d-6e7de5d17c65.jsonl | openai / gpt-5.6-sol / high | 1,201,172 | 1,128,704 | 11,220 | 1,212,392 | $1.2633 | 13m 4s | $5.7977 | 26m 57s | $2.8125 | n/a | derived |

## Pricing coverage

| Status | Threads | Meaning |
| --- | --- | --- |
| Matched | 3 | Model matched and all required token classes were priced |
| Matched but stale | 0 | Matched rate is more than 30 days past verification |
| Partial | 0 | A model matched, but one or more required rates or token classes are unavailable |
| Reported | 0 | Cost came from the harness record rather than local pricing |
| Unmatched | 0 | No model pattern matched the pricing catalog |


### Pricing catalog match detail

| Provider / model | Match | Rates per 1M | Effective | Verified | Notes | Source |
| --- | --- | --- | --- | --- | --- | --- |
| openai / gpt-5.6-sol | gpt-5.6-sol* | input=5, cachedInput=0.5, output=30 | 2026-07-09 | 2026-07-21 | Standard-context rates. Prompts over 272K input tokens use published long-context rates; cache-write charges are not represented by current harness token records. | https://developers.openai.com/api/docs/pricing |

Update the pricing override and rerun when rates are stale or unmatched.

## Anomalies and limitations

- OpenCode database opencode.db could not be read: no such column: cost

## Methodology

- Recursively inspect JSON, JSONL, and NDJSON files below the requested root, excluding dependency, VCS, cache, virtual-environment, and build directories.
- Discover Codex, Claude Code, Gemini CLI, Cline, Roo Code, and OpenCode usage from their native local stores. Include only sessions whose recorded project directory or project hash belongs to the requested root.
- Use the last cumulative Codex token-count event; deduplicate Claude streaming records; aggregate Gemini per-message counters and Cline/Roo API request metrics; read OpenCode's session ledger in read-only mode; aggregate generic usage records by provider and model.
- Preserve provider-native usage semantics: OpenAI cached input is a subset of input, while Anthropic cache buckets are disjoint. Reasoning tokens are a subset of output.
- Read effort only from discoverable request, message, payload, metadata, or settings fields and group Claude usage by model and recorded effort. Normalize Claude Code ultracode to xhigh. Never infer a missing effort from current settings or model defaults; report it as n/a.
- Measure wall time from the first to last distinct timestamp observed for a thread. Estimate active time by summing consecutive timestamp gaps with each gap capped at five minutes; report both as unavailable when fewer than two distinct timestamps exist.
- Starting from the exactly selected task, recursively include Codex sessions whose native metadata identifies the selected task or an included descendant as their parent. Do not infer sub-agent relationships from working directories, timestamps, or fork metadata alone.
- Retain explicitly linked sub-agent sessions even when cumulative token usage is unavailable; show their token and cost fields as unavailable rather than silently omitting the task.
- Calculate cost per wall hour and cost per active hour by dividing known cost by the corresponding summed measurable duration. Report the rate as unavailable when cost or duration is unavailable or duration is zero.
- Calculate cost per thread by dividing known cost by every recognized thread in the row. Incomplete cost coverage can therefore understate this rate. Per-thread detail omits the metric because it would duplicate selected cost.
- Treat missing values as unavailable. Sum known totals for overview coverage, but surface every incomplete or unpriced thread in the detail and limitations sections.
- Do not include prompts, message text, secrets, or raw transcripts in this report. Source-relative paths are the traceability boundary.

> Generated 2026-07-22T18:42:42.631Z · Root: `.` · Prices are USD per 1M tokens unless noted

_LLM token cost analysis by [11ai-llm-cost-single-thread](https://ai.rj11.io/skills/11ai-llm-cost-single-thread)._
