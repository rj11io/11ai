---
name: 11ai-git-setup
description: "Install Git and configure identity, default branch name, credential helpers, commit signing with SSH or GPG, global ignore rules, line-ending behaviour, merge and pull defaults, and safe directory ownership, then verify the configuration a commit will actually use. Use when Git is unconfigured on a new machine, when commits carry the wrong author or fail to sign, when pushes prompt for a password, or when the user asks how to set Git up."
---
# 11ai Git setup

Configuration decides what every future commit records, so read the effective values before changing them. Git merges four levels — system, global, local, and worktree — and the narrowest one wins, which is why a global change often appears to do nothing.

## Read the effective configuration

```bash
git --version
git config --list --show-origin --show-scope
git config user.name
git config user.email
git config init.defaultBranch
```

Run these inside the repository that matters. `--show-origin` names the file each value came from, which is the only reliable way to find a local override shadowing a global setting.

## Set identity

```bash
git config --global user.name "Full Name"
git config --global user.email "name@example.com"
```

Identity is recorded in every commit and cannot be corrected later without rewriting history. When a machine is used for both work and personal repositories, set the work address per repository or through conditional includes rather than switching the global value back and forth. Read [references/setup.md](references/setup.md) for the conditional include pattern, credential helpers per platform, SSH and GPG signing, and the global ignore file.

## Set the defaults worth setting

```bash
git config --global init.defaultBranch main
git config --global pull.ff only
git config --global push.default simple
git config --global core.excludesfile ~/.gitignore_global
```

`pull.ff only` is the safety-relevant one: it makes a divergent pull stop with a clear message instead of creating a merge commit nobody asked for. Choosing merge or rebase then stays an explicit decision, which is what `11ai-git-sync` expects.

Do not set `pull.rebase true` globally on someone's behalf; it silently rewrites local commits during a routine pull.

## Configure authentication and signing

For pushing, use the platform's credential helper or an SSH key. Never configure a credential store that writes a token in plain text when a keychain helper is available, and never take a token or passphrase through the terminal — it lands in shell history and in this transcript. Have the user run the login step themselves.

For signing, SSH signing is simpler than GPG when an SSH key already exists. Configure the key and the allowed-signers file together, or verification fails locally even though the platform shows the commit as verified.

## Verify

```bash
git config --list --show-origin --show-scope
git init /tmp/git-setup-check && cd /tmp/git-setup-check
git commit --allow-empty -m "check: verify identity and signing"
git log -1 --format='%an %ae %G?'
```

Check the author name and address, and the signature status: `G` for a good signature, `N` for none. Then remove the throwaway repository. Verify in a scratch directory rather than committing to the user's project.

## Guardrails

- Never rewrite existing commits to correct an author. Report the wrong identity and let the user decide; rewriting shared history is a separate, approved operation.
- Never print a token, a passphrase, a private key, or the contents of `~/.git-credentials`.
- Do not set `credential.helper store`, which writes tokens unencrypted, when the platform offers a keychain-backed helper.
- Do not add `safe.directory *`. Fix the directory ownership instead; the wildcard disables a protection that exists to stop a repository owned by another user from running its configured commands.
- Do not change `core.autocrlf` in a repository that already has committed line endings without checking what a conversion would do to the working tree.
- Leave working configuration alone and report what was found. If a push or fetch still fails after setup, hand off to `11ai-git-troubleshooting`.
