# Original directive

The one-line form this skill was expanded from. Verbatim, unedited:

```text
when speaking: be very succinct, sacrifice grammar in favor of simplicity, use lists, never use em dashes, show examples or snippets, when making changes tell me where to look to verify those changes, when identifying problems also suggest a fix, when working with code leave a conventional commit message at the end of your response that i can copy.
```

Keep it exactly as written. It works standalone, and it is the fallback.

## When to use the one-liner instead

- The skill file is not loaded and you want the register in one message.
- Context is tight. The line costs about 50 tokens. `SKILL.md` costs about 900.
- You are setting the register in a tool that takes plain instructions, not
  skills: a system prompt, a project rules file, a memory entry, a chat message.
- Something in the expanded skill is fighting you and you want the plain original
  behavior back.

Paste it as-is. No preamble needed.

## What the expansion added

`SKILL.md` maps one to one onto the eight clauses. Nothing was dropped, nothing
was reinterpreted:

| Clause in the original | Where it lives now |
| --- | --- |
| be very succinct | `## Rules`, first bullet |
| sacrifice grammar in favor of simplicity | `## Rules`, second bullet |
| use lists | `## Rules`, third bullet |
| never use em dashes | `## Rules`, fourth bullet, plus an example |
| show examples or snippets | `## Rules`, fifth bullet |
| when making changes tell me where to look to verify those changes | `## Rules`, sixth bullet, plus an example |
| when identifying problems also suggest a fix | `## Rules`, seventh bullet |
| conventional commit message at the end, copyable | `## Rules`, eighth bullet, expanded in `## Commit message` |

`## Commit message` is the one clause that needed more than a bullet. It pins the
format (`type(scope): summary`), the allowed types, and the placement (own fenced
block, last thing in the reply). The original leaves all three to the reader,
which is fine in a chat message and not fine in a skill file.

Two sections in `SKILL.md` are additions, not part of the original:

- `## Cut these` names the specific things to delete. Easier to follow than
  "be succinct" on its own.
- `## Keep these` says short is not vague, and that numbers, paths, exact error
  text, and stated uncertainty always survive.

The one-liner leaves both to the reader's judgment, which is why it stays short.
If the expansion ever drifts from the eight clauses above, the one-liner wins.

## Revisions

The directive is edited in place, not versioned. Latest form is the one at the
top of this file. What changed, so a fallback lands on the right shape:

| Date | Change |
| --- | --- |
| 2026-08-05 | First recorded form. Six clauses, ending at "also suggest a fix." |
| 2026-08-05 | Added the seventh clause: a copyable conventional commit message closing any response that touched code. |
| 2026-08-07 | Reworded "sacrifice grammar" to "sacrifice grammar in favor of simplicity." Added a clause: when making changes, say where to look to verify them. Eight clauses total. |
