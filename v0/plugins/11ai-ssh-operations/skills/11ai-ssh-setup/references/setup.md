# SSH client setup reference

## Client availability

```bash
ssh -V
command -v ssh ssh-keygen ssh-add ssh-copy-id
```

Present by default on macOS and most Linux distributions.

```bash
sudo apt-get install -y openssh-client
```

Install `openssh-client`, not `openssh-server`. The server package starts a listening service, which is a different decision with its own exposure.

On Windows, use the OpenSSH Client optional feature, or the client bundled with Git for Windows. `ssh-copy-id` is not included; append the key manually as shown below.

## Key types

```bash
ssh-keygen -t ed25519 -C "name@example.com"
```

`ed25519` is the default choice: short, fast, and supported everywhere current. Use RSA only for a server too old to accept it:

```bash
ssh-keygen -t rsa -b 4096 -C "name@example.com"
```

For a hardware-backed key, which cannot be copied off the device:

```bash
ssh-keygen -t ed25519-sk -C "name@example.com"
```

A named key when one machine holds several identities:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_work -C "work"
```

Always set a passphrase. Without one the private key is a plaintext credential, and a stolen laptop or a synced backup folder hands over every host that trusts it.

Change a passphrase later without changing the key:

```bash
ssh-keygen -p -f ~/.ssh/id_ed25519
```

## Agent persistence

The agent caches the decrypted key so the passphrase is typed once per session.

### macOS

```ini
# ~/.ssh/config
Host *
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile ~/.ssh/id_ed25519
```

```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

`UseKeychain yes` stores the passphrase in the login keychain, so it survives a reboot.

### Linux

Most desktop sessions start an agent automatically. Check before starting another:

```bash
echo "${SSH_AUTH_SOCK:-no agent socket}"
ssh-add -l
```

If there is none, start one per shell session:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

Putting `eval "$(ssh-agent -s)"` directly in a shell profile starts a new agent for every terminal, leaving orphaned processes. Prefer the desktop keyring, or a helper such as `keychain` that reuses one agent.

```ini
Host *
    AddKeysToAgent yes
```

### Verify

```bash
ssh-add -l
```

An empty list with a working key file means the agent is not holding it. `Agent admitted failure to sign` means the same thing.

## Permissions

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 600 ~/.ssh/config
chmod 644 ~/.ssh/id_ed25519.pub
chmod 644 ~/.ssh/known_hosts
```

```bash
ls -la ~/.ssh
```

A private key readable by other users is refused with `UNPROTECTED PRIVATE KEY FILE` on some versions and silently skipped on others, which then reports `Permission denied (publickey)`. This is the first thing to check when a key that should work does not.

On the server, the requirements are just as strict:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

The home directory itself must not be group-writable. A group-writable home is a common cause of key authentication failing on a freshly provisioned server with everything else correct.

## Host entry

```ini
# ~/.ssh/config
Host deploy
    HostName server.example.com
    User deploy
    Port 22
    IdentityFile ~/.ssh/id_deploy
    IdentitiesOnly yes
    ServerAliveInterval 30
    ServerAliveCountMax 3
```

```bash
ssh deploy
```

- `IdentitiesOnly yes` offers only the named key. Without it the agent offers everything it holds, which triggers `Too many authentication failures` and can authenticate as the wrong account on a shared host.
- `ServerAliveInterval` keeps an idle session from being dropped by a firewall.

Check the merged result rather than the file:

```bash
ssh -G deploy
```

## Authorizing a public key

The easy path:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub USER@HOST
```

It needs an existing way in — a password, or a console session. It appends rather than replaces, so an existing key keeps working.

Manually, when `ssh-copy-id` is unavailable:

```bash
cat ~/.ssh/id_ed25519.pub | ssh USER@HOST 'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

Note `>>` and not `>`. A single redirect replaces the file and removes every other key, which can lock out other people and other automation.

For a hosted Git service, paste the public key into the account settings rather than using `ssh-copy-id`, then:

```bash
ssh -T git@github.com
```

A message naming your account is success, even though it also says the shell access is not provided.

## Host key trust

```ini
Host *
    StrictHostKeyChecking accept-new
```

`accept-new` trusts a host the first time and still refuses if a known host's key later changes. `no` disables the check entirely and removes the protection against interception — do not use it.

To verify a first connection properly, get the fingerprint from the provider out of band and compare:

```bash
ssh-keyscan HOST 2>/dev/null | ssh-keygen -lf -
```

When a key has genuinely changed because a host was rebuilt:

```bash
ssh-keygen -F HOST
ssh-keygen -R HOST
```

Confirm the rebuild before removing the entry. A changed key on a host nobody rebuilt is the one case this warning exists for.

## Verify the whole setup

```bash
ssh -G HOST | grep -E '^(user|hostname|port|identityfile) '
ssh -o BatchMode=yes -o ConnectTimeout=5 USER@HOST true; echo "exit: $?"
```

`BatchMode=yes` fails instead of waiting at a password prompt, so exit code zero means key authentication genuinely worked.
