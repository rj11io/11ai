---
name: 11ai-docker-cheatsheet
description: "Answer Docker command questions with a compact, safety-aware reference for containers, images, Compose, storage, cleanup, and diagnostics. Use when the user asks what Docker command or flag to use, wants a quick Docker reference, or needs a command translated into plain language."
---
# 11ai Docker cheatsheet

Use this skill as a reference, not as permission to run commands. Give the smallest command that answers the question, explain the important flag in one sentence, and call out whether it only reads state or changes it.

## Read-only inspection

```bash
docker version
docker info
docker context show
docker context ls
docker ps
docker ps -a
docker system df
docker compose version
```

Use `docker version` to separate client and server problems. Use `docker info` to test daemon access. Treat a non-default context as important context, especially before changing or deleting anything.

## Containers

```bash
docker run --name NAME -d IMAGE
docker ps -a
docker logs --tail=200 NAME
docker inspect NAME
docker exec -it NAME sh
docker start NAME
docker stop NAME
docker restart NAME
docker rm NAME
```

Common run options: `-d` detached, `--name NAME`, `-p HOST:CONTAINER`, `-e KEY=VALUE`, `--env-file FILE`, `-v VOLUME:/path`, `--mount ...`, `--network NETWORK`, and `--restart unless-stopped`. Never invent ports, secrets, or persistent paths that the user did not request.

## Images

```bash
docker image ls
docker image ls --digests
docker pull IMAGE:TAG
docker image inspect IMAGE:TAG
docker history IMAGE:TAG
docker tag SOURCE IMAGE:TAG
docker rmi IMAGE:TAG
```

Prefer immutable digests for reproducible deployments. Check whether a container still references an image before removing it.

## Build and publish

```bash
docker build -t IMAGE:TAG .
docker build --pull -t IMAGE:TAG .
docker login REGISTRY
docker push IMAGE:TAG
```

Building changes local state. Login and push affect credentials or a remote registry, so they require a clear user request. Never echo passwords or tokens.

## Compose

```bash
docker compose config
docker compose up -d
docker compose ps
docker compose logs --tail=200 SERVICE
docker compose exec SERVICE sh
docker compose restart SERVICE
docker compose down
```

Use the discovered Compose file and project directory. `docker compose down --volumes` removes named and anonymous volumes and must never be added casually.

## Storage, networks, and cleanup

```bash
docker volume ls
docker volume inspect VOLUME
docker network ls
docker network inspect NETWORK
docker system df -v
docker builder prune
docker container prune
docker image prune
docker volume prune
docker network prune
docker system prune
```

The last five commands delete resources. Show candidates and ask for explicit approval before running any prune or remove command.

## Answer format

For a quick question, return:

1. the command;
2. what it does;
3. one relevant warning or prerequisite.

If the user supplies an error instead of a question, hand off to `11ai-docker-troubleshooting` and begin with evidence collection.
