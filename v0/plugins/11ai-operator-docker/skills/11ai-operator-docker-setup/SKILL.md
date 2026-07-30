---
name: 11ai-operator-docker-setup
description: "Install Docker Engine or Docker Desktop and configure contexts, the Compose plugin, buildx builders, socket permissions, registry credential helpers, and daemon resource limits, then verify the client reaches the intended daemon. Use when Docker is not installed, when the daemon is unreachable on a new machine, when a context or builder must be created, or when the user asks how to get Docker working."
---
# 11ai Docker setup

This is the one Docker skill that changes the machine, so establish what is already there before installing anything. `11ai-operator-docker-environment` inspects without touching; use it first and let its findings decide what this skill needs to do.

## Check what exists

```bash
docker version
docker info
docker context ls
docker compose version
docker buildx version
```

A missing client, an unreachable daemon, and a permission denial look similar and need different fixes. Read the error text before acting: `command not found` means no client, a client version with no server section means the daemon is not answering, and a socket permission error means the client found the daemon but may not talk to it.

## Install

Pick the distribution that matches the machine's role:

- **Docker Desktop** for a developer workstation on macOS or Windows. It bundles the engine, Compose, buildx, and a virtual machine, and it manages resource limits through its own settings.
- **Docker Engine** for a Linux server or continuous integration host, installed from the official repository so the Compose and buildx plugins arrive with it.

Use the operating system's documented installation steps. Do not install `docker.io` from a distribution's default repository when the project expects a current engine, and do not install the standalone `docker-compose` binary — the Compose plugin is invoked as `docker compose` and is what current documentation assumes.

Read [references/setup.md](references/setup.md) for the per-platform install commands, the socket permission fix, context creation for a remote daemon, buildx builder setup, and daemon configuration.

## Configure

Configure only what the work needs, in this order:

1. **Socket access on Linux.** Adding a user to the `docker` group grants root-equivalent access to the host. Explain that tradeoff and get agreement before doing it; never reach for `sudo docker` as a silent workaround or change socket permissions directly.
2. **Context**, when the daemon is not local. A context names a daemon endpoint so commands do not need a repeated flag. Confirm which context is active before any state-changing command.
3. **Buildx builder**, when builds need more than one platform or a shared cache.
4. **Registry credentials**, through the platform's credential helper rather than a password on the command line.
5. **Resource limits**, when builds are being killed for memory.

## Verify

```bash
docker run --rm hello-world
docker context show
docker compose version
```

Confirm the active context is the intended daemon, that Compose and buildx respond, and that a container actually runs. A successful `docker info` proves the daemon answers, not that images can be pulled or containers started.

## Guardrails

- Do not restart the daemon, switch contexts, prune anything, or change firewall rules to finish an installation without explicit approval.
- Do not add a user to the `docker` group without stating that it is equivalent to giving that user root on the host.
- Do not print registry credentials, credential-helper output, or the contents of `~/.docker/config.json`.
- Do not disable TLS verification, add an insecure registry, or expose the daemon on a TCP port to make a connection work. An exposed daemon without mutual TLS is a remote root shell.
- Leave an existing working installation alone. Report the version found rather than upgrading as a side effect.
- Report the client and server versions, the active context, Compose and buildx availability, what was changed, and the verification output. If the daemon still does not answer, hand off to `11ai-operator-docker-troubleshooting`.
