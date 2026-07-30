---
name: 11ai-operator-ssh-setup
description: "Install or verify an OpenSSH client, create a first key pair, load it into the agent so a passphrase is typed once, set the correct file permissions, add a host entry, and authorize the public key on a server. Use when SSH is missing or unconfigured on a new machine, when a first key must be created and installed, or when the user asks how to get SSH working."
---
# 11ai SSH setup

This is the one SSH skill that changes the machine and can change a server's authorized keys. Confirm which host, which user, and how the public key will get there before creating anything. `11ai-operator-ssh-environment` inspects what already exists; run it first so an existing key is reused rather than replaced.

## Check what exists

```bash
ssh -V
ls -la ~/.ssh
ssh-add -l
```

A usable key already present is the common case. Reuse it. Creating a second key for a host that already trusts the first adds a thing to maintain and fixes nothing.

## Install the client

```bash
command -v ssh ssh-keygen ssh-add
```

The OpenSSH client ships with macOS and with almost every Linux distribution, so a missing client is rare. On Debian or Ubuntu install `openssh-client`; on Windows use the optional OpenSSH Client feature or a Git Bash environment. Do not install a server package when only a client is needed — that opens a listening service nobody asked for.

## Create a key and load it

```bash
ssh-keygen -t ed25519 -C "name@example.com"
```

Accept the default path unless a named key is wanted, and set a passphrase. A key without a passphrase is a plaintext credential: anyone who copies the file has the access.

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
ssh-add -l
```

The agent holds the decrypted key for the session so the passphrase is typed once. Read [references/setup.md](references/setup.md) for persisting it across reboots per platform, the permission requirements, the host entry shape, and the ways to authorize a public key.

Never take a passphrase or a private key through the terminal — both land in shell history and in this transcript. Have the user run `ssh-keygen` themselves if they prefer to type the passphrase privately.

## Set permissions

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519 ~/.ssh/config
chmod 644 ~/.ssh/id_ed25519.pub ~/.ssh/known_hosts
```

SSH silently ignores a private key that other users can read and then reports a failed authentication, so wrong permissions look like a wrong key. Fix them before diagnosing anything else.

## Authorize the key and verify

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub USER@HOST
ssh -o BatchMode=yes USER@HOST true; echo "exit: $?"
```

`ssh-copy-id` appends to the server's `authorized_keys` and needs an existing way in — usually a password or a console. For a hosted Git service, add the public key through its web settings instead and verify with `ssh -T git@github.com`.

Copy only the `.pub` file. Sending a private key to a server, a chat, or a paste site compromises every host that trusts it.

## Guardrails

- Never display, copy, or transmit a private key. Only the `.pub` file leaves the machine.
- Never overwrite an existing key file. `ssh-keygen` prompts before replacing one, and the replacement locks you out of every host trusting the old key.
- Do not disable host key checking or add `StrictHostKeyChecking no` to make a first connection work. Use `accept-new`, which trusts a first-time host but still catches a later change.
- Do not enable `ForwardAgent` by default. It lets the remote host use your keys; scope it to one host block when it is genuinely needed.
- Do not install or enable an SSH server as part of client setup.
- Report the client version, the key path and fingerprint, whether the agent holds it, the permissions set, any host entry added, where the public key was authorized, and the verification exit code. Hand off to `11ai-operator-ssh-troubleshooting` if the connection still fails.
