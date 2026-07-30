# Docker integrations reference

## Continuous integration builds

The two things that make a pipeline build usable: a cache that survives between runs, and credentials that are not stored anywhere.

```yaml
permissions:
  contents: read
  packages: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/ORG/REPO:${{ github.sha }}
            ghcr.io/ORG/REPO:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64
```

Points that decide whether this works:

- Without `cache-from` and `cache-to`, every run starts from an empty cache and reinstalls all dependencies. `mode=max` caches intermediate stages too, which matters for a multi-stage build.
- `type=gha` is provider-specific. A registry cache works anywhere: `type=registry,ref=ghcr.io/ORG/REPO:buildcache`.
- Set `platforms` explicitly when the build host and the deployment target differ in architecture.
- For AWS, drop the stored password entirely and assume a role through OpenID Connect, then use `aws-actions/amazon-ecr-login`.

## Dockerfile layering for a cache that actually helps

Copy the dependency manifests, install, then copy the source. Reversing these two makes every source edit reinstall every dependency.

```dockerfile
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

A `.dockerignore` is what keeps the build context small and stops local state from leaking into an image:

```text
node_modules
.git
.env
.env.*
dist
coverage
**/*.log
```

Without it, a local `.env` and the whole `.git` history are sent to the daemon and can end up in a layer.

Never pass a secret with `ARG`. Build arguments are visible in the image history:

```bash
docker history IMAGE:TAG --no-trunc
```

Use a build secret instead, which is mounted for one command and never stored:

```dockerfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
```

```bash
docker buildx build --secret id=npmrc,src=$HOME/.npmrc -t IMAGE:TAG .
```

## Publishing and tagging

```bash
echo "$REGISTRY_TOKEN" | docker login REGISTRY --username USER --password-stdin
docker buildx build --platform linux/amd64 -t REGISTRY/REPO:GIT_SHA --push .
```

Tag with the commit SHA as the deployed identity. Keep `latest` or `main` as a pointer for convenience only — a deployment that names a moving tag cannot be rolled back by description, because nobody can say what `latest` was an hour ago.

Confirm what landed:

```bash
docker buildx imagetools inspect REGISTRY/REPO:GIT_SHA
```

That prints the digest and, for a multi-platform image, the per-platform manifests. The digest is the only identifier that cannot be reused for different content.

## Compose as a local development stack

Let Compose own the dependencies. Wait for them to be genuinely ready, not merely started.

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 10

  api:
    build: .
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://postgres:devpassword@db:5432/app
      REDIS_URL: redis://redis:6379
    ports:
      - "3000:3000"

volumes:
  db-data:
```

The details that trip people up:

- `depends_on` without `condition: service_healthy` only waits for the container to start, so the application still races the database's first-boot initialisation.
- Inside the network, services reach each other by service name and container port — `db:5432`. The `ports` mapping is only for reaching them from the host.
- Named volumes persist across `docker compose down`. Data is removed only by `docker compose down -v`, which is destructive and needs explicit approval.
- Development credentials belong in the Compose file where they are visibly fake. Real secrets belong in an ignored env file referenced with `env_file`.

For an application running on the host against Compose dependencies, publish the ports and point the host's connection string at `localhost`. Do not add the application to the Compose file just to reach the database.

Override for local-only changes rather than editing the shared file. `docker compose up` reads `compose.yaml` then `compose.override.yaml` automatically:

```yaml
services:
  api:
    command: npm run dev
    volumes:
      - .:/app
      - /app/node_modules
```

The anonymous volume on `node_modules` stops the host directory from hiding the modules installed inside the image — the usual cause of a missing-module error that only appears with a bind mount.

Check the merged result before debugging behaviour:

```bash
docker compose config
```

## Development containers

A `.devcontainer/devcontainer.json` reuses the Compose stack so the editor runs in the same environment as the tests:

```json
{
  "name": "app",
  "dockerComposeFile": "../compose.yaml",
  "service": "api",
  "workspaceFolder": "/app",
  "forwardPorts": [3000],
  "postCreateCommand": "npm ci"
}
```

Keep one definition of the environment. A devcontainer that installs a different toolchain than the Dockerfile recreates the problem it was meant to solve.

## The image contract an orchestrator expects

Five properties decide whether a scheduler can manage a container properly.

**Signals reach the real process.** A shell-form `CMD` runs the process under `/bin/sh`, which does not forward `SIGTERM`, so every stop waits out the timeout and then kills the container. Use exec form:

```dockerfile
CMD ["node", "dist/server.js"]
```

Handle the signal and close connections:

```js
process.on("SIGTERM", () => server.close(() => process.exit(0)))
```

For an image that spawns children, add an init process to reap them:

```bash
docker run --init IMAGE:TAG
```

**A health check that tests the dependency path**, not just the port:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
```

Set `start-period` longer than real startup, or a slow-booting container is killed and restarted forever. Never remove a health check to make a status turn green.

**Configuration from the environment**, never baked into the image. One image moves between environments; only its environment variables change.

**A non-root user**, declared in the image so the scheduler does not have to override it:

```dockerfile
USER node
```

**Logs to standard output and standard error.** Writing to a file inside a container means the platform's log collection sees nothing.

Verify the contract locally before deploying:

```bash
docker run -d --name check -p 3000:3000 IMAGE:TAG
docker inspect --format='{{.State.Health.Status}}' check
time docker stop check
docker inspect --format='{{.Config.User}}' IMAGE:TAG
```

A `docker stop` that takes ten seconds is a signal-handling bug. A clean stop returns in well under a second.
