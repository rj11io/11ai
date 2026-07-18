---
name: 11ai-saas-fleet-automation-creator
description: "Create a complete SaaS product-fleet agent automation for a niche and goal of the user's choice, combining the 11ai-automation method with the 11ai-saas-fleet-automation lifecycle (milestone ticks + the five-probe depth bar that blocks brochure-ware + the payments boundary). Runs a short interview about the niche, target users, stack, and caps — then generates the conductor, ledger, runner, and per-product scaffolding conventions. Use when the user says \"create an agent automation that builds SaaS products / POCs / MVPs for X\", \"set up an autonomous product factory\", or wants a cron-driven agent shipping many products in a chosen market unattended. For ONE product deepened to production grade, use 11ai-single-saas-automation-creator instead."
---

# SaaS Fleet Automation Creator

You are going to generate a complete, ready-to-run **product-fleet**
automation tailored to the user's niche. First read the **`11ai-automation`**
skill (method + conductor template + runner + operations) and the
**`11ai-saas-fleet-automation`** skill (state machine, depth bar, anti-theater
rules, payments boundary) — the generated automation embeds both.

## Step 1 — Interview (two batches)

**The fleet**
1. Niche/theme, and any sub-constraints ("B2B only", "no paid APIs",
   "mobile-first"). This becomes `config.theme` — the one knob that steers
   what gets researched.
2. Who is the target user of these products, and what should a finished
   product prove? (a demo-able business, a portfolio, acquisition bait —
   this calibrates how hard the shipping stage leans on landing/pricing)
3. Fleet caps: how many products (`maxItems`), in-flight at once
   (`capacity`, default 1), review iterations (default 2).

**The machinery**
4. Stack and layout: monorepo or per-product repos? Framework, database,
   test runners? Get the literal gate commands (typecheck, lint, build,
   unit, e2e). If the user has no stack, propose one mainstream default and
   confirm.
5. Real data: which sources are acceptable for depth-bar probe 4 (public
   APIs, user uploads, credentialed APIs behind adapters)? Any credentials
   the user will provide up front?
6. Agent CLI for ticks; optionally a different CLI for the reviewer (a
   second model family rubber-stamps less). Scheduler platform and interval.
7. Confirm the payments boundary (pricing real, CTAs → request-access, no
   checkout) and that captured leads must be persisted — these are defaults,
   not options, but say them out loud.

## Step 2 — Generate

In the target repo:

- **`CONDUCTOR.md`** — the core conductor template filled with the SaaS
  lifecycle verbatim from `11ai-saas-fleet-automation`: the
  `scoping → building → hardening → shipping → done` machine with milestones
  as the tick unit, the five-probe depth bar as §5 (instantiated with the
  user's stack — name the actual e2e commands that will prove input,
  persistence round-trip, and interactivity), the anti-theater hardening
  rules, the payments-boundary assertions, the scoping hard rules ("the
  out-of-scope list may not remove the product"; "dedupe means different,
  not renamed"), and the user's literal gate commands.
- **`ledger.json`** — `theme`, `stack`, caps from the interview; empty
  `items`.
- **`scripts/run-tick.sh` + `scripts/runner.conf`** — from the core skill's
  runner (AGENT_CMD-driven, flock-locked); `REVIEWER_CMD` set if answer 6
  provided one.
- **Per-product conventions** documented in the conductor: the product
  folder layout, per-product test subtree the runners already recurse into
  (so adding a product never edits shared config), `.env.example` sections
  per product, `docs/spec.md` + `docs/reviews/` locations.
- A **scheduler snippet** for the chosen platform — shown, not installed
  without confirmation.

## Step 3 — Lint, then prove one tick

Run the conductor lint checklist; fix blockers yourself. Then walk the user
through one manual tick: it should scope the first product — spec, depth
bar, milestone plan — and stop. Check the spec against the two scoping hard
rules before calling the automation ready. Only then hand over the scheduler
snippet.

## Rules

- The depth bar is non-negotiable machinery, not a preference question — if
  a user asks to drop persistence or live data, explain that without them
  the fleet converges on static brochure pages, then scope the *products*
  smaller instead.
- Milestone 1 of every product must already do the core job on real input.
- No vendor CLI names, flags, or model ids in `CONDUCTOR.md`; they live in
  `runner.conf` only.
- Watch-list for the user's first week: review approval rate near 100%
  means the reviewer needs tightening; ticks that ship only copy or tests
  mean the milestone plan is too thin.
