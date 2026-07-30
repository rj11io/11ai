# 11ai Convex operations

Eleven standalone skills for common Convex backend work, with read-first checks around schema changes, deploys, public function surfaces, and anything that touches production data.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-convex-cheatsheet`](./skills/11ai-convex-cheatsheet/SKILL.md) | Looking up CLI commands, the three function types, validators, database methods, and client hooks |
| [`11ai-convex-setup`](./skills/11ai-convex-setup/SKILL.md) | Installing, linking a deployment, generating the API, and wiring the client provider |
| [`11ai-convex-environment`](./skills/11ai-convex-environment/SKILL.md) | Inspecting which deployment is active, its variables, the schema, crons, and the public function surface |
| [`11ai-convex-schema`](./skills/11ai-convex-schema/SKILL.md) | Defining tables and indexes, and migrating a field without losing data |
| [`11ai-convex-functions`](./skills/11ai-convex-functions/SKILL.md) | Writing queries and mutations with validators, authorization, indexes, and pagination |
| [`11ai-convex-actions`](./skills/11ai-convex-actions/SKILL.md) | Calling external services, scheduling work, crons, and inbound HTTP endpoints |
| [`11ai-convex-auth`](./skills/11ai-convex-auth/SKILL.md) | Wiring an identity provider and enforcing per-document access inside functions |
| [`11ai-convex-file-storage`](./skills/11ai-convex-file-storage/SKILL.md) | Uploading, serving, authorizing, and deleting files, and sweeping orphans |
| [`11ai-convex-deployments`](./skills/11ai-convex-deployments/SKILL.md) | Deploying to production, deploy keys, previews, data export and import, and rollback |
| [`11ai-convex-integrations`](./skills/11ai-convex-integrations/SKILL.md) | Wiring React and Next.js clients, identity providers, outbound services, webhooks, and mirrors |
| [`11ai-convex-troubleshooting`](./skills/11ai-convex-troubleshooting/SKILL.md) | Diagnosing a missing generated API, stuck queries, null identity, read limits, and post-deploy failures |

The skills are intentionally narrow. Combine them when a task crosses boundaries, such as adding an index before writing a query, or confirming environment variables on production before deploying.

## Safety contract

Establish the deployment first. `npx convex dev` targets a personal development deployment and `npx convex deploy` targets production; they hold separate data and separate environment variables. A variable set in development and missing in production is the most common post-deploy failure, and the error rarely names it.

Every non-internal function is a public endpoint. A client that knows a function name can call it with any arguments, so hiding a button is not access control — declare argument validators on every function, check identity and per-document ownership inside the handler, and make anything private `internalQuery`, `internalMutation`, or `internalAction`. Never accept a user id or organization id as an argument and trust it.

Use `withIndex`, not `filter`, for anything that will grow. `filter` reads every document in the table, which works at ten rows and hits a read limit in production.

Mutations are transactional; actions are not. Group writes that must land together into one mutation, and make any retried or webhook-triggered work idempotent.

Treat as requiring explicit approval, naming the deployment: `npx convex deploy`, a schema change validated against production data, `convex import` and especially `--replace-all`, deleting files or documents in bulk, and generating or rotating a deploy key. Take an export before any destructive migration — it is the only rollback for data.

Roll out compatibly. Connected clients keep calling the signatures they were built with and do not reload, so add first, ship the frontend, and remove the old function or argument in a later deploy.

Do not print deploy keys, secrets, tokens, storage URLs, or the output of `npx convex env list`. Never import production data into a development deployment to reproduce a problem.
