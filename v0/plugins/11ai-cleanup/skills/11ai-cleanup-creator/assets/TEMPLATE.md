---
name: 11ai-cleanup-<TARGET>
description: "Scan for idle, hanging, or abandoned <RESOURCE>, report what's found in a compact table, ask the user which ones to clean up, then remove only what they picked. Use whenever the user wants to clean up <RESOURCE>, asks <TRIGGER PHRASES — include the real-world complaints, e.g. 'disk almost full', 'too many stale X'>, even if they only mention a single item."
---

# 11ai Cleanup <Target>

## Overview

<One short paragraph: why this resource accumulates and gets abandoned (usually: AI agent sessions or dev workflows leave them behind), and what this skill does about it.>

Two rules that matter: **never remove anything the user did not explicitly pick**, and **never run this skill's execute step — or any test of it — without that same explicit approval.** The scan and report are read-only and free; everything destructive goes through the user first.

## Workflow

### 1. Scan

Run the bundled scanner:

```bash
bash scripts/scan_<TARGET>.sh <ARGS IF ANY>
```

It prints one line per candidate: <COLUMNS>. Flags mean:

- `<flag>` — <what it signals>
- `<flag>` — <what it signals>

If the script fails or is missing, fall back to: <MANUAL COMMANDS>.

### 2. Judge

Signals that a candidate is abandoned:

- <signal>
- <signal>

Signals to leave something alone (list it, but don't recommend cleaning it):

- <signal — always include: anything the current session depends on>
- <signal>

When in doubt, put it in the report with your honest uncertainty rather than guessing a verdict.

### 3. Report

Keep it succinct — headline numbers first, then a table with one verdict line per row, no essay. Quote the scanner's TOTALS footer for the figures; don't estimate:

```
Found <N> <RESOURCE> using <TOTAL SIZE> — cleaning the <M> recommended ones reclaims <RECLAIMABLE>.

| <Key> | Size | <Facts> | Age | Verdict |
|-------|------|---------|-----|---------|
| ...   | ...  | ...     | ... | abandoned — <reason> |
| ...   | ...  | ...     | ... | leave alone — <reason> |
```

### 4. Ask

Ask which ones to clean before touching anything. If the AskUserQuestion tool is available, use it with `multiSelect: true` — one option per candidate, recommended-to-clean ones first. Otherwise ask in plain chat with a numbered list. Always make "none" an easy answer.

<IF IRREVERSIBLE: State plainly in the question that this cannot be undone.>
<IF REVERSIBLE: Mention how it comes back, e.g. "npm install rebuilds this".>

If nothing looks abandoned, say so and stop — don't invent candidates to justify the scan.

### 5. Execute

For the selected items only:

```bash
<GENTLEST EFFECTIVE COMMAND>
<ESCALATION, ONLY IF THE FIRST DIDN'T WORK>
```

### 6. Verify

Re-check the cleaned items (<VERIFY COMMAND>) and report the reclaimed amount as a concrete headline number — "<e.g. disk space saved by deleting the selected X: 3.2 GB>" — broken down per item when more than a couple were cleaned. Flag anything that resisted with the likely reason.

## Notes

- <Skill-specific gotchas discovered while designing the scan.>
