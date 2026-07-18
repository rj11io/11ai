---
name: 11ai-docker-cleanup
description: "Measure Docker disk usage, identify unused containers, images, volumes, networks, and build cache, then remove only resources the user explicitly selects. Use when Docker storage is growing, the user asks to prune Docker, or cleanup candidates need a safety review."
---
# 11ai Docker cleanup

Cleanup is a two-phase operation: inspect and report first, then execute only the user's explicit selection. A prune command does not provide a complete dry run, so never use it as a preview.

## Measure

```bash
docker system df
docker system df -v
docker ps -a
docker image ls -a
docker volume ls
docker network ls
docker builder du
```

Report totals and identify candidates by name, ID, image, age, labels, attachments, and size. Distinguish disposable stopped containers from containers that may hold logs or configuration, dangling images from tagged images, and unused volumes from persistent application data.

## Review candidates

Before proposing removal, check:

- whether a container is referenced by a Compose project or deployment script;
- whether an image is used by any running or stopped container;
- whether a volume contains persistent application data or backups;
- whether a network belongs to an active project;
- whether build cache is useful for an active repository;
- whether the current Docker context is the intended target.

Keep the current session's project and any resource with unclear ownership in the report rather than guessing.

## Candidate commands

```bash
docker container prune
docker image prune
docker image prune -a
docker volume prune
docker network prune
docker builder prune
docker system prune
```

Explain the scope of each command. `image prune -a` removes all images not referenced by a container; `volume prune` can destroy data; `system prune` combines several cleanup classes. Never add `--volumes`, `-a`, or `-f` without explicit approval for that scope. Prefer named, path-scoped removal when the user selects individual resources.

## Execute and verify

Ask for an explicit selection after presenting the candidates and expected reclaimable space. Then run only the approved command or resource removals. Re-run `docker system df` and the relevant listing commands, and report what was removed, what was skipped, and any resources that remained referenced.
