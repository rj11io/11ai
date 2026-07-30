# Operations plugin blueprint

The shape every `11ai-TOOL-operations` skill follows, and the six archetypes a plugin is built from.

## The canonical skill file

~~~markdown
---
name: 11ai-TOOL-AREA
description: "One sentence naming the operations this skill covers. One sentence starting 'Use when' that names the triggers."
---
# 11ai TOOL AREA

One or two sentences of framing. Say what must be known before acting.

## Inspect first

```bash
tool list
tool inspect TARGET
```

What the output means and what to confirm before changing anything.

## Operate

```bash
tool change TARGET
```

Which flags to add only on request, and which values never to invent.

## Verify and report

What to re-run, and what the final message must state.
~~~

Fixed details, in the order a reader meets them:

- No blank line between the closing `---` and the H1.
- The H1 carries the `11ai` prefix: `# 11ai Docker containers`, not `# Docker containers`.
- The framing paragraph is prose, never a bullet list, and almost always says know your target before you act. Examples in the repository: "Resolve the bucket, key or local path, region, profile, and direction of data flow before running a command"; "Establish exactly which MongoDB deployment will receive a command".
- Three to five H2 sections, ordered read-only, then change, then verify.
- Fenced code blocks with a language tag. Placeholders are bare uppercase words: `NAME`, `BUCKET`, `PROFILE`, `SERVICE`, `PORT`, `TARGET`.
- A closing section that tells the model what to report. Use `## Report`, `## Reporting`, `## Verification`, `## Guardrails`, or `## Review traps` and match the archetype.
- Aim for 40 to 60 lines. Under 30 means the skill is thin; over 80 means material belongs in `references/`.

Two cosmetic points differ across the older plugins: `antdesign`, `aws`, and `jest` leave a blank line after the frontmatter and drop the `11ai` H1 prefix, and `mongodb` plus half of `nodejs-api` use four-space indented code blocks instead of fences. Write new skills to the canon above; do not copy that drift.

## The description field

Two sentences, one line, double-quoted, no angle brackets, at most 1024 characters.

The first sentence lists the covered operations concretely, because that is what a model matches against. The second starts with "Use when" and names the situations, including the phrasing a user would actually type.

```text
"Perform common Docker container operations including run, list, inspect, logs, exec, start, stop, restart, and remove with evidence-first safety checks. Use when the user asks to operate an individual container or wants help understanding its state."
```

Avoid a description that only restates the title. `"Manage containers. Use for containers."` matches nothing useful and collides with its neighbours.

## Codex metadata

```yaml
interface:
  display_name: "11ai TOOL Area"
  short_description: "Verb phrase, 25 to 64 characters"
  default_prompt: "Use $11ai-TOOL-AREA to do the thing and verify the result."
```

Three keys, two-space indent, every value double-quoted. `short_description` outside 25 to 64 characters fails the validator, and so does a `default_prompt` missing the literal `$` plus the exact skill name.

## The six archetypes

Every plugin has one of each of the first five. The rest are domain skills.

### Cheatsheet

A lookup surface, not a workflow. Command tables or grouped fenced blocks, one section per area, then a closing `## Answer format` or `## Response shape` that keeps replies short and command-first. Put long matrices in `references/cheatsheet.md` or `references/command-matrix.md`.

### Environment

Read-only inspection of whether the tool is present, reachable, and pointed at the intended target. Sections: the smallest useful checks, how to read each result, then a closing report. The distinctive rule is that this skill never fixes anything: "Do not repair, restart, install, or switch contexts unless the user asks for that action."

### Setup

Install and configure from zero, which is the one archetype that is allowed to change the machine. Sections: what to gather first, install, configure, verify, and what never to commit. Keep credential handling in prose and never print a secret. The walkthrough lives in `references/setup.md`; the skill body holds the decisions and the guardrails.

Setup and environment are different skills on purpose. Environment answers "what do I have and where does it point"; setup answers "make it exist and work". A setup skill that only inspects is a duplicate, and an environment skill that installs breaks the read-only promise the other skills depend on.

### Integrations

How the tool connects to the rest of a stack: the neighbouring services, the CI surface, the local development loop, and the environment variables each side needs. Sections: name the integration surfaces, wire one deliberately, verify end to end, then report. Recipes live in `references/integrations.md`.

Keep this skill about the seam between two systems. Anything that is only about the tool itself belongs in a domain skill.

### Troubleshooting

Four beats, in this order:

1. `## Evidence collection` — read-only checks, with an instruction to redact secrets and preserve exact error text and exit codes.
2. `## Classify the failure` — a bold-led bullet per failure class.
3. `## Remediation discipline` — one bounded change, state confidence, request approval, re-run the original check.
4. `## Report` — failing boundary, evidence, root cause or remaining uncertainty, fix proposed, impact, rollback, verification.

Open with the separation of fact from theory and close by handing off to the environment skill when the tool itself is unhealthy. Long symptom tables go in `references/triage-matrix.md`.

### Domain skills

Five to eight per plugin, one per area that has its own commands, failure modes, and destructive operation. The body runs inspect, operate, then verify. Name every destructive command explicitly and gate it: `docker rm -f`, `deleteMany`, `aws s3 rb --force`, `git push --force`.

## The safety contract

Five rules, restated in each skill's own vocabulary rather than pasted. The plugin README repeats them under a `## Safety contract` heading.

1. **Read before you write.** An `## Inspect first` section, or an equivalent, comes before any change.
2. **Never guess a value that changes behaviour.** Regions, ports, tags, filters, identifiers, and credentials come from the user or the repository, never from a plausible default.
3. **Ask before an unrequested state change.** Name each destructive command and require explicit approval for the exact target.
4. **Redact secrets before quoting output.** Tokens, keys, connection strings, signed URLs, and personal data. Never echo an environment variable that holds a credential, and never read shell history to find one.
5. **Count or preview before a bulk change.** A dry run, a count, or a diff, shown to the user before the write.

## Cross-references

Name sibling skills so a reader can hand off: "If Docker itself is not healthy, hand off to `11ai-docker-environment` before diagnosing application behavior." Troubleshooting and environment skills should always do this. Domain skills should do it whenever a task realistically crosses a boundary, such as building an image and then pushing it.

## The plugin README

```markdown
# 11ai TOOL operations

N standalone skills for common TOOL work, with safety checks around state-changing and destructive commands.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-TOOL-cheatsheet`](./skills/11ai-TOOL-cheatsheet/SKILL.md) | Looking up common commands, flags, and safe patterns |

One sentence on combining skills when a task crosses boundaries.

## Safety contract

The five rules in this tool's vocabulary, naming the specific destructive commands the plugin guards.
```

Every skill name must appear in the README or validation fails.
