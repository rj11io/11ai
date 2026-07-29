---
name: 11ai-automated-releases
description: "Set up and maintain semantic-release based release automation for repositories that need automated versioning, changelog generation, GitHub release creation, release commits, and release workflows on pushes to main, without publishing packages to npm or GitHub Packages. Use when Codex needs to add or update semantic-release, `.releaserc.js`, or GitHub Actions release workflows focused on changelogs and GitHub releases only."
---

# Automated Releases

## Overview

Use this skill to add or maintain semantic-release workflows that automate changelogs, tags, version bumps, and GitHub releases.

Prefer a file-based semantic-release config, a release workflow on `main`, and a changelog-first setup that does not assume package registry publishing is required.

## Workflow

1. Inspect the repo release surface.
   Read `package.json`, check whether `.releaserc.js` already exists, and inspect any existing `.github/workflows/release.yml`.

2. Add or align semantic-release dependencies.
   Add a `semantic-release` script in `package.json`.
   Pin the semantic-release packages to the exact stable versions used by this setup.
   The pinned set includes `@semantic-release/npm`, which this setup needs for the version bump even though it never publishes.
   Use npm `overrides` to pin `lodash-es` to `4.17.21`.

3. Add file-based release config.
   Prefer `.releaserc.js` over inline `package.json` config.
   Configure `main` as the release branch.
   Enable commit analysis, release notes generation, changelog updates, the version bump, release commits, and GitHub releases.
   Include `@semantic-release/npm` with `npmPublish: false`, ordered before `@semantic-release/git`.
   Do not publish to npm or GitHub Packages in this skill.

   Keep the npm plugin even though nothing is published. It does two separate jobs: its prepare step writes the new version into `package.json`, and only its publish step talks to the registry. Setting `npmPublish: false` switches off the publish half and keeps the bump. Drop the plugin and `package.json` keeps its old version forever — and because `@semantic-release/git` stages an asset only when the file actually changed on disk, listing `package.json` in its `assets` silently does nothing.

4. Add the GitHub Actions workflow.
   Trigger on pushes to `main`.
   Use `actions/checkout` with `fetch-depth: 0`.
   Do not configure npm caching in `actions/setup-node`.
   Install dependencies.
   Run `npm run semantic-release`.
   Grant the workflow enough permissions for changelog commits, tags, and GitHub releases.

5. Check release prerequisites.
   Ensure commit messages follow Conventional Commits.
   Only `feat`, `fix`, and breaking changes produce a release under the default preset. `chore`, `docs`, `style`, `refactor`, and `test` do not, so a batch of those lands on `main` and correctly produces no release at all.
   If the package or project already has releases outside semantic-release, seed git with the current version tag before enabling automation.
   Set `package.json` to match that seeded tag by hand. The version bump only writes releases made from now on; it never backfills the version you already shipped.

6. Troubleshoot failures by category.
   If semantic-release starts at `1.0.0` unexpectedly, add the existing version tag to git.
   If a release succeeds but `package.json` keeps its old version, `@semantic-release/npm` is missing from `plugins`. The give-away is a release commit that touches `CHANGELOG.md` and nothing else.
   If no release happens at all, read the commit types since the last tag before suspecting the pipeline.
   If changelog commits fail, inspect branch protection and workflow token permissions.
   If semantic-release crashes during verify, inspect resolved dependency versions and confirm the `lodash-es` override is active.

## References

Read [references/semantic-release-changelog.md](./references/semantic-release-changelog.md) for the recommended semantic-release config and workflow shape.
