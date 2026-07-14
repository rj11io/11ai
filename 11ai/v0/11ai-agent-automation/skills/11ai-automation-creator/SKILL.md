---
name: 11ai-automation-creator
description: "Create a complete agent automation for ANY goal of the user's choice, on the 11ai-automation method (Ledger + Conductor + Routine). Runs a short interview about the goal, work item, milestones, depth bar, quality gate, platform, and agent CLI — then generates every file: a filled-in CONDUCTOR.md, ledger.json, the provider-agnostic runner script and config, and a first-tick walkthrough. Use when the user says \"create/build/set up an agent automation for X\", \"I want an agent that keeps doing X on a schedule\", or \"turn this recurring work into an autonomous pipeline\". For SaaS product fleets specifically, prefer 11ai-saas-fleet-automation-creator."
---

# Agent Automation Creator

You are going to generate a complete, ready-to-run automation tailored to the
user's goal. First read the **`11ai-automation`** skill and its three
references (conductor template, runner, operations) — everything you generate
must follow them. If the goal is building software products, hand off to
**`11ai-saas-fleet-automation-creator`** instead.

## Step 1 — Interview (ask in two or three batches, not twenty questions)

**The goal and the item**
1. What should the automation produce, and for whom? (one sentence)
2. What is ONE work item? (one product / report / guide / dataset / …)
3. What does the finished fleet look like — how many items, what theme/scope?

**Milestones and the depth bar**
4. For one item, what are the 3–7 vertical slices, each something a user of
   the output can exercise end to end? Draft them yourself from answers 1–3
   and confirm with the user rather than asking cold.
5. What must a stranger be able to *do* with a finished item? Turn the
   answer into 3–6 automatable probes — the depth bar. Push back on probes
   that cannot be checked by a command.

**Machinery**
6. Where does the work live? (repo, branch, path layout; new or existing)
7. What are the literal quality-gate commands? (typecheck/lint/build/test/
   verifier — get exact commands, not "run the tests")
8. Which agent CLI runs the ticks, and is a second one available for the
   reviewer? Which scheduler/platform (cron, launchd, systemd, Task
   Scheduler, CI)?
9. Caps and budgets: `capacity`, `maxItems`, `reviewMaxIterations`,
   `tickBudget` (if the provider reports spend), tick interval.

## Step 2 — Generate the files

Create, in the target repo:

- **`CONDUCTOR.md`** — the core skill's conductor template with every blank
  filled from the interview: mission, ledger schema, the standard state
  machine (`scoping → building → hardening → shipping → done`, milestones as
  the tick unit), priority order with tiebreak, sync + merge rule, the
  evidence-required review, the user's depth bar as §5, the literal gate
  commands, and every failure branch ending in a clean stop.
- **`ledger.json`** — config from answers 3 and 9, empty `items` array.
- **`scripts/run-tick.sh`** — copy from the core skill's
  `scripts/run-tick.sh` (AGENT_CMD-driven, flock-locked, thin trigger
  prompt). Plus **`scripts/runner.conf`** (git-ignored) with the chosen
  `AGENT_CMD`, optional `REVIEWER_CMD`, and the modelTier→model mapping.
- **`.env.example`** with empty keys for any integrations named, and a
  `logs/` entry in `.gitignore`.
- A **scheduler snippet** for the chosen platform (from the runner
  reference), presented to the user but not installed without confirmation.

## Step 3 — Lint before handing over

Run the conductor lint checklist (bottom of the core skill's conductor
template) against the generated `CONDUCTOR.md`. Fix every blocker yourself;
show the user anything you had to interpret.

## Step 4 — Prove one tick

Walk the user through one manual tick with their agent CLI before any
scheduling: sync runs, one milestone ships, the review produced evidence,
the gate passed, one commit persisted, the run stopped. Only then hand over
the scheduler snippet.

## Rules

- Never invent depth probes that cannot be automated — negotiate them down
  to checkable form during the interview.
- Never put a vendor CLI name, flag, or model id inside `CONDUCTOR.md`;
  those live only in `runner.conf`.
- Generate everything in plain, unambiguous language: pinned orders,
  tiebreaks, explicit failure branches. Ambiguity is where unattended agents
  drift.
