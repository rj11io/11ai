---
name: 11ai-automation
description: >-
  Build autonomous, scheduled agent automations with the Ledger + Conductor +
  Routine pattern. Each scheduled run ships ONE MILESTONE — a complete
  vertical slice with checks, implementation, one evidence-backed review, and
  a quality gate, all in a single run — against a durable JSON ledger, driven
  by any headless agent CLI (Claude Code, Codex, Gemini, opencode, Cursor,
  aider, and others). Use when the user wants a self-running pipeline, a
  fleet builder, or any cron-driven agent that must keep making real,
  verifiable progress unattended — resumable, serial, and never corrupting
  shared state. This is the core method; sibling skills provide a worked
  example, a SaaS product pipeline, and creators that generate a tailored
  automation from an interview.
---

# AI Agent Automation — Ledger + Conductor + Routine

A method for building agents that work alone, on a schedule, and make **real**
progress every run — not paperwork progress.

Use it when the work is open-ended (a growing fleet of products, reports, or
datasets), too big for one session, and unattended. If the job fits in one
session, you do not need this.

---

## The three pillars

| Pillar | What it is | Where it lives |
| ------ | ---------- | -------------- |
| **Ledger** | One JSON file holding all durable state: config plus a list of work items, each with a `status` and a milestone plan. Read it first, write it last. | `ledger.json` |
| **Conductor** | The one spec the agent re-reads every run: state machine, per-tick algorithm, depth bar, review rule, quality gate, failure branches. | `CONDUCTOR.md` |
| **Routine** | A scheduler (cron, launchd, systemd, Task Scheduler, CI) that fires a headless agent CLI with a short trigger prompt and a single-instance lock. | `run-tick.sh` |

A run ("tick") is a pure function: `(ledger, conductor) → one milestone → new
ledger`. The agent keeps no memory between runs; the ledger is the memory.

---

## The four failure modes this method is built against

Unattended agent loops fail the same four ways. Every rule in this skill
exists to make one of them impossible:

1. **Ceremony ticks.** The loop splits one unit of work into many tiny
   scheduled runs (author tests in one run, pass them in another, then a
   parade of mandatory "review" and "revision" runs). Most runs then produce
   documents about the work instead of the work. Cure: the tick unit is a
   **milestone** — a full vertical slice in one run.
2. **Shallow output that passes every check.** Green typecheck/lint/build/
   test says nothing about whether the output is real: a static page over
   hard-coded data passes all four. Cure: a **depth bar** — domain-specific,
   automated probes that prove a stranger could actually use the output —
   is part of the gate.
3. **Rubber-stamp reviews.** A reviewer in the same context, or one asked
   only for prose, approves nearly everything at length. Cure: **one
   fresh-context review per tick, and every approval must cite the commands
   the reviewer ran.**
4. **Vendor lock-in.** The spec hardcodes one CLI's flags, model names, and
   settings format, so the automation dies with the vendor's next rename.
   Cure: the conductor addresses "the agent"; only the runner knows which
   CLI is installed.

---

## The seven invariants

1. **One milestone per tick, then stop.** A milestone is a complete slice:
   author the failing checks, do the work, pass one review, pass the gate,
   persist. Never two milestones; never half of one. A tick that only adds
   copy, styling, docs, or tests is not a milestone and must not advance
   `status`.
2. **The ledger is the single source of truth.** Read first, write last, in
   the same commit as the work. Never infer status from the filesystem.
3. **An explicit state machine decides the next action.** Item `status` plus
   a fixed priority order answers "what now?" — never the model's mood.
4. **Serialize hard.** A start-of-tick sync (fetch, fast-forward, refuse a
   dirty tree) plus a single-instance lock. Ledger merge rule: union items by
   `id`, keep the more-advanced status, later `updatedAt` breaks ties.
5. **One falsifiable review per tick.** A fresh context (sub-agent, or a
   second headless CLI call) reviews the milestone against its acceptance
   criteria. The verdict must name the commands or probes the reviewer ran
   and their results. Persist the critique; revise up to the cap; carry notes
   to the next tick if still failing.
6. **The gate measures depth, not just green.** Typecheck, lint, build, tests
   — **and** the item's depth-bar probes (real input, real persistence, real
   round-trip). Never weaken a check to pass it.
7. **Failure is a state, not a crash.** Permanent, human-actionable problems →
   `status: "blocked"` with a reason. Transient problems (rate limits, network)
   → abort the tick cleanly, change nothing, do **not** block the item.

---

## How to build a new automation

1. **Define the work item and its milestones.** One item = one product /
   report / dataset. In scoping, the agent writes a plan of 3–7 milestones,
   each a user-visible capability with numbered, testable acceptance criteria.
2. **Set the depth bar.** Decide what "real" means for this domain before any
   work: what must a stranger be able to *do* with the output? Write those as
   automatable probes. For SaaS products, use the ready-made bar in the
   **`11ai-saas-fleet-automation`** skill.
3. **Write the conductor** from
   [references/conductor-template.md](references/conductor-template.md), then
   run its built-in lint checklist against your draft. (Or let
   **`11ai-automation-creator`** interview you and generate all the files.)
4. **Prove one tick by hand.** Run the trigger prompt interactively. Confirm
   it syncs, ships one milestone, reviews it with evidence, passes the gate,
   persists, stops. Fix the spec until this is boring.
5. **Schedule it** with the provider-agnostic runner:
   [references/runner.md](references/runner.md).
6. **Operate it** — recovery, budgets, logs, secrets:
   [references/operations.md](references/operations.md).

> Golden rule: **the conductor is the product**, and **capability is the unit
> of progress.** If a tick did not make the item able to do something it
> could not do before, the tick did not count.

---

## The skills in this plugin

- **`11ai-automation`** (this skill) — the method and its three references.
- **`11ai-automation-example`** — a complete, filled-in instance (conductor +
  ledger + runner config for a how-to guide library). Read it to see the
  template become concrete; copy it as a starting point.
- **`11ai-automation-creator`** — interviews the user about any goal, then
  generates the full automation: conductor, ledger, runner, depth bar.
- **`11ai-automation-seed`** — adds a human idea to a running automation's
  ledger (vetted, deduped, committed safely between ticks) so the agent
  picks it up in a later run. Seeded ideas are scoped before the agent's
  own.
- **`11ai-saas-fleet-automation`** — the ready-made lifecycle for building a fleet
  of real SaaS products: milestone planning plus the five-probe depth bar
  that blocks brochure-ware.
- **`11ai-saas-fleet-automation-creator`** — interviews the user about their SaaS
  niche and stack, then generates a product-fleet automation.
- **`11ai-single-saas-automation`** — one product, production depth: ledger
  items are capabilities of a single SaaS, built against a production bar
  (accounts and tenant isolation, test-mode payments, migrations, a growing
  spine e2e).
- **`11ai-single-saas-automation-creator`** — interviews the user about their
  one product, then generates `PRODUCT.md`, the conductor, a pre-seeded
  capability backlog, and the runner.

## References

- [references/conductor-template.md](references/conductor-template.md) —
  fill-in-the-blanks `CONDUCTOR.md` with the state machine, plus the lint
  checklist to audit it before scheduling.
- [references/runner.md](references/runner.md) — the provider-agnostic runner:
  the CLI contract, an adapter table for common agent CLIs, locking,
  scheduling on every platform, CI runners, auth.
- [references/operations.md](references/operations.md) — git recovery,
  blocked-item triage, transient-vs-permanent failures, budgets, secrets and
  mock adapters, per-tick logs and stall detection, ledger schema changes.
