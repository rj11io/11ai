# Docker setup reference

## Install

### macOS

Docker Desktop is the practical choice; it provides the virtual machine the engine needs.

```bash
brew install --cask docker
```

Then launch the application once so it can install its privileged helper. Until it has run, the CLI is present and the daemon is not, which reads as an unreachable daemon.

Colima is a lighter alternative that provides a daemon without Docker Desktop:

```bash
brew install colima docker docker-compose
colima start
```

### Linux, Debian or Ubuntu

Install from Docker's own repository so the Compose and buildx plugins come with the engine:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

The distribution's own `docker.io` package is usually older and often ships without the Compose plugin, so `docker compose` fails while `docker-compose` may exist. Prefer the repository above.

### Verify the install

```bash
docker version
docker compose version
docker buildx version
docker run --rm hello-world
```

## Socket permission on Linux

By default the socket is owned by root, so a non-root user gets:

```text
permission denied while trying to connect to the Docker daemon socket
```

Adding the user to the `docker` group fixes it:

```bash
sudo usermod -aG docker "$USER"
newgrp docker
```

Say this out loud before doing it: membership in the `docker` group is equivalent to root on the host, because any member can start a container that mounts the whole filesystem. On a shared or production machine, prefer rootless mode or a dedicated deploy user.

Never `chmod 666` the socket. That grants the same root-equivalent access to every user and process on the machine.

Rootless mode avoids the group entirely, at the cost of some networking and storage limitations:

```bash
dockerd-rootless-setuptool.sh install
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/docker.sock
```

## Contexts

A context names a daemon endpoint so commands do not repeat a flag.

```bash
docker context ls
docker context create remote --docker "host=ssh://user@host"
docker context use remote
docker context show
```

Over SSH the connection needs key-based authentication to the host and a user with socket access there. This is the safe way to reach a remote daemon.

The unsafe way is exposing the daemon on a TCP port. A daemon on `tcp://0.0.0.0:2375` without mutual TLS is an unauthenticated remote root shell, and hosts get compromised this way within hours of being reachable. If a TCP endpoint is genuinely required, use `2376` with client certificate verification.

Switch back to local with:

```bash
docker context use default
```

Always confirm the active context before a state-changing command. Removing a container on the wrong daemon is the most common context accident.

## Buildx builders

The default builder cannot build for other architectures. Create one that can:

```bash
docker buildx create --name multi --driver docker-container --bootstrap --use
docker buildx ls
docker buildx inspect multi
```

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t REGISTRY/REPO:TAG --push .
```

A multi-platform build cannot load into the local image store, so it needs `--push` or an explicit output. This is why a multi-platform build that "succeeds" leaves nothing behind locally.

To keep the cache between continuous integration runs:

```bash
docker buildx build \
  --cache-from type=registry,ref=REGISTRY/REPO:buildcache \
  --cache-to type=registry,ref=REGISTRY/REPO:buildcache,mode=max \
  -t REGISTRY/REPO:TAG --push .
```

## Registry credentials

Log in through standard input so the secret never reaches the process list or shell history:

```bash
echo "$REGISTRY_TOKEN" | docker login REGISTRY --username USER --password-stdin
```

Without a credential helper, Docker writes a base64-encoded credential into `~/.docker/config.json`, which is encoding rather than encryption. Configure the platform's helper — `osxkeychain` on macOS, `secretservice` or `pass` on Linux, `wincred` on Windows:

```json
{
  "credsStore": "osxkeychain"
}
```

Never print that file, and never commit it.

## Daemon configuration

`/etc/docker/daemon.json` on Linux, or the Docker Desktop settings pane elsewhere. Log rotation is the setting worth adding by default, because unbounded JSON logs are a common cause of a full disk:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Applying it requires a daemon restart, which stops running containers. Ask first, and check what is running before proposing it:

```bash
sudo systemctl restart docker
```

On Docker Desktop, memory and CPU limits live in the application's resource settings. A build killed with exit code 137 was out of memory, and raising that limit is the fix rather than changing the Dockerfile.

## Cleanup after a temporary setup

```bash
docker context rm remote
docker buildx rm multi
docker logout REGISTRY
```
