---
name: 11ai-docker-troubleshooting
description: "Diagnose Docker and Compose failures from reproducible evidence, covering daemon access, contexts, pulls, builds, container exits, health checks, ports, volumes, networks, and configuration. Use when the user reports a Docker error, a service will not start, or a container behaves unexpectedly."
---
# 11ai Docker troubleshooting

Separate observed facts from hypotheses. Start with read-only evidence, reproduce the smallest failing command, identify the boundary that failed, and recommend the least risky fix. Do not restart, delete, prune, alter credentials, or change firewall and port settings without explicit approval.

## Evidence collection

Use only the checks relevant to the failure:

```bash
docker version
docker info
docker context show
docker ps -a
docker logs --tail=200 CONTAINER
docker inspect CONTAINER
docker image inspect IMAGE:TAG
docker system df
docker compose config
docker compose ps -a
docker compose logs --tail=200 SERVICE
```

Redact secrets, tokens, private environment values, and sensitive bind-mount paths before quoting output. Preserve exact error text and exit codes.

## Classify common failures

- **CLI or daemon unavailable:** distinguish missing CLI, unreachable daemon, wrong context, and permission denial with `docker version`, `docker info`, and context checks.
- **Image pull or authentication:** distinguish DNS or TLS reachability, missing credentials, private repository authorization, an unknown tag, and architecture mismatch. Do not disable TLS verification.
- **Container exits immediately:** inspect the exit code, command, entrypoint, environment, mounts, and last logs. A container is not necessarily broken because its main process completed.
- **Unhealthy service:** inspect the health-check command, start period, dependency readiness, and service logs. Do not remove a health check just to make a status green.
- **Port binding failure:** identify the host process and existing container using the port. Ask before stopping it, changing the port, or exposing a new one.
- **Build failure:** inspect the Dockerfile step, context, `.dockerignore`, platform, base image, and network dependency. Use `--progress=plain` or `--no-cache` only when the evidence supports it.
- **Volume or permission failure:** inspect the mount source, volume name, container user, and filesystem ownership before changing permissions or deleting data.
- **Network or DNS failure:** verify shared user-defined networks, Compose service names, aliases, listening addresses, and application-level ports. Do not use container IPs as a durable fix.
- **Compose configuration failure:** run `docker compose config`, identify missing variables or duplicate resources, and preserve the project’s intended override order.

## Remediation discipline

Give a diagnosis with confidence level and a minimal next command. If the fix changes state, state its impact and request approval when it was not already requested. Prefer editing the project definition or Compose file over one-off mutations when the problem is configuration drift. After remediation, rerun the original failing check and verify the service, logs, health, and connectivity that matter.

## Report

Conclude with the failing boundary, evidence, root cause or remaining uncertainty, exact fix applied or proposed, and verification result. If Docker itself is not healthy, hand off to `11ai-docker-environment` before diagnosing application behavior.
