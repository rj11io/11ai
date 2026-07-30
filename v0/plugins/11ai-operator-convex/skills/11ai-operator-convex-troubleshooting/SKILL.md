---
name: 11ai-operator-convex-troubleshooting
description: "Diagnose Convex failures from reproducible evidence, covering a missing generated API, queries stuck loading, null identity, rejected schema pushes, read and write limit errors from unindexed queries, argument validator failures, actions partially applying changes, missing deployment environment variables after deploy, broken open clients after an incompatible deploy, and development versus production data confusion. Use when a function errors, when a query never resolves, when a deploy broke something, or when it works locally and fails in production."
---
# 11ai convex troubleshooting

Separate observed facts from theories. Two questions answer most Convex reports before any code is read: which deployment is this, and has the API been generated. Do not disable validators, widen a public function's access, or import production data into development to test an idea.

## Evidence collection

```bash
npx convex --version
ls -la convex/_generated/ 2>/dev/null || echo "generated API missing"
grep -o 'CONVEX_DEPLOYMENT=.*' .env.local 2>/dev/null
npx convex logs --limit 50
npx convex logs --prod --limit 50
npx convex env list
npx convex env list --prod
npx convex dashboard
```

`npx convex logs` is the primary evidence here — Convex logs every function call with its arguments, return value, and error. Read it before reading code.

`env list` prints values, so report names only and never paste its output whole.

```bash
npx convex run module:functionName '{}'
npx tsc --noEmit
```

Running a function from the CLI is unauthenticated, which is useful twice: it reproduces a failure without the browser, and it reveals whether a function that should require identity actually does.

## Classify the failure

- **`Cannot find module './_generated/api'`** — the API has never been generated. Run `npx convex dev` once. This is not a code error and no amount of editing imports will fix it.
- **`useQuery` stays `undefined` forever** — the provider has no URL, the function name is wrong, an argument validator is rejecting the call, or the handler is throwing. The logs name the last two. Note that `undefined` means loading and is never the empty result — check with `=== undefined`, not falsiness.
- **`getUserIdentity()` returns null for a signed-in user** — one of three things: `convex/auth.config.ts` is missing or names the wrong issuer domain or application id, the client uses the plain `ConvexProvider` instead of the authenticated one so no token is sent, or a server-side read did not pass `{ token }`. Check in that order.
- **A schema push rejected** — existing documents do not match the new definition. It can pass in development and fail on production because production has different data. Widen, backfill, then narrow; see `11ai-operator-convex-schema`.
- **A read or write limit error, or a slow query** — a query using `filter` instead of `withIndex`, so it reads every document in the table. Works at ten rows, fails at scale. Add the index and use `withIndex`.
- **An argument validator failure** — the client is sending a different shape than the function declares, often after a schema change without regenerating types. Regenerate and typecheck.
- **`Math.random()` or `Date.now()` behaving oddly in a query** — queries must be deterministic because their results are cached. Generate those values in a mutation and pass them in.
- **A Node import failing in a function** — queries and mutations run in a restricted runtime. External calls and Node packages belong in an action with `"use node"` at the top of the file.
- **An action that half-applied its changes** — actions are not transactional and each `runMutation` commits independently. Group the writes that must land together into one mutation.
- **The same work happening twice** — a retried action or a redelivered webhook with no idempotency guard. Key on the event id or check a marker field before acting.
- **Works locally, fails after deploy** — an environment variable set on the development deployment and missing in production. Compare `env list` with `env list --prod`; the resulting error rarely names the variable.
- **Open browser tabs breaking right after a deploy** — the deploy removed or narrowed a function those clients still call. Clients do not reload. Add first, ship, remove later; see `11ai-operator-convex-deployments`.
- **Data present in one deployment and absent in the other** — they are separate databases. This is expected, not a sync failure.
- **A public function returning data it should not** — every non-internal function is an endpoint. Authorization belongs in the handler, and anything private should be `internalQuery` or `internalMutation`.
- **A file URL returning nothing** — the storage id was never recorded on a document, or the upload's recording mutation was never called. Check for orphaned files.

## Remediation discipline

1. Establish the deployment and whether the API is generated. Many reports end here.
2. Read `npx convex logs` before the code. The failing call, its arguments, and its error are already recorded.
3. Reproduce with `npx convex run` so the browser is out of the picture.
4. Fix the cause, not the symptom. Removing a validator, replacing `withIndex` with a larger `take`, making a private function public, or catching and swallowing an action's error each hide the problem.
5. State confidence as high, medium, or low and name the evidence you are missing.
6. Make one bounded change, then rerun the original failing path end to end — including reactivity, since a working single call does not prove a working subscription.
7. Before rerunning a failed action or migration, check what the failed attempt already committed. Actions have no transaction, so partial state is normal.
8. Never import production data into a development deployment to reproduce something. It copies real personal data onto a developer machine; generate a seed or redact first.

Hand off when the cause is elsewhere: `11ai-operator-convex-environment` for deployment and variable questions, `11ai-operator-convex-setup` if the project is not linked, `11ai-operator-convex-schema` for rejected pushes and indexes, `11ai-operator-convex-functions` for limits and authorization, `11ai-operator-convex-actions` for external calls and retries, and `11ai-operator-convex-deployments` for anything that started at a deploy.

## Report

Conclude with: which deployment was involved, whether the generated API was present, the exact error from the logs with the function name and arguments, the failing layer — generation, provider, identity, schema, index, runtime, action, or deploy — the root cause or remaining uncertainty, the fix applied or proposed and why it addresses the cause rather than the symptom, its impact, how to undo it, and the verification result including reactivity. Never print `env list` values, secrets, or deploy keys. Flag any public function without an authorization check as an exposure.
