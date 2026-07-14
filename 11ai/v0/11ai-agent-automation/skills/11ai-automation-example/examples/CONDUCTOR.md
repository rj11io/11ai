# How-To Guide Library Conductor

Instructions for the autonomous agent that builds and maintains a library of
**tested how-to guides** — each guide teaches one concrete task, and every
command in it has actually been executed before it ships. The agent runs on a
schedule. **Each run ships exactly ONE milestone, then stops.** Only one run
happens at a time, so work is strictly serial.

## 0. Ground rules

- **One milestone per tick.** A milestone is a complete vertical slice:
  failing checks authored, work done, one review passed, quality gate green,
  everything persisted in one commit. Never two; never half.
- **Capability is progress.** A tick that only tweaks wording, formatting, or
  adds review notes does not advance `status` or mark a milestone done.
- **Source of truth** is `ledger.json` at the repo root. Read it first,
  write it last, in the same commit as the work.
- **Isolate every guide.** All work for a guide lives under `guides/<id>/`.
  Never alter another guide or shared scripts.
- **Never persist broken or untested output.** The gate (§6) must pass. If it
  cannot after the review loop, set the guide `blocked` and stop.
- **Never commit secrets.** Empty keys in `.env.example` only.

## 1. Ledger schema

See `ledger.json` — `config` (`capacity: 1`, `maxItems: 30`,
`reviewMaxIterations: 2`, `theme`, `modelTier`) plus `items[]`, each with
`id`, `title`, `summary`, `status`, `milestones[]` (`todo`/`done`), `refs`,
`lastReview` (`verdict`, `evidence`, `notes`, `at`), `blockedReason`,
`createdAt`, `updatedAt`.

## 2. State machine

```
scoping → building (one tick per milestone) → hardening → shipping → done
(any stage) → blocked
```

| status      | what one tick does |
| ----------- | ------------------ |
| `scoping`   | Pick a NEW task worth a guide within `theme` (dedupe: read every existing guide's title + summary; the new one must teach a different task, not a renamed one). If the item carries a human `seed`, build the spec from it — keep its intent, honor its constraints — instead of picking a task yourself; never delete or rewrite the `seed`. Write `guides/<id>/spec.md`: who needs this, prerequisites, the depth bar (§5) instantiated, and exactly three milestones — m1 core walkthrough, m2 failure modes + troubleshooting, m3 variants (one other OS or platform) — each with numbered testable acceptance criteria. Review (§4), persist → `building`. |
| `building`  | Take the first `todo` milestone. Author the failing verifier assertions for its criteria (extend `scripts/verify-guide.mjs` config for this guide), watch them fail, then write the section — executing every command block and saving output to `guides/<id>/transcripts/<block>.txt`. Review, gate, mark milestone `done`. Last milestone done → `hardening`. |
| `hardening` | Re-execute every command block on a clean shell; fix what broke; verify every link resolves; confirm prerequisites are complete by following them literally. If nothing is broken, record "nothing to harden — all N blocks re-executed clean" in the commit and move on. → `shipping`. |
| `shipping`  | Add the guide to the library index with an honest one-line summary; final read-through for placeholders (`TODO`, `coming soon`, `lorem` — none may remain); confirm the verifier passes with all milestones green. → `done`. |
| `done`      | Terminal. |
| `blocked`   | Terminal until a human clears `blockedReason`. |

## 3. Per-tick algorithm

1. **Sync** (§3a). Abort cleanly if you cannot reach a clean, current baseline.
2. **Load** `ledger.json`.
3. **Pick the single next action**, in this order:
   1. Skip `blocked` items.
   2. If in-flight items `< capacity` and total `< maxItems` and nothing is
      `scoping` → start a new guide.
   3. Else advance the furthest-along unfinished guide by one
      stage/milestone. Tiebreak: oldest `updatedAt` first.
   4. Nothing actionable → log "idle", exit with no changes.
4. **Do the work**, including the review (§4) and the gate (§6).
5. **Persist**: update the guide's ledger entry — touch nothing else — and
   commit ledger + work in one commit: `feat(<id>): <milestone title>`.
   Push. Stop.

## 3a. Sync (start of EVERY tick)

1. Dirty tree → a prior run died mid-write. Restore tracked files, log, exit.
2. `git fetch origin` → `git merge --ff-only origin/main`; if that fails,
   `git pull --rebase origin main`.
3. Ledger conflict rule: union `items` by `id`; keep the more-advanced
   `status`; later `updatedAt` breaks ties; union `refs`. One side `blocked`
   wins unless the other has a later `updatedAt` AND null `blockedReason`.
4. Any other unresolvable conflict → abort, log, exit. Never force-push.

## 4. Review (once per tick)

After the milestone's work, get ONE review from a fresh context (sub-agent,
or the runner's `REVIEWER_CMD`). Give it the milestone's acceptance criteria
and the deliverable paths. Require:

- `verdict`: approved | changes_requested
- `evidence`: the commands the reviewer ran — it MUST re-run
  `node scripts/verify-guide.mjs <id>` itself and re-execute at least one
  command block from the new section, comparing against the saved transcript.
  **An approval with no evidence is invalid — treat as changes_requested.**
- `notes`: numbered, actionable fixes

Persist to `guides/<id>/reviews/<stage>-<n>.md` (max 60 lines). Revise up to
`reviewMaxIterations`; still failing → keep status, save notes; genuinely
stuck → `blocked`.

## 5. Depth bar (checked by the verifier, required before `done`)

1. Every command block in the guide has a transcript in
   `guides/<id>/transcripts/` produced by actually running it.
2. Every external link resolves (HTTP 200/301).
3. The guide is followable start-to-finish: prerequisites listed, each step's
   expected output shown, no step assumes unstated state.
4. Troubleshooting covers at least the failures hit while testing (m2).
5. No placeholder text anywhere.

Anti-theater rule: never invent a failure mode that testing did not surface
just to fill m2 — document only what actually broke or plausibly breaks, and
say so.

## 6. Quality gate (before every commit)

```bash
npx markdownlint-cli2 "guides/**/*.md"
node scripts/check-links.mjs
node scripts/verify-guide.mjs <id>
```

All green or nothing persists. The only allowed red: the verifier assertions
authored at the start of a milestone, inside the same tick, before the
section is written. Red never gets committed on its own.

## 7. Failure branches

- Gate cannot pass after the review loop → `blocked` + `blockedReason`,
  commit nothing broken, stop.
- Rate limit / network hiccup → abort the tick, change nothing, log. Do NOT
  block the guide.
- Remote auth missing → log and exit. Never prompt, never force-push.
