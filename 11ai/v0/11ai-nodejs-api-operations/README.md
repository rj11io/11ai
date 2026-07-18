# 11ai Node.js API operations

Ten standalone skills for inspecting, changing, testing, and troubleshooting Node.js APIs across common frameworks such as Express, Fastify, Koa, Hono, and NestJS.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-nodejs-api-cheatsheet`](./11ai-nodejs-api-cheatsheet/SKILL.md) | Looking up common Node.js API commands, patterns, status codes, and diagnostics |
| [`11ai-nodejs-api-environment`](./11ai-nodejs-api-environment/SKILL.md) | Inspecting the runtime, package manager, framework, scripts, configuration, and local prerequisites |
| [`11ai-nodejs-api-server`](./11ai-nodejs-api-server/SKILL.md) | Starting, checking, observing, and safely stopping a local API server |
| [`11ai-nodejs-api-routes`](./11ai-nodejs-api-routes/SKILL.md) | Adding, changing, inspecting, and verifying HTTP routes while following project conventions |
| [`11ai-nodejs-api-validation`](./11ai-nodejs-api-validation/SKILL.md) | Validating request bodies, query strings, path parameters, and headers |
| [`11ai-nodejs-api-errors`](./11ai-nodejs-api-errors/SKILL.md) | Designing or repairing consistent API errors, status mapping, and safe logging |
| [`11ai-nodejs-api-auth`](./11ai-nodejs-api-auth/SKILL.md) | Adding or debugging API-key, bearer-token, JWT, or existing middleware authentication |
| [`11ai-nodejs-api-http-client`](./11ai-nodejs-api-http-client/SKILL.md) | Calling upstream APIs with fetch or the project's existing HTTP client safely |
| [`11ai-nodejs-api-testing`](./11ai-nodejs-api-testing/SKILL.md) | Writing and running focused unit, route, integration, and contract tests |
| [`11ai-nodejs-api-troubleshooting`](./11ai-nodejs-api-troubleshooting/SKILL.md) | Diagnosing startup, routing, auth, validation, upstream, test, and runtime failures |

## How the skills compose

Start with `11ai-nodejs-api-environment` when the project is unfamiliar. Pair `11ai-nodejs-api-routes` with `11ai-nodejs-api-validation`, `11ai-nodejs-api-errors`, and `11ai-nodejs-api-testing` when changing an endpoint. Use `11ai-nodejs-api-server` for local runtime work and hand failures to `11ai-nodejs-api-troubleshooting` with the evidence already collected.

The skills discover and preserve the project's existing framework, package manager, response envelope, authentication, test runner, and configuration conventions. They do not silently install dependencies, expose secrets, call production services, kill unrelated processes, or change public contracts without making the impact clear.

## Likely follow-on skills

Good candidates for a later release are database and CRUD operations, webhooks and signature verification, pagination and filtering, rate limiting, OpenAPI generation, observability and request correlation, background jobs, GraphQL, file uploads, deployment/runtime configuration, and API versioning.
