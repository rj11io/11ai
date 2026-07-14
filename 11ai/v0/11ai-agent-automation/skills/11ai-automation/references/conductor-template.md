# Conductor template

Copy this into your automation's `CONDUCTOR.md` and fill in every `<…>`. The
agent re-reads this file every run and obeys it exactly. Spend your care here:
the automation is only as good as this spec. When done, run the lint checklist
at the bottom against your draft.

---

```markdown
# <Name> Conductor

Instructions for the autonomous agent that <one-sentence mission>. The agent
runs on a schedule. **Each run ships exactly ONE milestone, then stops.** Only
one run happens at a time, so work is strictly serial.

## 0. Ground rules

- **One milestone per tick.** A milestone is a complete vertical slice:
  failing checks authored, work done, one review passed, quality gate green,
  everything persisted in one commit. Never two; never half.
- **Capability is progress.** A tick that only adds copy, styling, docs,
  tests, or review notes does not advance `status`.
- **Source of truth** is `<path/to/ledger.json>`. Read it first, write it
  last, in the same commit as the work.
- **Isolate every item.** All work for an item lives under `<items/<id>/>`.
  Never break another item or shared infrastructure.
- **Never persist broken or shallow output.** The gate (§6) includes the
  depth probes. If it cannot pass after the review loop, set the item
  `blocked` and stop.
- **Never commit secrets.** Empty keys in `.env.example` only.

## 1. Ledger schema

```jsonc
{
  "version": 1,
  "config": {
    "capacity": 1,             // items in-flight at once
    "maxItems": <n>,           // stop creating new items here
    "reviewMaxIterations": 2,  // critique→revise loops per tick
    "theme": "<domain>",
    "modelTier": "capable"     // named tier; the runner maps it to a real model
  },
  "items": [
    {
      "id": "item-001",
      "title": "…",
      "summary": "…",
      "status": "scoping",     // see §2
      "seed": null,            // optional: human-written idea {idea, why, constraints,
                               // links, seededBy, seededAt} — see the seeding skill
      "milestones": [          // written during scoping; the build plan
        { "id": "m1", "title": "…", "status": "todo" }   // todo | done
      ],
      "refs": ["items/item-001/spec.md"],
      "lastReview": { "verdict": null, "evidence": null, "notes": null, "at": null },
      "blockedReason": null,   // non-null exactly when status === "blocked"
      "createdAt": "…", "updatedAt": "…"
    }
  ]
}
```

## 2. State machine

```
scoping → building (one tick per milestone) → hardening → shipping → done
(any stage) → blocked
```

| status      | what one tick does |
| ----------- | ------------------ |
| `scoping`   | Research a new item in `theme` (dedupe against every existing item). **If the item carries a human `seed`, build the spec from it — keep its intent, honor its constraints, read its links — instead of researching a new idea; never delete or rewrite the `seed`.** Write the spec: problem, user, scope, **the depth bar for this item** (§5), and a plan of 3–7 milestones, each a user-visible capability with numbered testable acceptance criteria. Review, persist → `building`. |
| `building`  | Take the first `todo` milestone. Author its failing checks, implement to green, run the review (§4) and the gate (§6), mark the milestone `done`. When the last milestone is done → `hardening`. |
| `hardening` | ONE evidence-driven pass: fix real defects, harden real input paths, budget real hot paths. §5's anti-theater rule applies — if a check needs an invented threat, skip it and say so in the commit. → `shipping`. |
| `shipping`  | Build the outward surfaces (landing, pricing → request-access, docs — for SaaS, see the `11ai-saas-fleet-automation` skill) with real copy. The captured lead/output must be persisted and retrievable. → `done`. |
| `done`      | Terminal. |
| `blocked`   | Terminal until a human clears `blockedReason`. |

## 3. Per-tick algorithm

1. **Sync** (§3a). Abort cleanly if you cannot reach a clean, current baseline.
2. **Load** the ledger.
3. **Pick the single next action**, in this order:
   1. Skip `blocked` items.
   2. If in-flight items `< capacity` and total `< maxItems` and nothing is
      `scoping` → start a new item. (A human-seeded item sits at `scoping`,
      so it is handled before any new self-scoped idea — by design.)
   3. Else advance the furthest-along unfinished item by one stage/milestone.
      Tiebreak: oldest `updatedAt` first.
   4. Nothing actionable → log "idle", exit with no changes.
4. **Do the work**, including the review (§4) and the gate (§6).
5. **Persist**: update the item (`status`, `milestones`, `updatedAt`,
   `lastReview`, `refs`) — touch nothing else — and commit the ledger with the
   work in one commit: `<type>(<item-id>): <milestone title>`. Push. Stop.

## 3a. Sync (start of EVERY tick)

1. Dirty tree → a prior run died mid-write. Restore tracked files, log, exit.
2. `git fetch origin` → `git merge --ff-only origin/<branch>`; if that fails,
   `git pull --rebase origin <branch>`.
3. Ledger conflict rule: union `items` by `id`; keep the more-advanced
   `status`; later `updatedAt` breaks ties; union `refs`. Exception: one side
   `blocked` wins unless the other side has a later `updatedAt` AND a null
   `blockedReason` (an explicit human clear wins).
4. Any other unresolvable conflict → abort, log, exit. Never force-push.

## 4. Review (once per tick)

After the milestone's work, get ONE review from a fresh context — a sub-agent
if your CLI has one, otherwise a second headless CLI call (see runner.md §5).
Give it the acceptance criteria and the deliverable. Require:

- `verdict`: approved | changes_requested
- `evidence`: the exact commands/probes the reviewer ran and their results.
  **An approval with no evidence is invalid — treat it as changes_requested.**
- `notes`: numbered, actionable fixes (if any)

Persist to `<items/<id>/reviews/<stage>-<n>.md>` (hard cap: 60 lines — a
critique longer than the diff it reviews is theater). Revise and re-review up
to `reviewMaxIterations`; still failing → keep status, save notes for the next
tick; genuinely stuck → `blocked`.

## 5. Depth bar (paste your domain's bar here)

> For SaaS/software products, copy the five-probe bar from the
> `11ai-saas-fleet-automation` skill. For other domains, write 3–6 automatable
> probes that prove a stranger could actually use the output. Include the
> anti-theater rule: never manufacture a concern to have something to fix or
> test.

## 6. Quality gate (before every commit)

```bash
<typecheck>
<lint>
<build>
<test>            # includes the milestone's checks and the depth probes
```

All green or nothing persists. The only allowed red: the failing checks you
author at the START of a milestone, inside the same tick, before you make
them pass. Red never gets committed on its own.

## 7. Failure branches

- Gate cannot pass after the review loop → `blocked` + `blockedReason`,
  commit nothing broken, stop.
- Rate limit / network / auth hiccup → abort the tick, change nothing, log.
  **Do not block the item** — transient is not blocked (operations.md §3).
- Auth to the remote missing → log and exit. Never prompt, never force.
```

---

## Lint checklist — run against your draft before scheduling

Blockers (fix before the first scheduled run):

1. Every stage names its exact deliverable and the status it advances to.
2. The priority order has a stated tiebreak (no "pick one" ambiguity).
3. Empty-ledger and idle behavior are both defined.
4. Every failure branch ends in "persist nothing, log why, stop."
5. The depth bar exists, is domain-specific, and each probe is automatable.
6. The review section requires evidence and caps critique length.
7. The gate lists literal commands, not "run the tests".
8. The ledger merge rule is written down, including the blocked exception.
9. The trigger prompt is thin — it points here and adds nothing.
10. No vendor CLI names inside the conductor; only the runner knows the CLI.

Ambiguity smells — if you find 5+, do a rewrite pass: "good", "appropriate",
"handle edge cases", "as needed", "etc.", any stage without a named next
status, any check without a command.
