---
name: 11ai-ssh-config
description: "Add and repair entries in the SSH client configuration, covering host aliases, hostnames, users, ports, identity files, jump hosts, keep-alive settings, connection multiplexing, wildcard and pattern matching, Include files, and first-match-wins precedence. Use when a host alias must be created or fixed, when the wrong key or user is being used, when a jump host is needed, or when config changes appear to have no effect."
---
# 11ai SSH config

The client configuration is a merge of several files with first-match-wins precedence per keyword, so read the effective result rather than any single file. A change that appears to do nothing is almost always shadowed by an earlier matching block.

## Read the effective configuration

```bash
ssh -G HOST
ls -la ~/.ssh/config
grep -n '^\(Host\|Match\|Include\)' ~/.ssh/config
```

`ssh -G HOST` prints the merged outcome and connects to nothing. Use it before and after every edit; it is the only reliable check.

The merge order is `~/.ssh/config`, then any `Include` files at the point they appear, then `/etc/ssh/ssh_config`, then built-in defaults. For each keyword the **first** value found wins — unlike most configuration formats, a later block cannot override an earlier one.

That single rule explains most surprises. A `Host *` block at the top of the file sets `User` for everything below it, and a specific host block further down cannot change it. Specific blocks go first; `Host *` goes last.

## Add an entry

```ini
Host deploy
    HostName server.example.com
    User deploy
    Port 22
    IdentityFile ~/.ssh/id_deploy
    IdentitiesOnly yes
    ServerAliveInterval 30
    ServerAliveCountMax 3
```

```bash
ssh -G deploy | grep -E '^(hostname|user|port|identityfile|identitiesonly) '
ssh -o BatchMode=yes deploy true; echo "exit: $?"
```

Preserve what is already there. Append a new block above `Host *`, keep the file's existing indentation, and never rewrite unrelated entries. This file is often hand-maintained and holds access to hosts you cannot see.

The keywords worth knowing:

- `IdentitiesOnly yes` offers only the named key. Without it the agent offers every key it holds, which causes `Too many authentication failures` and can authenticate as the wrong account on a shared host.
- `ProxyJump bastion` routes through a jump host without forwarding your agent to it.
- `ServerAliveInterval` keeps an idle session alive through a firewall that drops quiet connections.
- `ControlMaster` and `ControlPath` reuse one connection for several sessions, which removes the handshake delay on repeated commands.
- `StrictHostKeyChecking accept-new` trusts a first-time host but still refuses when a known host's key changes.

## Patterns, Match, and Include

```ini
Host *.internal.example.com
    ProxyJump bastion.example.com

Match host *.prod.example.com user deploy
    IdentityFile ~/.ssh/id_prod

Include ~/.ssh/config.d/*.conf

Host *
    AddKeysToAgent yes
    ServerAliveInterval 30
```

`Host` matches the name typed on the command line, not the resolved `HostName`. `Match` evaluates conditions including the user and, with `exec`, an arbitrary command — so a slow `Match exec` slows every connection.

`Include` is read where it appears, so its contents participate in first-match-wins from that position. An include placed after `Host *` cannot override anything that block already set.

## Guardrails and verification

- Do not add `StrictHostKeyChecking no` or `UserKnownHostsFile /dev/null` to silence a warning. Both remove the protection against a machine-in-the-middle; use `accept-new` and investigate a changed key.
- Do not set `ForwardAgent yes` under `Host *`. It lets every host you reach use your keys to authenticate elsewhere. Scope it to a single host block when genuinely required.
- Do not put a password, a token, or a private key in this file. It holds no secrets, only settings.
- Do not use `ProxyCommand` with a shell pipeline copied from a search result without reading it; it runs on every connection.
- Keep `~/.ssh/config` at mode `600`. A group-writable config can be edited by another user to redirect your connections.

After any change, confirm with `ssh -G` that the intended values won, then make one real connection with `BatchMode=yes`. Report the alias added or changed, the effective hostname, user, port, key, and jump host, the file and line touched, and the verification exit code. If the effective values are still wrong, the cause is an earlier matching block — find it with `grep -n` and hand persistent failures to `11ai-ssh-troubleshooting`.
