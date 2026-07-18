---
name: 11ai-nodejs-api-environment
description: "Inspect a Node.js API project's runtime, package manager, framework, scripts, entrypoints, configuration, dependencies, and local prerequisites without changing the environment. Use when a project is unfamiliar, a task needs an evidence-based starting point, or the user asks whether the API is configured or runnable."
---

# 11ai Node.js API environment

Establish what the project is, how it runs, and which conventions it already uses before editing or operating it. Keep the first pass read-only. Do not install packages, rewrite lockfiles, start long-lived services, switch Node versions, or print environment values merely to inspect the environment.

## Workflow

1. Identify the working directory, repository boundary, and operating system when paths or process commands depend on it.
2. Find the package manager from the lockfile and check the matching runtime:

   ```bash
   node --version
   npm --version
   pnpm --version
   yarn --version
   bun --version
   ```

   Run only the package-manager checks that are relevant and available; a missing optional manager is not automatically a project failure.
3. Read `package.json` scripts, engines, dependencies, and devDependencies. Look for framework signals such as `express`, `fastify`, `koa`, `hono`, `@nestjs/core`, `polka`, or a custom Node HTTP server.
4. Locate likely entrypoints and route registration with focused searches:

   ```bash
   rg --files -g 'package.json' -g '*lock*' -g 'src/**' -g 'app/**' -g 'server/**'
   rg -n "listen\(|createServer\(|Router\(|fastify\(|express\(|NestFactory|app\.route|app\.(get|post|put|patch|delete)" .
   ```

5. Inventory configuration by filename only: `.env.example`, `.env.local`, config modules, port settings, test setup, and service definitions. Never print `.env` contents or connection strings.
6. Identify the test runner, lint/typecheck commands, health endpoint, and whether the API can be injected into tests without binding a real port.
7. Report findings as facts, unknowns, and the smallest safe next action.

## What to record

- Node.js version and whether `package.json` restricts it.
- Package manager and lockfile.
- Framework and the actual server entrypoint.
- Development, production, test, lint, and typecheck scripts.
- Route registration locations and middleware order.
- Configuration names and required variables, never their secret values.
- Existing auth, validation, error, logging, and HTTP-client conventions.
- Test runner and the command for the smallest relevant test.
- Port and health-check evidence, if the server is already running.

## Classification

- **Runnable**: the expected runtime and dependencies are present and a project script can start or test the API.
- **Configured but unverified**: scripts and config are present, but starting the service was not requested or cannot be safely verified yet.
- **Blocked by environment**: the required runtime, package manager, dependency install, variable, or service is missing; quote the exact evidence.
- **Ambiguous**: multiple entrypoints, package managers, frameworks, or ports exist; preserve the ambiguity and ask which target is intended.

## Reporting

End with a compact environment summary and a next-action recommendation. Separate observations from assumptions. If a fix requires installation, a version switch, a secret, a database, or a remote service, name it as a prerequisite instead of performing it implicitly.
