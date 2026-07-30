---
name: 11ai-ssh-keys
description: "Create, inspect, authorize, rotate, and revoke SSH key pairs, covering key types, passphrases, fingerprints, agent loading, authorized_keys entries with command and source restrictions, and separate keys per identity or per machine. Use when a key must be generated or replaced, when a key needs authorizing on a host, when a key is being retired, or when it is unclear which key a host trusts."
---
# 11ai SSH keys

A private key is a credential that grants access to every host trusting it, so treat every operation here as touching production access. Only the public half — the file ending `.pub` — ever leaves the machine.

## Inspect first

```bash
ls -la ~/.ssh
ssh-keygen -l -f ~/.ssh/id_ed25519.pub
ssh-add -l
ssh -G HOST | grep -E '^identit'
```

Establish what already exists before creating anything. A key present and trusted by the host is the common case, and adding a second one solves nothing while doubling what has to be rotated later.

Never print a private key. Any file in `~/.ssh` without a `.pub` suffix is private: `ls`, `ssh-keygen -l`, and `ssh-keygen -y` are safe, `cat` is not.

## Create a key

```bash
ssh-keygen -t ed25519 -C "purpose or machine name"
ssh-keygen -t ed25519 -f ~/.ssh/id_PURPOSE -C "purpose"
ssh-keygen -t rsa -b 4096 -C "legacy host"
```

Use `ed25519`. Fall back to `rsa -b 4096` only for a server that rejects it. Use `ed25519-sk` when the key should be bound to a hardware device and impossible to copy.

Always set a passphrase, and never accept one typed into this conversation — it is recorded. If the user wants to keep it private, have them run the command themselves.

The comment is the only label a key carries once it is in a server's `authorized_keys`, so make it identify the machine or purpose. A file full of keys commented `user@laptop` cannot be audited.

One key per machine, and a separate key per identity on a shared machine. Copying one private key between machines means a single compromise revokes access everywhere and you cannot tell which machine leaked it.

## Authorize on a host

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub USER@HOST
```

```bash
ssh USER@HOST 'grep -c . ~/.ssh/authorized_keys'
ssh USER@HOST 'ssh-keygen -lf ~/.ssh/authorized_keys'
```

`ssh-copy-id` appends, which preserves the keys already there. When appending by hand, use `>>` — a single `>` replaces the file and can lock out other people and every deploy job.

For an automation key, restrict what it can do in the `authorized_keys` entry itself, using `command`, `from`, `no-port-forwarding`, and `no-pty`. A deploy key that can only run one script is a much smaller loss than a shell. Read [references/integrations.md](../11ai-ssh-integrations/references/integrations.md) for restricted entry shapes.

## Rotate and revoke

Rotation is add, verify, then remove — in that order, never the reverse:

1. Create the new key and authorize it alongside the old one.
2. Verify the new key works on its own: `ssh -o BatchMode=yes -o IdentitiesOnly=yes -i ~/.ssh/id_new USER@HOST true`.
3. Remove the old entry from `authorized_keys` on every host that had it.
4. Delete the old private key locally and remove it from the agent.

Removing first locks you out of the host you need in order to fix it. Before removing any entry, confirm which other people or systems use that key; an `authorized_keys` file is shared state.

For a compromised key, the order changes: revoke everywhere immediately, then create a replacement. Also check the host for other keys added since the compromise.

## Verify and report

```bash
ssh -o BatchMode=yes -o IdentitiesOnly=yes -i ~/.ssh/id_KEY USER@HOST true; echo "exit: $?"
ssh-keygen -l -f ~/.ssh/id_KEY.pub
```

`BatchMode=yes` fails rather than falling back to a password prompt, and `IdentitiesOnly=yes` proves that specific key worked rather than another one the agent offered.

Report the key path, type, comment, and fingerprint; where the public key was authorized; whether the agent holds it; what was removed and from which hosts; and the verification exit code. Never include private key material. If a key that should work does not, check file permissions first and then hand off to `11ai-ssh-troubleshooting`.
