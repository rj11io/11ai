---
name: 11ai-bash-processes
description: "Run, background, monitor, and stop processes from the shell, covering exit status and PIPESTATUS, job control, nohup and disown, signals and graceful termination, waiting on background work, timeouts, port and file holders, resource usage, and identifying a process precisely before killing it. Use when a command must run in the background or under a timeout, when a port is occupied, when a process must be stopped, or when a script hangs."
---
# 11ai bash processes

Stopping the wrong process is the failure this skill exists to prevent, so identification always comes before termination. Match the exact process, show it, and only then signal it. A pattern-based kill is a blunt instrument that catches unrelated work.

## Inspect first

```bash
ps -ef | head -20
ps -p PID -o pid,ppid,user,etime,rss,command
pgrep -fl 'PATTERN'
pgrep -c -f 'PATTERN'
lsof -nP -iTCP:PORT -sTCP:LISTEN
lsof -nP -p PID | head -20
```

`pgrep -fl` lists the full command line of every match, which is the check that catches a pattern matching more than intended. Run the count first: if `pgrep -c` returns more than one and you expected one, the pattern is wrong.

For a port conflict, `lsof` names the holder. On Linux without `lsof`:

```bash
ss -ltnp | grep ":PORT "
```

Resource usage, when a process is suspected of being the problem:

```bash
ps -eo pid,ppid,%cpu,%mem,rss,etime,command --sort=-%cpu | head -10
top -l 1 -o cpu 2>/dev/null | head -15 || top -bn1 | head -15
```

## Run and capture status

```bash
command; echo "exit: $?"
output="$(command 2>/tmp/err)"; status=$?
command1 | command2; echo "${PIPESTATUS[@]}"
timeout 30 command; echo "exit: $?"
timeout --kill-after=5 30 command
```

`$?` holds only the last command's status, so a pipeline needs `PIPESTATUS` to see which stage failed. Under `set -o pipefail` the pipeline itself fails when any stage does, which is what you want in a script.

Exit codes worth recognising: `126` not executable, `127` not found, `124` a `timeout` expiry, `130` interrupted by the user, and `128 + N` killed by signal `N` — so `137` is `SIGKILL` and usually means out of memory.

`timeout` belongs on anything that talks to a network or an external service. Without it a hung call blocks a script indefinitely, and `--kill-after` guarantees termination when the process ignores the first signal.

## Background and wait

```bash
command &
pid=$!
wait "$pid"; echo "exit: $?"
```

```bash
pids=()
for target in "${targets[@]}"; do
  process "$target" &
  pids+=("$!")
done

status=0
for pid in "${pids[@]}"; do
  wait "$pid" || status=1
done
exit "$status"
```

Capture `$!` immediately; it changes with the next background command. Always `wait` and check the status — an unwaited background job's failure is invisible, so a script reports success while half its work failed.

For work that must outlive the shell:

```bash
nohup command > /tmp/command.log 2>&1 &
disown
```

`nohup` detaches from the terminal's hangup signal and `disown` removes the job from the shell's table. Redirect both streams to a file, or output is lost. For work on a remote host, a terminal multiplexer is better than `nohup`; see `11ai-ssh-sessions`.

Job control in an interactive shell:

```bash
jobs -l
fg %1
bg %1
kill %1
```

## Stop deliberately

```bash
pgrep -fl 'PATTERN'
kill PID
kill -TERM PID
sleep 5; ps -p PID > /dev/null && echo "still running"
kill -KILL PID
```

Escalate, never start at the top:

1. `SIGTERM` (`kill PID`) asks the process to shut down and lets it flush buffers, finish requests, and close files.
2. Wait. A well-behaved service takes a moment.
3. `SIGKILL` (`kill -9`) only if it has not exited. It cannot be caught, so buffered writes are lost and locks may be left behind.

```bash
kill -INT PID
kill -HUP PID
kill -QUIT PID
kill -0 PID; echo "alive: $?"
```

`kill -0` tests whether a process exists without signalling it. `SIGHUP` makes many daemons reload configuration rather than exit, which is often what is actually wanted.

To stop a process group — a script and its children — signal the negative process group id:

```bash
kill -TERM -PGID
```

Get the group id from `ps -o pgid= -p PID` first.

## Guardrails and reporting

- Identify before you signal. Show the matched process list and its count, and get approval for that specific process when the user did not ask for it to be stopped.
- Never `pkill` or `killall` on a broad name. `pkill node` stops every Node process on the machine, including unrelated editors and servers. Use a specific pattern with `pgrep -fl` first, or a pid.
- Do not reach for `kill -9` first. Use it only after `SIGTERM` was given time.
- Do not stop a process because it looks idle, and do not free a port by killing its holder without checking what the holder is.
- Do not run a command with `&` and no `wait` in a script; failures disappear.
- Do not put a secret on a command line. It is visible in `ps` to every user on the machine.
- Report the process identified with its full command line, the signal sent, whether it exited on `SIGTERM` or needed `SIGKILL`, the exit status or `PIPESTATUS`, and anything left running. If a script hangs rather than a process misbehaving, hand off to `11ai-bash-troubleshooting`.
