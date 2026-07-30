---
name: 11ai-ssh-cheatsheet
description: "Answer quick OpenSSH questions with a compact reference for connection flags, key generation and inspection, client configuration keywords, port forwarding forms, agent commands, scp and rsync syntax, and host key handling. Use when someone asks which SSH flag or config keyword to use, how a forwarding form is written, or wants a fast lookup rather than a guided workflow."
---
# 11ai SSH cheatsheet

A lookup surface for OpenSSH. Give the command, name what it changes, and stop. For anything that opens a session, moves data, or edits a remote host, hand off to the matching operation skill.

## Connect and inspect

```bash
ssh USER@HOST
ssh -p 2222 USER@HOST
ssh -i ~/.ssh/id_ed25519 USER@HOST
ssh -v USER@HOST
ssh -G HOST
ssh -T git@github.com
ssh USER@HOST 'uptime; df -h /'
```

`ssh -G HOST` prints the effective configuration after all matching rules are merged. It is the fastest answer to "which key and user will this actually use", and it connects to nothing.

## Keys

```bash
ssh-keygen -t ed25519 -C "name@example.com"
ssh-keygen -t ed25519 -f ~/.ssh/id_work -C "work key"
ssh-keygen -l -f ~/.ssh/id_ed25519.pub
ssh-keygen -y -f ~/.ssh/id_ed25519
ssh-keygen -p -f ~/.ssh/id_ed25519
ssh-copy-id -i ~/.ssh/id_ed25519.pub USER@HOST
```

Use `ed25519` unless the server is old enough to require `rsa -b 4096`. `-l` shows a fingerprint, `-y` recovers a public key from a private one, `-p` changes a passphrase without changing the key.

## Agent

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
ssh-add -l
ssh-add -L
ssh-add -D
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

`ssh-add -l` lists fingerprints, `-L` lists full public keys, `-D` forgets everything.

## Client configuration keywords

```text
Host alias
    HostName server.example.com
    User deploy
    Port 2222
    IdentityFile ~/.ssh/id_deploy
    IdentitiesOnly yes
    ProxyJump bastion.example.com
    ForwardAgent no
    ServerAliveInterval 30
    ServerAliveCountMax 3
    StrictHostKeyChecking accept-new
```

First match wins per keyword, so put specific `Host` blocks above `Host *`. `IdentitiesOnly yes` stops the agent offering every key it holds.

## Port forwarding

```bash
ssh -L 5432:localhost:5432 USER@HOST
ssh -R 8080:localhost:3000 USER@HOST
ssh -D 1080 USER@HOST
ssh -N -f -L 5432:db.internal:5432 USER@BASTION
```

`-L` brings a remote service to a local port. `-R` exposes a local service on the remote host. `-D` opens a local proxy. `-N` runs no command and `-f` backgrounds it, which is the pair used for a tunnel you leave running.

## Copy files

```bash
scp LOCAL_FILE USER@HOST:/remote/path
scp USER@HOST:/remote/file ./local/
scp -r LOCAL_DIR USER@HOST:/remote/path
rsync -avh --dry-run LOCAL_DIR/ USER@HOST:/remote/path/
rsync -avh --progress USER@HOST:/remote/path/ LOCAL_DIR/
sftp USER@HOST
```

A trailing slash on an `rsync` source copies the directory's contents; without it the directory itself is copied inside the destination. Always dry-run first.

## Host keys

```bash
ssh-keygen -F HOST
ssh-keygen -R HOST
ssh-keyscan HOST
```

A changed host key is a warning to investigate, not a line to delete. Confirm the rebuild or the fingerprint out of band before removing the entry.

## Answer format

Lead with the command. Add one line on what it changes and any flag that makes it destructive or externally visible. Name the operation skill when the task goes beyond a lookup: keys to `11ai-ssh-keys`, host entries to `11ai-ssh-config`, forwarding to `11ai-ssh-tunnels`, transfers to `11ai-ssh-file-transfer`, failures to `11ai-ssh-troubleshooting`.
