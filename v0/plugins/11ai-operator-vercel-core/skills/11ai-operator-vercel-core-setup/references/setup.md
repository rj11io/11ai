# Vercel Core Platform setup reference

Use current Vercel documentation at <https://vercel.com/docs> and the installed CLI help as sources of truth.

## Decisions

Confirm repository, package manager, team, project ownership, Git provider, build and output commands, framework, development, preview and production environments, runtime, regions, domains, roles, billing, and rollback owner.

## Install and inspect

```bash
npm install --save-dev vercel
npx vercel --version
npx vercel whoami
npx vercel link --help
```

Installing locally changes the lockfile. Linking may select or create remote project state and requires approval. Never put access tokens in command arguments.

## Link and configure

Record exact team and project. Enter variables through approved dashboard or CLI input without echoing values. Keep development, preview, and production scopes separate. Do not add domains during initial verification.

## Verify

Run the repository's production build or `vercel build` after inspecting scripts. A preview deployment is a separate approved action. Verify source commit, build settings, output, variable names, and access before any production promotion.

## Report

List CLI version, team, project, Git source, environments, build and output, runtime, files, remote state created, checks, and rollback without secret values.
