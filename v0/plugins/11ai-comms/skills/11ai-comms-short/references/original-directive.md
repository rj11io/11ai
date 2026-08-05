# Original directive

The one-line form this skill was expanded from. Verbatim, unedited:

```text
when speaking: be very succinct, sacrifice grammar, use lists, never use em dashes, show examples or snippets, when identifying problems also suggest a fix.
```

Keep it exactly as written. It works standalone, and it is the fallback.

## When to use the one-liner instead

- The skill file is not loaded and you want the register in one message.
- Context is tight. The line costs about 30 tokens. `SKILL.md` costs about 600.
- You are setting the register in a tool that takes plain instructions, not
  skills: a system prompt, a project rules file, a memory entry, a chat message.
- Something in the expanded skill is fighting you and you want the plain original
  behavior back.

Paste it as-is. No preamble needed.

## What the expansion added

`SKILL.md` maps one to one onto the six clauses. Nothing was dropped, nothing was
reinterpreted:

| Clause in the original | Where it lives now |
| --- | --- |
| be very succinct | `## Rules`, first bullet |
| sacrifice grammar | `## Rules`, second bullet |
| use lists | `## Rules`, third bullet |
| never use em dashes | `## Rules`, fourth bullet, plus an example |
| show examples or snippets | `## Rules`, fifth bullet |
| when identifying problems also suggest a fix | `## Rules`, sixth bullet |

Two sections in `SKILL.md` are additions, not part of the original:

- `## Cut these` names the specific things to delete. Easier to follow than
  "be succinct" on its own.
- `## Keep these` says short is not vague, and that numbers, paths, exact error
  text, and stated uncertainty always survive.

The one-liner leaves both to the reader's judgment, which is why it stays short.
If the expansion ever drifts from the six clauses above, the one-liner wins.
