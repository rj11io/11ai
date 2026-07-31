---
name: 11ai-operator-docker-volumes-and-networks
description: "Inspect and manage Docker named volumes and user-defined networks, including create, connect, disconnect, and remove workflows with checks for live containers and persistent data. Use when a Docker task concerns storage, service connectivity, or isolated project networks."
---
# 11ai Docker volumes and networks

Version baseline: Current stable Docker tooling: Engine 29.x (29.6.2 at this review), Compose v5, and the matching current BuildKit/containerd supplied by the installation. Inspect each component independently because Docker Desktop, Engine, Compose, Buildx, and the API do not share one version.

Separate persistent data from disposable containers. Before changing storage or connectivity, identify the project, attached containers, and whether the data can be recreated.

## Inspect

```bash
docker volume ls
docker volume inspect VOLUME
docker network ls
docker network inspect NETWORK
docker ps -a --format '{{.ID}}\t{{.Names}}\t{{.Mounts}}\t{{.Networks}}'
```

For a Compose project, inspect the Compose file first because names may be project-prefixed and external resources may be declared explicitly.

## Create and connect

```bash
docker volume create VOLUME
docker network create NETWORK
docker network connect NETWORK CONTAINER
docker network disconnect NETWORK CONTAINER
```

Run create or connect operations only when the requested name and intended scope are clear. Do not change a running service's network attachment or mount layout without stating the expected interruption and rollback.

## Remove safely

Check attachments before removal:

```bash
docker ps -a --filter volume=VOLUME
docker network inspect NETWORK
```

`docker volume rm VOLUME` can destroy persistent data. `docker network rm NETWORK` can disconnect services or fail when the network is in use. Never use `docker volume prune` from this skill; hand off broad cleanup to `11ai-operator-docker-cleanup`. Require explicit approval naming each volume or network to remove.

## Troubleshoot

For missing data, inspect the mount source, container user, and volume name before changing permissions. For service-to-service failures, verify both services share the intended user-defined network and use the Compose service name as DNS rather than a hard-coded container IP. Do not recommend exposing a database port merely to test internal connectivity.
