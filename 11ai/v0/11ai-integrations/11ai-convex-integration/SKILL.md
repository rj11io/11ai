---
name: 11ai-convex-integration
description: "Add or maintain a standalone Convex integration for application database and backend functions, including package setup, Convex project initialization, Next.js provider wiring, queries and mutations, generated API handling, local and production environment variables, Convex dashboard/deployment settings, CI deploy keys, and troubleshooting missing deployment or dashboard visibility issues."
---

# Convex Integration

## Overview

Use this skill to integrate Convex as the application database and backend function layer.

Prefer the official `convex` package and generated Convex files when the project is initialized. Before initialization, use lightweight function references only when needed to keep a repo compiling.

## Workflow

1. Inspect the repo.
   Check `package.json`, `convex/`, `convex.json`, `.env.local`, existing generated files, and whether the app already has a Convex provider.

2. Install and initialize Convex.
   Add `convex`.
   Run `npx convex dev` when the user is ready to log in and link/create a deployment.
   Let Convex populate local deployment values.

3. Add frontend provider.
   For React/Next.js, add `ConvexReactClient` and `ConvexProvider` around the app only when `NEXT_PUBLIC_CONVEX_URL` is available.

4. Add backend functions.
   Put Convex functions under `convex/`.
   Prefer generated imports from `convex/_generated/server` after initialization.
   Use `query`, `mutation`, and validators for production functions.

5. Use generated API references.
   Prefer `api.<module>.<function>` from `convex/_generated/api` in client code after codegen exists.
   Use explicit `makeFunctionReference` only as a temporary bridge before generated files are available.

6. Configure environments and deployment.
   Read [references/setup.md](./references/setup.md) for local env vars, dashboard checks, production hosting, and CI deploy key guidance.

7. Verify.
   Run `npx convex dev` locally, then run app typecheck, lint, build, and tests.

## Troubleshooting

- Deployment not visible in dashboard: confirm the active Convex account/team, then run `npx convex dashboard` from the repo.
- Missing `convex.json`: run `npx convex dev` and finish project linking.
- Missing `NEXT_PUBLIC_CONVEX_URL`: run `npx convex dev` or set the deployment URL manually.
- Generated file lint warnings: ignore `convex/_generated/**` in ESLint.
- Build fails without Convex env: guard provider initialization when `NEXT_PUBLIC_CONVEX_URL` is absent.

## References

Read [references/setup.md](./references/setup.md) for the step-by-step Convex setup guide.
