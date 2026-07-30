---
name: 11ai-operator-convex-environment
description: "Inspect which Convex deployment is active, whether the project is linked and the generated API exists, the deployment URL the application reads, environment variables set on each deployment, the schema and index state, function and cron inventory, and recent logs, without changing anything. Use before a Convex operation, when it is unclear whether a command targets development or production, when generated types are missing, or when the user asks whether Convex is set up."
---
# 11ai Convex environment

Every Convex project has at least two deployments — a personal development one and production — with separate data, separate environment variables, and separate function versions. Establish which one a command will reach before running anything, because `npx convex dev` and `npx convex deploy` target different places. Keep this pass read-only.

## Inspect the project and the link

```bash
npx convex --version
ls -la convex/
ls -la convex/_generated/ 2>/dev/null || echo "generated API missing"
cat convex.json 2>/dev/null
grep -o '^[A-Z_]*' .env.local 2>/dev/null | sort
```

Three things tell you where the project stands:

- A `convex/` directory with function files means the project is initialized.
- `convex/_generated/` present means the API has been generated at least once. Missing it is why `api.foo.bar` fails to resolve and the editor reports an unknown import — the fix is running `npx convex dev`, not editing code.
- `CONVEX_DEPLOYMENT` in the local environment file names the linked development deployment; the public URL variable is what the client reads.

```bash
grep -o 'CONVEX_DEPLOYMENT=.*' .env.local 2>/dev/null
grep -o 'CONVEX_URL=.*' .env.local 2>/dev/null
```

Both of those are safe to display — they are deployment identifiers, not secrets. A `dev:` prefix on `CONVEX_DEPLOYMENT` means a development deployment; a `prod:` prefix means production.

## Read the deployment state

```bash
npx convex env list
npx convex env list --prod
npx convex logs --limit 50
npx convex dashboard
```

`npx convex env list` prints variable **names and values** for the deployment, so treat its output as sensitive: report names only, and never paste it whole. Compare the two lists — a variable set on development and missing in production is the single most common cause of a function that works locally and fails after deploy.

```bash
npx convex run --help
cat convex/schema.ts 2>/dev/null | head -40
ls convex/*.ts
cat convex/crons.ts 2>/dev/null
```

Read the schema to see which tables and indexes exist, and read `crons.ts` to see what runs on a schedule — a cron on production doing work nobody expected is worth knowing about before changing anything.

Check which functions are public rather than internal:

```bash
grep -rn 'export const' convex/*.ts | grep -c 'internalQuery\|internalMutation\|internalAction'
grep -rn 'export const' convex/*.ts | grep -c '= query(\|= mutation(\|= action('
```

Every non-internal function is callable by any client that knows its name. A mutation that should be internal but is not is an exposure, so count them and read the public ones.

## Check the client wiring

```bash
grep -rn 'ConvexProvider\|ConvexReactClient\|ConvexProviderWithAuth' --include='*.tsx' --include='*.ts' app/ src/ 2>/dev/null | head
grep -rn 'CONVEX_URL' --include='*.tsx' --include='*.ts' app/ src/ 2>/dev/null | head
```

The client needs the deployment URL at build time. A provider created without it silently renders nothing reactive, which looks like a data problem.

## Interpretation

- **`Cannot find module './_generated/api'`** — the API has not been generated. Run `npx convex dev` once; this is not a code error.
- **A function that works locally and fails in production** — a missing environment variable on the production deployment, or the function was never deployed. Compare `env list` with `env list --prod` and check the dashboard's function list.
- **Data present in development and absent in production, or the reverse** — they are separate databases. This is expected, not a sync failure.
- **`useQuery` staying `undefined` forever** — the provider has no URL, the function name is wrong, or an argument validator is rejecting the call. The logs name the last one.
- **A schema change rejected on push** — existing documents do not match the new definition. Hand off to `11ai-operator-convex-schema`.
- **A public function that mutates or reads private data** — an exposure. Anything not meant for clients should be `internalMutation` or `internalQuery`.
- **Slow queries or a read limit error** — a query without an index scanning a large table. Hand off to `11ai-operator-convex-functions`.

## Report

State the CLI version, whether the project is initialized and the generated API exists, the active development deployment and whether production exists, the URL the client reads, the environment variable **names** on each deployment with any development-only ones flagged, the tables and indexes in the schema, the cron jobs defined, and the count of public versus internal functions with any suspicious public mutation named. Report variable values as set or unset only. End with the smallest next safe step, and hand off to `11ai-operator-convex-setup` if the project is not linked or to `11ai-operator-convex-troubleshooting` if something is already failing.
