---
name: 11ai-docker-compose
description: "Operate Docker Compose applications by locating the project file, validating configuration, inspecting services, viewing logs, and managing startup or shutdown safely. Use when the user mentions Compose, a compose.yaml file, a multi-container app, or service-level operations."
---
# 11ai Docker Compose

Treat the Compose file as the source of truth for service names, images, ports, environment, volumes, networks, health checks, and dependencies. Work from the directory containing the selected file unless the user specifies another project directory.

## Discover and validate

Look for `compose.yaml`, `compose.yml`, `docker-compose.yml`, and `docker-compose.yaml`. If there are multiple files or override files, identify which one is intended instead of silently merging an arbitrary set.

```bash
docker compose config
docker compose config --quiet
docker compose ps
```

Use `-f FILE` and `--project-name NAME` only when the project layout or user request calls for them. `config` can reveal missing variables, invalid interpolation, duplicate ports, and service dependency problems before startup.

## Inspect services

```bash
docker compose ps -a
docker compose logs --tail=200 SERVICE
docker compose logs -f --tail=200 SERVICE
docker compose top SERVICE
docker compose exec SERVICE sh
```

Use `docker compose logs` before restarting a failing service. If a shell is unavailable, inspect the image and use a non-interactive diagnostic command rather than guessing.

## Lifecycle operations

```bash
docker compose up -d
docker compose up -d --build SERVICE
docker compose restart SERVICE
docker compose stop SERVICE
docker compose start SERVICE
docker compose pull SERVICE
docker compose build SERVICE
docker compose down
```

Run a lifecycle command when the user explicitly requests it or when the requested task clearly includes that operation. Explain whether it builds, downloads, stops, recreates, or leaves volumes intact. Never add `--volumes` or `--remove-orphans` casually; both can remove state or hide configuration drift. `down --volumes` requires explicit approval after naming the affected volumes.

## Safe handoff

When a service cannot start, collect `config`, `ps -a`, and targeted logs, then hand off to `11ai-docker-troubleshooting`. When cleanup is requested across the project, use `11ai-docker-cleanup` rather than inventing a broad prune command.

Report the Compose file, project name, affected services, exact command, and resulting service state. Redact interpolated secrets from output.
