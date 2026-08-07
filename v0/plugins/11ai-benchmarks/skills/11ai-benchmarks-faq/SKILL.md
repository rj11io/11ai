---
name: 11ai-benchmarks-faq
description: "Answer questions about the 11ai-benchmarks plugin: which reporting skill fits a job, how the analyzers discover and classify harness usage, how pricing, timing, and cost states are derived, what each report section and warning means, and how the skills are maintained. Routes every question to the plugin's own contracts, references, scripts, and tests and answers with a citation. Use when a user asks how the benchmark skills behave, why a report shows a value, which benchmarks skill to run, or what a report section means."
---
# 11ai Benchmarks FAQ

Answer questions about this plugin by routing them to the plugin's own files, not from
memory. This skill owns no behavior: the sibling skills' contracts, references, scripts,
and tests are the truth, and the routing table below says which file answers which
question. The only content this skill owns is the comparison table and the glossary.

## Answer contract

- Read the routed source before answering. Never answer a behavior question from memory.
- Cite the file, and the section when one is named, in every answer.
- If the sources do not cover the question, say so and name the skill that owns the
  behavior. Do not guess.
- Escalate tiers when the question demands it: a question about what a skill promises
  stops at its contract; a question about what exactly happens in an edge case goes to
  the tests.
- If a routed sibling file is missing because only this skill was installed, read the
  same skill's page at https://ai.rj11.io/skills/ followed by the skill name, or the
  rj11io/11ai repository on GitHub, instead.

## Ground-truth ladder

| Tier | Meaning | Sources |
| --- | --- | --- |
| contract | What a skill promises | Sibling SKILL.md files |
| reference | Coverage tables and catalogs | Files under sibling references directories |
| behavior | What actually happens, asserted | Sibling scripts and tests |

## Covered skills

- `11ai-benchmarks-machine` — machine-wide usage, cost, and timing reports.
- `11ai-benchmarks-project` — reports for one repository and its attributed threads.
- `11ai-benchmarks-single-thread` — a report for one exact thread and its sub-agents.
- `11ai-benchmarks-pricing-update` — maintains the bundled pricing catalogs; writes no report.

## Which skill do I want?

| Skill | Scope | Input | Output |
| --- | --- | --- | --- |
| 11ai-benchmarks-single-thread | One thread plus its spawned sub-agent threads | A thread selector, or the active thread | Markdown and HTML report package under the thread folder |
| 11ai-benchmarks-project | One repository and every thread attributed to it | The repository root folder | Markdown and HTML report package under the thread folder |
| 11ai-benchmarks-machine | Every readable usage store on the machine | Nothing | Markdown and HTML report package on the Desktop |
| 11ai-benchmarks-pricing-update | The bundled pricing catalogs of the three reporting skills | Official provider pricing pages | Updated, synchronized catalog copies |

## Routing table

Every row: a question, the file that answers it, the text to find in that file, and its
tier on the ground-truth ladder.

### Choosing and running

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| What does the machine-wide skill promise end to end? | `../11ai-benchmarks-machine/SKILL.md` | "## Contract" | contract |
| What does the project skill promise end to end? | `../11ai-benchmarks-project/SKILL.md` | "## Contract" | contract |
| What does the single-thread skill promise end to end? | `../11ai-benchmarks-single-thread/SKILL.md` | "## Contract" | contract |
| What does the pricing-update skill actually do? | `../11ai-benchmarks-pricing-update/SKILL.md` | "## Workflow" | contract |
| How do I run the machine-wide analyzer and which flags exist? | `../11ai-benchmarks-machine/SKILL.md` | "## Contract" | contract |
| How do I select one exact thread to analyze? | `../11ai-benchmarks-single-thread/SKILL.md` | "## Workflow" | contract |
| How do I include exported usage from an unsupported harness? | `../11ai-benchmarks-machine/SKILL.md` | "--include" | contract |
| What checks must pass before a run counts as complete? | `../11ai-benchmarks-machine/SKILL.md` | "## Completion checks" | contract |

### Harness coverage and classification

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| Which coding harnesses are covered and where do their usage stores live? | `../11ai-benchmarks-machine/references/harnesses.md` | "# Native harness stores" | reference |
| How are user-facing surface and underlying runtime told apart? | `../11ai-benchmarks-machine/references/harnesses.md` | "## Surface and billing semantics" | reference |
| Which usage shapes count as authoritative, and which never become costs? | `../11ai-benchmarks-machine/SKILL.md` | "## Supported usage shapes" | contract |
| How does declared workspace metadata attribute usage to a project? | `../11ai-benchmarks-machine/references/harnesses.md` | "## Supplemental workspace attribution" | reference |

### Cowork sessions and sub-agents

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| How are Cowork root and sub-agent transcripts grouped into sessions? | `../11ai-benchmarks-machine/references/harnesses.md` | "## Claude Cowork" | reference |
| What happens to detected remote Cowork sessions without readable usage? | `../11ai-benchmarks-machine/scripts/analyze-llm-cost-global.mjs` | "remote Cowork" | behavior |
| Where do measured Cowork sessions and sub-agent runs show up in a report? | `../11ai-benchmarks-machine/scripts/analyze-llm-cost-global.mjs` | "Cowork coverage" | behavior |
| Is Claude usage ever counted twice across Desktop, Cowork, and CLI surfaces? | `../11ai-benchmarks-machine/references/harnesses.md` | "Claude Desktop metadata" | reference |

### Pricing and cost states

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| Where do prices come from, and can I override them locally? | `../11ai-benchmarks-machine/SKILL.md` | "## Pricing" | contract |
| Which rate applies when usage predates the known price history? | `../11ai-benchmarks-pricing-update/tests/pricing-history.test.mjs` | "uses the earliest available rate when usage predates known history" | behavior |
| Which rate applies when a thread crosses a price-change boundary? | `../11ai-benchmarks-pricing-update/tests/pricing-history.test.mjs` | "uses the main price at the finish date when an aggregated thread crosses a boundary" | behavior |
| Which rate applies when usage has no date at all? | `../11ai-benchmarks-pricing-update/tests/pricing-history.test.mjs` | "uses the latest rate active at report time when usage is undated" | behavior |
| Why is a model listed as requiring a pricing update, and what does that exclude? | `../11ai-benchmarks-machine/scripts/analyze-llm-cost-global.mjs` | "Models requiring a pricing update" | behavior |
| Which official sources may feed the catalog, and how are they reviewed? | `../11ai-benchmarks-pricing-update/references/provider-sources.md` | "# Official provider pricing sources" | reference |
| What schema and rate periods does the pricing catalog use? | `../11ai-benchmarks-pricing-update/references/provider-sources.md` | "## Catalog schema" | reference |
| Is a specific model priced in the bundled catalog right now? | `../11ai-benchmarks-pricing-update/references/pricing.json` | - | reference |
| How are the three bundled catalog copies kept identical? | `../11ai-benchmarks-pricing-update/scripts/sync-pricing-catalog.mjs` | - | behavior |
| Who is allowed to change the bundled catalogs? | `../11ai-benchmarks-pricing-update/SKILL.md` | "## Catalog ownership" | contract |
| Why does the report not match my invoice or subscription bill? | `../11ai-benchmarks-machine/SKILL.md` | "API-equivalent estimate" | contract |

### Timing

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| What is the difference between wall time and estimated active time? | `../11ai-benchmarks-machine/SKILL.md` | "## Timing" | contract |
| How is timing measured for one thread and its sub-agents? | `../11ai-benchmarks-single-thread/SKILL.md` | "## Timing semantics" | contract |

### Reports and outputs

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| Where are report packages written by default? | `../11ai-benchmarks-machine/SKILL.md` | "11ai-benchmarks-machine-reports" | contract |
| Where does the project report land, and how is its folder named? | `../11ai-benchmarks-project/SKILL.md` | "11ai-benchmarks-project-reports" | contract |
| Where does the single-thread report land, and how is its folder named? | `../11ai-benchmarks-single-thread/SKILL.md` | "11ai-benchmarks-single-thread-reports" | contract |
| Are unreadable or malformed records silently dropped from the totals? | `../11ai-benchmarks-machine/scripts/analyze-llm-cost-global.mjs` | "malformed" | behavior |
| What must every report contain, and how does the HTML behave? | `../11ai-benchmarks-machine/SKILL.md` | "## Report requirements" | contract |
| How is usage attributed to monthly, quarterly, and yearly periods? | `../11ai-benchmarks-machine/SKILL.md` | "## Period attribution" | contract |
| What does the Pricing coverage section of a report tell me? | `../11ai-benchmarks-machine/scripts/analyze-llm-cost-global.mjs` | "## Pricing coverage" | behavior |
| What does the Anomalies and limitations section flag? | `../11ai-benchmarks-machine/scripts/analyze-llm-cost-global.mjs` | "## Anomalies and limitations" | behavior |
| What does the Historical pricing selection detail show? | `../11ai-benchmarks-machine/scripts/analyze-llm-cost-global.mjs` | "Historical pricing selection" | behavior |
| How is cost broken down by model and reasoning effort? | `../11ai-benchmarks-machine/scripts/analyze-llm-cost-global.mjs` | "Cost by model by effort" | behavior |
| How does a report classify each observed surface? | `../11ai-benchmarks-machine/scripts/analyze-llm-cost-global.mjs` | "Observed surface classification" | behavior |

### Maintenance and regression

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| What must happen when one sibling skill changes behavior? | `../../README.md` | "## Cross-skill maintenance" | reference |
| What is the report regression gate before a behavior change ships? | `../../README.md` | "regression gate" | reference |

## Glossary

Definitions only; the numbers, paths, and defaults live in the routed sources above.

| Term | Meaning |
| --- | --- |
| Harness | A local coding agent whose usage stores the analyzers read, such as Codex or Claude Code |
| Harness surface | The user-facing product a thread ran in, as opposed to the runtime underneath it |
| Billing mode | Whether usage was billed per token through an API key or covered by a subscription |
| Thread | One conversation or session as the unit of attribution, cost, and timing |
| Known cost | Cost computed from measured tokens matched to a bundled catalog rate |
| Unpriced model | A measured model with no catalog match; its cost stays unavailable instead of zero |
| Temporal fallback | Applying a documented substitute rate when usage falls outside known price history |
| Measured Cowork session | A Cowork session whose local transcripts were readable and counted |
| Sub-agent run | A child thread spawned by a root thread and reported as part of its tree |
| Active time | Estimated time the model was actually working, as opposed to wall-clock elapsed time |
| Attribution time | The timestamp that decides which price period and report period a thread belongs to |
