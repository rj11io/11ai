---
name: 11ai-single-saas-automation-creator
description: >-
  Create an agent automation that builds and continuously deepens ONE SaaS
  product to production grade, for a product of the user's choice —
  combining the 11ai-automation method with the 11ai-single-saas-automation
  lifecycle (capability items, the production depth bar with accounts/
  tenancy/test-mode payments/migrations, the walking skeleton, the spine
  e2e). Runs an interview about the product's mission, users, monetization,
  stack, and initial capability backlog — then generates PRODUCT.md, the
  conductor, a pre-seeded ledger, and the runner. Use when the user says
  "set up an agent to build my product", "create an automation that takes
  this SaaS to production", or names one specific product to work on. For a
  fleet of many products, use 11ai-saas-fleet-automation-creator.
---

# Single-SaaS Automation Creator

You are going to generate a complete automation that pours every scheduled
run into **one product**. First read the **`11ai-automation`** skill (method
+ conductor template + runner + operations) and the
**`11ai-single-saas-automation`** skill (capability lifecycle, production
depth bar, walking skeleton, spine e2e, shared-codebase rules) — the
generated automation embeds both. If the user actually wants many small
products, hand off to **`11ai-saas-fleet-automation-creator`**.

## Step 1 — Interview (two batches)

**The product**
1. Mission in one sentence, target user, and the core job — the journey the
   spine e2e will walk (sign up → do the core job → result persists).
2. Monetization: does it charge? If yes, which provider, and confirm
   `payments: "test-mode"` (real checkout on test keys, no live charging
   until a human flips it). If it doesn't charge yet, `"boundary"`.
3. Initial capability backlog: draft 5–8 capabilities yourself from answers
   1–2 — **walking skeleton always first** — with a `priority` order, and
   confirm with the user rather than asking cold. Each capability is a
   user-visible ability, not a layer ("invite teammates", not "API layer").
4. Existing code? If the product already exists, audit what is real against
   the production depth bar (accounts? isolation tested? migrations? spine
   journey possible?) and turn the gaps into the first backlog items after
   the skeleton — the skeleton item shrinks to whatever is genuinely missing.

**The machinery**
5. Stack: framework, database, auth approach, test runners. Get the literal
   gate commands (typecheck, lint, build, unit, e2e). Propose one mainstream
   default and confirm if the user has no preference.
6. Agent CLI for ticks; optionally a different CLI for the reviewer.
   Scheduler platform and interval.
7. Caps: `capacity` (default 1), `maxItems` (open-backlog cap, default 40),
   `reviewMaxIterations` (default 2), `tickBudget` if the provider reports
   spend.

## Step 2 — Generate

In the target repo:

- **`PRODUCT.md`** — mission, target user, core job, positioning, the
  confirmed capability map with priorities, and product-wide conventions
  (design tokens, data-model overview, permission model). Mark it as
  human-owned: the conductor may propose changes but never applies them.
- **`CONDUCTOR.md`** — the core template filled with the single-SaaS
  lifecycle verbatim: the `scoping → building → hardening → integrating →
  done` machine, the production depth bar instantiated for the user's stack
  (name the actual commands that will prove tenancy isolation, the payments
  test-mode flow, migrations, and the spine e2e), the walking-skeleton
  bootstrap rule, the shared-codebase rules, the seeded-first prioritization,
  and the literal gate commands.
- **`ledger.json`** — config from the interview; `items` pre-seeded: the
  walking skeleton as item 1, the confirmed backlog as seeded items (each
  with a `seed` carrying the capability intent and constraints, `status:
  "scoping"` order enforced by `priority`).
- **`scripts/run-tick.sh` + `scripts/runner.conf`** — from the core skill's
  runner; `REVIEWER_CMD` if a second CLI was chosen.
- **`.env.example`** with empty keys (auth provider, payment provider test
  keys, database), `logs/` git-ignored, and a **scheduler snippet** — shown,
  not installed without confirmation.

## Step 3 — Lint, then prove one tick

Run the conductor lint checklist; fix blockers yourself. Then walk one
manual tick with the user: it must scope the walking skeleton (spec, probes
that apply, 2–5 milestones) and stop. Check the spec names the spine e2e
harness before calling the automation ready. Hand over the scheduler snippet
only after that.

## Rules

- The walking skeleton is not negotiable — without auth, deploy, and the
  spine harness first, every later capability builds on sand.
- The production depth bar is machinery, not preference: if the user asks to
  skip tenancy isolation or migrations, explain what breaks at the first
  real user, then descope *capabilities* instead.
- Never write live payment credentials anywhere; test keys only, empty in
  `.env.example`.
- No vendor CLI names, flags, or model ids in `CONDUCTOR.md` or
  `PRODUCT.md`; they live in `runner.conf` only.
- First-week watch-list for the user: review approval rate near 100%, ticks
  that ship only copy/tests, and a spine e2e that stops growing while
  capabilities finish — each means a spec needs tightening.
