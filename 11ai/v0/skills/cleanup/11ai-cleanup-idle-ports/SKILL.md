---
name: 11ai-cleanup-idle-ports
description: Scan for idle, hanging, or abandoned local ports (usually dev servers left behind by AI agents), report what's open in a compact table, ask the user which ones to clean up, then kill only the processes they picked. Use whenever the user wants to clean up ports or processes, asks "what's running on my ports", complains a port is already in use / EADDRINUSE, mentions leftover or zombie dev servers, or wants to free up a port — even if they only name a single port.
---

# 11ai Cleanup Idle Ports

## Overview

AI agent sessions tend to leave dev servers behind: a Vite preview here, a `python -m http.server` there, an orphaned Next.js instance from a session that ended hours ago. This skill finds them, shows the user a short honest report, lets the user choose what dies, and kills exactly that — nothing more.

Two rules that matter: **never kill a process the user did not explicitly pick**, and **never run this skill's kill step — or any test of it — without that same explicit approval.** The scan and report are read-only and free; the kill always goes through the user first.

## Workflow

### 1. Scan

Run the bundled scanner:

```bash
bash scripts/scan_ports.sh
```

It prints one line per listening process: its ports, PID (process ID), age, CPU%, flags, and command. Flags mean:

- `orphan` — the parent process is gone (PPID 1). Strong signal of abandonment for CLI processes — but on macOS every GUI app is launched by launchd (PID 1), so ignore this flag when the command is an `.app` bundle.
- `dev` — the command looks like a dev server or tool an agent would start (node, vite, python, uvicorn, …).
- `db` — looks like a database (postgres, redis, …). Killing these can lose data — never recommend killing them, and warn if the user picks one.

If the script fails or is missing, fall back to `lsof -iTCP -sTCP:LISTEN -P -n` and gather age/command per PID with `ps -o ppid=,etime=,pcpu=,command= -p <pid>`.

If the user asked about one specific port, still scan everything — the point of the skill is surfacing the other leftovers too — but lead the report with their port.

### 2. Judge

Sort the results into likely-abandoned vs. probably-intentional. Signals that a process is abandoned:

- `orphan` flag on a CLI process (the session that started it is gone; disregard for `.app` bundles, which launchd always parents)
- `dev` flag plus an age of hours or days with ~0.0 CPU (a server nobody is talking to)
- listening on a typical dev port (3000–9999) from a temp, scratchpad, or worktree directory — check with `lsof -a -p <pid> -d cwd` when the command line alone is ambiguous

Signals to leave something alone (list it, but don't recommend killing it):

- `db` flag
- ports below 1024 or anything owned by another user
- recognizable long-lived apps the user runs on purpose (IDE helpers, Docker, browsers, sync clients)
- anything in your own process ancestry — killing your parent kills this session; check with `ps -o ppid= -p $$` up the chain if a candidate PID looks close to home

When in doubt, put it in the report with your honest uncertainty rather than guessing a verdict.

### 3. Report

Keep it succinct — a table plus one line of verdict per row, no essay:

```
| Port(s) | Process        | Age    | Verdict                                  |
|---------|----------------|--------|------------------------------------------|
| 3117    | python http    | 2d 4h  | abandoned — orphaned, idle for 2 days     |
| 5173    | vite (my-app)  | 8h     | likely abandoned — 0% CPU, temp worktree  |
| 5432    | postgres       | 12d    | leave alone — database                    |
```

### 4. Ask

Ask which ones to kill before touching anything. If the AskUserQuestion tool is available, use it with `multiSelect: true` — one option per killable process, labeled by port and process name, with the recommended-to-kill ones listed first. Otherwise ask in plain chat with a numbered list. Always make "none" an easy answer.

If nothing looks abandoned, say so and stop — don't invent candidates to justify the scan.

### 5. Kill

For the selected PIDs only:

```bash
kill <pid> ...            # polite first
sleep 2
kill -0 <pid> 2>/dev/null # still alive?
kill -9 <pid>             # only for survivors
```

### 6. Verify

Re-check the freed ports (`lsof -i :<port>`) and confirm to the user: which ports are now free, and anything that refused to die (rare — usually means a supervisor like nodemon or pm2 respawned it; say so and suggest stopping the supervisor instead).

## Notes

- A single process often holds several ports (e.g. a Next.js server on 3000 and its HMR socket). The scanner groups ports by PID so one choice covers all of them — make that visible in the report.
- Killing by port (`lsof -ti :3000 | xargs kill`) is a fine manual trick but this skill kills by PID from the user's selection, so a port that changed hands between scan and kill never takes out an innocent process.
- This skill only manages local processes. If a port is held by a Docker container, report the container (`docker ps` will show the port mapping) and suggest `docker stop <name>` instead of killing the proxy process.
