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
