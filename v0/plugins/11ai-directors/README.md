# 11ai Directors

Director skills. A director does not do the task, it wraps one: preconditions,
handoff, quality gate, report, abort.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-director-git-main`](./skills/11ai-director-git-main/SKILL.md) | Running a complete repository task directly on main: sync a clean tree, do the task, quality-check, and report, committing or pushing only when explicitly asked |
| [`11ai-director-git-branch`](./skills/11ai-director-git-branch/SKILL.md) | Landing a complete repository task through a branch and pull request: branch from a clean tree, do the task, open a detailed PR, address review comments, merging or closing only when explicitly asked |

The directors wrap a task in a Git transaction; they do not define the task. Name
the work (or the task skill) in the same request, and the director handles
synchronization, cleanliness, rollback, and reporting around it.

## Director contract

Every skill here states these five beats in its own vocabulary:

1. **Preconditions.** What must be true before starting. Refuse to start if not.
2. **Handoff.** What the director drives, and what it never does itself.
3. **Quality gate.** The check that decides done versus not done.
4. **Report.** What the closing message must state.
5. **Abort.** What ends the session, and how state is restored.

Pair a director with any skill that does the work itself. The director supplies
the discipline, not the task.
