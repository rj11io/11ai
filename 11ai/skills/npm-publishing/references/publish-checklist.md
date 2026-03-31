# Publish Checklist

## Before Publish

- Confirm `package.json` has the correct scoped package name.
- Confirm `private` is `false`.
- Confirm `publishConfig.access` is `public` for public scoped packages.
- Confirm `main` or `exports` points to a real file.
- Confirm `files` includes only the intended publish paths.
- Confirm `.env` is ignored by git.
- Confirm `README.md` and `LICENSE` are present when needed.

## Token-Based Publish

- Store `NPM_TOKEN` in the project root `.env`.
- Use a token that can publish under the target npm scope.
- If the org enforces 2FA, use interactive auth with 2FA or a granular token that is allowed to bypass 2FA for publishing.
- Avoid passing the token as a CLI argument; prefer a temporary `.npmrc` or equivalent npm config injection.

## Creating a New npm Org Token

1. Sign in to npm with an account that can publish under the target org.
2. Open your npm account's access token settings.
3. Create a granular access token.
4. Give it package publish permission for the target org or package scope.
5. If your org requires 2FA for publishing, enable the token option that allows publishing under that policy.
6. Copy the token immediately and store it securely.

Use the npm docs for the current token UI and policy details:
- [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers/)
- [Access tokens overview](https://docs.npmjs.com/about-access-tokens)

## Setting the Token as a GitHub Environment Secret

1. Open the GitHub repository.
2. Go to `Settings` -> `Environments`.
3. Create or open the environment used by the release workflow, for example `release`.
4. Add a new environment secret named `NPM_TOKEN`.
5. Paste the npm token value.
6. Ensure the workflow job uses the same environment name and passes `secrets.NPM_TOKEN` to the release step.

GitHub reference:
- [Using secrets in GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets?tool=webui)

## Useful Commands

```sh
npm pack --dry-run
npm publish --access public
npm whoami
```

## Common Failures

### 403 Forbidden

Usually means the token or account is not allowed to publish this package, or the org requires stronger auth policy than the current credentials satisfy.

### Missing Entry Point

The tarball publishes, but consumers install a broken package because `main` or `exports` points to a file that does not exist.

### Wrong Files In Tarball

`npm pack --dry-run` shows too much or too little content. Fix the `files` array before publishing.
