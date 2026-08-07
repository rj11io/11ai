# 11ai Meta Skills

Skills for building, auditing, and packaging other skills and plugins, plus
two general-purpose utilities that don't fit anywhere else yet: compressing
guidance text and reverse engineering an existing repo.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-meta-operator-plugin-creator`](./skills/11ai-meta-operator-plugin-creator/SKILL.md) | Scaffolding a new `11ai-operator-TOOL` plugin that matches the house pattern and passes validation |
| [`11ai-meta-plugin-faq-manager`](./skills/11ai-meta-plugin-faq-manager/SKILL.md) | Creating or updating a plugin's `11ai-*-faq` skill: a validated question router over the plugin's own contracts, references, scripts, and tests |
| [`11ai-meta-compression`](./skills/11ai-meta-compression/SKILL.md) | Compressing a markdown guidance file (a SKILL.md, CLAUDE.md, prompt, or runbook) locally, without an external LLM call, while preserving headings, code, links, and paths |
| [`11ai-meta-reverse-engineering`](./skills/11ai-meta-reverse-engineering/SKILL.md) | Reverse engineering a locally cloned repository into a sanitized markdown blueprint for rebuilding it with modern tools |

Marketplace and plugin configuration research moved to the
[`11ai-plugins-marketplace`](../11ai-plugins-marketplace/README.md) plugin.

## Scope

Candidates for this plugin:

- Author a new skill from a description.
- Audit frontmatter and packaging across harnesses.
- Wire a plugin into the marketplace, catalogs, and site.
- Keep counts, manifests, and duplicated helper scripts in sync.
- Retire a skill or plugin cleanly.

## The authority

`v0/scripts/validate-skills.mjs` is the source of truth for every packaging rule.
A meta skill enforces what the validator already checks and closes the gaps it
does not. Read it first. Do not restate its rules from memory.

## Related

`11ai-super-skill-qa` in `11ai-super` also falls in this scope: it audits and
repairs skill packaging across harnesses. Read it before writing a new meta
skill here.
