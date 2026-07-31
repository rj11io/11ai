---
name: 11ai-operator-docker-integrations
description: "Connect Docker to the systems around it, covering continuous integration builds with layer caching, image publishing to registries with short-lived credentials, Compose as a local development dependency stack, development containers, and the image contract an orchestrator such as ECS or Kubernetes depends on. Use when a pipeline must build or publish an image, when local services need to run alongside an application, or when an image must satisfy a deployment target's health, signal, and configuration expectations."
---
# 11ai Docker integrations

Version baseline: Current stable Docker tooling: Engine 29.x (29.6.2 at this review), Compose v5, and the matching current BuildKit/containerd supplied by the installation. Inspect each component independently because Docker Desktop, Engine, Compose, Buildx, and the API do not share one version.

Each Docker integration is a contract about an image: how it is built, how it is named, and what the thing running it expects of it. Establish which side already owns the build, the tags, and the configuration before adding a second owner.

## Name the seam

- **Continuous integration builds** — a pipeline builds the image, needs a cache that survives between runs, and must not hold long-lived registry credentials.
- **Registry publishing** — tags identify what shipped, and a mutable tag makes a rollback impossible to describe.
- **Local development stack** — Compose runs the databases and services an application needs, while the application itself may run on the host or in a container.
- **Development containers** — the editor and the toolchain run inside a container so every contributor gets the same environment.
- **Orchestrator contract** — an image must handle signals, expose a health check, read configuration from the environment, and run as a non-root user for a scheduler to treat it correctly.

## Wire one deliberately

1. Read what exists first: the Dockerfile and its stages, the Compose files and their override order, the pipeline's current build step, the registry and repository names, and how the deployment target selects an image.
2. Keep one owner for the build. A pipeline that builds and a deploy step that rebuilds will eventually ship two different images from one commit.
3. Tag with the commit SHA, and treat a moving tag such as `latest` as a convenience pointer, never as the deployed identity.
4. Use short-lived registry credentials from the pipeline's identity provider. Pass any secret through standard input, never as a command line argument.
5. For a local stack, let Compose own the dependencies and keep the ports, volumes, and environment values in the Compose file rather than in a script that wraps it.
6. For an orchestrator, make the image forward signals to the real process, answer a health check, and read configuration from the environment. Read [references/integrations.md](references/integrations.md) for the pipeline build and cache steps, the publish sequence, the Compose dependency stack, and the image contract checklist.

## Verify end to end

Prove the whole path rather than the build step:

- Run the pipeline and confirm the pushed digest matches what the build produced.
- Pull the published image on a clean machine and run it; a build that only works with the local cache is not reproducible.
- For a local stack, bring it up from nothing with `docker compose up --build` and confirm the application connects to every dependency without a manual step.
- For a deployment target, confirm the running task reports the new digest, that its health check passes, and that stopping it is clean rather than a timeout followed by a kill.

## Report

State the seam wired, the image name and tagging scheme, where the cache lives, how credentials are obtained, the files changed, and the verification evidence including the image digest. Call out anything still manual, and any place where two systems can both build or tag the same image.
