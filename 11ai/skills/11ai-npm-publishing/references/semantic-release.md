# Semantic Release

## Recommended Setup

Use this setup as the recommended stable baseline:

- `semantic-release` script in `package.json`
- `.releaserc.js` as the release config source of truth
- `.github/workflows/release.yml` for releases on pushes to `main`
- GitHub Actions environment `release`
- GitHub Actions publishing to both npmjs.org and GitHub Packages

Use these exact package versions unless the user explicitly asks to upgrade them:

- `semantic-release@24.2.7`
- `@semantic-release/changelog@6.0.3`
- `@semantic-release/commit-analyzer@13.0.1`
- `@semantic-release/git@10.0.1`
- `@semantic-release/github@11.0.6`
- `@semantic-release/npm@12.0.2`
- `@semantic-release/release-notes-generator@14.1.0`
- `lodash-es@4.17.21` via npm `overrides`

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
- Configure the npm plugin to write a tarball to a stable directory such as `dist`.
- Configure the GitHub plugin to create the GitHub release and upload the npm tarball and changelog as release assets.
- Add a workflow step after `semantic-release` to publish the generated tarball to GitHub Packages.

## Recommended Config Shape

Use this `.releaserc.js` pattern by default:

```js
module.exports = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/npm",
      {
        npmPublish: true,
        tarballDir: "dist",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "CHANGELOG.md"],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [
          { path: "dist/*.tgz", label: "npm package tarball" },
          { path: "CHANGELOG.md", label: "Changelog" },
        ],
      },
    ],
  ],
};
```

Treat that as the default baseline when making future changes unless the user asks for a different release policy.

## Dependency Guardrail

Pin `lodash-es` to `4.17.21` with npm `overrides` when using this setup. A broken `lodash-es@4.18.0` resolution can crash `semantic-release` during verify with `ReferenceError: assignWith is not defined`.

## Recommended Workflow Shape

- Use `actions/checkout` with `fetch-depth: 0`.
- Use `actions/setup-node`.
- Install dependencies before running the release script.
- Pass `GITHUB_TOKEN` and `NPM_TOKEN` to the release step.
- In GitHub Actions, also pass `NODE_AUTH_TOKEN=${{ secrets.NPM_TOKEN }}` to npm auth checks and release steps to match npm CLI auth resolution used by `actions/setup-node`.
- Give the job enough permissions to create releases.
- Give the job `packages: write` if it must publish to GitHub Packages.
- If using environment-scoped secrets, set the job `environment` to the same environment name.
- Enable npm caching in `actions/setup-node` when using npm in CI.
- Run `npm run semantic-release` from the workflow.
- Use the environment name `release` unless the user explicitly wants a different name and updates the workflow and secret configuration together.
- After `semantic-release`, configure `actions/setup-node` for `https://npm.pkg.github.com` and publish the generated tarball with `NODE_AUTH_TOKEN=${{ secrets.GITHUB_TOKEN }}`.
- Prefer deriving the GitHub Packages scope from `package.json.name` instead of hardcoding an org scope in the workflow.

## Commit Message Requirement

`semantic-release` determines the next version from commit messages. Use Conventional Commits, for example:

- `fix: correct npm publish workflow`
- `feat: add npm publishing skill`
- `feat!: change package entrypoint`

Without recognizable commit messages, pushes to `main` may produce no release.

## Bootstrapping An Existing Published Package

If the package already exists on npm but the repo has not been managed by `semantic-release` before, seed git with the current published version tag before enabling automated releases.

Example for an existing `1.0.3` release:

```sh
git tag v1.0.3
git push origin v1.0.3
```

Important:

- `semantic-release` uses git tags and commit history as the release baseline.
- It does not treat the current `package.json` version as the authoritative starting point.
- If no matching release tag exists, it may try to publish `1.0.0` as if this were the first release.
- After the bootstrap tag is in place, let `semantic-release` manage future version bumps.

## GitHub Actions Notes

- Do not use shallow git history for the release job.
- Keep the workflow on `main` unless the release policy explicitly uses more branches.
- Prefer `GITHUB_TOKEN` for GitHub release operations.
- Prefer `NPM_TOKEN` as a secret, not a plain variable.
- If the workflow uses a GitHub Actions environment such as `release`, the `NPM_TOKEN` secret must exist in that same environment or the job will see an empty value even when a repository-level secret exists elsewhere.
- If the repo commits release artifacts back to git, ensure workflow permissions allow contents writes.
- If `@semantic-release/git` is enabled, ensure files such as `CHANGELOG.md` and `package.json` are present and writable in CI.
- If `@semantic-release/github` uploads assets, ensure the configured asset paths are created before the publish step finishes.
- If `npm whoami` or `@semantic-release/npm` fails with `E401` in CI, add a temporary explicit `npm whoami --registry=https://registry.npmjs.org/` step before release to isolate raw npm auth from semantic-release behavior.
- Distinguish GitHub Releases from GitHub Packages: `@semantic-release/github` creates GitHub Releases, but a separate npm publish step is needed for the GitHub Packages registry.
- For GitHub Packages npm publishing, use `packages: write` permission and authenticate with `GITHUB_TOKEN` when publishing from the same repository.
- If the package is scoped, derive the scope from `package.json` and feed that into `actions/setup-node`. If the package is unscoped, skip the GitHub Packages publish path rather than forcing an invalid scope.
- When deriving workflow outputs for later `if:` conditions, avoid `node -e "..."` snippets that contain JavaScript backticks inside double-quoted shell strings. Shell command substitution can swallow the intended `GITHUB_OUTPUT` writes and silently skip downstream steps.
- When publishing a generated tarball to GitHub Packages, pass it as an explicit local path such as `./dist/package-name.tgz`. Without the `./` prefix, npm can misread `dist/...` as a git or hosted package spec instead of a local file.
- If an npm auth failure triggers a secondary `@semantic-release/github` error while posting failure comments, set `repositoryUrl` explicitly and disable `failComment` if needed so the real release error remains actionable.

## Useful Docs

- [semantic-release GitHub Actions recipe](https://semantic-release.gitbook.io/semantic-release/recipes/ci-configurations/github-actions)
- [semantic-release configuration](https://semantic-release.gitbook.io/semantic-release/usage/configuration)
- [semantic-release npm plugin](https://github.com/semantic-release/npm)
