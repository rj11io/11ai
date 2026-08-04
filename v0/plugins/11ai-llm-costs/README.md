# 11ai LLM Costs

Four skills for single-thread, project-scoped, and machine-wide LLM usage reporting plus provider-verified pricing maintenance across local coding harnesses.

The reporting skills distinguish user-facing surface, underlying runtime, billing mode, usage source, and confidence. They count authoritative local token ledgers once, preserve wrapper provenance, and never convert product credits, quotas, or context snapshots into invented API-token costs.

Claude reporting groups local Cowork root and sub-agent transcripts into logical sessions, reports distinct sub-agent runs, detects remote Cowork session indexes, honors declared workspace metadata in supplemental records, and joins Claude Desktop Code metadata to existing transcripts without counting usage twice. Reports keep measured totals numeric while warning that detected remote sessions without readable usage are excluded rather than treated as zero.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-llm-cost-global`](./skills/11ai-llm-cost-global/SKILL.md) | Reporting machine-wide LLM usage under `~/Desktop/11ai-llm-cost-global-reports/11ai-llm-cost-global-reports-{datetime}` |
| [`11ai-llm-cost-project`](./skills/11ai-llm-cost-project/SKILL.md) | Analyzing project-attributed LLM usage and writing matching reports under `<current-thread-folder>/11ai-llm-cost-project-reports/11ai-llm-cost-project-reports-{datetime}` |
| [`11ai-llm-cost-single-thread`](./skills/11ai-llm-cost-single-thread/SKILL.md) | Analyzing the active Codex thread or one exact thread selector under `<current-thread-folder>/11ai-llm-cost-single-thread-reports/11ai-llm-cost-single-thread-reports-{datetime}` |
| [`11ai-llm-cost-pricing-update`](./skills/11ai-llm-cost-pricing-update/SKILL.md) | Verifying official provider prices, updating the canonical catalog, and synchronizing all three reporting skills |

All standalone HTML reports use native disclosure controls. Every report section is collapsed by default, while the report title and linked skill signature remain visible.

The three reporting skills always use their synchronized bundled pricing catalog. They do not accept or discover local pricing overrides. Catalog version 3 preserves model price histories and applies the rate effective at each thread's attribution time. Boundary-spanning aggregates use their finish-time main price; usage older than known history uses the earliest available rate while the pricing-update workflow searches official historical sources. Reports expose every temporal fallback. When measured usage has no bundled model match, reports leave that cost unavailable and link to `11ai-llm-cost-pricing-update` for a provider-verified catalog refresh.

## Cross-skill maintenance

When fixing or extending one skill, evaluate whether the behavior applies to every sibling skill in this plugin. Apply the equivalent change wherever it is applicable, document intentional exceptions, run the affected skill tests plus the complete plugin test set, and compare newly generated reports with prior reports to confirm existing features and output contracts remain intact.

Treat report comparison as a required regression gate for every skill-behavior change:

1. Before editing, identify older Markdown and HTML reports for every affected reporting scope. Global report baselines are stored under `~/Desktop/11ai-llm-cost-global-reports/`.
2. If an affected scope has no older report, generate and preserve a baseline with the unmodified skill before making the change.
3. After editing, generate the same reports and compare them with their baselines. Verify that existing sections, tables, thread rows, totals, pricing states, warnings, and HTML interactions were not lost or broken; explain any intentional difference.
4. Do not consider the behavior change complete until both the automated tests and the report regression comparison pass.
5. In the final handoff, tell the user exactly where to inspect the new behavior. Link the newly generated reports and name the relevant sections, tables, rows, or visible states.
6. End the handoff with a conventional commit-style summary of the latest changes.
