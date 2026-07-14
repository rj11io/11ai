---
name: 11ai-saas-fleet-automation
description: >-
  Ready-made agent automation for building a fleet of real SaaS products,
  one milestone per scheduled run, on the 11ai-automation method (Ledger +
  Conductor + Routine). Includes the SaaS state machine (scoping → building
  per-milestone → hardening → shipping → done), a five-probe DEPTH BAR that
  blocks static brochure-ware from ever counting as done (real user input,
  real persistence round-trip, real interactivity, a live data path, honest
  copy), anti-theater hardening rules, and the payments boundary (pricing is
  real, checkout does not exist). Use when the user wants an autonomous,
  cron-driven agent that researches, builds, and ships MANY SaaS
  products/POCs/MVPs unattended. To tailor a new fleet to a specific niche
  via an interview, use 11ai-saas-fleet-automation-creator instead. To pour
  every tick into ONE product at production depth, use
  11ai-single-saas-automation instead.
---

# SaaS Fleet Automation — many real products, one milestone per tick

Drop-in lifecycle for the **`11ai-automation`** conductor when the work item
is a SaaS product. One item = one product; each scheduled run ships one
milestone of one product; a product finishes in **6–10 ticks**, and each tick
adds something a user can actually do.

The rules below are strict because unattended product loops drift toward one
outcome: a fleet of static brochure pages — mock data forever, demos with no
interactivity, lead forms that drop the email, tests that assert marketing
strings are non-empty. Every rule exists to make that outcome impossible.

---

## 1. Config (the knobs)

In the ledger `config`:

```jsonc
{
  "capacity": 1,            // products in-flight at once (finish before starting)
  "maxItems": 12,           // stop scoping new products here
  "reviewMaxIterations": 2,
  "theme": "<niche>",       // e.g. "dev tooling", "local commerce", "climate data"
  "stack": "<one line>",    // e.g. "Next.js + Convex monorepo, products under app/(products)/"
  "modelTier": "capable"
}
```

## 2. The depth bar (part of the quality gate; a product cannot finish without it)

Automated probes must prove all five before `done`:

1. **Real input.** A user supplies their own data (form, paste, upload, URL)
   and the product processes it — not only seeded fixtures.
2. **Real persistence.** At least one user action writes to a store (database,
   file, API) and survives a reload. An e2e does the round-trip: submit →
   reload → find it.
3. **Real interactivity.** The product's output changes when the user changes
   the input, and an e2e drives that change and asserts the difference. A
   server-rendered page over a constant array fails this probe.
4. **A live data path.** At least one data source is real: user-supplied
   input, a public API or feed, files on disk, or a credentialed API behind
   an adapter. Mocks are for development and tests, selected by credential
   absence — never the only implementation, never a silent fallback.
5. **Honest surfaces.** No invented testimonials, user counts, or metrics.
   No `lorem`, `TODO`, or "coming soon" in shipped copy. Lead capture stores
   the lead (probe 2 applies to it).

**The payments boundary:** pricing is real (tiers, comparison, persuasive
copy); every pricing CTA routes to request-access; no checkout, billing, or
payment provider exists. Tests assert all three. This keeps the product
demo-shippable while leaving the most compliance-heavy piece as a clearly
labeled next step.

## 3. Scoping (1 tick): the spec may not define the product away

One tick produces `products/<id>/docs/spec.md`:

- **Problem, target user, job to be done** — one paragraph each.
- **The depth bar instantiated** for this product as numbered probes.
- **Milestone plan: 3–7 vertical slices**, each a capability a user can
  exercise end to end ("paste a competitor URL and see extracted plans",
  "save a watchlist and reload it"), with numbered testable acceptance
  criteria. Milestone 1 already does the core job on real input.
- **Data plan** naming the real source for milestone 1 (per probe 4).

Human-seeded ideas (added with **`11ai-automation-seed`**) are scoped before
the agent researches its own: build the spec from the `seed`, honor its
constraints, never rewrite it.

Hard rules:

- **The out-of-scope list may not remove the product.** If persistence, input
  handling, or the data path is scoped out, the depth bar is unreachable and
  the spec is invalid. Cut features, never the bar.
- **Dedupe means different, not renamed.** Read every existing product's spec
  first. The new product must differ in what the user *does*, not in nouns.
  If two products would share components with two-line diffs, they are one
  product; shared UI gets extracted into a shared kit deliberately.

## 4. Building (1 tick per milestone): the slice is the tick

Each `building` tick, in one run: read the first `todo` milestone → author
its failing checks (unit and/or e2e) and watch them fail for the right reason
→ implement to green (never weaken a check) → one fresh-context review with
evidence, which independently verifies at least one red→green (stash, fail,
restore, pass) → gate green → mark the milestone `done`, commit, push, stop.

Too big for one tick? Split it in the ledger and ship the first half — a
shipped half beats a paperwork tick. Never commit red checks on their own.

## 5. Hardening (1 tick, anti-theater)

One evidence-driven pass, scoped by what the product actually has:

- Fix defects found by the reviewer or by running the product — regression
  test each.
- Harden inputs real users reach (the depth bar guarantees some exist):
  validation, authz if there are accounts, injection on real parse paths.
- Budget hot paths only if a real usage pattern can hit them.
- **If you must invent a threat or a load to have something to fix, skip it
  and say so in the commit message.** "Nothing to harden beyond X" is a
  valid outcome. Never harden a hard-coded fixture against attacks it
  cannot receive; never set performance budgets with orders-of-magnitude
  headroom just to have a perf test.

## 6. Shipping (1 tick, occasionally 2)

Landing page, pricing → request-access, navigation, and a copy pass — real,
benefit-led, specific copy, gated by probe 5. The demo needs no separate
stage: the milestones already built the product as working capability. Keep
every product inside its own folder with its own layout shell; a tick never
breaks another product or shared infrastructure.

Suggested layout (adapt to `config.stack`):

```
products/<id>/
  page.tsx (or entrypoint)     # landing
  pricing/  request-access/    # priced, no payments (§2)
  app/ or demo/                # the working product
  components/  lib/
  docs/spec.md  docs/reviews/
```

## 7. Commit conventions

One commit per tick, Conventional Commits scoped to the product id, ledger
staged in the same commit:

- `feat(prod-a): scope spec and milestone plan`
- `feat(prod-a): m1 — <milestone title>`
- `fix(prod-a): hardening pass`
- `feat(prod-a): shipping surfaces`

## 8. Invariants specific to SaaS fleets

- The depth bar is part of the gate from milestone 1, not a final-stage
  afterthought.
- Mock-first integrations, credential-presence selection, no silent
  fallback (see the core skill's operations reference).
- Everything but payments; assert the boundary in tests.
- No product ships placeholder or fabricated copy.
- Stop scoping new products at `maxItems`; watch the review approval rate —
  near-100% means the reviewer prompt needs tightening.
