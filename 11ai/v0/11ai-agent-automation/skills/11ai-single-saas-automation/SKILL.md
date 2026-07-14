---
name: 11ai-single-saas-automation
description: >-
  Agent automation that builds and continuously deepens ONE SaaS product to
  production grade, on the 11ai-automation method (Ledger + Conductor +
  Routine). Where the fleet skill ships many demo-grade products, this one
  pours every tick into a single product: ledger items are CAPABILITIES of
  the product (auth, billing, the core feature, admin, notifications), each
  built milestone-by-milestone against a production depth bar — real
  accounts with tenant isolation, payments in provider test mode, schema
  migrations, error/empty/loading states, rate limiting, and a growing
  cross-capability "spine" e2e that must stay green forever. Use when the
  user wants an autonomous agent working on one real product ("keep building
  my app", "deepen this SaaS", "take this product to production quality").
  For many small products instead, use 11ai-saas-fleet-automation. To set a
  new single-product automation up via interview, use
  11ai-single-saas-automation-creator.
---

# Single-SaaS Agent Automation — one product, production depth

Drop-in lifecycle for the **`11ai-automation`** conductor when the goal is
**one product that keeps getting deeper**, not a fleet that keeps getting
wider. The unit changes: a ledger item is not a product, it is a
**capability** of the product — and the product is never "done", it has a
backlog that humans and the agent keep feeding.

The fleet skill optimizes for breadth and caps depth on purpose (demo-grade,
payments deliberately absent). This skill removes those caps: the depth bar
here is a production bar.

---

## 1. Product-level artifacts (exist before any capability)

- **`PRODUCT.md`** — the product's constitution, re-read every scoping tick:
  mission, target user, the core job, positioning, the capability map (what
  exists, what is planned), and product-wide conventions (design tokens,
  data-model overview, permission model). Scoping decisions must agree with
  it; changing it is a deliberate human-approved commit, never a side effect.
- **The spine e2e** — one end-to-end test of the product's core journey
  (sign up → do the core job → see the result persist). Every capability
  that ships **extends** the spine, and the spine must stay green in every
  gate from then on. The spine is the product-level answer to "did we break
  the whole while building the part."

## 2. Config

```jsonc
{
  "capacity": 1,
  "maxItems": 40,               // open backlog cap, not a lifetime limit
  "reviewMaxIterations": 2,
  "product": "<name> — <one-line mission>",   // replaces theme
  "stack": "<one line>",
  "payments": "test-mode",      // "test-mode" | "boundary" | "live" (live needs a human)
  "modelTier": "capable"
}
```

## 3. The production depth bar

The fleet's five probes (real input, persistence round-trip, interactivity,
live data path, honest copy) are **table stakes** — assumed, not the bar.
On top, automated probes must prove, per capability where it applies:

1. **Accounts and tenancy.** Real signup/login/session; authorization
   enforced per user; a data-isolation test proves user A cannot read or
   mutate user B's data through any endpoint the capability adds.
2. **Payments in test mode** (when the product monetizes). A real checkout
   flow against the provider's test keys; subscription state handled
   (created, canceled, past-due) and reflected in what the user can do. No
   live charging until a human flips `payments: "live"`. If config says
   `"boundary"`, the fleet rule applies instead (pricing real, CTAs →
   request-access, no checkout).
3. **Durability.** Schema changes ship as migrations, never manual edits;
   every user-facing state has error / empty / loading handling; every
   endpoint the capability adds validates input; public endpoints are
   rate-limited.
4. **Integration.** The capability is wired into navigation, permissions,
   and the data model — no orphan features — and the spine e2e is extended
   to cross it and passes.
5. **Operability.** Errors are captured somewhere a human can see (log,
   error tracker hook); local dev can seed realistic data with one command.

Anti-theater still applies: probes attach to surfaces the capability
actually has. A capability with no public endpoint needs no rate-limit test
— say so in the spec instead of inventing one.

## 4. State machine (per capability)

```
scoping → building (one tick per milestone) → hardening → integrating → done
(any stage) → blocked
```

| status        | what one tick does |
| ------------- | ------------------ |
| `scoping`     | Pick the highest-`priority` backlog need consistent with `PRODUCT.md` (human `seed`s first — build the spec from the seed, honor its constraints, never rewrite it). Write `capabilities/<id>/spec.md`: the user story, how it touches the data model and permissions, the depth-bar probes that apply (and which don't, with reasons), and 2–5 milestones, each a slice a user can exercise. → `building`. |
| `building`    | First `todo` milestone: author failing checks, implement to green, one evidence-backed review, gate. Last milestone done → `hardening`. |
| `hardening`   | Evidence-driven pass on what this capability really has: defects found by using it, validation, authz edges, migration rollback sanity. Anti-theater rule in force. → `integrating`. |
| `integrating` | Wire into nav/permissions/docs; extend the **spine e2e** through this capability; reconcile any drift with `PRODUCT.md`'s capability map; full suite green. → `done`. |
| `done`        | Terminal for the capability. The product keeps going. |
| `blocked`     | Terminal until a human clears `blockedReason`. |

**Bootstrap rule:** the first item is always the **walking skeleton** —
auth, base layout and navigation, the deploy/build pipeline, the spine e2e
harness, and one thin slice of the core job. Nothing else may be scoped
before the skeleton is `done`.

## 5. Shared codebase rules (this is not the fleet)

Fleet products are isolated folders; a single product is one organism. So:

- A capability may change shared code (schema, shared components, permission
  model) **when its spec names the change** — guarded by the full test suite
  and the spine e2e, never just the capability's own tests.
- Refactors ride along only when the capability needs them; note them in the
  commit body. No drive-by rewrites of code the capability doesn't touch.
- Migrations are forward-only and land in the same commit as the code that
  needs them.
- Extract shared UI/logic when the second consumer appears, not before.

## 6. Prioritization (replaces the core priority order's step 3.3)

1. Skip `blocked`.
2. In-flight `< capacity` and nothing `scoping` → scope the next need:
   seeded items first (by `priority`, then oldest `seededAt`), else the top
   unmet item on `PRODUCT.md`'s capability map.
3. Else advance the in-flight capability by one stage/milestone.
4. Nothing actionable → log "idle", exit. (Idle is rare here — a live
   product can always propose its next capability from the map; genuinely
   idle means the map is exhausted and a human should review `PRODUCT.md`.)

## 7. Commit conventions

One commit per tick, scoped to the capability id, ledger staged in the same
commit: `feat(cap-004): m2 — invite a teammate`, `fix(cap-004): hardening
pass`, `feat(cap-004): integrate — spine e2e through invitations`.

## 8. Invariants specific to single-SaaS depth

- The spine e2e never leaves the gate once it exists; it only grows.
- No capability ships without its data-isolation probe (or a spec'd reason
  it does not apply).
- `PRODUCT.md` changes are deliberate human-reviewed commits, never a tick's
  side effect.
- Payments stay in test mode until a human flips the config.
- Watch the same health numbers as any automation (review approval rate,
  ticks that ship only copy or tests) — plus one more: **spine length.** If
  capabilities keep finishing but the spine e2e stops growing, the agent is
  building orphans.
