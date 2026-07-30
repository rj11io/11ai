---
name: 11ai-operator-ssh-troubleshooting
description: "Diagnose SSH failures from reproducible evidence, covering unreachable ports, refused connections, publickey denials, wrong user or key selection, file permission problems, agent and passphrase failures, changed host keys, too many authentication failures, forwarding failures, and dropped or hanging sessions. Use when an SSH command fails, when a key that should work does not, when a host key warning appears, or when a session stalls."
---
# 11ai SSH troubleshooting

Separate observed facts from theories. Start with read-only evidence, identify which of the three connection stages failed, and propose the least risky fix. Do not remove a known-hosts entry, regenerate a key, edit a server's authorized keys, or weaken host key checking to test an idea.

## Evidence collection

Use only the checks that fit the symptom:

```bash
ssh -V
ssh -G HOST
nc -z -w 5 HOST 22; echo "exit: $?"
ssh -v -o BatchMode=yes -o ConnectTimeout=5 USER@HOST true 2>&1 | tail -40
ssh-add -l
ls -la ~/.ssh
ssh-keygen -F HOST
```

Three stages fail differently, and naming the stage is most of the diagnosis:

1. **Network** — can anything reach the port. `nc -z` answers this without authentication.
2. **Host key** — does the presented key match the stored one.
3. **Authentication** — does the server accept a key or password.

Capture the exact error text, the exit status, and the relevant verbose lines. Redact internal hostnames when sensitive, and never quote private key material or a token appearing in output. SSH exits `255` for its own failures; any other non-zero status came from the remote command.

The verbose lines worth reading:

```bash
ssh -v USER@HOST true 2>&1 | grep -Ei 'debug1: (Connecting|Offering|Authentications that can continue|Next authentication|Server accepts|Remote protocol)|Permission denied|no mutual'
```

## Classify the failure

- **`Connection timed out` or no response** — a firewall or security group dropping packets, the wrong port, or the wrong address. `nc -z` also times out. Check `ssh -G` for the port, then the network path.
- **`Connection refused`** — the address is reachable and nothing is listening on that port. The service is stopped or listens elsewhere. This is a different problem from a timeout.
- **`Permission denied (publickey)`** — the server refused every key offered. Either the right key was not offered, or its public half is not in the server's authorized keys. `debug1: Offering public key` lines name what was actually tried.
- **A key that should work but does not** — check permissions before anything else. SSH ignores a private key readable by other users, and a group-writable remote home directory or `~/.ssh` makes the server ignore `authorized_keys`. Both surface as a publickey denial.
- **The wrong user or key is used** — a `Host *` block earlier in the config already set the value, because first match wins per keyword. `ssh -G` shows the effective value; `grep -n '^Host'` finds the block.
- **`Too many authentication failures`** — the agent offered more keys than the server permits before disconnecting. Set `IdentitiesOnly yes` and name the key.
- **`Agent admitted failure to sign`, or an empty `ssh-add -l`** — the key is not loaded in the agent, or the agent is not running. Not a key problem.
- **`Host key verification failed` or a changed-key warning** — the host's key differs from the stored one. This is what the check exists for. Confirm out of band that the host was rebuilt before touching `known_hosts`.
- **`no matching host key type` or `no matching key exchange method`** — a current client and an old server disagree on algorithms. Enable the specific algorithm for that host only, never globally.
- **A forward that does nothing** — SSH warns and stays connected when a forward fails. Rerun with `ExitOnForwardFailure=yes`, and check whether the local port was already in use.
- **A session that drops when idle** — a firewall timing out a quiet connection. `ServerAliveInterval 30` keeps it open.
- **`Connection closed by remote host` right after authentication** — usually a server-side restriction: a forced command, a disabled shell, or a full disk on the remote.

## Remediation discipline

1. Reproduce with the smallest read-only command: `ssh -o BatchMode=yes USER@HOST true`.
2. Fix the narrowest cause. Local file permissions and an `IdentitiesOnly` setting are safe; regenerating a key or editing a server's authorized keys is not.
3. State confidence as high, medium, or low and name the evidence you are missing.
4. Make one bounded change, then rerun the original failing command.
5. Never weaken security to get past a symptom. `StrictHostKeyChecking no`, `UserKnownHostsFile /dev/null`, a world-readable key, and a blanket `ForwardAgent yes` each trade a real protection for a shortcut. `accept-new` is the acceptable middle ground for a genuinely new host.
6. Before removing a `known_hosts` entry, confirm the host was rebuilt and compare the new fingerprint against a source that is not the connection itself.

If the client or a first key is missing, hand off to `11ai-operator-ssh-setup`. If the effective configuration is the cause, hand off to `11ai-operator-ssh-config`. If a key must be rotated or authorized, hand off to `11ai-operator-ssh-keys`.

## Report

Conclude with: which of the three stages failed, the exact error text and exit status, the effective user, host, port, and key from `ssh -G`, the root cause or the remaining uncertainty, the exact fix applied or proposed, its impact, how to undo it, and the verification result. Redact internal hostnames and any credential. If a host key changed and the rebuild is unconfirmed, say plainly that the connection should not be trusted until it is.
