---
name: 11ai-operator-git-faq
description: "Answer questions about the 11ai Git operator plugin: which of its skills fits a task, what each skill promises and refuses to do, which actions always need explicit approval, how staging, committing, syncing, branching, tagging, stashing, recovery, and troubleshooting behave, and where the command and triage references live. Routes every question to the plugin's own contracts and references and answers with a citation. Use when a user asks how the Git operator skills behave, which one to run, or what a skill will and will not touch. For questions about Git itself rather than these skills, use the cheatsheet skill instead."
---
# 11ai Git operator FAQ

Answer questions about this plugin by routing them to the plugin's own files, not from
memory. This skill owns no behavior: the sibling skills' contracts and references are the
truth, and the routing table below says which file answers which question. The only
content this skill owns is the job-family map and the glossary.

Mind the boundary with the cheatsheet: questions about Git itself (which command, which
flag) belong to the cheatsheet skill; questions about how these skills behave (what they
promise, guard, refuse, or report) belong here.

## Answer contract

- Read the routed source before answering. Never answer a behavior question from memory.
- Cite the file, and the section when one is named, in every answer.
- If the sources do not cover the question, say so and name the skill that owns the
  behavior. Do not guess.
- Escalate tiers when the question demands it: a question about what a skill promises
  stops at its contract; coverage and lookup questions go to the references.
- If a routed sibling file is missing because only this skill was installed, read the
  same skill's page at https://ai.rj11.io/skills/ followed by the skill name, or the
  rj11io/11ai repository on GitHub, instead.

## Ground-truth ladder

| Tier | Meaning | Sources |
| --- | --- | --- |
| contract | What a skill promises | Sibling SKILL.md files |
| reference | Lookup tables and matrices | Files under sibling references directories |
| behavior | What actually happens, asserted | Sibling scripts and tests |

This plugin ships no scripts or tests, so no routing row carries the behavior tier; the
contracts and references are the deepest available sources.

## Covered skills

- `11ai-operator-git-setup` — machine configuration, identity, signing, and authentication.
- `11ai-operator-git-integrations` — wiring a repository to remotes, CI, LFS, and provider tooling.
- `11ai-operator-git-status` — read-only inspection of repository state.
- `11ai-operator-git-stage` — staging and unstaging only the intended changes.
- `11ai-operator-git-commit` — creating one reviewed local commit.
- `11ai-operator-git-conventional-commits` — composing and validating a Conventional Commits message.
- `11ai-operator-git-sync` — fetching, pulling, and pushing with safeguards.
- `11ai-operator-git-branches` — listing, creating, switching, renaming, and deleting branches.
- `11ai-operator-git-worktrees` — checking out two branches at once.
- `11ai-operator-git-tags-and-releases` — creating, publishing, and correcting tags.
- `11ai-operator-git-stash` — shelving and restoring work deliberately.
- `11ai-operator-git-submodules` — adding, pinning, updating, and removing submodules.
- `11ai-operator-git-hooks` — writing, sharing, debugging, and bypassing local hooks.
- `11ai-operator-git-pull-requests` — opening, reviewing, and landing pull requests.
- `11ai-operator-git-bisect` — finding the commit that introduced a regression.
- `11ai-operator-git-recovery` — undoing and recovering work within an explicit risk boundary.
- `11ai-operator-git-cheatsheet` — quick command, flag, and what-should-I-use answers.
- `11ai-operator-git-troubleshooting` — diagnosing failures from read-only evidence.

## Which skill do I want?

Grouped by job; the plugin README's Choose a skill table carries the full per-skill
detail, and the cheatsheet's decision guide picks a command when the job is Git itself.

| Job | Skills |
| --- | --- |
| Daily flow | status, stage, commit, conventional-commits |
| Sharing work | sync, pull-requests, integrations |
| Parallel work | branches, worktrees, stash |
| Versions and history | tags-and-releases, submodules, bisect |
| Automation | hooks |
| Safety nets | recovery, troubleshooting |
| Learning and setup | cheatsheet, setup |

## Routing table

Every row: a question, the file that answers it, the text to find in that file, and its
tier on the ground-truth ladder.

### Choosing a skill

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| Which Git skill fits my task? | `../../README.md` | "## Choose a skill" | reference |
| Where do I get a quick command or flag answer without a full workflow? | `../11ai-operator-git-cheatsheet/SKILL.md` | "## Quick decision guide" | contract |
| Which command does a given job, and what are its safety notes? | `../11ai-operator-git-cheatsheet/references/command-matrix.md` | "# Git command matrix" | reference |

### Inspection and daily flow

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| How do the skills inspect repository state without changing it? | `../11ai-operator-git-status/SKILL.md` | "## Inspect in layers" | contract |
| How is staging kept to only the intended paths or hunks? | `../11ai-operator-git-stage/SKILL.md` | "## Stage deliberately" | contract |
| What must be true before a commit is created? | `../11ai-operator-git-commit/SKILL.md` | "## Pre-commit gate" | contract |
| How is a Conventional Commits message composed and validated? | `../11ai-operator-git-conventional-commits/SKILL.md` | "## Validate before committing" | contract |

### Sharing work

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| What safeguards apply to fetching, pulling, and pushing? | `../11ai-operator-git-sync/SKILL.md` | "## Push deliberately" | contract |
| When is a force push allowed, and in what form? | `../11ai-operator-git-sync/SKILL.md` | "force-with-lease" | contract |
| How is a pull request opened, kept current, and landed? | `../11ai-operator-git-pull-requests/SKILL.md` | "## Land it" | contract |
| How is a repository wired to remotes, CI, LFS, or provider tooling? | `../11ai-operator-git-integrations/SKILL.md` | "## Name the seam" | contract |
| Which integration seams exist and how is each verified end to end? | `../11ai-operator-git-integrations/references/integrations.md` | "# Git integrations reference" | reference |

### Branching and parallel work

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| How are branches created, switched, renamed, and deleted safely? | `../11ai-operator-git-branches/SKILL.md` | "## Common operations" | contract |
| How do I work on two branches at the same time? | `../11ai-operator-git-worktrees/SKILL.md` | "## Add a worktree" | contract |
| When can a worktree be removed, and which removals need approval? | `../11ai-operator-git-worktrees/SKILL.md` | "## Remove and prune" | contract |
| How is work shelved and restored, and when are stashes deleted? | `../11ai-operator-git-stash/SKILL.md` | "## Delete only by request" | contract |

### History, versions, and automation

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| How are tags created, published, and corrected after they are pushed? | `../11ai-operator-git-tags-and-releases/SKILL.md` | "## Correct a tag" | contract |
| How are submodules added, pinned, updated, and removed completely? | `../11ai-operator-git-submodules/SKILL.md` | "## Remove one completely" | contract |
| How are hooks written so the team keeps them, and how are they shared? | `../11ai-operator-git-hooks/SKILL.md` | "## Write a hook that people keep" | contract |
| Can a local hook be bypassed, and what does that mean for enforcement? | `../11ai-operator-git-hooks/SKILL.md` | "no-verify" | contract |
| How is a regression hunted down to a single commit? | `../11ai-operator-git-bisect/SKILL.md` | "## Establish a reliable check first" | contract |
| How does a bisect session end without leaving the repository detached? | `../11ai-operator-git-bisect/SKILL.md` | "## Recover and reset" | contract |

### Recovery and safety

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| How is lost or broken work recovered, and what evidence comes first? | `../11ai-operator-git-recovery/SKILL.md` | "## Capture evidence" | contract |
| How does recovery pick the least destructive operation? | `../11ai-operator-git-recovery/SKILL.md` | "## Choose the smallest operation" | contract |
| Which actions always require explicit approval across every skill? | `../../README.md` | "## Shared safety contract" | reference |
| How are identity, signing, and authentication set up on a new machine? | `../11ai-operator-git-setup/SKILL.md` | "## Configure authentication and signing" | contract |

### Troubleshooting

| Question | Source | Anchor | Tier |
| --- | --- | --- | --- |
| How is a Git failure diagnosed before anything is changed? | `../11ai-operator-git-troubleshooting/SKILL.md` | "## Classify before fixing" | contract |
| Where is the symptom-to-cause triage table? | `../11ai-operator-git-troubleshooting/references/triage-matrix.md` | "# Git troubleshooting triage matrix" | reference |

## Glossary

Definitions only; the commands, flags, and defaults live in the routed sources above.

| Term | Meaning |
| --- | --- |
| Shared safety contract | The plugin-wide rules every skill follows about inspection, approval, and what is never done |
| Path-scoped command | A command limited to named files or folders so it cannot touch unrelated work |
| Read-only inspection | Looking at repository state with commands that change nothing; the default first step |
| Fast-forward | Moving a branch pointer ahead without creating a merge, possible only when histories have not diverged |
| Force push safeguard | The rule that rewriting a published branch needs explicit approval and the safer lease-checked form |
| Seam | A named connection point between the repository and an outside system, such as a remote or CI |
| Pinned commit | The exact submodule commit a parent repository records and expects |
| Reflog | The local journal of where branch tips pointed before each change; the main recovery source |
| Server-side check | An enforcement that runs on the host, which a local hook bypass cannot skip |
| Triage matrix | The lookup table mapping failure symptoms to likely causes and the smallest repair |
