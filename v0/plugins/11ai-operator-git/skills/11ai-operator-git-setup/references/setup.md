# Git setup reference

## Configuration levels

Four levels, narrowest wins:

| Level | File | Set with |
| --- | --- | --- |
| System | `/etc/gitconfig` | `git config --system` |
| Global | `~/.gitconfig` or `~/.config/git/config` | `git config --global` |
| Local | `.git/config` in the repository | `git config --local` |
| Worktree | `.git/config.worktree` | `git config --worktree` |

```bash
git config --list --show-origin --show-scope
```

This is the first command to run when a setting seems to have no effect. A local value set months ago silently outranks the global one you just changed.

## Identity

```bash
git config --global user.name "Full Name"
git config --global user.email "name@example.com"
```

Verify what a commit will actually record — this respects all four levels:

```bash
git var GIT_AUTHOR_IDENT
```

### Two identities on one machine

Conditional includes switch identity by directory, so no manual switching is needed:

```ini
# ~/.gitconfig
[user]
    name = Full Name
    email = personal@example.com

[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work
```

```ini
# ~/.gitconfig-work
[user]
    email = name@company.com
[commit]
    gpgsign = true
```

The trailing slash on `gitdir:~/work/` matters — without it the pattern matches a directory named `work` and nothing inside it. Test it from a repository under that path:

```bash
cd ~/work/some-repo && git config user.email
```

## Useful defaults

```bash
git config --global init.defaultBranch main
git config --global pull.ff only
git config --global push.default simple
git config --global push.autoSetupRemote true
git config --global core.excludesfile ~/.gitignore_global
git config --global diff.colorMoved zebra
git config --global rerere.enabled true
```

What each one buys:

- `pull.ff only` — a divergent pull stops with a message rather than creating an unrequested merge commit. Merge or rebase then stays a deliberate choice.
- `push.autoSetupRemote true` — a first push of a new branch works without `--set-upstream`.
- `diff.colorMoved zebra` — moved lines are shown as moved rather than as a delete plus an add, which makes a refactoring diff readable.
- `rerere.enabled true` — Git remembers how you resolved a conflict and reapplies it if the same conflict returns during a long rebase.

Deliberately not set globally: `pull.rebase true`. It rewrites local commits during a routine pull, which surprises people who did not choose it.

## Global ignore file

Machine-specific and editor-specific noise belongs here, not in a project's `.gitignore`:

```text
# ~/.gitignore_global
.DS_Store
Thumbs.db
*.swp
.idea/
.vscode/
.direnv/
```

A project's `.gitignore` describes the project. Adding `.DS_Store` to every repository is one person's operating system leaking into shared files.

## SSH authentication

```bash
ls -la ~/.ssh
ssh-keygen -t ed25519 -C "name@example.com"
```

Accept the default path and set a passphrase. Add it to the agent so the passphrase is typed once per session:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

On macOS, persist it in the keychain:

```ini
# ~/.ssh/config
Host github.com
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile ~/.ssh/id_ed25519
```

Copy the public key — the one ending `.pub`, never the other file — and add it in the platform's settings. Then verify:

```bash
ssh -T git@github.com
```

For two accounts on one host, give each an alias:

```ini
Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
    IdentitiesOnly yes
```

```bash
git remote set-url origin git@github-work:ORG/REPO.git
```

`IdentitiesOnly yes` is required. Without it the agent offers every key it holds and the host authenticates as whichever matches first, which is how commits end up attributed to the wrong account.

## HTTPS credential helpers

```bash
git config --global credential.helper osxkeychain
```

```bash
git config --global credential.helper libsecret
```

```bash
git config --global credential.helper manager
```

Use the platform helper: `osxkeychain` on macOS, `libsecret` on Linux, `manager` on Windows. If the platform's CLI is installed, let it own credentials instead:

```bash
gh auth login
gh auth setup-git
```

Never use `credential.helper store`. It writes tokens as plain text to `~/.git-credentials`. Never accept a token pasted into the terminal either — have the user run the login command themselves.

## Commit signing

### SSH signing

Simpler when an SSH key already exists.

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

Local verification needs an allowed-signers file, which is the step most often skipped:

```bash
echo "name@example.com $(cat ~/.ssh/id_ed25519.pub)" >> ~/.ssh/allowed_signers
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
```

Without it, the platform shows commits as verified while `git log --show-signature` reports no signature — the key is not the problem, the local trust list is.

The same public key must also be registered as a *signing* key in the platform's settings. An authentication key and a signing key are separate entries even when the key material is identical.

### GPG signing

```bash
gpg --list-secret-keys --keyid-format=long
git config --global user.signingkey KEY_ID
git config --global commit.gpgsign true
```

If signing fails in a non-interactive shell, the agent cannot prompt for the passphrase:

```bash
export GPG_TTY=$(tty)
```

Add that to the shell profile. Export the public key with `gpg --armor --export KEY_ID` and add it in the platform's settings.

### Verify

```bash
git log -1 --format='%an %ae %G?'
git log --show-signature -1
```

`%G?` returns `G` for a good signature, `U` for good with unknown trust, `N` for none, `E` when the key could not be checked.

## Line endings

```bash
git config --global core.autocrlf input
```

`input` on macOS and Linux commits line feeds and leaves the working tree alone. `true` on Windows converts to carriage return plus line feed on checkout.

Better: let the repository decide with a `.gitattributes` that every contributor gets automatically:

```text
* text=auto eol=lf
*.png binary
*.sh text eol=lf
*.bat text eol=crlf
```

Changing this on an existing repository rewrites the working tree. Check the effect before committing it:

```bash
git add --renormalize .
git status --short
```

## Safe directory ownership

A repository owned by another user produces:

```text
fatal: detected dubious ownership in repository
```

Add that one path:

```bash
git config --global --add safe.directory /path/to/repo
```

Do not use `safe.directory *`. The protection exists because a repository's configuration can run commands; disabling it everywhere makes any repository you enter able to execute code as you. If the real problem is ownership, fix the ownership:

```bash
sudo chown -R "$USER" /path/to/repo
```

## Verify the whole setup

In a scratch directory, never in the user's project:

```bash
git init /tmp/git-setup-check
cd /tmp/git-setup-check
git commit --allow-empty -m "check: verify identity and signing"
git log -1 --format='%an %ae %G?'
cd - && rm -rf /tmp/git-setup-check
```
