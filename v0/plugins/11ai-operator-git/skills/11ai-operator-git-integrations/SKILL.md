---
name: 11ai-operator-git-integrations
description: "Connect Git to the systems around it, covering remotes and hosting providers, pull-request tooling, continuous integration triggers, local hooks through husky or lefthook, commit-message and lint gates, large file storage, and submodules or subtrees for vendored code. Use when a repository needs a remote or a second one, when a pipeline trigger does not fire, when a pre-commit gate must be added or is blocking work, or when another repository must be embedded in this one."
---
# 11ai Git integrations

Each of these seams gives another system a say over what happens on commit, on push, or on a branch. Find out what already runs at those moments before adding anything, because a second gate on the same event is how a repository becomes slow to work in.

## Name the seam

- **Remotes and hosting** — which remotes exist, whether they use SSH or HTTPS, and whether a fork means two remotes.
- **Pull-request tooling** — the provider's CLI creates and inspects reviews without a browser.
- **Pipeline triggers** — a workflow's branch, path, and event filters decide whether a push runs anything at all.
- **Local hooks** — husky or lefthook run checks on commit or push, and they are shared through the repository rather than through each machine.
- **Message and lint gates** — a commit-message convention or a staged-file linter enforced at commit time.
- **Large files** — Git LFS replaces binaries with pointers, and it must be installed before the files are committed.
- **Embedded repositories** — a submodule pins another repository by commit; a subtree copies its content in.

## Wire one deliberately

1. Inspect first: `git remote -v`, the `.git/hooks` directory and any `core.hooksPath`, the pipeline configuration, `.gitattributes`, and `.gitmodules`.
2. Add one gate at a time and keep it fast. A pre-commit hook that runs the whole test suite gets bypassed with `--no-verify`, which means it protects nothing.
3. Run hooks on staged content only, and let the pipeline be the real gate. A local hook is a convenience; the pipeline is the enforcement.
4. Prefer SSH for interactive use and short-lived tokens for automation. Never commit a token, and never put one in a remote URL where it lands in `.git/config` and in every log that prints the remote.
5. For pipeline triggers, name the branches, paths, and events explicitly, and remember that a workflow file must exist on the branch being pushed before it can run there.
6. For embedded code, choose deliberately: a submodule keeps history separate and needs every contributor to know the extra commands; a subtree makes the code local and its updates a merge. Read [references/integrations.md](references/integrations.md) for the remote and fork layout, hook manager setup, commit-message gates, LFS migration, and submodule versus subtree commands.

## Verify end to end

Prove the trigger fires and the gate blocks:

- Push a branch and confirm the pipeline actually started; a silent no-run is almost always a branch or path filter.
- Make a deliberately bad commit in a scratch branch and confirm the hook rejects it, then confirm a good one passes.
- After an LFS change, clone the repository fresh and confirm the working tree holds real files rather than pointer text.
- After adding a submodule, clone with `--recurse-submodules` and confirm the pinned commit checks out.

## Report

State the seam wired, the files added or changed, what now runs on which event and how long it takes, whether the gate is advisory or enforced, and the verification evidence. Never print a token or a credential from a remote URL, and call out anything a contributor must do on their own machine for the change to take effect.
