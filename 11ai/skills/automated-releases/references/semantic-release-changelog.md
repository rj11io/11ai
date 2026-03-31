# Semantic Release With Automated Changelogs

## Recommended Stable Versions

Use these exact versions unless the user explicitly asks to upgrade them:

- `semantic-release@24.2.7`
- `@semantic-release/changelog@6.0.3`
- `@semantic-release/commit-analyzer@13.0.1`
- `@semantic-release/git@10.0.1`
- `@semantic-release/github@11.0.6`
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
          cache: npm

      - name: Install dependencies
        run: npm install

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run semantic-release
```

## Important Notes

- This setup creates GitHub Releases, changelog updates, tags, and release commits.
- This setup does not publish to npm.
- This setup does not publish to GitHub Packages.
- Use Conventional Commits so semantic-release can determine the next version.
- If the project already has a published or released baseline, seed git with a matching tag such as `v1.0.3` before first run.
