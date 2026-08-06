# FAQ skill blueprint

The exact shape of a plugin FAQ skill. `v0/scripts/validate-skills.mjs` enforces the
machine-checkable parts (`validateFaqSkills`); read that function first and treat this
file as its human-readable companion. Where the two disagree, the validator wins.

## Identity

- Directory and frontmatter name: `11ai-<plugin-short>-faq`, where `<plugin-short>` is the
  plugin name without the `11ai-` prefix (plugin `11ai-benchmarks` → skill `11ai-benchmarks-faq`).
- The skill lives inside the plugin it documents, next to its siblings.
- Create an FAQ only when explicitly asked. Never mass-generate FAQs across plugins: the
  pattern earns trust one reviewed instance at a time.

## What an FAQ skill is — and is not

An FAQ skill is a router: it turns a user's question into the right source of truth, then
answers from that source with a citation. It is not a condensed copy of the sibling docs.
Copies drift; routes are checked by the validator on every push. The only content the FAQ
owns outright is synthesis that exists nowhere else: the comparison table, the decision
guide, and the glossary.

Organize by question, never by document structure. Deriving the routing table from the
siblings' section headings produces a table of contents, which is worthless — the agent can
already find headings. Derive questions from personas instead (see below), then map each
question to its source.

## Required structure

Every FAQ SKILL.md contains these sections. The validator requires `## Covered skills` and
at least one routing row; the rest is the house pattern.

### 1. Answer contract

Verbatim rules the answering agent follows:

- Read the mapped source before answering; never answer a behavior question from memory.
- Cite the file (and section) the answer came from.
- If the sources do not cover the question, say so and name the skill that owns the
  behavior — do not guess.
- Escalate tiers when the question demands it: a "what does it promise" question stops at
  the contract; a "what exactly happens when" question goes to the tests.
- If a routed sibling file is missing because only the FAQ skill was installed, read the
  same skill's page at `https://ai.rj11.io/skills/<skill-name>` or the repository on
  GitHub instead.

### 2. Ground-truth ladder

Three tiers, from promise to proof:

| Tier | Meaning | Sources |
| --- | --- | --- |
| `contract` | What the skill promises | Sibling `SKILL.md` files |
| `reference` | Coverage tables and catalogs | Files under sibling `references/` |
| `behavior` | What actually happens, asserted | Sibling `scripts/` and `tests/` |

For edge-case questions prefer tests over scripts: a test asserts the behavior and cannot
drift from it.

### 3. Covered skills

A `## Covered skills` section listing every sibling skill name in backticks, one bullet
each with a one-line role. The validator requires this list to exactly equal the plugin's
skills minus the FAQ itself — adding a sibling without updating the FAQ fails the build.

### 4. Routing table

Rows in this exact grammar (the validator parses it):

```text
| <question, no pipes or backticks> | `<relative path from the FAQ dir>` | "<anchor>" or - | contract|reference|behavior |
```

- The anchor is a string that must appear verbatim in the source file: a `## Heading` for
  Markdown, a report-section title or option name for scripts, a test description for
  tests. Use `-` only when the whole file is the answer.
- Phrase questions the way users ask them ("Why is a cost shown as n/a?"), not the way
  documents are titled ("Pricing").
- Group rows under `###` subsections by theme; every group's rows still match the grammar.
- Every sibling skill must appear as a source in at least one row (validator-enforced).

### 5. Synthesis content (the FAQ's own material)

- **Comparison table**: one row per sibling — scope, input, how to run it, where output
  lands. This answers "which skill do I want?" before anything is installed.
- **Glossary**: the plugin's invented terms, defined in plain words. Definitions only —
  no numbers, paths, or defaults, which belong in routed sources where anchors watch them.

## Deriving the questions

Work through four personas against everything the plugin ships (SKILL.md files,
references, scripts, tests, and generated outputs):

1. **Choosing** — "which of these skills do I want, and do I want this plugin at all?"
2. **Running** — "how do I invoke it, what inputs does it need, what will it touch?"
3. **Interpreting** — "what does this section / row / label / warning in my output mean?"
4. **Troubleshooting** — "why is this value missing, zero, doubled, or flagged?"

For interpretation questions, enumerate the output the plugin actually produces (report
sections, warnings, states) from the generating scripts, and write one question per thing
a user would point at.

## Update mode

When the FAQ already exists, merge — never regenerate:

- Diff `## Covered skills` against the plugin's skills directory; add or remove entries.
- Re-run the validator; fix every dead source and stale anchor it reports.
- Add rows for new skills, new report sections, and new failure modes.
- Preserve existing question phrasings and hand-written rows. A regenerated table throws
  away accumulated judgment about how users actually ask.

## Wiring checklist

Same ripple as any new skill:

- `agents/openai.yaml` with `display_name`, `short_description` (25–64 chars), and a
  `default_prompt` containing the literal `$<skill-name>`.
- Plugin README: add the FAQ to the skill table, and extend the plugin's cross-skill
  maintenance rule (when present) with: confirm the FAQ routing rows and comparison table
  for every section you touched.
- Root README: plugin catalog row count, layout entry count, and the total skills count.
- Run `npm run validate-skills` and fix every error before reporting done.
