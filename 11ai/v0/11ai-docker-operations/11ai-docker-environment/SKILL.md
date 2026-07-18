---
name: 11ai-docker-environment
description: "Inspect Docker installation, client and daemon health, active contexts, Compose availability, and local permissions without changing the environment. Use when Docker is not responding, the user asks whether Docker is installed or healthy, or a task needs a safe environment check first."
---
# 11ai Docker environment

Establish what Docker endpoint the CLI is targeting before operating on resources. Keep the first pass read-only and report exact command output or the relevant error.

## Workflow

1. Identify the working directory and operating system when it affects paths or Compose behavior.
2. Run the smallest useful checks:

   ```bash
   docker version
   docker info
   docker context show
   docker context ls
   docker compose version
   docker ps
   ```

3. Classify the result as a CLI problem, daemon problem, context problem, permission problem, or Compose problem.
4. Recommend the least invasive next step. Do not repair, restart, install, or switch contexts unless the user asks for that action.

## Interpretation

- `docker: command not found` means the CLI is missing or not on `PATH`; do not assume a package manager or installation method.
- A client version with no server response usually means the daemon is unavailable, the selected context is unreachable, or access is denied.
- A non-default context changes which Docker daemon receives commands. Confirm the target before any state-changing command.
- `docker info` can fail even when the CLI is installed; quote the daemon error instead of reporting Docker as wholly absent.
- `docker compose version` is a separate capability check. Prefer `docker compose` when available and do not silently fall back to the legacy `docker-compose` binary.
- A permission error is not permission to recommend `sudo` automatically. Explain the tradeoff and ask before changing group membership or using elevated access.

## Optional evidence

When the first checks are inconclusive, collect only relevant details such as `docker context inspect NAME`, `docker system df`, or the platform's service status command. Avoid printing environment variables that may contain credentials. Redact tokens, registry credentials, socket paths that reveal sensitive infrastructure, and unrelated logs.

## Reporting

End with the active context, whether the daemon answered, whether Compose is available, and the next safe action. If a context switch or daemon restart is needed, give the exact command but wait for explicit approval before running it.
