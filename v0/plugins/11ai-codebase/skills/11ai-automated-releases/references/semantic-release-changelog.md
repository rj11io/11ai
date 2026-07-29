# Semantic Release With Automated Changelogs

## Recommended Stable Versions

Use these exact versions unless the user explicitly asks to upgrade them:

- `semantic-release@24.2.7`
- `@semantic-release/changelog@6.0.3`
- `@semantic-release/commit-analyzer@13.0.1`
- `@semantic-release/git@10.0.1`
- `@semantic-release/github@11.0.6`
- `@semantic-release/npm@12.0.2` (for the version bump only, never publishing)
- `@semantic-release/release-notes-generator@14.1.0`
- `lodash-es@4.17.21` via npm `overrides`

## Recommended package.json Shape

```json
{
  "scripts": {
    "semantic-release": "semantic-release"
  },
  "devDependencies": {
    "@semantic-release/changelog": "6.0.3",
    "@semantic-release/commit-analyzer": "13.0.1",
    "@semantic-release/git": "10.0.1",
    "@semantic-release/github": "11.0.6",
    "@semantic-release/npm": "12.0.2",
    "@semantic-release/release-notes-generator": "14.1.0",
    "semantic-release": "24.2.7"
  },
  "overrides": {
    "lodash-es": "4.17.21"
  }
}
```

## Recommended .releaserc.js

```js
module.exports = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    // Writes the new version into package.json. `npmPublish: false` switches off
    // the registry half of this plugin and keeps the bump. It has to run before
    // the git plugin, which stages an asset only if the file changed on disk.
    ["@semantic-release/npm", { npmPublish: false }],
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

## Recommended GitHub Actions Workflow

```yaml
name: Release

on:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    environment: release
    permissions:
      contents: write
      issues: write
      pull-requests: write
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "lts/*"

      - name: Install dependencies
        run: npm install

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run semantic-release
```

## Important Notes

- This setup creates GitHub Releases, changelog updates, tags, release commits, and the `package.json` version bump.
- This setup does not publish to npm.
- This setup does not publish to GitHub Packages.
- `@semantic-release/npm` is in the plugin list on purpose, and it is not publishing. The plugin has two halves: prepare writes the version into `package.json`, publish talks to the registry. `npmPublish: false` disables the second half only. Private packages skip publishing anyway, but set the flag so the intent is on the page.
- Removing that plugin is the classic way to break this setup. Releases still tag and still write the changelog, so everything looks healthy, while `package.json` sits on its original version forever. `@semantic-release/git` will not save you: it stages `package.json` only when something already changed the file.
- Order matters. The npm plugin must appear before `@semantic-release/git`, or the commit is built before the version is written.
- Do not set `cache: npm` or `cache-dependency-path` on `actions/setup-node` in the release workflow.
- Use Conventional Commits so semantic-release can determine the next version. Only `feat`, `fix`, and breaking changes cut a release; `chore`, `docs`, `style`, `refactor`, and `test` do not.
- If the project already has a published or released baseline, seed git with a matching tag such as `v1.0.3` before first run, and set `package.json` to that same version by hand. The bump applies to future releases only and does not backfill.

## Verifying The Bump Works

After the first release, confirm the release commit carries both files:

```bash
git show --stat "$(git describe --tags --abbrev=0)"
```

Expect `CHANGELOG.md` and `package.json`. A commit containing only `CHANGELOG.md` means the npm plugin is missing or ordered after `@semantic-release/git`.
