# 11ai Comms

How an agent speaks. Registers that set the shape of every reply, plus one-off
communication deliverables like a blunt critique.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-pragmatic`](./skills/11ai-pragmatic/SKILL.md) | Pragmatic, objective, extremely concise replies: lists, an example and source per claim, a fix beside every problem, no file changes while planning, verify pointers after changes, and a copyable scoped conventional commit message after repo work |
| [`11ai-roast`](./skills/11ai-roast/SKILL.md) | Giving a blunt, prioritized, read-only critique of code or another work product |

Pick one register per session. Two registers at once cancel each other out. The
roast is not a register: it is a one-off critique, and it composes with whatever
register is active.

## Register contract

Every skill in this plugin follows the same three rules, stated in its own
vocabulary:

1. **Say what changes the reader's next action.** Cut the rest.
2. **Never cut the evidence.** Numbers, file paths, command names, exact error
   text, and stated uncertainty survive every register. Brevity is not vagueness.
3. **Pair every problem with a fix.** A finding with no proposed action is
   incomplete, however short the reply.

A register controls shape and length. It never changes what is true, and it never
licenses a claim the agent cannot support.
