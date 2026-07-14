---
name: 11ai-automation-seed
description: "Add a human idea to an existing agent automation's ledger so the autonomous agent picks it up and works on it in later scheduled runs. Reads the automation's CONDUCTOR.md and ledger.json, checks the idea fits the theme, dedupes it against existing items, writes a well-formed ledger entry carrying a `seed` (the idea, why, constraints), and commits it safely between ticks. Use when the user says \"add this idea to the ledger/queue/backlog\", \"have the agent build X next\", \"seed the automation with these ideas\", or pastes a list of ideas for the fleet. Works with any ledger built on the 11ai-automation method, including 11ai-saas-fleet-automation fleets (seed = a product idea) and 11ai-single-saas-automation products (seed = a feature/capability request)."
---

# Seed the Ledger — queue human ideas for the agent

Seeding lets a human steer an automation without doing the agent's work. You
write a small, well-formed ledger entry that carries the idea; the agent
still does its own scoping tick later (spec, depth bar, milestone plan) —
but from the human's idea instead of researching its own. Because a seeded
item sits at `scoping`, it naturally blocks the agent from self-scoping new
ideas until every human idea is handled: **human ideas take precedence by
construction.**

## Step 1 — Locate and read the automation

Find `ledger.json` and its `CONDUCTOR.md` (ask which automation if the repo
has several). From them, learn: the item schema and id convention, the
`theme`, `capacity`, `maxItems`, and the current item list. Do not proceed
on schema guesses — the entry you write must match what the conductor reads.

## Step 2 — Gather the idea (light interview, batch-friendly)

Per idea, collect — asking only for what the user didn't already give:

- **Title** and a one-sentence summary of what it is.
- **Why** — the problem or value, one or two sentences.
- **Constraints** — must / must-not statements the agent has to honor
  ("no paid APIs", "CLI not web", "reuse the shared auth kit").
- **Links** — any references worth the agent's scoping time.

Do **not** ask for milestones, acceptance criteria, or a spec — producing
those is the agent's scoping job, and pre-writing them badly is worse than
leaving them to the conductor's rules.

## Step 3 — Vet before writing

- **Theme fit.** If the idea falls outside `config.theme`, say so and ask:
  adjust the idea, or widen the theme (a deliberate config change, its own
  commit)? Never silently seed off-theme work — the conductor will fight it.
- **Dedupe.** Read existing items' titles, summaries, and specs. Different
  means different in what the user of the output *does*, not renamed nouns.
  If it collides, show the user the existing item and stop.
- **Cap check.** Seeded items count toward `maxItems`. At the cap, ask
  whether to raise it (config change, same commit) or drop the idea.

## Step 4 — Write the entry

Append to `items` with the next free id, matching the ledger's field shape:

```jsonc
{
  "id": "<next-free-id>",
  "title": "…",
  "summary": "…",
  "status": "scoping",           // always scoping — never further
  "seed": {
    "idea": "<the human's idea, verbatim intent>",
    "why": "…",
    "constraints": ["…"],
    "links": ["…"],
    "seededBy": "<name/handle>",
    "seededAt": "<ISO-8601>"
  },
  "milestones": [],              // the agent plans these in its scoping tick
  "refs": [],
  "lastReview": { "verdict": null, "evidence": null, "notes": null, "at": null },
  "blockedReason": null,
  "createdAt": "<ISO-8601>",
  "updatedAt": "<ISO-8601>"
}
```

Rules: status is always `scoping`; never pre-fill milestones or refs; never
touch any other item; one commit for the whole seeding session.

## Step 5 — Persist safely (a human edit is just another writer)

1. If the tree is dirty or the runner's lock file is held, a tick may be
   mid-flight — wait for it or stop; never write over a running tick.
2. Sync first: fetch and fast-forward, exactly like a tick does.
3. Write the ledger, validate the JSON parses and only `items` (plus agreed
   config changes) differ.
4. Commit `chore(ledger): seed <id> — <title>` (one commit even for a
   batch, listing all ids) and push. If the push is rejected, rebase using
   the ledger merge rule (union by id, more-advanced status wins) and retry.

## Step 6 — Confirm the conductor honors seeds

Conductors generated from this plugin's template handle seeds natively. For
an older or hand-written conductor, check its scoping stage; if it says
nothing about seeds, offer to add this clause to the scoping row:

> If the item carries a human `seed`, build the spec from it — keep its
> intent, honor its constraints, read its links — instead of researching a
> new idea. Never delete or rewrite the `seed`. Seeded items are scoped
> before any self-researched idea is started.

Then tell the user when the idea will be picked up: with `capacity: 1`, the
next tick after the current in-flight item finishes; sooner if the fleet is
idle.
