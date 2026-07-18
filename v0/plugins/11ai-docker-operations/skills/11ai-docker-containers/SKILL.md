---
name: 11ai-docker-containers
description: "Perform common Docker container operations including run, list, inspect, logs, exec, start, stop, restart, and remove with evidence-first safety checks. Use when the user asks to operate an individual container or wants help understanding its state."
---
# 11ai Docker containers

Operate on one container or a clearly identified set of containers. Inspect first, preserve the user's image, environment, mounts, ports, and network choices, and never guess values that affect behavior.

## Inspect first

```bash
docker ps
docker ps -a
docker inspect NAME
docker logs --tail=200 NAME
docker stats --no-stream NAME
```

Use `docker ps -a` when a container may have exited. Check exit status, health status, restart policy, mounts, published ports, and the image before changing it. If names are ambiguous, use IDs or ask the user to identify the target.

## Common operations

```bash
docker start NAME
docker stop NAME
docker restart NAME
docker logs -f --tail=200 NAME
docker exec -it NAME sh
docker exec NAME COMMAND
docker cp NAME:/path ./local-path
```

Use `sh` first for a shell; only use `bash` when the image is known to contain it. Avoid interactive commands when the user needs a reproducible script.

To create a container, form `docker run` only from user-provided requirements:

```bash
docker run --name NAME -d IMAGE:TAG
```

Add `-p`, `-e`, `--env-file`, `--mount`, `--network`, health checks, and restart policy only when requested or present in the project configuration. Warn that `docker run` creates a new container rather than updating an existing one.

## Removal and replacement

Before removal, inspect mounts and confirm whether the container is disposable. `docker rm NAME` removes the container but not named volumes; `docker rm -v NAME` also removes anonymous volumes. `docker rm -f NAME` stops and removes a running container and requires explicit approval.

If a replacement is needed, capture the old configuration with `docker inspect`, explain what will change, and prefer the project's Compose or deployment definition over reconstructing an ad hoc command.

## Safety and reporting

Do not stop, restart, or remove a container merely because it looks idle. Ask before state-changing actions when the user did not explicitly request them. Report the target, command, result, exit code or health state, and any remaining follow-up.
