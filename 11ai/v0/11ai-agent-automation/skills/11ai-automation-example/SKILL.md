---
name: 11ai-automation-example
description: >-
  A complete, generic worked example of the 11ai-automation method (Ledger +
  Conductor + Routine): an autonomous agent that builds and maintains a
  library of tested how-to guides, one milestone per scheduled run. Contains
  a fully filled-in CONDUCTOR.md, a real ledger.json mid-flight, and a runner
  config — every blank in the conductor template made concrete. Use when the
  user wants to SEE the pattern instantiated before writing their own, wants
  a starting point to copy and adapt, or asks "show me an example agent
  automation". For a tailored automation, use 11ai-automation-creator.
---

# Worked example — the How-To Guide Library

A runnable instance of the **`11ai-automation`** method in a simple domain:
an agent that grows a library of how-to guides (each guide teaches one task,
e.g. "set up a systemd user timer"), where every command in every guide has
actually been executed before it ships.

Read the two files in [examples/](examples/) side by side with the core
skill's conductor template — every `<…>` blank is filled in:

- [examples/CONDUCTOR.md](examples/CONDUCTOR.md) — the complete spec.
- [examples/ledger.json](examples/ledger.json) — a ledger mid-flight: one
  guide done, one mid-build, config with caps.
- [examples/runner.conf](examples/runner.conf) — the provider config: one
  `AGENT_CMD` line makes the same automation run on any headless agent CLI,
  with an optional second provider as the reviewer.

## How the pattern maps to this domain

| Concept | Here |
| --- | --- |
| Work item | One how-to guide (`guides/<id>/guide.md`) |
| Milestones | 1: core walkthrough (tested commands), 2: failure modes + troubleshooting, 3: variants (other OS/platform) |
| Depth bar | Every command block executed with output captured to `guides/<id>/transcripts/`; every link resolves; a stranger can follow the guide start to finish on a clean machine |
| Quality gate | `markdownlint`, a link checker, and `node scripts/verify-guide.mjs <id>` (asserts structure, transcript coverage, no placeholders) |
| Review | One fresh-context reviewer per tick; must re-run the verifier and re-execute at least one command block itself |
| Runner | `run-tick.sh` with `AGENT_CMD` from `runner.conf` — works with any headless agent CLI |

## Using it as a starting point

1. Copy `examples/` into a fresh repo; rename the mission, theme, and paths.
2. Swap the depth bar and gate commands for your domain (that is usually the
   only real design work).
3. Prove one tick by hand, then schedule per the core skill's runner
   reference.

The fastest way to design a new automation is to diff your domain against
this one: what is the item, what are its milestones, what would a stranger
need to be able to do, and what command proves it.
