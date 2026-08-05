# 11ai Comms

Registers that set how an agent speaks. One skill per communication direction, so
a session can pick a voice and hold it.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-comms-short`](./skills/11ai-comms-short/SKILL.md) | Terse, list-first replies with an example per claim, a fix beside every problem, and a copyable conventional commit message after code changes |

Pick one direction per session. Two registers at once cancel each other out.

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
