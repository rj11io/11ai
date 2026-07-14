# 11ai Agent Automation

A plugin for building **autonomous agents that ship real, verifiable work on
a schedule** — the Ledger + Conductor + Routine pattern. Eight skills, no
sprawl: the method, a worked example, an idea-seeder that lets a human queue
work for the agent, two SaaS lifecycles (a fleet of products, or one product
at production depth), and creators that generate each tailored automation
from an interview.

---

## The pattern in one minute

| Pillar | What it is |
| ------ | ---------- |
| **Ledger** | One JSON file, the single source of truth: config + work items, each with a `status` and a **milestone plan**. Read first, write last. |
| **Conductor** | One spec the agent re-reads every run: state machine, per-tick algorithm, depth bar, review rule, quality gate. Each run ships **one milestone, then stops**. |
| **Routine** | A scheduler firing a **provider-agnostic** headless agent CLI with a thin trigger prompt and a single-instance lock. |

A run ("tick") is a pure function: `(ledger, conductor) → one milestone → new
ledger`. Three design choices keep the output real, not ceremonial:

- **The tick unit is a milestone** — a complete vertical slice (failing
  checks, implementation, one review, quality gate) in a single run. Never a
  paperwork-only run.
- **A depth bar in the quality gate** — automated probes that prove a
  stranger could actually use the output (for products: real input, a
  persistence round-trip, real interactivity, a live data path, honest copy).
  Green typecheck/lint/build/test alone never finishes an item.
- **Evidence-backed review** — one fresh-context review per tick; approvals
  must cite the commands the reviewer ran, or they don't count.

And it is **provider-agnostic**: the conductor addresses "the agent"; the
runner takes any headless agent CLI (Claude Code, Codex, Gemini, opencode,
Cursor, aider) through one `AGENT_CMD` variable — the reviewer can even run
on a different provider than the worker.

## The skills

| Skill | Use it when |
| ----- | ----------- |
| [**11ai-automation**](skills/11ai-automation/SKILL.md) | You want the method itself: pillars, seven invariants, conductor template + lint checklist, provider-agnostic runner, operations playbook. |
| [**11ai-automation-example**](skills/11ai-automation-example/SKILL.md) | You want to see the pattern instantiated — a complete conductor + ledger for a how-to guide library — or a starting point to copy. |
| [**11ai-automation-creator**](skills/11ai-automation-creator/SKILL.md) | You want an automation for a goal of your choice: it interviews you, then generates conductor, ledger, runner, and depth bar. |
| [**11ai-automation-seed**](skills/11ai-automation-seed/SKILL.md) | You have an idea for a running automation: it vets and dedupes the idea, writes a `seed` entry to the ledger, and the agent scopes it on a later tick — human ideas before its own. |
| [**11ai-saas-fleet-automation**](skills/11ai-saas-fleet-automation/SKILL.md) | Your work items are SaaS products: the ready-made lifecycle with the five-probe depth bar and the payments boundary. |
| [**11ai-saas-fleet-automation-creator**](skills/11ai-saas-fleet-automation-creator/SKILL.md) | You want a product-fleet automation for your niche: it interviews you about theme, stack, and caps, then generates everything. |
| [**11ai-single-saas-automation**](skills/11ai-single-saas-automation/SKILL.md) | You have ONE product to deepen to production grade: ledger items are capabilities, gated by a production bar — accounts and tenant isolation, test-mode payments, migrations, and a growing spine e2e. |
| [**11ai-single-saas-automation-creator**](skills/11ai-single-saas-automation-creator/SKILL.md) | You want that single-product automation set up for your product: it interviews you, then generates PRODUCT.md, the conductor, a pre-seeded capability backlog, and the runner. |

## Layout

```
11ai-agent-automation/            (plugin root)
  .claude-plugin/plugin.json
  README.md
  skills/
    11ai-automation/                 # core method
      SKILL.md
      references/                    # conductor-template, runner, operations
      scripts/run-tick.sh            # provider-agnostic runner (AGENT_CMD, flock)
    11ai-automation-example/         # filled-in instance (+ examples/)
    11ai-automation-creator/         # interview → generated automation
    11ai-automation-seed/            # human queues an idea into a ledger
    11ai-saas-fleet-automation/            # many products: fleet lifecycle + depth bar
    11ai-saas-fleet-automation-creator/    # interview → generated product fleet
    11ai-single-saas-automation/           # one product: production-depth lifecycle
    11ai-single-saas-automation-creator/   # interview → generated single-product automation
```

## Getting started

- **Fastest:** ask for an automation — "create an agent automation that
  keeps X going" — and let a creator skill interview you and generate the
  files.
- **To understand it first:** read
  [11ai-automation/SKILL.md](skills/11ai-automation/SKILL.md) (5 minutes),
  then the [worked example](skills/11ai-automation-example/SKILL.md).
- **Either way:** prove one tick by hand before scheduling anything.
- **Once it's running:** drop ideas in anytime — "add this idea to the
  ledger" — and the agent picks them up before inventing its own.
