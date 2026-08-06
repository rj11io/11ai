# 11ai Directors

Director skills. A director does not do the task, it wraps one: preconditions,
handoff, quality gate, report, abort.

**Status: scaffold.** The plugin holds a placeholder only. No working skill yet.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-directors-placeholder`](./skills/11ai-directors-placeholder/SKILL.md) | Nothing yet. Reserves the plugin and carries the director contract for the first real skill |

## Director contract

Every skill here states these five beats in its own vocabulary:

1. **Preconditions.** What must be true before starting. Refuse to start if not.
2. **Handoff.** What the director drives, and what it never does itself.
3. **Quality gate.** The check that decides done versus not done.
4. **Report.** What the closing message must state.
5. **Abort.** What ends the session, and how state is restored.

Pair a director with any skill that does the work itself. The director supplies
the discipline, not the task.

## Related

`11ai-utils` already holds two working directors, `11ai-director-git-branch` and
`11ai-director-git-main`. Read them before writing a new one. Moving them here is
a separate decision, not part of this scaffold.
