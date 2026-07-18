# 11ai Docker operations

Ten standalone skills for common Docker CLI and Compose work, with safety checks around state-changing and destructive commands.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-docker-cheatsheet`](./skills/11ai-docker-cheatsheet/SKILL.md) | Looking up common Docker and Compose commands, flags, and safe patterns |
| [`11ai-docker-environment`](./skills/11ai-docker-environment/SKILL.md) | Checking Docker installation, daemon health, contexts, versions, and permissions |
| [`11ai-docker-containers`](./skills/11ai-docker-containers/SKILL.md) | Running, listing, inspecting, logging, entering, stopping, and removing containers |
| [`11ai-docker-images`](./skills/11ai-docker-images/SKILL.md) | Pulling, listing, inspecting, tagging, and removing images |
| [`11ai-docker-compose`](./skills/11ai-docker-compose/SKILL.md) | Validating and operating multi-container Compose applications |
| [`11ai-docker-build`](./skills/11ai-docker-build/SKILL.md) | Building local images from Dockerfiles and verifying the result |
| [`11ai-docker-registry`](./skills/11ai-docker-registry/SKILL.md) | Logging in, tagging, pulling, and pushing images to registries |
| [`11ai-docker-volumes-and-networks`](./skills/11ai-docker-volumes-and-networks/SKILL.md) | Inspecting and managing named volumes and user-defined networks |
| [`11ai-docker-cleanup`](./skills/11ai-docker-cleanup/SKILL.md) | Measuring Docker disk usage and removing only reviewed, selected resources |
| [`11ai-docker-troubleshooting`](./skills/11ai-docker-troubleshooting/SKILL.md) | Diagnosing daemon, image, container, Compose, storage, network, and build failures |

The skills are intentionally narrow. Combine them when a task crosses boundaries, such as building an image and then publishing it, or diagnosing a Compose service that cannot start.

## Safety contract

Start with read-only inspection. Never delete containers, images, volumes, networks, or build cache without explicit user approval for the specific cleanup. Never push an image, switch Docker context, or expose a port unless the user requested that action or approved the exact command. Do not print passwords, tokens, or credential-helper output.
