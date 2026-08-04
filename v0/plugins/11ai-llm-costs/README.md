# 11ai LLM Costs

Four skills for single-thread, project-scoped, and machine-wide LLM usage reporting plus provider-verified pricing maintenance across local coding harnesses.

The reporting skills distinguish user-facing surface, underlying runtime, billing mode, usage source, and confidence. They count authoritative local token ledgers once, preserve wrapper provenance, and never convert product credits, quotas, or context snapshots into invented API-token costs.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-llm-cost-global`](./skills/11ai-llm-cost-global/SKILL.md) | Reporting machine-wide LLM usage under `~/Desktop/11ai-llm-cost-global-reports/11ai-llm-cost-global-reports-{datetime}` |
| [`11ai-llm-cost-project`](./skills/11ai-llm-cost-project/SKILL.md) | Analyzing project-attributed LLM usage and writing matching reports under `<current-thread-folder>/11ai-llm-cost-project-reports/11ai-llm-cost-project-reports-{datetime}` |
| [`11ai-llm-cost-single-thread`](./skills/11ai-llm-cost-single-thread/SKILL.md) | Analyzing the active Codex thread or one exact thread selector under `<current-thread-folder>/11ai-llm-cost-single-thread-reports/11ai-llm-cost-single-thread-reports-{datetime}` |
| [`11ai-llm-cost-pricing-update`](./skills/11ai-llm-cost-pricing-update/SKILL.md) | Verifying official provider prices, updating the canonical catalog, and synchronizing all three reporting skills |

All standalone HTML reports use native disclosure controls. Every report section is collapsed by default, while the report title and linked skill signature remain visible.

The three reporting skills always use their synchronized bundled pricing catalog. They do not accept or discover local pricing overrides. When measured usage has no bundled model match, reports leave that cost unavailable and link to `11ai-llm-cost-pricing-update` for a provider-verified catalog refresh.

## Cross-skill maintenance

When fixing or extending one skill, evaluate whether the behavior applies to every sibling skill in this plugin. Apply the equivalent change wherever it is applicable, document intentional exceptions, run the affected skill tests plus the complete plugin test set, and compare newly generated reports with prior reports to confirm existing features and output contracts remain intact.
