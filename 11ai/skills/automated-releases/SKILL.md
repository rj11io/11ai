---
name: automated-releases
description: Set up and maintain semantic-release based release automation for repositories that need automated versioning, changelog generation, GitHub release creation, release commits, and release workflows on pushes to main, without publishing packages to npm or GitHub Packages. Use when Codex needs to add or update semantic-release, `.releaserc.js`, or GitHub Actions release workflows focused on changelogs and GitHub releases only.
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
   Use npm `overrides` to pin `lodash-es` to `4.17.21`.

3. Add file-based release config.
   Prefer `.releaserc.js` over inline `package.json` config.
   Configure `main` as the release branch.
   Enable commit analysis, release notes generation, changelog updates, release commits, and GitHub releases.
   Do not add npm or GitHub Packages publishing in this skill.

4. Add the GitHub Actions workflow.
   Trigger on pushes to `main`.
   Use `actions/checkout` with `fetch-depth: 0`.
   Install dependencies.
   Run `npm run semantic-release`.
   Grant the workflow enough permissions for changelog commits, tags, and GitHub releases.

5. Check release prerequisites.
   Ensure commit messages follow Conventional Commits.
   If the package or project already has releases outside semantic-release, seed git with the current version tag before enabling automation.

6. Troubleshoot failures by category.
   If semantic-release starts at `1.0.0` unexpectedly, add the existing version tag to git.
   If changelog commits fail, inspect branch protection and workflow token permissions.
   If semantic-release crashes during verify, inspect resolved dependency versions and confirm the `lodash-es` override is active.

## References

Read [references/semantic-release-changelog.md](./references/semantic-release-changelog.md) for the recommended semantic-release config and workflow shape.
