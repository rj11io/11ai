# Root package scripts

This directory contains the root npm package's validation, release-version
synchronization, and manual publishing helpers.

## Scripts

| File | How it is used |
| --- | --- |
| `validate-skills.mjs` | Run through `npm run validate-skills` to check skill frontmatter, Codex metadata, plugin packaging, links, scripts, and catalogs. |
| `sync-claude-plugin-versions.mjs` | Run automatically by the root package's `postversion` hook to copy the package version into Claude and Codex plugin manifests. |
| `publish-public-w-local-token.cjs` | Run through `npm run publish-public-local` for a real public npm publish using `NPM_TOKEN` from `.env`. |

## Publish with a local token

`publish-public-w-local-token.cjs` performs a real public npm publish. It reads `NPM_TOKEN` from a root `.env` file, writes that token to a temporary npm configuration, runs `npm publish --access public`, then removes the temporary file.

From the repository root:

```bash
npm run pack-dry
npm run publish-public-local
```

Use `pack-dry` first to inspect the package contents. Before publishing, create a root `.env` entry containing a non-empty npm token:

```dotenv
NPM_TOKEN=your-token
```

Run the command from the repository root because the script resolves both `.env` and `.npmrc.codex-publish-temp` from the current working directory. The repository ignores `.env`. The script normally removes the temporary npm configuration itself; after an interrupted publish, confirm that `.npmrc.codex-publish-temp` is gone because it contains the token and is not ignored by Git.
