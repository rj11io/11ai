# 11ai-benchmarks

Five skills: single-thread, project-scoped, and machine-wide LLM usage reporting, provider-verified pricing maintenance, and a FAQ that answers questions about all of them — across local coding harnesses.

The reporting skills distinguish user-facing surface, underlying runtime, billing mode, usage source, and confidence. They count authoritative local token ledgers once, preserve wrapper provenance, and never convert product credits, quotas, or context snapshots into invented API-token costs.

Claude reporting groups local Cowork root and sub-agent transcripts into logical sessions, reports distinct sub-agent runs, detects remote Cowork session indexes, honors declared workspace metadata in supplemental records, and joins Claude Desktop Code metadata to existing transcripts without counting usage twice. Reports keep measured totals numeric while warning that detected remote sessions without readable usage are excluded rather than treated as zero.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-benchmarks-machine`](./skills/11ai-benchmarks-machine/SKILL.md) | Reporting machine-wide LLM usage under `~/Desktop/11ai-benchmarks-machine-reports/11ai-benchmarks-machine-reports-{datetime}` |
| [`11ai-benchmarks-project`](./skills/11ai-benchmarks-project/SKILL.md) | Analyzing project-attributed LLM usage and writing matching reports under `<current-thread-folder>/11ai-benchmarks-project-reports/11ai-benchmarks-project-reports-{datetime}` |
| [`11ai-benchmarks-single-thread`](./skills/11ai-benchmarks-single-thread/SKILL.md) | Analyzing the active Codex thread or one exact thread selector under `<current-thread-folder>/11ai-benchmarks-single-thread-reports/11ai-benchmarks-single-thread-reports-{datetime}` |
| [`11ai-benchmarks-pricing-update`](./skills/11ai-benchmarks-pricing-update/SKILL.md) | Verifying official provider prices, updating the canonical catalog, and synchronizing all three reporting skills |
| [`11ai-benchmarks-faq`](./skills/11ai-benchmarks-faq/SKILL.md) | Answering questions about how these skills behave, what report sections mean, and which skill to run |

All standalone HTML reports use native disclosure controls. Every report section is collapsed by default, while the report title and linked skill signature remain visible.

The three reporting skills always use their synchronized bundled pricing catalog. They do not accept or discover local pricing overrides. Catalog version 3 preserves model price histories and applies the rate effective at each thread's attribution time. Boundary-spanning aggregates use their finish-time main price; usage older than known history uses the earliest available rate while the pricing-update workflow searches official historical sources. Reports expose every temporal fallback. When measured usage has no bundled model match, reports leave that cost unavailable and link to `11ai-benchmarks-pricing-update` for a provider-verified catalog refresh.

## Reporting principles

Show as many datapoints as possible. Table width is never a reason to drop a column: when a metric is available per row, it belongs in the table, and unavailable values render as `n/a` rather than being omitted. A harness is the combination of surface, runtime, store, and billing mode, and the by-harness tables break those out as separate columns together with usage source and confidence. HTML reports open dark with a light toggle, mirror the 11blog design tokens and embedded fonts, and make rows highlightable and columns resizable without persisting any of it across reloads.

## Cross-skill maintenance

The three reporting skills share one analyzer core: each carries a byte-identical copy of `scripts/benchmarks-core.mjs` and `scripts/harness-support.mjs`, with only scope-specific code living in the per-skill analyzer scripts. Edit shared behavior in the `11ai-benchmarks-project` copy first, then run `node v0/scripts/check-benchmarks-drift.mjs --write` from the repository root to copy the shared files to the siblings; the same script without `--write` (also run by `validate-skills`) fails on any divergence, including divergence between same-named analyzer functions that are not allowlisted as intentionally scope-specific.

When fixing or extending one skill, evaluate whether the behavior applies to every sibling skill in this plugin. Apply the equivalent change wherever it is applicable, document intentional exceptions, run the affected skill tests plus the complete plugin test set, and compare newly generated reports with prior reports to confirm existing features and output contracts remain intact. Confirm the `11ai-benchmarks-faq` routing rows and comparison table still hold for every section you touched; the validator checks its sources and anchors, but only you can tell when an unchanged heading now describes changed behavior.

Treat report comparison as a required regression gate for every skill-behavior change:

1. Before editing, identify older Markdown and HTML reports for every affected reporting scope. Global report baselines are stored under `~/Desktop/11ai-benchmarks-machine-reports/`.
2. If an affected scope has no older report, generate and preserve a baseline with the unmodified skill before making the change.
3. After editing, generate the same reports and compare them with their baselines. Verify that existing sections, tables, thread rows, totals, pricing states, warnings, and HTML interactions were not lost or broken; explain any intentional difference.
4. Do not consider the behavior change complete until both the automated tests and the report regression comparison pass.
5. In the final handoff, tell the user exactly where to inspect the new behavior. Link the newly generated reports and name the relevant sections, tables, rows, or visible states.
6. End the handoff with a conventional commit-style summary of the latest changes.
