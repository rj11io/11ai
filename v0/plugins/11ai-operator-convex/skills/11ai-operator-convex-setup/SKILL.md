---
name: 11ai-operator-convex-setup
description: "Set up a Convex project from zero, covering package install, project initialization and deployment linking, the development watcher that generates the API, the client provider for a framework, environment variables for local and hosted use, a first schema and function, and separating the development deployment from production. Use when a repository has no Convex directory, when the generated API is missing, when a project must be linked to a deployment, or when the user asks how to get Convex running."
---
# 11ai Convex setup

Two things trip up a first Convex setup: the generated API only exists after the development watcher has run once, and the development deployment is a different database from production. Get both straight before writing functions.

## Check what exists

```bash
npx convex --version
ls -la convex/ convex/_generated/ 2>/dev/null
grep -o 'CONVEX_DEPLOYMENT=.*' .env.local 2>/dev/null
cat package.json | grep -A3 '"dependencies"'
```

Use `11ai-operator-convex-environment` for the full inspection. If a `convex/` directory already exists with functions, this is not a fresh setup — add only what is missing rather than initializing over someone's work.

## Install and link

```bash
npm install convex
npx convex dev
```

`npx convex dev` does the initialization on first run: it prompts for login, lets you choose or create a project, creates a personal development deployment, writes `CONVEX_DEPLOYMENT` and the public URL into the local environment file, and then stays running to watch for changes.

That watcher is what generates `convex/_generated/`. Until it has run once, `import { api } from "./_generated/api"` cannot resolve and the editor reports an unknown module — which reads as a broken install and is simply a step not yet taken.

Read [references/setup.md](references/setup.md) for the framework provider wiring, the environment variable names per bundler, the first schema and function, and the production deployment step.

Choose the project deliberately. Creating a new one when the team already has it is a common mistake; `npx convex dev` will happily make a second project with the same name in a different team.

## Wire the client provider

The client needs the deployment URL at build time, and it must be a variable the bundler exposes to the browser:

- Next.js: `NEXT_PUBLIC_CONVEX_URL`
- Vite: `VITE_CONVEX_URL`

Create one `ConvexReactClient` at module scope and wrap the application in its provider. Creating a client per render opens a websocket per render.

Guard against a missing URL rather than letting the provider fail obscurely — a build that runs without the variable should say which variable is absent.

## Add a schema and a first function

Define the schema before writing much code. Convex will accept documents without one, but a schema gives you type safety and the indexes that keep queries fast:

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  messages: defineTable({
    body: v.string(),
    authorId: v.string(),
    createdAt: v.number(),
  }).index("by_author", ["authorId"]),
})
```

Declare argument validators on every function. A function without `args` validators accepts whatever a caller sends, and every non-internal function is callable by any client that knows its name. Anything not meant for clients must be `internalQuery`, `internalMutation`, or `internalAction`.

## Verify

```bash
npx convex dev --once
ls convex/_generated/
npx convex run messages:list '{}'
npx tsc --noEmit
```

`npx convex dev --once` pushes and generates without staying resident, which is what a script or a pipeline wants. Then check the loop end to end: start the application, confirm a `useQuery` returns data rather than staying `undefined`, and confirm a mutation's effect appears without a manual refresh — reactivity working is the proof the provider and deployment agree.

Confirm the deployment you are on:

```bash
grep -o 'CONVEX_DEPLOYMENT=.*' .env.local
```

A `dev:` prefix is a development deployment. Do not point local work at production.

## Guardrails

- Do not run `npx convex deploy` during setup. That pushes to production and belongs in `11ai-operator-convex-deployments`.
- Do not commit `.env.local`. The deployment URL is not secret, but the file will hold other values later.
- Commit `convex/_generated/` only if the project already does; otherwise leave it ignored and let each machine generate it. Be consistent either way, because a stale committed copy is worse than none.
- Do not create a public mutation or query for something only the backend should call.
- Do not skip argument validators to move faster; they are the input validation for every function.
- Do not import a Node-only package into a query or mutation. Those run in a restricted runtime; external calls belong in actions.
- Report the deployment name and whether it is development or production, the files created, the provider wiring and the URL variable, the schema and indexes defined, whether the generated API exists, and the verification result including that reactivity works.
