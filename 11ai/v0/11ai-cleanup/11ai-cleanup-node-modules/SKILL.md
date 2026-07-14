---
name: 11ai-cleanup-node-modules
description: "Scan for node_modules directories in stale or abandoned projects, report each one's size and age in a compact table, ask the user which to delete, then remove only what they picked. Use whenever the user wants to clean up node_modules, reclaim disk space from old JavaScript/Node projects, complains their disk is almost full, or mentions bloated / forgotten / duplicate node_modules folders — even if they only mention one project."
---

# 11ai Cleanup node_modules

## Overview

Every JavaScript project — including the throwaway ones AI agents scaffold and abandon — grows a node_modules directory that easily runs to hundreds of megabytes. The project gets forgotten; the dependencies stay. This skill finds them, shows which projects have gone quiet, and deletes only the ones the user picks. The good news: this cleanup is recoverable — `npm install` (or pnpm/yarn/bun) rebuilds any node_modules from the project's lockfile.

Two rules that matter: **never remove anything the user did not explicitly pick**, and **never run this skill's delete step — or any test of it — without that same explicit approval.** The scan and report are read-only and free; the cleanup always goes through the user first.

## Workflow

### 1. Scan

Run the bundled scanner. Default root is the user's home directory; pass a narrower root if the user named one (a full home scan can take a minute or two on a big disk — say so before running it):

```bash
bash scripts/scan_node_modules.sh [root]
```

It prints one line per top-level node_modules (nested ones are counted with their parent), biggest first — size, days since the project was touched, last git commit, flags, project path — followed by a TOTALS footer: overall count and disk usage, plus per-flag subtotals with the stale-reclaimable number the report leads with. Flags mean:

- `stale` — the project hasn't been touched in over 60 days. Prime candidate.
- `big` — node_modules over 500 MB. High-value cleanup even if not stale.
- `active` — touched within the last 7 days. Leave alone.

If the script fails or is missing, fall back to `find <root> -type d -name node_modules -prune -print` plus `du -sh` and `stat` per hit.

### 2. Judge

Signals that a node_modules is safe to reclaim:

- `stale` flag, especially together with an old last commit
- the project lives in a temp, scratchpad, or agent-worktree path
- the project has a lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`) — reinstall is guaranteed to reproduce it

Signals to leave something alone (list it, but don't recommend cleaning it):

- `active` flag, or a running dev server whose working directory is that project (cross-check with `lsof` if a port scan was done recently)
- the project this very session is working in
- no lockfile — reinstall would resolve fresh versions, which may differ; flag this in the report so the user decides with eyes open

When in doubt, put it in the report with your honest uncertainty rather than guessing a verdict.

### 3. Report

Keep it succinct — headline numbers first (quote the scanner's TOTALS footer, don't estimate), then a table with one verdict line per row, no essay:

```
Found 12 node_modules directories using 8.4 GB — deleting the 7 stale ones reclaims 5.2 GB.

| Size  | Project              | Last touched | Verdict                              |
|-------|----------------------|--------------|--------------------------------------|
| 1.2G  | ~/dev/old-dashboard  | 8 months ago | reclaim — stale, has lockfile        |
| 640M  | ~/tmp/agent-scaffold | 3 months ago | reclaim — abandoned agent project    |
| 890M  | ~/dev/current-app    | today        | leave alone — active                 |
```

### 4. Ask

Ask which ones to delete before touching anything. If the AskUserQuestion tool is available, use it with `multiSelect: true` — one option per project labeled with path and size, recommended ones first. Otherwise ask in plain chat with a numbered list. Always make "none" an easy answer.

Mention the safety net in the question: any deleted node_modules comes back with `npm install` (or the project's package manager) as long as the project keeps its lockfile — and call out any candidate that has no lockfile.

If nothing looks stale, say so and stop — don't invent candidates to justify the scan.

### 5. Execute

For the selected directories only:

```bash
rm -rf "<project>/node_modules"
```

Delete only the node_modules directory — never the project around it.

### 6. Verify

Confirm each selected directory is gone (`ls "<project>/node_modules"` should fail) and report the headline number — "disk space saved by deleting the detected node_modules: 5.2 GB" — with the per-project breakdown beneath it (sizes come from the scan; use them rather than re-measuring what no longer exists). Flag anything that resisted (usually a permissions issue or a process holding files — name the fix).

## Notes

- The scanner prunes at each node_modules, so a monorepo's nested `packages/*/node_modules` are counted inside the root one — one selection covers the whole tree.
- Global package-manager stores (`~/.npm`, pnpm's content-addressable store) are caches, not project dependencies — out of scope here; mention `npm cache clean` / `pnpm store prune` only if the user asks about them.
