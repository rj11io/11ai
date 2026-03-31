# Semantic Release

## What to Add

- Add a `release` script to `package.json` that runs `semantic-release`.
- Add `semantic-release` as a dev dependency.
- Add `@semantic-release/github` when the repo should create GitHub releases.
- Configure the release branches, usually `main`.
- Add a GitHub Actions workflow that runs on pushes to `main`.

## Recommended Workflow Shape

- Use `actions/checkout` with `fetch-depth: 0`.
- Use `actions/setup-node`.
- Install dependencies before running the release script.
- Pass `GITHUB_TOKEN` and `NPM_TOKEN` to the release step.
- Give the job enough permissions to create releases.
- If using environment-scoped secrets, set the job `environment` to the same environment name.

## Commit Message Requirement

`semantic-release` determines the next version from commit messages. Use Conventional Commits, for example:

- `fix: correct npm publish workflow`
- `feat: add npm publishing skill`
- `feat!: change package entrypoint`

Without recognizable commit messages, pushes to `main` may produce no release.

## GitHub Actions Notes

- Do not use shallow git history for the release job.
- Keep the workflow on `main` unless the release policy explicitly uses more branches.
- Prefer `GITHUB_TOKEN` for GitHub release operations.
- Prefer `NPM_TOKEN` as a secret, not a plain variable.

## Useful Docs

- [semantic-release GitHub Actions recipe](https://semantic-release.gitbook.io/semantic-release/recipes/ci-configurations/github-actions)
- [semantic-release configuration](https://semantic-release.gitbook.io/semantic-release/usage/configuration)
- [semantic-release npm plugin](https://github.com/semantic-release/npm)
