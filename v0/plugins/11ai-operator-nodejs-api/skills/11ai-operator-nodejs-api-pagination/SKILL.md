---
name: 11ai-operator-nodejs-api-pagination
description: "Add pagination, filtering, and sorting to a list endpoint, covering offset versus cursor paging and when each is correct, a stable sort key, clamped page sizes, allow-listed filter and sort fields, total counts and their cost, the indexes each query shape needs, and a consistent response envelope. Use when a list endpoint returns everything, when paging skips or repeats rows, or when filtering and sorting must be exposed without opening a query surface."
---
# 11ai Node.js API pagination

An unpaginated list endpoint works until the table grows and then takes the service down with it. Two rules carry this skill: sort on something unique so paging cannot skip or repeat rows, and never let a client name a column that reaches SQL.

## Inspect the endpoint and the data

```bash
grep -rn 'findMany\|select \*\|\.find(' --include='*.ts' src/repositories/ src/routes/ 2>/dev/null | head
grep -rn 'limit\|offset\|cursor\|page' --include='*.ts' src/routes/ 2>/dev/null | head
```

```sql
select count(*) from public.orders;
select indexname, indexdef from pg_indexes where tablename = 'orders';
```

Establish the row count and the existing indexes. Under a few thousand rows offset paging is fine; at hundreds of thousands a deep offset scans and discards every skipped row, so the last page is far slower than the first.

## Choose offset or cursor

**Offset paging** suits an interface with numbered pages and a total count:

```text
GET /api/orders?page=3&pageSize=20
```

**Cursor paging** suits an infinite scroll, a feed, or any large or actively changing set:

```text
GET /api/orders?limit=20&cursor=eyJpZCI6IjAxOTIzIn0
```

The correctness difference matters more than the performance one. With offset paging, a row inserted while a user reads page one pushes a row from page one onto page two, so they see it twice — and a deletion makes a row vanish unseen. Cursor paging anchors on a position in the ordering and does not drift.

Offer offset paging only where a total and jumpable pages are genuinely needed. Default to cursor paging for anything that grows.

## Implement cursor paging on a stable key

```ts
import { z } from "zod"

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  status: z.enum(["open", "paid", "cancelled"]).optional(),
  sort: z.enum(["created_at", "total"]).default("created_at"),
  direction: z.enum(["asc", "desc"]).default("desc"),
})

function decodeCursor(cursor?: string) {
  if (!cursor) return null
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      createdAt: string
      id: string
    }
  } catch {
    throw new HttpError(400, "invalid_cursor")
  }
}
```

```ts
export async function listOrders(params: z.infer<typeof listQuery>) {
  const after = decodeCursor(params.cursor)
  const comparison = params.direction === "desc" ? "<" : ">"

  const { rows } = await pool.query(
    `select id, status, total, created_at
       from public.orders
      where ($1::text is null or status = $1)
        and ($2::timestamptz is null or (created_at, id) ${comparison} ($2, $3))
      order by created_at ${params.direction === "desc" ? "desc" : "asc"}, id ${params.direction === "desc" ? "desc" : "asc"}
      limit $4`,
    [params.status ?? null, after?.createdAt ?? null, after?.id ?? null, params.limit + 1]
  )

  const hasMore = rows.length > params.limit
  const page = hasMore ? rows.slice(0, params.limit) : rows
  const last = page.at(-1)

  return {
    data: page,
    pageInfo: {
      hasMore,
      nextCursor: hasMore && last
        ? Buffer.from(JSON.stringify({ createdAt: last.created_at.toISOString(), id: last.id })).toString("base64url")
        : null,
    },
  }
}
```

The points that make this correct:

- **The sort key is a tuple ending in a unique column.** Ordering by `created_at` alone is ambiguous when timestamps tie, and rows with equal timestamps get skipped or repeated across pages. `(created_at, id)` is total.
- **Fetch `limit + 1`** to learn whether more exist without a second query or a count.
- **The direction and sort are interpolated only after passing an enum**, never taken as raw strings — an `order by` column cannot be parameterized, so an allow-list is the only safe route.
- **Clamp `limit`** with a maximum. An unbounded page size is a denial-of-service vector.
- **A malformed cursor is a 400**, not a 500, and never a silent reset to page one.

Treat the cursor as opaque. Base64 is encoding, not protection, so never put a filter a client should not control inside it — re-derive filters from the query string.

## Filter and sort from an allow-list

Every filterable field and every sortable field comes from a closed enum, as above. A generic filter surface — `?where=` or `?orderBy=` accepting arbitrary column names — is an injection and an accidental full-table-scan generator.

Index each shape you expose. The query above needs `(status, created_at desc, id desc)`; without it, filtered paging scans. Adding a filter without its index is how a fast endpoint becomes slow later.

## Handle totals honestly

```ts
const { rows: [{ count }] } = await pool.query(
  `select count(*)::int as count from public.orders where ($1::text is null or status = $1)`,
  [params.status ?? null]
)
```

An exact `count(*)` scans matching rows and costs roughly as much as the page query. Do not return one by default. Options, in order of preference: omit it and return `hasMore`; return it only when the client asks with `?includeTotal=true`; or return an estimate for very large tables.

## Keep one response envelope

```json
{
  "data": [],
  "pageInfo": { "hasMore": true, "nextCursor": "eyJ..." }
}
```

Use the same shape for every list endpoint. A client that has to special-case each one is a symptom of an inconsistent API, and adding a total later should not be a breaking change.

## Verify

```bash
curl -s 'http://localhost:3000/api/orders?limit=2' | jq
curl -s 'http://localhost:3000/api/orders?limit=2&cursor=CURSOR' | jq
curl -i 'http://localhost:3000/api/orders?limit=9999'
curl -i 'http://localhost:3000/api/orders?sort=;drop%20table%20orders'
curl -i 'http://localhost:3000/api/orders?cursor=not-base64'
```

Then check correctness rather than shape: page through the whole set collecting ids and confirm there are no duplicates and no gaps; insert a row between two page requests and confirm no row is repeated; and confirm an oversized limit is clamped rather than honoured, an unknown sort field is rejected, and a malformed cursor returns 400.

```sql
explain analyze select id from public.orders where status = 'open' order by created_at desc, id desc limit 21;
```

Confirm the plan uses the index and does not sort in memory.

## Report

State the endpoint, whether it uses offset or cursor paging and why, the sort tuple and that its last component is unique, the clamped maximum page size, the allow-listed filter and sort fields, the indexes backing each exposed shape with the explain result, how totals are handled and their cost, the response envelope, and the verification including the no-duplicates-no-gaps walk, the insert-during-paging check, and the rejected oversized limit, unknown sort field, and malformed cursor.
