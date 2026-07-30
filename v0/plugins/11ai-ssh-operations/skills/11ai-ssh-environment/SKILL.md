---
name: 11ai-ssh-environment
description: "Inspect the SSH client version, key inventory, agent contents, effective per-host configuration, known-hosts entries, and reachability without changing anything or connecting where it is not needed. Use before an SSH operation, when a connection behaves unexpectedly, when it is unclear which key or user a host will use, or when the user asks whether SSH is set up."
---
# 11ai SSH environment

Establish which key, user, port, and jump host a connection will actually use before opening one. SSH merges configuration from several files and the answer is rarely what a single file suggests. Keep this pass read-only: report what is there and name the next safe step.

## Inspect the client and keys

```bash
ssh -V
ls -la ~/.ssh
ssh-add -l
```

Read the permissions, not just the names. SSH refuses to use a private key that other users can read, and reports it as a failed authentication rather than a permission problem. Private keys need `600`, the directory `700`.

Never print a private key. A file without a `.pub` suffix is private; `ls` and `ssh-keygen -l` are safe, `cat` is not.

## Resolve the effective configuration

```bash
ssh -G HOST
ssh -G HOST | grep -E '^(user|hostname|port|identityfile|proxyjump|identitiesonly|forwardagent) '
```

This is the important step and it connects to nothing. It prints the merged result of `~/.ssh/config`, any `Include` files, `/etc/ssh/ssh_config`, and the built-in defaults, with first-match-wins already applied.

Compare it against what the user expects. A wrong `user`, an unexpected `identityfile`, or a missing `proxyjump` explains most "it worked yesterday" reports.

```bash
ls -la ~/.ssh/config /etc/ssh/ssh_config 2>/dev/null
grep -n '^Include' ~/.ssh/config 2>/dev/null
```

## Check host trust and reachability

```bash
ssh-keygen -F HOST
nc -z -w 5 HOST 22; echo "exit: $?"
ssh -o BatchMode=yes -o ConnectTimeout=5 USER@HOST true; echo "exit: $?"
```

Take these in order, because they separate three different failures: no entry in known hosts, no network path to the port, and no accepted authentication. `BatchMode=yes` stops the command waiting at a password prompt, which is what makes it safe to run unattended.

For a verbose trace when authentication is the open question:

```bash
ssh -v -o BatchMode=yes USER@HOST true 2>&1 | grep -Ei 'offering|authentications that can continue|no more authentication|remote software'
```

Verbose output can include hostnames, usernames, and key fingerprints. Quote only the lines that matter and redact internal hostnames when they are sensitive.

## Interpretation

- **`Permission denied (publickey)`** means the server refused every key offered. Either the right key is not being offered — check `identityfile` and `identitiesonly` in `ssh -G` — or the public key is not in the server's authorized keys.
- **`Host key verification failed`** means the presented key differs from the stored one. Do not remove the entry as an inspection step; report the fingerprint and let the user confirm the host was rebuilt.
- **A connection that hangs** is usually a network path problem — a firewall dropping rather than rejecting. `nc -z` distinguishes it from an authentication failure.
- **`Too many authentication failures`** means the agent offered more keys than the server allows. `IdentitiesOnly yes` on that host fixes it.
- **`Agent admitted failure to sign`** or an empty `ssh-add -l` means the key is not loaded, not that it is wrong.
- **An unexpected `user`** almost always comes from a `Host *` block or a forgotten alias, and `ssh -G` names it.

## Report

State the client version, the keys present with their types and fingerprints, what the agent holds, the effective user, host, port, key, and jump host for the target, whether the host key is known, and which of the three connection stages succeeded. Redact private key material, internal hostnames when sensitive, and any credential in verbose output. End with the smallest next safe command, and hand off to `11ai-ssh-troubleshooting` if a connection is failing or to `11ai-ssh-setup` if the client or a first key is missing.
