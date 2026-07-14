# Operations — keeping the loop healthy

Everything you need after the first scheduled fire: recovery, failure triage,
budgets, secrets, logs, and schema changes.

---

## 1. Git recovery playbook

The sync (conductor §3a) prevents most trouble. When it still goes wrong:

| Symptom | Meaning | Fix |
| --- | --- | --- |
| Dirty tree at tick start | A prior tick died mid-write | Do NOT pile work on it. `git restore .`, remove untracked debris, log, exit. Next tick starts clean from the ledger. |
| Truncated/garbled tracked file | Kill during a write (common on network mounts) | `git show HEAD:<path> > <path>` restores it, then proceed with the sync. |
| Push rejected ("fetch first") | Remote moved during the tick | Re-run the sync (fetch, rebase with the ledger merge rule), push again. **Never force-push** — the reflog will not save a shared branch. |
| "could not read Username" | Headless auth missing/expired | Log and exit. Fix the token out-of-band. Never prompt. |
| Stranded `.git/*.lock` files | Hard kill mid-git-operation | Safe to move aside (`mkdir -p .git/locktrash && mv .git/*.lock .git/locktrash/`) **only because the conductor is strictly serial** — verify the lock is not held by a live process first. |
| Whole tree modified, empty diff | CRLF churn on a Windows host | Set `core.autocrlf`, restore, never commit that noise. |

Avoid network/no-unlink mounts for the working copy if you can — a normal
local disk removes the two ugliest rows above.

## 2. Blocked items: triage and the CLEAR protocol

`blocked` is for **permanent, human-actionable** problems. Reviving one:

1. Read `blockedReason` and the item's last persisted review.
2. Fix the root cause (credential, broken dependency, impossible criterion —
   amend the spec if the spec was the problem).
3. **CLEAR:** set `blockedReason: null`, keep the item's status at the stage
   that failed, commit that as its own `chore(<id>): clear block` commit.
4. The next tick re-enters at the start of the failed stage.

Guard against thrash: track `blockedCount` on the item; after 3 clears for
the same root cause, stop clearing and either amend the spec or abandon the
item deliberately. Auto-recovery (a tick that clears blocks itself) needs the
same counter plus a cooldown — otherwise block→clear→block burns every tick.

If a stale runner lock (noclobber fallback) blocks all ticks: confirm no
agent process is alive, then remove the lock file. With `flock` this cannot
happen.

## 3. Transient vs permanent — and budgets

The single most common operations bug in unattended fleets: marking items
`blocked` on a rate limit.

- **Transient** (429, network blip, provider outage): abort the tick, change
  nothing, log `rate_limit_abort`. The item stays where it was; the next
  scheduled fire retries naturally. If 429s recur, **widen the schedule
  interval, not the retry count**.
- **Permanent** (missing credential, impossible criterion, structural gate
  failure): `blocked` with a reason a human can act on.

Budgets: put `tickBudget` (tokens or currency, whatever your provider
reports) in the ledger config. Reserve a fraction (~40%) for the review loop
— it is the most likely site of runaway spend. On budget exhaustion mid-tick:
abort cleanly (`budget_abort`), do not block the item. Append one JSON line
per tick to `logs/cost.jsonl`: `{at, item, stage, spend, outcome}` where
outcome ∈ `ok | idle | budget_abort | rate_limit_abort | blocked | error`.

## 4. Secrets and adapters

- Real credentials never enter the repo. `.env.example` carries **empty**
  keys; each integration gets a doc with setup steps and exact key names.
- Adapters are selected by the **presence of the credential**, not a build
  flag: key present → live, absent → mock. Write a test for the selection.
- **Never fall back to mock silently when a credential was expected** — that
  silently converts real work into fake work. Expected-but-missing credential
  is a `blocked` reason (permanent, human-actionable).
- Mock fixtures mirror the live response shape exactly, so the swap is
  config, not code. (And per the depth bar: a mock is never the only
  implementation of a product's data path.)
- Never pass secrets as CLI arguments — they show up in `ps` output. Env vars
  or files with tight permissions.

## 5. Observability

- **One JSON line per tick** appended to `logs/ticks.jsonl`: `{at, item,
  stage, milestone, outcome, durationSec, commit}`. Write it **after** the
  commit — a log line for work that never persisted misrepresents the ledger.
- Exit codes from the runner: 0 progress, 1 idle, 2 clean abort, 3 error.
  Schedulers and CI can alert on 3s without parsing logs.
- Liveness triad: **healthy** (recent progress lines), **idle** (idle lines —
  fine, capacity or maxItems reached), **stalled** (no line for 3× the tick
  interval — the scheduler or lock is wedged; investigate the host, not the
  conductor).
- A health digest is a read-only script over the ledger + ticks.jsonl (counts
  by status, last advance per item, block list). It **never mutates** state.
  Log pruning is a separate housekeeping cron, never done inside a tick.
- Watch one more number: **review approval rate**. If the trailing rate is
  ~100%, the reviewer is rubber-stamping — tighten the evidence requirement
  or switch `REVIEWER_CMD` to a different provider (runner.md §5).

## 6. Ledger schema changes

Keep migrations forward-only, idempotent, and tolerant:

- **Additive change** (new optional field)? If a fresh item without it would
  not break the state machine, just start writing it — no version bump.
- **Breaking change**: bump `version`, and spend one dedicated tick on the
  migration — the migration IS that tick's single action, never combined
  with work.
- Removing a field is three steps across versions: stop writing → stop
  reading → clean up.
- When the merge rule meets mixed versions: **migrate after the union, not
  before**, and keep the higher version.
- Rollback is forward-fix-only: a new migration, never a revert of the
  ledger.
