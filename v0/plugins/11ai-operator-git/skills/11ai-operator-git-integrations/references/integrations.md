# Git integrations reference

## Remotes

```bash
git remote -v
git remote add origin git@github.com:ORG/REPO.git
git remote set-url origin git@github.com:ORG/REPO.git
```

Never put a token in a remote URL. It is written to `.git/config` in plain text and printed by any command that shows the remote, including error output that gets pasted into an issue:

```text
https://TOKEN@github.com/ORG/REPO.git
```

Use SSH, or HTTPS with a credential helper.

### Fork layout

Two remotes: `origin` is your fork and receives pushes, `upstream` is the source and is read-only.

```bash
git remote add upstream git@github.com:UPSTREAM_ORG/REPO.git
git remote set-url --push upstream no-push
git fetch upstream
git switch -c feature upstream/main
```

Setting the push URL to `no-push` makes an accidental `git push upstream` fail instead of attempting to write to someone else's repository.

## Provider CLI

```bash
gh auth login
gh auth setup-git
```

`gh auth setup-git` makes the CLI the credential helper for HTTPS, so there is no separate token to manage.

```bash
gh pr create --fill --base main
gh pr status
gh pr checks
gh pr view --json state,mergeable,statusCheckRollup
gh run list --branch BRANCH --limit 5
gh run view RUN_ID --log-failed
```

`gh run view --log-failed` prints only the failing step's log, which is far faster than opening the run in a browser.

Creating or merging a pull request is an outward-facing action. Confirm the base branch and the title before running it, and never merge without explicit instruction.

## Pipeline triggers

A workflow runs only when its filters match. Be explicit:

```yaml
name: ci

on:
  push:
    branches: [main]
    paths:
      - "src/**"
      - "package.json"
      - ".github/workflows/ci.yml"
  pull_request:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

The reasons a push runs nothing, in the order to check them:

1. The workflow file does not exist on the branch that was pushed. A workflow added on a feature branch cannot run for a push to another branch.
2. A `paths` filter excluded every changed file. Include the workflow file itself so changes to it are tested.
3. The trigger is `pull_request` only, and the push was a direct branch push.
4. Actions are disabled for the repository, or the fork's pull request needs approval.
5. A commit message contains a skip marker such as `[skip ci]`.

`workflow_dispatch` is worth adding to every workflow — it gives a manual run button, which turns a trigger question into a five-second test.

`concurrency` with `cancel-in-progress` stops a queue of superseded runs from a rapid series of pushes.

Reading the current state without a browser:

```bash
gh workflow list
gh workflow view ci.yml
```

## Hook managers

Hooks in `.git/hooks` are not committed, so they exist only on the machine that created them. A hook manager stores them in the repository and installs them for everyone.

### husky

```bash
npm install --save-dev husky
npx husky init
```

That sets `core.hooksPath` to `.husky` and adds a `prepare` script so `npm install` installs the hooks. Verify:

```bash
git config core.hooksPath
```

```bash
# .husky/pre-commit
npx lint-staged
```

### lefthook

Faster, language-agnostic, and configured in one file:

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: "*.{js,ts,tsx}"
      run: npx eslint {staged_files}
    format:
      glob: "*.{js,ts,tsx,json,md}"
      run: npx prettier --check {staged_files}

commit-msg:
  commands:
    conventional:
      run: npx commitlint --edit {1}
```

```bash
npx lefthook install
```

### Rules for hooks that survive

- **Staged files only.** `{staged_files}` or `lint-staged`. A hook that checks the whole repository takes long enough that people bypass it.
- **Under a few seconds.** Tests belong in the pipeline, not in `pre-commit`.
- **Formatting checks, not formatting rewrites.** A hook that reformats files changes what is being committed after the user reviewed it.
- **The pipeline is the enforcement.** `--no-verify` skips every local hook, so anything that must not be bypassed has to run server-side too.

```json
{
  "lint-staged": {
    "*.{js,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

## Commit-message gates

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

```js
// commitlint.config.js
module.exports = { extends: ["@commitlint/config-conventional"] }
```

```yaml
commit-msg:
  commands:
    conventional:
      run: npx commitlint --edit {1}
```

Enforce it on the pull request title too when the repository squash-merges, because the squash commit takes the title rather than the individual commit messages. That is the gap that lets a non-conventional message reach `main` in a repository that thought it was gated. If the repository uses release automation driven by commit messages, this gate is what protects the version number.

## Git LFS

```bash
git lfs install
git lfs track "*.psd"
git lfs track "*.mp4"
git add .gitattributes
```

`.gitattributes` must be committed, or other clones will not use LFS for those paths.

```bash
git lfs ls-files
git lfs env
```

LFS applies from the commit that adds the tracking rule forward. Files already in history stay in history and the repository stays large. Converting existing history rewrites every commit that touched those files:

```bash
git lfs migrate import --include="*.psd" --everything
```

That changes every commit hash. It requires a force push, coordination with everyone who has a clone, and a backup first. Treat it as a planned operation with explicit approval, never as a cleanup step.

After any LFS change, clone fresh and confirm the working tree holds real files. A clone made without the LFS client installed yields small text pointer files instead, and builds fail in a way that does not mention LFS.

## Submodules and subtrees

### Submodule — pins another repository by commit, keeps history separate

```bash
git submodule add git@github.com:ORG/LIB.git vendor/lib
git commit -m "chore: add lib submodule"
```

```bash
git clone --recurse-submodules git@github.com:ORG/REPO.git
git submodule update --init --recursive
```

```bash
cd vendor/lib && git fetch && git checkout TAG
cd - && git add vendor/lib && git commit -m "chore: bump lib to TAG"
```

The parent repository records a commit, not a branch. Two consequences people meet the hard way: a plain `git clone` leaves the submodule directory empty, and `git pull` in the parent does not update the submodule contents. Make it automatic:

```bash
git config --global submodule.recurse true
```

### Subtree — copies the content in, updates are merges

```bash
git subtree add --prefix vendor/lib git@github.com:ORG/LIB.git main --squash
git subtree pull --prefix vendor/lib git@github.com:ORG/LIB.git main --squash
```

Choose a subtree when contributors should not need to know the code is vendored — a plain clone gets everything. Choose a submodule when the pinned version must be explicit and the code is genuinely a separate project.

Either way, record which one is in use and the update command in the repository's own documentation. The commands are not guessable from the directory contents.
