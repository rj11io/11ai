# 11ai Docker operator

Twelve standalone skills for common Docker CLI and Compose work, with safety checks around state-changing and destructive commands.

Version baseline: Docker Engine 29.6.2 and Compose v5 at this review, with the BuildKit and containerd versions supplied by the installation. The plugin remains unversioned because Engine, Desktop, Compose, Buildx, API, and runtime components version independently.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-docker-cheatsheet`](./skills/11ai-operator-docker-cheatsheet/SKILL.md) | Looking up common Docker and Compose commands, flags, and safe patterns |
| [`11ai-operator-docker-setup`](./skills/11ai-operator-docker-setup/SKILL.md) | Installing Docker and configuring contexts, Compose, builders, socket permissions, and daemon limits |
| [`11ai-operator-docker-environment`](./skills/11ai-operator-docker-environment/SKILL.md) | Checking Docker installation, daemon health, contexts, versions, and permissions |
| [`11ai-operator-docker-integrations`](./skills/11ai-operator-docker-integrations/SKILL.md) | Connecting Docker to CI builds, registries, local dependency stacks, devcontainers, and orchestrators |
| [`11ai-operator-docker-containers`](./skills/11ai-operator-docker-containers/SKILL.md) | Running, listing, inspecting, logging, entering, stopping, and removing containers |
| [`11ai-operator-docker-images`](./skills/11ai-operator-docker-images/SKILL.md) | Pulling, listing, inspecting, tagging, and removing images |
| [`11ai-operator-docker-compose`](./skills/11ai-operator-docker-compose/SKILL.md) | Validating and operating multi-container Compose applications |
| [`11ai-operator-docker-build`](./skills/11ai-operator-docker-build/SKILL.md) | Building local images from Dockerfiles and verifying the result |
| [`11ai-operator-docker-registry`](./skills/11ai-operator-docker-registry/SKILL.md) | Logging in, tagging, pulling, and pushing images to registries |
| [`11ai-operator-docker-volumes-and-networks`](./skills/11ai-operator-docker-volumes-and-networks/SKILL.md) | Inspecting and managing named volumes and user-defined networks |
| [`11ai-operator-docker-cleanup`](./skills/11ai-operator-docker-cleanup/SKILL.md) | Measuring Docker disk usage and removing only reviewed, selected resources |
| [`11ai-operator-docker-troubleshooting`](./skills/11ai-operator-docker-troubleshooting/SKILL.md) | Diagnosing daemon, image, container, Compose, storage, network, and build failures |

The skills are intentionally narrow. Combine them when a task crosses boundaries, such as building an image and then publishing it, or diagnosing a Compose service that cannot start.

## Safety contract

Start with read-only inspection. Never delete containers, images, volumes, networks, or build cache without explicit user approval for the specific cleanup. Never push an image, switch Docker context, or expose a port unless the user requested that action or approved the exact command. Do not print passwords, tokens, or credential-helper output.
