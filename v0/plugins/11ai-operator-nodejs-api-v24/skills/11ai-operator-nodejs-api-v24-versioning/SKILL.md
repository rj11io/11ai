---
name: 11ai-operator-nodejs-api-v24-versioning
description: "Introduce an API version and retire an old one without breaking clients, covering what counts as a breaking change, URL path versus header versioning, running two versions from one codebase with a shared service layer, additive changes that need no new version, deprecation headers and sunset dates, measuring real client usage before removal, and the removal sequence. Use when a change would break existing clients, when a second version must be introduced, or when an old version must be retired safely."
---
# 11ai Node.js API versioning

Version baseline: Node.js 24.x Krypton LTS, using the latest security patch in that release line (24.18.0 at this review). Do not silently move an existing application between Node release lines; inspect engines, runtime files, CI, and deployment support first.

Most changes do not need a new version, and a new version is expensive — two code paths, two test suites, two things to document. So the first question is always whether the change is actually breaking. The second is whether anyone is still using what you plan to remove, answered with data rather than assumption.

## Decide whether it is breaking

Breaking, and needing a version or a migration plan:

- Removing or renaming a field in a response, or a parameter in a request.
- Changing a field's type, or its format — an integer to a string, a date format.
- Making an optional request field required, or adding a required one.
- Changing a status code for an existing condition, or the error body shape.
- Narrowing an enum's accepted values, or tightening validation on existing input.
- Changing default behaviour, pagination shape, or sort order clients rely on.

Not breaking, and safe to ship directly:

- Adding an optional request field.
- Adding a field to a response — provided clients do not reject unknown fields.
- Adding a new endpoint, or a new optional query parameter with the previous default.
- Widening an enum's accepted input, or relaxing a validation rule.

The asymmetry: adding to a response is safe, removing is not. Loosening input is safe, tightening is not.

```bash
grep -rn 'v1\|/api/' --include='*.ts' src/routes/ 2>/dev/null | head
git log --oneline -20 -- src/routes/
```

Check how the API is already versioned before choosing — consistency beats the theoretically better scheme.

## Choose the scheme

**URL path** — `/api/v1/orders`. Visible in logs, cacheable, trivial to route, easy to test with `curl`. The pragmatic default.

**Header** — `Accept: application/vnd.example.v2+json`. Keeps URLs stable, and is invisible in logs and awkward to test, which makes debugging harder.

Version the API as a whole rather than per endpoint. Per-endpoint versions produce combinations nobody can reason about or document.

## Run both versions from one codebase

```ts
// src/routes/v1/orders.ts
import { listOrders } from "../../services/orders.js"

router.get("/orders", async (req, res) => {
  const result = await listOrders(req.query)
  res.json({ orders: result.data.map(toV1Order), total: result.total })
})
```

```ts
// src/routes/v2/orders.ts
router.get("/orders", async (req, res) => {
  const result = await listOrders(req.query)
  res.json({ data: result.data.map(toV2Order), pageInfo: result.pageInfo })
})
```

```ts
app.use("/api/v1", v1Router)
app.use("/api/v2", v2Router)
```

Keep one service layer and one database schema, with a thin presentation mapper per version. Two versions with duplicated business logic diverge, and a bug fixed in one silently persists in the other.

The mapper is where a version lives — `toV1Order` keeps the old field names and shape. That means an internal rename does not need a new version at all, because only the mapper changes.

The database is not versioned. Use expand-then-contract so one schema serves both versions: add the new column, write both, backfill, then read the new one — never a column per API version.

## Deprecate with dates and evidence

```ts
v1Router.use((_req, res, next) => {
  res.setHeader("Deprecation", "true")
  res.setHeader("Sunset", "Wed, 31 Dec 2026 23:59:59 GMT")
  res.setHeader("Link", '</api/v2/orders>; rel="successor-version"')
  next()
})
```

The `Sunset` header is a machine-readable removal date, and it must be a real date that will be honoured. Announce it, and give a window proportional to how hard the migration is and how little control you have over the clients.

Measure before removing anything:

```ts
v1Router.use((req, _res, next) => {
  logger.info({ version: "v1", path: req.path, clientId: req.auth?.clientId }, "versioned request")
  next()
})
```

Log the version and the identified client on every request, then report actual usage — which clients, how many requests, and when each was last seen. Removing a version because the date arrived, while a customer still sends 40% of its traffic there, is an outage you scheduled for yourself. Contact remaining clients directly rather than relying on a header they never read.

## Remove in order

1. Announce the sunset date and set the headers.
2. Watch usage fall; contact the clients that remain.
3. Once usage is effectively zero, return `410 Gone` with a message naming the successor — not a 404, which reads as a bug.
4. Remove the routes and mappers in a later release, and drop the version from the published description in the same change.
5. Only then remove any schema left over from expand-then-contract.

Consider a brownout before removal: return 410 for a short window at a announced time, so a client still depending on it discovers the problem while someone is watching rather than at removal.

## Verify

```bash
curl -s http://localhost:3000/api/v1/orders | jq 'keys'
curl -s http://localhost:3000/api/v2/orders | jq 'keys'
curl -i http://localhost:3000/api/v1/orders | grep -iE 'deprecation|sunset|link'
curl -i http://localhost:3000/api/v3/orders
```

Confirm both versions return their own documented shape from the same underlying data, the deprecation and sunset headers are present on the old one, and an unknown version returns a clear 404 rather than falling through to a default. Run both versions' test suites, and confirm a change to the shared service layer is reflected in both.

After a retirement, confirm the removed version returns 410 with the successor named, and that no remaining route still serves it.

## Report

State whether the change is genuinely breaking and which rule makes it so, the versioning scheme and that it matches the existing one, the shared service layer and per-version mappers, the schema strategy showing one schema serves both, the deprecation and sunset headers with the real date, the measured usage per client for anything being retired, the removal sequence and where it currently stands, and the verification of both versions plus the unknown-version and post-retirement responses.
