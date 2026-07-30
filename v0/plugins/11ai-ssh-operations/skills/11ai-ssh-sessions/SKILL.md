---
name: 11ai-ssh-sessions
description: "Open interactive SSH sessions and run remote commands non-interactively, covering batch mode and timeouts, quoting and here-documents, exit status and output capture, jump hosts, connection multiplexing, long-running work under tmux or screen, and safe handling of commands that change a remote host. Use when a command must run on a remote machine, when a session must be opened or kept alive, or when remote output has to be captured reliably."
---
# 11ai SSH sessions

Every command in this skill runs on someone else's machine, so the target and the command are both decisions to confirm. Read before you write remotely: inspect the host's state first, and treat anything that installs, restarts, deletes, or reconfigures as requiring explicit approval for that exact command on that exact host.

## Inspect the target first

```bash
ssh -G HOST | grep -E '^(hostname|user|port) '
ssh -o BatchMode=yes -o ConnectTimeout=5 HOST true; echo "exit: $?"
ssh HOST 'hostname; uptime; df -h /; free -m 2>/dev/null || vm_stat'
```

Confirm the effective host and user before anything else. Running a correct command on the wrong host is the failure mode this step exists to prevent, and `ssh -G` catches an alias pointing somewhere unexpected.

Then read the host's state — hostname, load, disk, memory — before changing it. A deploy onto a full disk fails halfway.

## Run commands non-interactively

```bash
ssh -o BatchMode=yes -o ConnectTimeout=10 HOST 'COMMAND'
ssh HOST 'set -euo pipefail; COMMAND1 && COMMAND2'
ssh HOST bash -s <<'REMOTE'
set -euo pipefail
cd /srv/app
git rev-parse --short HEAD
REMOTE
```

The details that decide whether this behaves:

- `BatchMode=yes` fails instead of waiting at a password prompt. Without it, an unattended command can hang forever on a prompt nobody will answer.
- Single-quote the remote command. Double quotes let the local shell expand variables first, so `"$HOME"` becomes your home directory, not the remote one.
- The remote command runs through a non-login shell by default, so `PATH` and profile settings may differ from an interactive session. A command that works when you log in and fails here is usually this.
- A here-document with `bash -s` is the readable way to run several lines, and quoting the delimiter as `'REMOTE'` stops local expansion inside it.
- Start remote scripts with `set -euo pipefail` or a failing step will be ignored and the whole run reports success.

Capture status and output separately:

```bash
output=$(ssh -o BatchMode=yes HOST 'COMMAND' 2>/tmp/ssh-err); status=$?
echo "exit: $status"
```

`ssh` returns the remote command's exit status, except `255`, which it uses for its own connection failures. Distinguish the two before concluding the command failed.

## Interactive and long-running work

```bash
ssh HOST
ssh -J bastion.example.com HOST
ssh -t HOST 'sudo systemctl status SERVICE'
```

`-t` forces a terminal, which anything prompting for input needs. `-J` routes through a jump host without exposing your keys to it.

For work that outlives the connection, run it under a terminal multiplexer rather than backgrounding it — a dropped connection kills a plain background job:

```bash
ssh HOST 'tmux new-session -d -s deploy "bash /srv/deploy.sh 2>&1 | tee -a /tmp/deploy.log"'
ssh HOST 'tmux ls'
ssh -t HOST 'tmux attach -t deploy'
```

To make repeated commands fast, reuse one connection:

```ini
Host *
    ControlMaster auto
    ControlPath ~/.ssh/cm-%r@%h:%p
    ControlPersist 10m
```

That removes the handshake from every subsequent command. Be aware the socket keeps an authenticated channel open for its lifetime; use a short `ControlPersist` on a shared machine.

## Safety and reporting

- Confirm the host before every state-changing command, and name it in the confirmation you ask for. "Restart the service" is not approval for a specific host.
- Never pipe a downloaded script into a remote shell. Fetch it, read it, then run it.
- Treat `sudo`, package installs, service restarts, `rm`, and configuration edits as requiring explicit approval for that command on that host. Do not restart a service because it looks idle.
- Do not use `ForwardAgent` to make a remote Git operation work unless the host is trusted; a deploy key on the server is the safer answer.
- Redact hostnames when internal, and never echo tokens or credentials that appear in remote output or environment variables.
- Prefer running the project's own script over reconstructing an ad hoc command sequence.

Report the effective host and user, the exact command run, the exit status, the relevant output with secrets redacted, and what changed on the remote host. If the connection itself failed with `255`, hand off to `11ai-ssh-troubleshooting` rather than retrying the command.
