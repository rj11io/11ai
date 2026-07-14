---
name: 11ai-cleanup-creator
description: >-
  Create a new 11ai cleanup skill for any kind of idle, hanging, or abandoned
  resource — ports, node_modules folders, caches, agent sessions, Docker
  containers, stale branches, whatever the user names. Use whenever the user
  asks to create, make, or generate a cleanup skill for something, wants a
  scan-and-clean workflow for a resource, or wants to extend the 11ai cleanup
  skill family. The generated skill always follows the same pattern: scan →
  judge → report → ask → execute → verify, and never destroys anything the
  user didn't explicitly pick.
---

# 11ai Cleanup Creator

## Overview

This is a skill that writes skills. The 11ai cleanup family shares one shape: find things that look abandoned, show the user a short honest report, let the user choose what goes, and remove exactly that. This skill turns any resource the user names into a new member of that family.

The canonical example is `11ai-cleanup-idle-ports` (sibling directory) — read it when you want to see the pattern fully worked out.

## The pattern every cleanup skill follows

Six steps, in order. Each exists for a reason:

1. **Scan** — run a bundled, strictly read-only script that lists every candidate with the facts needed to judge it (age, size, owner, flags). A script beats ad-hoc commands because every invocation gets the same reliable data.
2. **Judge** — sort candidates into likely-abandoned vs. leave-alone using the skill's named signals. When unsure, say so in the report instead of guessing.
3. **Report** — a compact table with one verdict line per row, and numbers the user can act on. Every row carries the item's size (or the resource's equivalent — a process's RAM, a worktree's disk usage), and the report leads with the roll-up analytics: total found, total per group, and above all the headline reclaimable number ("deleting the 7 stale node_modules frees 5.2 GB"). The scan script's TOTALS footer provides these figures — quote them, don't estimate. No essay. If nothing looks abandoned, say so and stop — never invent candidates to justify the scan.
4. **Ask** — the user picks what gets cleaned. Use AskUserQuestion with `multiSelect: true` when available (recommended items first), otherwise a numbered list in chat. "None" is always an easy answer. If the action is irreversible, say so right in the question.
5. **Execute** — act only on the selected items, gentlest effective action first (e.g. `kill` before `kill -9`, `git worktree remove` before `rm -rf`).
6. **Verify** — re-check that the resources are actually gone/freed, and report the reclaimed amount as a concrete number ("disk space saved by deleting the selected node_modules: 3.2 GB", "freed 4 ports and ~1.1 GB of RAM"), broken down per item when more than a couple were cleaned. Flag anything that resisted, plus the likely reason.

The one rule that overrides everything: **never destroy anything the user did not explicitly pick.** Scanning and reporting are free; every destructive step goes through the user first.

## How to create a new cleanup skill

### 1. Pin down the target

Get clear answers (from the user or from obvious context) on five things:

- **What** is the resource? (e.g. node_modules directories, agent session files)
- **Where** does it live? (paths, commands that enumerate it)
- **Abandonment signals** — what makes one look dead? (age, zero activity, orphaned parent, stale project)
- **Leave-alone signals** — what must never be suggested for cleanup? (in-use items, databases, anything belonging to the current session, other users' resources)
- **The cleanup action and its reversibility** — is removal recoverable (`npm install` rebuilds node_modules) or permanent (a deleted transcript is gone)? This wording goes into the Ask step.

### 2. Write the scan script

Put it at `scripts/scan_<target>.sh` inside the new skill. Requirements:

- **Read-only.** It lists and measures; it never deletes, kills, or modifies.
- **Portable.** Works with stock macOS bash 3.2 (no associative arrays, no `mapfile`) and on Linux. For file mtimes use the two-way fallback: `stat -f %m "$f" 2>/dev/null || stat -c %Y "$f"`.
- **Tab-separated output** with a header row, one line per candidate, including a FLAGS column (comma-joined, `-` if none). Flags encode the signals from step 1 so the judging step is mostly mechanical.
- **Measures, not just lists.** Every candidate gets a size (or the resource's equivalent metric — RAM for processes), computed in machine-summable units internally, and the output ends with a **TOTALS footer**: overall count and size, per-flag subtotals, and the reclaimable-candidates subtotal. This is what lets the report and verify steps quote exact numbers instead of estimates. See any sibling scanner for the awk pattern.
- **Handles the empty case** with a friendly one-line message and exit 0.

### 3. Write the SKILL.md

Copy `assets/TEMPLATE.md` and fill in the placeholders. Conventions:

- Name: `11ai-cleanup-<target>` (kebab-case).
- Location: `v0/skills/cleanup/11ai-cleanup-<target>/` alongside the others.
- Description: state what it scans and cleans, and be generous with trigger phrasings — include the complaints a user would actually type ("disk full", "port already in use"), not just the skill's own vocabulary. Skills tend to under-trigger; a slightly pushy description compensates.
- Keep the body under ~120 lines. The six steps carry the structure; the skill-specific content is the signals, the flags, and the exact execute commands.

### 4. Make the script executable

`chmod +x` the scan script. Do not run or test the new skill — not even its read-only scan — unless the user explicitly asks for a test. A cleanup skill exercised without approval is exactly the accident these skills exist to prevent.

## Hard rules for generated skills

These are non-negotiable in every skill this creator produces:

- Nothing is destroyed without the user's explicit per-item selection in that same session.
- The scan script is read-only, always.
- Irreversible actions are labeled as irreversible in the Ask step, before the user chooses.
- The skill never recommends cleaning anything it can't confidently judge — uncertainty is stated, not hidden.
- The skill protects itself: never suggest cleaning resources the current session depends on (its own process ancestry, its own scratchpad, memory directories).
- No running or testing without approval: a cleanup skill — this creator's output included — is never run, demoed, or tested without the user asking for it, and its execute step is never exercised against real files as a "test". The only safe unattended part is the read-only scan, and even that runs only when the user invoked the skill.
