---
name: 11ai-operator-convex-deployments
description: "Deploy Convex and manage its environments, covering the difference between the development watcher and a production deploy, deploy keys for a pipeline, environment variables per deployment, preview deployments for branches, build integration with a frontend deploy, data export and import between deployments, backward-compatible function and schema rollout, and rollback. Use when a change must reach production, when a pipeline must deploy Convex, when environment variables differ between deployments, or when a deploy broke a running client."
---
# 11ai convex deployments

`npx convex dev` and `npx convex deploy` target different deployments with different data. A deploy replaces the functions every connected client is calling, and those clients do not reload — so a deploy that removes or narrows a function breaks the browser tabs already open. Plan for that before pushing.

## Inspect first

```bash
grep -o 'CONVEX_DEPLOYMENT=.*' .env.local 2>/dev/null
npx convex env list
npx convex env list --prod
npx convex logs --prod --limit 30
npx convex dashboard
```

Compare the two environment variable lists. A variable set in development and missing in production is the most common post-deploy failure, and the resulting error rarely names the variable. Report names only — `env list` prints values.

Read the production logs before deploying, so you know what normal looks like and can tell whether the deploy changed it.

## Deploy

```bash
npx convex deploy
npx convex deploy --cmd 'npm run build'
npx convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'npm run build'
```

`npx convex deploy` pushes functions and the schema to production and runs the schema validation against production data — which is why a schema change that passed in development can be rejected here.

The `--cmd` form deploys the backend and then runs the frontend build with the production deployment URL injected, so the client bundle points at the right deployment. Without it, a frontend built before the deploy can hold a stale URL.

Set environment variables **before** deploying code that needs them:

```bash
npx convex env set STRIPE_SECRET_KEY sk_live_... --prod
npx convex env list --prod
```

Never take a secret through the terminal where it enters shell history and this transcript. Have the user set it, or read it from a file.

## Roll out compatibly

Connected clients keep calling the function signatures they were built with. Deploy in steps rather than in one change:

1. **Add** the new function or the new optional argument, and deploy it.
2. **Ship** the frontend that uses it.
3. **Remove** the old function or the old argument in a later deploy, once no client calls it.

A deploy that renames a function, removes one, or makes an optional argument required breaks every open tab immediately. Check the logs for calls to a function before removing it.

Schema changes follow the same shape — widen, backfill, narrow — and are validated against production data. See `11ai-operator-convex-schema`.

## Deploy from a pipeline

```bash
npx convex env set --help
```

A pipeline authenticates with a deploy key generated in the dashboard for that deployment, held as a secret:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npx convex deploy --cmd 'npm run build'
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
```

A deploy key can replace every function on that deployment, so treat it as a production credential: scope it to the deployment it needs, never commit it, never echo it, and rotate it when someone with access leaves. Gate the job on the default branch and on a passing test job — an unguarded deploy job means any branch push reaches production.

For preview deployments, generate a preview deploy key and deploy per branch. Each preview gets its own empty database, so seed it if the preview needs data:

```bash
npx convex deploy --preview-create "$BRANCH_NAME" --cmd 'npm run build'
```

## Move data between deployments

```bash
npx convex export --path ./snapshot.zip
npx convex export --prod --path ./prod-snapshot.zip
npx convex import --table users ./users.jsonl
npx convex import --replace-all ./snapshot.zip
```

Exporting production is a read and is safe. Importing is not:

- `--replace-all` overwrites the target deployment's data entirely. Against production that is unrecoverable without another export.
- Importing production data into a development deployment copies real personal data onto a developer machine. Prefer a generated seed, and where real data is needed, redact it first.
- Take an export before any import or destructive migration. It is the only rollback for data.

Get explicit approval naming the deployment for any import, and confirm the target from `env list` output rather than assuming.

## Roll back

There is no single command that reverts a deploy. Recovery is:

- **Functions and schema** — deploy the previous commit. Keep the repository's main branch always deployable so this is one command rather than a reconstruction.
- **Data** — restore from the export taken before the change. Without one, there is nothing to restore.
- **Environment variables** — set the previous value; the deployment keeps no history of them.

That is why the export before a destructive migration is not optional.

## Verify

```bash
npx convex logs --prod --limit 50
npx convex logs --prod --success
npx convex env list --prod
```

After deploying:

1. Confirm the function list in the dashboard matches what you intended to ship.
2. Run one read-only function against production and confirm the expected shape.
3. Watch the logs for errors that started at the deploy time, particularly missing environment variables.
4. Load the application in a fresh browser session and confirm reactivity works — that proves the built client points at the deployed backend.
5. Keep an already-open tab and confirm it still works, which is the backward-compatibility check.
6. Check that any cron defined in this deploy is scheduled as expected and is not duplicating existing work.

## Report

State which deployment was targeted, the functions and schema changes shipped, whether the rollout was backward compatible and why, the environment variables required and confirmed present on that deployment, whether an export was taken and where it is, how the frontend build received the deployment URL, the log check after deploying, and the verification results including the open-tab check. Never print a deploy key, a secret, or `env list` values. Say plainly what the rollback path is and whether it has been tested.
