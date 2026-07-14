# 11ai Cleanup

Five skills for finding abandoned local resources and removing only the items the user explicitly selects.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-cleanup-agent-threads`](./11ai-cleanup-agent-threads/SKILL.md) | Finding old conversations and session scratchpads from coding agents |
| [`11ai-cleanup-agent-worktrees`](./11ai-cleanup-agent-worktrees/SKILL.md) | Finding stale Git worktrees and reporting their branch safety |
| [`11ai-cleanup-idle-ports`](./11ai-cleanup-idle-ports/SKILL.md) | Finding abandoned development servers and processes holding ports |
| [`11ai-cleanup-node-modules`](./11ai-cleanup-node-modules/SKILL.md) | Finding large `node_modules` directories in stale projects |
| [`11ai-cleanup-creator`](./11ai-cleanup-creator/SKILL.md) | Creating another scan, review, select, execute, and verify cleanup skill |

The resource-specific skills include read-only scan scripts. Their shared safety pattern is: scan, judge, report, ask, execute, then verify. A scan never authorizes deletion.
