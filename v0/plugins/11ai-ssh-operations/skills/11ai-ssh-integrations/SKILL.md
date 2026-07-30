---
name: 11ai-ssh-integrations
description: "Connect SSH to the systems around it, covering Git hosting authentication and signing, deploy keys, pipeline access through ephemeral keys, bastion and jump host chains, restricted authorized_keys entries for automation, remote Docker contexts, rsync-based deploys, and editor remote development. Use when a pipeline or another service needs SSH access to a host, when a repository must authenticate over SSH, or when access must be routed through a bastion."
---
# 11ai SSH integrations

Each of these seams hands an SSH credential to something that is not a person. Decide what that credential may do before creating it: which host, which command, from which addresses, and how it is revoked. An unrestricted automation key is a shell on the host for anyone who reads the file it lives in.

## Name the seam

- **Git hosting** — a personal key for interactive use, a repository-scoped deploy key for a server, and a signing key that is a separate registration from the authentication key.
- **Pipeline access** — a short-lived key held as a secret, or better, the provider's own federated access so nothing is stored.
- **Bastion chains** — a jump host, configured so the bastion never sees your private key.
- **Automation on a host** — an `authorized_keys` entry restricted to one command, one source range, and no forwarding.
- **Remote Docker** — a Docker context over SSH, which needs socket access on the far side.
- **Deploys** — `rsync` over SSH, with the delete policy decided up front.
- **Remote development** — an editor opening a session and running a server on the host.

## Wire one deliberately

1. Inspect first: which keys exist, what `ssh -G` resolves for the host, what is already in the remote `authorized_keys`, and how the pipeline authenticates today.
2. Give each consumer its own key. One key shared between a laptop, a pipeline, and a server means a single compromise revokes everything and you cannot tell which side leaked.
3. Restrict automation keys in the `authorized_keys` entry itself, not only by convention. A `command=` restriction turns a stolen key from a shell into one script.
4. Use `ProxyJump` rather than agent forwarding to reach a host through a bastion. Forwarding lets the bastion authenticate as you elsewhere; a jump host does not.
5. Prefer a read-only deploy key over a personal key on a server, and prefer the provider's federated pipeline access over any stored key.
6. Never commit a private key, and never paste one into a variable, a log, or this conversation. Read [references/integrations.md](references/integrations.md) for the deploy key and signing setup, restricted `authorized_keys` entries, jump host chains, pipeline key handling, Docker contexts, and the rsync deploy shape.

## Verify end to end

- For Git hosting, run `ssh -T git@HOST` and confirm the account or repository named back is the intended one, then clone or fetch once.
- For a restricted key, try something it should not be allowed to do — open a shell, forward a port — and confirm it is refused, not just that the allowed command works.
- For a pipeline, run it and confirm the host accepted the key and that a `known_hosts` entry was verified rather than blindly accepted.
- For a bastion chain, confirm with `ssh -v` that the connection goes through the jump host and that no agent was forwarded.
- For a deploy, dry-run the transfer and read the deletion list before the first real run.

## Report

State the seam wired, which key each consumer uses and its fingerprint, the restrictions placed on it, where the public half was authorized, how it is revoked, the files changed, and the verification evidence including the negative test. Never include private key material. Call out any key that ended up unrestricted, any place agent forwarding is enabled, and anything a person must do on their own machine for the change to take effect.
