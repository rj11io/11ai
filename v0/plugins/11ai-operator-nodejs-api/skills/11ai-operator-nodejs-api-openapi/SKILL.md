---
name: 11ai-operator-nodejs-api-openapi
description: "Generate, serve, and check an OpenAPI description of a Node.js API, covering generating the document from the validation schemas that already run rather than hand-writing it, documenting error shapes and security schemes, serving the document and an interactive page, keeping it honest with a drift check in the pipeline, and versioning it alongside the API. Use when an API needs a published contract, when the existing document has drifted from the code, or when clients need a generated SDK."
---
# 11ai Node.js API OpenAPI

A hand-written OpenAPI document is wrong within weeks. Generate it from the validation schemas the API already enforces at runtime, so the description cannot drift from the behaviour — and then have the pipeline fail when it does.

## Inspect what exists

```bash
ls openapi.json openapi.yaml docs/openapi* 2>/dev/null
grep -rn 'swagger\|openapi\|zod-to-openapi\|@fastify/swagger' package.json 2>/dev/null
grep -rn 'z.object\|Type.Object\|joi.object' --include='*.ts' src/ 2>/dev/null | head
```

Establish where request and response shapes are already defined. If the API validates with Zod, TypeBox, or JSON Schema, those definitions are the source — reuse them. If nothing validates, add validation first: a document describing shapes nothing enforces is fiction.

Check for an existing committed document and whether it matches the routes.

## Generate from the runtime schemas

```bash
npm install --save-dev @asteasolutions/zod-to-openapi
```

```ts
// src/openapi/registry.ts
import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

extendZodWithOpenApi(z)

export const registry = new OpenAPIRegistry()

export const UserSchema = registry.register(
  "User",
  z.object({
    id: z.string().uuid().openapi({ example: "01923e5a-0000-7000-8000-000000000000" }),
    email: z.string().email(),
    createdAt: z.string().datetime(),
  })
)

export const ErrorSchema = registry.register(
  "Error",
  z.object({
    error: z.object({ code: z.string(), message: z.string() }),
  })
)

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
})
```

```ts
registry.registerPath({
  method: "get",
  path: "/api/users/{id}",
  summary: "Fetch one user",
  tags: ["users"],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: "The user", content: { "application/json": { schema: UserSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorSchema } } },
  },
})
```

The same `UserSchema` validates at runtime and describes the response, which is what removes drift.

Document the failures, not only the happy path. An operation listing a single 200 is the most common defect in a generated document: clients then have no idea what an error looks like, and every consumer invents its own handling.

For Fastify, the JSON Schema already attached to each route can produce the document directly through the framework's own plugin — prefer that over a second definition.

## Serve and publish

```ts
// scripts/generate-openapi.ts
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi"
import { writeFileSync } from "node:fs"
import { registry } from "../src/openapi/registry.js"

const document = new OpenApiGeneratorV31(registry.definitions).generateDocument({
  openapi: "3.1.0",
  info: { title: "Orders API", version: process.env.npm_package_version ?? "0.0.0" },
  servers: [{ url: "https://api.example.com" }],
})

writeFileSync("openapi.json", JSON.stringify(document, null, 2) + "\n")
```

```json
{
  "scripts": {
    "openapi": "tsx scripts/generate-openapi.ts",
    "openapi:check": "npm run openapi && git diff --exit-code openapi.json"
  }
}
```

```ts
app.get("/openapi.json", (_req, res) => res.json(document))
```

Commit the generated document. That makes changes to the public contract visible in review, which is the point — a breaking change should appear in a diff rather than being discovered by a client.

Serving an interactive page is convenient in development and a decision in production: it publishes your whole surface, including endpoints an unauthenticated visitor should not know about. Gate it behind authentication or serve it only in non-production unless the API is genuinely public.

Never let the document include a real credential in an example, and never let it describe an internal-only endpoint on a public page.

## Keep it honest

```yaml
      - run: npm run openapi:check
```

`git diff --exit-code` after regenerating fails the build when someone changed a schema or route and did not regenerate. That single step is what keeps the document true; without it, generation is just a snapshot from whenever someone last remembered.

Add a spec-validity check and, for a published API, a breaking-change check against the previous version:

```bash
npx @redocly/cli lint openapi.json
```

The remaining honesty gap is routes that exist in code and not in the registry. Compare the counts and treat a mismatch as a failure:

```bash
node -e '
  const doc = require("./openapi.json");
  console.log("documented operations:", Object.values(doc.paths).flatMap(p => Object.keys(p)).length);
'
```

## Version alongside the API

The document's `info.version` should track the API's release, and its path prefix should match however the API is versioned. When a version is retired, remove it from the document in the same change that retires the route — a document advertising a removed endpoint sends clients to a 404.

## Verify

```bash
npm run openapi
npx @redocly/cli lint openapi.json
curl -s http://localhost:3000/openapi.json | jq '.info, (.paths | keys)'
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/openapi.json
```

Then check the document against reality: pick two operations, send exactly what the document says, and confirm the response matches the declared schema and status. Send a deliberately invalid body and confirm the error matches the documented error shape. A document that has never been tested against the running API is unverified.

Generate a client from it as a final check — a generator failing usually means the document is invalid in a way a linter allowed.

## Report

State where the schemas come from and that they are the same ones enforced at runtime, the operations documented with their success and error responses, the security schemes, whether the document is committed and served, whether the interactive page is exposed in production and what gates it, the drift check in the pipeline and its result, the lint result, and the verification of two operations plus an error path against the running API. Name any route that exists in code but not in the document.
