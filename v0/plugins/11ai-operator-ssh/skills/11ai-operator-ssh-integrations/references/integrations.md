# SSH integrations reference

## Git hosting

```bash
ssh -T git@github.com
git remote set-url origin git@github.com:ORG/REPO.git
```

Two accounts on one machine need one alias each, and `IdentitiesOnly yes` is not optional:

```ini
Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_personal
    IdentitiesOnly yes

Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_work
    IdentitiesOnly yes
```

```bash
git remote set-url origin git@github-work:ORG/REPO.git
```

Without `IdentitiesOnly yes` the agent offers every key and the host authenticates as whichever matches first — which is how commits end up attributed to the wrong account, intermittently and confusingly.

### Deploy keys

A deploy key is scoped to one repository, which is what makes it the right credential for a server. A personal key on a server grants access to everything that person can reach.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_deploy_REPO -C "deploy key for REPO on HOST" -N ""
```

An empty passphrase is acceptable here only because unattended automation cannot type one — which is exactly why the key must be scoped read-only to a single repository. Add the public half in the repository's deploy key settings and leave write access off unless the server genuinely pushes.

```ini
Host github-REPO
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_deploy_REPO
    IdentitiesOnly yes
```

### Commit signing over SSH

The authentication key and the signing key are separate registrations even when the key material is identical.

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true

echo "name@example.com $(cat ~/.ssh/id_ed25519.pub)" >> ~/.ssh/allowed_signers
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
```

```bash
git log --show-signature -1
```

Without the allowed-signers file the host shows commits as verified while local verification reports no signature. The key is fine; the local trust list is missing.

## Restricted authorized_keys entries

The restrictions live in the file, ahead of the key. This is the difference between a stolen key being a shell and being one script.

```text
command="/usr/local/bin/deploy.sh",from="203.0.113.0/24",no-agent-forwarding,no-port-forwarding,no-pty,no-X11-forwarding ssh-ed25519 AAAAC3Nz... deploy@ci
```

- `command=` runs only that command, whatever the client asks for. The client's requested command is available to the script as `SSH_ORIGINAL_COMMAND`, so the script must validate it rather than execute it.
- `from=` limits the source addresses. Use it wherever the caller's range is known.
- `no-pty` prevents an interactive terminal.
- `no-port-forwarding` stops the key being used to tunnel into the network.

```bash
ssh USER@HOST 'ls -la ~/.ssh/authorized_keys'
ssh USER@HOST 'ssh-keygen -lf ~/.ssh/authorized_keys'
```

Test the restriction by trying to break it. Verifying only that the allowed command works proves nothing about the restriction:

```bash
ssh -i ~/.ssh/id_deploy USER@HOST 'id'
ssh -i ~/.ssh/id_deploy -N -L 15432:localhost:5432 USER@HOST
```

Both must be refused. Append entries with `>>`; a single `>` replaces the file and removes every other key, locking out other people and other automation.

## Bastion and jump hosts

```ini
Host bastion
    HostName bastion.example.com
    User jump
    IdentityFile ~/.ssh/id_bastion
    IdentitiesOnly yes

Host app-*
    HostName %h.internal.example.com
    User deploy
    IdentityFile ~/.ssh/id_deploy
    IdentitiesOnly yes
    ProxyJump bastion
```

```bash
ssh app-01
ssh -v app-01 2>&1 | grep -i 'proxy\|jump'
```

`ProxyJump` opens a connection through the bastion and authenticates to the final host from your machine, so the bastion never holds your key or a usable authentication channel.

Do not use `ForwardAgent yes` for this. Agent forwarding leaves a socket on the bastion that anyone with root there can use to authenticate as you anywhere your keys are trusted. `ProxyJump` has no such exposure. Chain several hops with a comma:

```bash
ssh -J bastion,relay app-01
```

## Pipeline access

Prefer the provider's own federated access, so nothing is stored. When a key is genuinely needed, keep it short-lived and scoped.

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure SSH
        run: |
          mkdir -p ~/.ssh
          chmod 700 ~/.ssh
          printf '%s\n' "${{ secrets.DEPLOY_KEY }}" > ~/.ssh/id_deploy
          chmod 600 ~/.ssh/id_deploy
          printf '%s\n' "${{ secrets.KNOWN_HOSTS }}" > ~/.ssh/known_hosts
          chmod 644 ~/.ssh/known_hosts

      - name: Deploy
        run: ssh -i ~/.ssh/id_deploy -o IdentitiesOnly=yes deploy@HOST '/usr/local/bin/deploy.sh'
```

The parts that matter:

- **A pinned `known_hosts`.** Generate it once with `ssh-keyscan HOST` and store it as a secret. Using `StrictHostKeyChecking no` instead means the pipeline trusts whatever answers, on every run.
- **`printf` over `echo`** so the key's newlines survive; a mangled key reports a publickey denial.
- **Permissions immediately.** A key written mode 644 is ignored by SSH.
- **A scoped key.** This key should be restricted with `command=` on the host, so leaking the secret leaks one script.

Never `echo` the key or run the step with shell tracing on. Rotate on a schedule, and revoke by removing the entry from the host's `authorized_keys`, not only by deleting the secret.

## Remote Docker context

```bash
docker context create remote --docker "host=ssh://deploy@HOST"
docker context use remote
docker context show
docker ps
```

Needs key-based authentication to the host and a user in the `docker` group there — which is root-equivalent on that host, so the SSH key is effectively a root credential. Scope it accordingly.

This is the safe way to reach a remote daemon. Exposing the daemon on a TCP port without mutual TLS is an unauthenticated remote root shell.

```bash
docker context use default
```

Switch back when finished; a forgotten remote context sends the next `docker rm` to production.

## Deploys with rsync

```bash
rsync -avhn --itemize-changes --delete \
  --exclude='.git/' --exclude='.env' --exclude='node_modules/' \
  -e 'ssh -i ~/.ssh/id_deploy -o IdentitiesOnly=yes' \
  ./dist/ deploy@HOST:/srv/app/current/
```

Dry-run first and read every `*deleting` line. `--delete` makes the destination match the source, so a mistyped or empty source empties the target directory.

The trailing slashes are load-bearing: `./dist/` copies the contents of `dist`, while `./dist` would create `/srv/app/current/dist`.

For a deploy that can be rolled back, write to a new release directory and move a symlink:

```bash
rsync -avh ./dist/ deploy@HOST:/srv/app/releases/GIT_SHA/
ssh deploy@HOST 'ln -sfn /srv/app/releases/GIT_SHA /srv/app/current && systemctl reload app'
```

`ln -sfn` replaces the symlink atomically, so no request sees a half-written directory. Restarting a service is a state change: get approval for that host.

## Remote development

An editor's remote session runs a server process on the host and needs a working `ssh HOST` first — configure and test the host entry before opening the editor.

```bash
ssh -o BatchMode=yes HOST true; echo "exit: $?"
```

Two things to know: the editor's server consumes memory and CPU on the host, which matters on a small instance shared with the application; and connection multiplexing makes it noticeably faster:

```ini
Host dev
    ControlMaster auto
    ControlPath ~/.ssh/cm-%r@%h:%p
    ControlPersist 10m
```

Do not use remote development directly against a production host. Use a dedicated development instance.
