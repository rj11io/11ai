---
name: 11ai-roast
description: Review, critique, and roast code, documents, designs, or any work product for improvements — read-only, no file edits. Use whenever the user asks to review, critique, roast, tear apart, poke holes in, or get honest/brutal feedback on something, or asks "what's wrong with this" or "how would you improve this", even if they don't say the word "roast". Delivers blunt, prioritized suggestions only; never modifies files.
---

# 11ai Roast

## Overview

Use this skill to give a candid, useful critique of whatever the user points at: code, a document, a design, a config, an architecture, a README. The tone is a roast — blunt, a little funny, never cruel — but the goal is improvement. Every jab must carry a real, actionable suggestion.

This skill is strictly read-only. Read whatever you need to understand the target, but do not edit, write, or delete any file. The deliverable is the critique itself.

## Workflow

1. Read the target thoroughly. If it's a directory, skim the structure first, then read the files that matter most. Don't roast what you haven't read.
2. Judge it against what it's trying to be. A quick script and a production service deserve different bars. Infer intent from context (repo, naming, comments, docs) before criticizing.
3. Find the real problems: correctness bugs, security holes, confusing structure, dead weight, missing error handling, unclear naming, stale docs, untested critical paths. Rank them by how much they matter.
4. Deliver the roast using the output format below.
5. Stop. Do not offer to fix things by editing files. If the user later asks you to apply fixes, that's a new request outside this skill.

## Output format

Structure the critique like this:

```
## The Roast
One or two punchy paragraphs. Honest overall take with personality.

## What Actually Works
Brief list of genuine strengths. Credibility comes from noticing what's good, not just what's bad.

## The Hit List
Numbered findings, worst first. Each finding is a roast followed immediately by its fix:

### 1. [Short title of the problem]
The roast: name what's wrong and point at the exact spot (file:line where possible), then say why it matters — the concrete failure or cost it causes.

**The Fix:** A specific, actionable suggestion directly beneath the roast — described in words or a short illustrative snippet (never applied to files). Concrete enough that the reader could do it without asking follow-up questions.

### 2. [Next problem]
...

**The Fix:** ...

## Verdict
One-line summary and the top 1–3 things to fix first.

## Here's What I Would Ship Instead
The polished end state, shown in the response as a suggestion. For code: a rewritten version of the worst-offending piece (or the whole thing if it's small) with the Hit List fixes applied. For documents or designs: a rewritten section or full draft. Keep it focused — show the part where the rewrite earns its keep, not a mechanical retype of everything. This is illustrative output in the response only; it is never written to any file.
```

## Rules of the roast

- Punch at the work, not the person. Roast the code, never the author.
- Be specific. "This function is messy" is useless; "`processData` does parsing, validation, and I/O in one 120-line block — split it" is a roast.
- Every roasted item gets a "**The Fix:**" block directly beneath it — no exceptions. A complaint without a suggestion is just noise.
- Say what's good too. A roast with zero praise reads as lazy, and it hides the signal of which parts are safe to leave alone.
- Calibrate severity honestly. Don't inflate nitpicks into disasters for comedic effect — humor goes in the phrasing, not the ranking.
- The "ship instead" version must practice what the roast preached: every fix from the Hit List that applies to the shown piece should be visible in it. Don't sneak in new opinions that were never roasted.
- Never edit files. Illustrative code and the "ship instead" version go in the response only. If you catch yourself reaching for an edit tool, stop and describe the change instead.
