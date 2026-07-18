---
name: 11ai-docker-images
description: "Manage Docker images with pull, list, inspect, history, tag, remove, and disk-usage workflows. Use when the user needs to find an image, compare tags, download an image, understand image layers, or remove reviewed image data."
---
# 11ai Docker images

Treat image references as exact identifiers. Preserve registry, repository, tag, and digest information, and prefer inspection before changing local image state.

## Inspect and retrieve

```bash
docker image ls
docker image ls --digests
docker image inspect IMAGE:TAG
docker history IMAGE:TAG
docker pull IMAGE:TAG
```

Use a digest when reproducibility matters. If a tag is mutable or ambiguous, say so and show the resolved digest when available. A pull changes local state but does not change a running container that already exists.

## Tagging

```bash
docker tag SOURCE_IMAGE REGISTRY/REPOSITORY:TAG
```

Verify the source image exists and preserve the exact destination requested by the user. Tagging creates another local reference to the same image; it does not build or copy image data.

## Removal

Before removal, check all containers, including stopped containers, that reference the image:

```bash
docker ps -a --filter ancestor=IMAGE:TAG
docker image inspect IMAGE:TAG
```

Use `docker rmi IMAGE:TAG` only after the user has selected the image. Do not add `-f` to bypass references without explicit approval. For broad cleanup, hand off to `11ai-docker-cleanup` so candidates are measured and reviewed first.

## Reporting

Report the exact image reference, ID or digest, size when relevant, and whether the operation affected only the local cache or a remote registry. Never claim that removing a tag deleted all underlying layers unless Docker confirms no other references remain.
