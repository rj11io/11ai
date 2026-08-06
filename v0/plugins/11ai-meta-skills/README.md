# 11ai Meta Skills

Skills whose subject is skills: authoring, auditing, packaging, and retiring them
without leaving dangling references.

**Status: scaffold.** The plugin holds a placeholder only. No working skill yet.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-meta-skills-placeholder`](./skills/11ai-meta-skills-placeholder/SKILL.md) | Nothing yet. Reserves the plugin and records the packaging rules the first real skill has to enforce |

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

Two working skills elsewhere already fall in this scope:
`11ai-operator-plugin-creator` in `11ai-utils`, and `11ai-super-skill-qa` in
`11ai-super`. Read both before writing a new one. Moving them here is a separate
decision, not part of this scaffold.
