# 11ai Core Skills

Skills for building, auditing, and packaging other skills and plugins, plus
general-purpose utilities that don't fit anywhere else yet: compressing
guidance text, reverse engineering an existing repo, setting how an agent
communicates, and critiquing any work product.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-core-operator-plugin-creator`](./skills/11ai-core-operator-plugin-creator/SKILL.md) | Scaffolding a new `11ai-operator-TOOL` plugin that matches the house pattern and passes validation |
| [`11ai-core-plugin-faq-manager`](./skills/11ai-core-plugin-faq-manager/SKILL.md) | Creating or updating a plugin's `11ai-*-faq` skill: a validated question router over the plugin's own contracts, references, scripts, and tests |
| [`11ai-core-compression`](./skills/11ai-core-compression/SKILL.md) | Compressing a markdown guidance file (a SKILL.md, CLAUDE.md, prompt, or runbook) locally, without an external LLM call, while preserving headings, code, links, and paths |
| [`11ai-core-reverse-engineering`](./skills/11ai-core-reverse-engineering/SKILL.md) | Reverse engineering a locally cloned repository into a sanitized markdown blueprint for rebuilding it with modern tools |
| [`11ai-pragmatic`](./skills/11ai-pragmatic/SKILL.md) | Answering in a terse, evidence-preserving register: short lines, an example per claim, a fix beside every problem, and a copyable conventional commit message after repo work |
| [`11ai-core-reports-styleguide`](./skills/11ai-core-reports-styleguide/SKILL.md) | Styling, restyling, or reviewing generated HTML reports: canonical tokens, embedded fonts, dark default, and the table interaction contract with its verification checklist |
| [`11ai-roast`](./skills/11ai-roast/SKILL.md) | Giving a blunt, prioritized, read-only critique of code, documents, designs, or any other work product |

Marketplace and plugin configuration research moved to the
[`11ai-plugins-marketplace`](../11ai-plugins-marketplace/README.md) plugin.

## Communication skills

`11ai-pragmatic` and `11ai-roast` set or critique how an agent communicates.
Both follow the same three-rule contract, stated in their own vocabulary:

1. **Say what changes the reader's next action.** Cut the rest.
2. **Never cut the evidence.** Numbers, file paths, command names, exact error
   text, and stated uncertainty survive every register. Brevity is not
   vagueness.
3. **Pair every problem with a fix.** A finding with no proposed action is
   incomplete, however short the reply.

`11ai-roast` is not a register: it's a one-off critique, and it composes with
whichever register is active.

## Scope

Candidates for this plugin:

- Author a new skill from a description.
- Audit frontmatter and packaging across harnesses.
- Wire a plugin into the marketplace, catalogs, and site.
- Keep counts, manifests, and duplicated helper scripts in sync.
- Retire a skill or plugin cleanly.
- Add a communication register or a one-off critique deliverable.

## The authority

`v0/scripts/validate-skills.mjs` is the source of truth for every packaging rule.
A core skill enforces what the validator already checks and closes the gaps it
does not. Read it first. Do not restate its rules from memory.

## Related

`11ai-super-skill-qa` in `11ai-super` also falls in this scope: it audits and
repairs skill packaging across harnesses. Read it before writing a new core
skill here.
