---
name: npm-publishing
description: Prepare and publish npm packages, especially scoped public packages that need package.json fixes, publish scripts, dry-run checks, .env-managed NPM_TOKEN handling, or org-scoped publish troubleshooting. Use when Codex needs to make a repo publish-ready, verify what npm will ship, or diagnose publish failures such as access, 2FA, token, or package-content issues.
---

# Npm Publishing

## Overview

Use this skill to make a repo publish-ready and to publish it safely with a short, repeatable workflow.

Prefer the smallest set of changes that gets the package publishable. Keep package contents explicit, verify the tarball before publish, and treat auth and org permissions as separate from package configuration.

## Workflow

1. Inspect the package root.
   Read `package.json`, check the intended entry point, and inspect the folders that should ship.
   If `semantic-release` is configured, check for a dedicated release config file such as `.releaserc.js` and treat that as the source of truth over older inline config examples.

2. Align package metadata with the intended publish target.
   Ensure the scoped package name is correct.
   Set `"private": false` when the package must publish.
   Add `"publishConfig": { "access": "public" }` for public scoped packages.
   Set `main` or `exports` to a real entry file.
   Add a `files` array when the package should publish only selected paths.

3. Protect secrets and local publish config.
   Ignore `.env` files in `.gitignore`.
   Prefer reading `NPM_TOKEN` from a local `.env` file instead of hardcoding credentials in `package.json`.

4. Add or update repo-local publish commands.
   If the repo needs a reusable publish flow, add a small Node script rather than a long inline one-liner in `package.json`.
   Keep the script at a stable path such as `./scripts/publish-public-w-local-token.cjs`.
   Prefer a temporary npm config file over passing the token on the command line.
   Use the helper at [scripts/publish-with-local-token.cjs](./scripts/publish-with-local-token.cjs) as the starting point when the repo does not already have its own version.

5. Verify publish contents before release.
   Run `npm pack --dry-run` or the repo's equivalent script.
   Confirm the tarball includes the intended files and excludes local secrets or unrelated workspace files.

6. Choose the publish mode.
   For one-off local publishing, use a repo-local helper that reads `NPM_TOKEN` from `.env`.
   For automated publishing from GitHub, prefer `semantic-release` on pushes to `main`.
   When the repo already uses `semantic-release`, preserve the existing config shape, plugin order, and workflow naming unless the user explicitly wants a migration.

7. Publish.
   For scoped public packages, use `npm publish --access public`.
   If the repo uses a local token helper, ensure `.env` contains `NPM_TOKEN=...` first.
   If the repo uses `semantic-release`, ensure the workflow has `GITHUB_TOKEN` and an `NPM_TOKEN` secret available.

8. Troubleshoot failures by category.
   For package-content issues, revisit `main`, `exports`, and `files`.
   For 403 errors, separate "wrong credentials" from "org requires 2FA or bypass-enabled token."
   For local permission or shell issues, inspect the execution environment before changing npm config.
   For automated releases that do not trigger, inspect branch filters, workflow permissions, and commit message format.

## Quick Checks

- Entry file exists at the path named by `main` or `exports`
- `files` includes the paths that should ship
- `publishConfig.access` is `"public"` for public scoped packages
- `.env` is ignored by git
- `npm pack --dry-run` output looks correct
- Active npm account or token has permission to publish under the target scope

## References

Read [references/publish-checklist.md](./references/publish-checklist.md) for a concise pre-publish checklist and common failure modes.
Read [references/semantic-release.md](./references/semantic-release.md) when the repo should publish automatically from GitHub Actions.

## Scripts

Use [scripts/publish-with-local-token.cjs](./scripts/publish-with-local-token.cjs) as a reusable template when a repo needs to publish with `NPM_TOKEN` stored in a root `.env` on Windows, macOS, or Linux.
