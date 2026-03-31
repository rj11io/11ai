# Semantic Release

## Recommended Setup

Use this setup as the recommended stable baseline:

- `semantic-release` script in `package.json`
- `.releaserc.js` as the release config source of truth
- `.github/workflows/release.yml` for releases on pushes to `main`
- GitHub Actions environment `release`

Use these exact package versions unless the user explicitly asks to upgrade them:

- `semantic-release@24.2.0`
- `@semantic-release/changelog@6.0.3`
- `@semantic-release/commit-analyzer@13.0.0`
- `@semantic-release/git@10.0.1`
- `@semantic-release/github@11.0.4`
- `@semantic-release/npm@12.0.2`
- `@semantic-release/release-notes-generator@14.0.1`

When updating release automation, hard-reference those exact versions rather than broad guidance like "install the latest semantic-release plugins."

## What to Add Or Preserve

- Add or preserve a `semantic-release` script in `package.json` that runs `semantic-release`.
- Keep the main plugin config in `.releaserc.js`.
- Configure the release branch as `main`.
- Add or preserve a GitHub Actions workflow that runs on pushes to `main`.
- Keep the plugin order aligned with the recommended config:
  `@semantic-release/commit-analyzer`,
  `@semantic-release/release-notes-generator`,
  `@semantic-release/changelog`,
  `@semantic-release/npm`,
  `@semantic-release/git`,
  `@semantic-release/github`.

## Recommended Config Shape

Use this `.releaserc.js` pattern by default:

```js
module.exports = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "CHANGELOG.md"],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    "@semantic-release/github",
  ],
};
```

Treat that as the default baseline when making future changes unless the user asks for a different release policy.

## Recommended Workflow Shape

- Use `actions/checkout` with `fetch-depth: 0`.
- Use `actions/setup-node`.
- Install dependencies before running the release script.
- Pass `GITHUB_TOKEN` and `NPM_TOKEN` to the release step.
- Give the job enough permissions to create releases.
- If using environment-scoped secrets, set the job `environment` to the same environment name.
- Run `npm run semantic-release` from the workflow.
- Use the environment name `release` unless the user explicitly wants a different name and updates the workflow and secret configuration together.

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
- If the repo commits release artifacts back to git, ensure workflow permissions allow contents writes.
- If `@semantic-release/git` is enabled, ensure files such as `CHANGELOG.md` and `package.json` are present and writable in CI.

## Useful Docs

- [semantic-release GitHub Actions recipe](https://semantic-release.gitbook.io/semantic-release/recipes/ci-configurations/github-actions)
- [semantic-release configuration](https://semantic-release.gitbook.io/semantic-release/usage/configuration)
- [semantic-release npm plugin](https://github.com/semantic-release/npm)
