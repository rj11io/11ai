---
name: 11ai-core-plugin-faq-manager
description: "Analyze an existing 11ai plugin and create or update its FAQ skill: a question router that maps user questions about skill behavior, usage, outputs, and troubleshooting to the plugin's own contracts, references, scripts, and tests, plus a comparison table and glossary the siblings do not carry. Use when asked to add a FAQ skill to a plugin, refresh a plugin FAQ after skills changed, or check that a FAQ still covers its plugin."
---
# 11ai meta plugin FAQ manager

Build or update a `11ai-<plugin-short>-faq` skill inside an existing plugin. The FAQ is a
router, not a copy: it answers questions by reading the plugin's own files and citing them,
and it owns only the synthesis the siblings do not carry. Read
[references/faq-blueprint.md](references/faq-blueprint.md) for the exact shape before
writing any file; `validateFaqSkills` in `v0/scripts/validate-skills.mjs` enforces the
machine-checkable parts and is the authority when the two disagree.

## Confirm the scope

Settle these before creating or editing anything:

- The target plugin, and whether its FAQ already exists — that decides create versus
  update mode. Never regenerate an existing FAQ; update mode merges.
- That the user explicitly asked for this FAQ. Do not create FAQs proactively or in bulk.
- Whether the plugin has enough surface to justify one. A single-skill plugin usually
  answers questions fine through its own SKILL.md; say so instead of building.

## Analyze the plugin

Read everything the plugin ships: every sibling `SKILL.md`, every file under
`references/`, the `scripts/`, and the `tests/`. Then derive questions — not sections —
using the blueprint's four personas: choosing, running, interpreting outputs, and
troubleshooting. For output interpretation, enumerate what the scripts actually generate
(report section titles, warnings, states) and write one question per thing a user would
point at. A routing table organized by the documents' own headings is a failure; the
agent can already find headings.

## Create mode

Lay out the skill per the blueprint:

```text
v0/plugins/<plugin>/skills/11ai-<plugin-short>-faq/
  SKILL.md
  agents/openai.yaml
```

`SKILL.md` carries, in order: the answer contract, the ground-truth ladder, the covered
skills list, the routing table grouped by question theme, the comparison table, and the
glossary. Every routing row follows the blueprint grammar so the validator can check that
sources exist, anchors still appear verbatim in them, and every sibling is routed to at
least once. No scripts, no references of its own.

## Update mode

- Diff the FAQ's covered skills against the plugin's skills directory; reconcile.
- Run `npm run validate-skills`; fix every dead source and stale anchor it reports.
- Add rows for new siblings, new report sections, and new failure modes discovered in the
  updated scripts and tests.
- Preserve existing question phrasings and hand-written rows.

## Wire and verify

Work through the blueprint's wiring checklist: Codex metadata, the plugin README table and
its cross-skill maintenance rule, and the root README counts. Then run:

```bash
npm run validate-skills
```

Fix every reported error and rerun until it passes. The FAQ checks are part of the
validator, so a green run proves coverage and anchors, not just packaging.

## Report

Name the plugin and mode (create or update), the question groups and row count, which
sibling files the routing table reads from, the synthesis content added, every catalog
file touched, and the validator's final line. In update mode, list rows added, rows
repaired, and rows deliberately left alone.
