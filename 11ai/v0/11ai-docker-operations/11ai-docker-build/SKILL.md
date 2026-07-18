---
name: 11ai-docker-build
description: "Build Docker images from a repository Dockerfile with context, ignore-file, tag, cache, and post-build verification checks. Use when the user asks to build or rebuild an image locally, fix a Docker build, or turn an application directory into a tagged image."
---
# 11ai Docker build

Build from the repository's intended Dockerfile and context. Do not silently change the base image, build arguments, target stage, platform, tag, or cache behavior.

## Inspect inputs

Before building, inspect:

- the requested Dockerfile and any alternate `Dockerfile.*` files;
- the build context directory;
- `.dockerignore` and files that are likely to contain secrets;
- Compose or project scripts that already define the canonical build command;
- required `ARG` values and target stages.

If the Dockerfile, context, or output tag is ambiguous, ask a focused question or show the assumed command before running it.

## Build

Use the simplest command that matches the project:

```bash
docker build -t IMAGE:TAG .
docker build -f PATH/TO/Dockerfile -t IMAGE:TAG CONTEXT
docker build --target STAGE -t IMAGE:TAG .
```

Add `--pull`, `--no-cache`, `--build-arg`, `--platform`, or `--progress=plain` only when requested, necessary to diagnose the failure, or already specified by the project. Treat build arguments as potentially sensitive and never print secret values.

## Verify

After a successful build, verify the local result:

```bash
docker image inspect IMAGE:TAG
docker image ls IMAGE:TAG
docker history IMAGE:TAG
```

If appropriate, run a smoke test using the image's declared default command without inventing external ports or credentials. A successful build proves image creation, not that the application starts correctly.

## Diagnose failures

For missing files, check the build context and `.dockerignore`. For dependency or network failures, preserve the failing step and exact error. For cache confusion, explain the cost of `--no-cache` before using it. For architecture errors, compare the requested platform with the host and base image metadata. Do not push a build from this skill; hand off to `11ai-docker-registry` after the user confirms the exact tag and destination.
