---
name: 11ai-docker-registry
description: "Handle Docker registry workflows for login, logout, pull, tag, and push while protecting credentials and verifying exact image destinations. Use when the user needs to move an image between a local Docker daemon and a registry."
---
# 11ai Docker registry

Treat registry operations as remote or credential-affecting actions. Confirm the registry hostname, repository, tag, active Docker context, and whether the user intends to pull or publish before changing anything.

## Inspect local state

```bash
docker context show
docker image ls
docker image inspect LOCAL_IMAGE:TAG
```

Verify that the source image exists locally for a push. Preserve the exact tag and digest in the report. A registry hostname may be implicit for Docker Hub or explicit for a private registry; do not infer a private destination from a local image name.

## Authenticate carefully

```bash
docker login REGISTRY
docker logout REGISTRY
```

Prefer Docker's interactive or credential-helper flow. Never place passwords, access tokens, or shell-expanded secrets in a command, log, prompt, or report. Do not read or print `~/.docker/config.json` unless the user explicitly asks for a redacted configuration audit.

## Tag and transfer

```bash
docker tag LOCAL_IMAGE:TAG REGISTRY/REPOSITORY:TAG
docker push REGISTRY/REPOSITORY:TAG
docker pull REGISTRY/REPOSITORY:TAG
```

Pushing is an external side effect and requires a clear user request for the exact destination. Before pushing, show the final fully qualified reference and ask for confirmation if the user did not provide it exactly. Pulling can replace a local tag and downloads data; mention that impact.

## Verify and report

After a push or pull, report the registry reference, tag, digest when Docker returns one, and active context. If authentication fails, distinguish missing credentials, expired credentials, insufficient repository permission, and an unreachable registry. Do not retry blindly or advise disabling TLS verification.
