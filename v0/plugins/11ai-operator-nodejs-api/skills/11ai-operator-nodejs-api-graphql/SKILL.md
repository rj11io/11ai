---
name: 11ai-operator-nodejs-api-graphql
description: "Add a GraphQL surface to a Node.js API safely, covering schema-first types and resolvers, the N-plus-one problem and batching, depth and complexity limits, disabling introspection and persisted queries in production, authorization per field rather than per request, errors and partial results, pagination conventions, and why a single endpoint defeats path-based rate limiting. Use when a GraphQL endpoint must be added, when queries are slow from repeated database calls, or when a GraphQL surface must be reviewed for abuse resistance."
---
# 11ai Node.js API GraphQL

GraphQL hands query construction to the client, which moves two problems from the client to your server: a single request can fan out into thousands of database calls, and a single deeply nested query can be arbitrarily expensive. Neither is optional to solve — an unprotected GraphQL endpoint is a denial-of-service surface.

## Inspect what exists

```bash
grep -rn 'graphql\|apollo\|@envelop\|mercurius\|graphql-yoga' package.json 2>/dev/null
ls src/graphql/ src/schema/ 2>/dev/null
grep -rn 'introspection\|depthLimit\|costAnalysis\|persistedQueries' --include='*.ts' src/ 2>/dev/null
grep -rn 'DataLoader' --include='*.ts' src/ 2>/dev/null | head
```

Three absences to look for, each a real exposure: no depth or complexity limit, introspection enabled in production, and no batching layer. If a schema already exists, check whether resolvers hit the database directly per field.

## Define the schema and resolvers

```ts
const typeDefs = /* GraphQL */ `
  type Order {
    id: ID!
    total: Int!
    createdAt: String!
    customer: Customer!
    items: [OrderItem!]!
  }

  type Query {
    order(id: ID!): Order
    orders(first: Int = 20, after: String): OrderConnection!
  }

  type Mutation {
    cancelOrder(id: ID!): Order!
  }
`
```

Return integers in minor units for money, and make nullability deliberate: a non-null field whose resolver throws nulls out its whole parent, so mark a field non-null only when it genuinely always resolves.

Use a connection shape for lists — `edges`/`pageInfo` or `data`/`pageInfo` — from the start. Retrofitting pagination onto a plain list field is a breaking change for every client.

## Solve the N-plus-one problem

```ts
import DataLoader from "dataloader"

export function createLoaders() {
  return {
    customerById: new DataLoader<string, Customer | null>(async (ids) => {
      const { rows } = await pool.query(
        `select id, email from public.customers where id = any($1::uuid[])`,
        [ids as string[]]
      )
      const byId = new Map(rows.map((r) => [r.id, r]))
      return ids.map((id) => byId.get(id) ?? null)
    }),
  }
}
```

```ts
const resolvers = {
  Order: {
    customer: (order, _args, ctx) => ctx.loaders.customerById.load(order.customerId),
  },
}
```

Without a loader, a query returning 100 orders each with a customer issues 101 queries — the field resolver runs once per parent. The loader collects the ids within one tick and issues a single `where id = any(...)`.

Two rules: **create loaders per request**, never at module scope, or one user's data is cached into another's response; and **return results in the same order as the requested keys**, with a null placeholder for a miss, or the loader hands the wrong record to the wrong parent.

## Limit depth and complexity

```ts
import depthLimit from "graphql-depth-limit"

const server = new ApolloServer({
  schema,
  validationRules: [depthLimit(8)],
  introspection: process.env.NODE_ENV !== "production",
  plugins: [complexityPlugin({ maximumComplexity: 1_000 })],
})
```

A self-referencing schema lets a client nest indefinitely — `order { customer { orders { customer { ... } } } }` — and each level multiplies the work. A depth limit stops that class of query outright.

Depth alone is not enough: a shallow query requesting `first: 10000` on three list fields is cheap by depth and enormous by cost. Assign a complexity per field, weight list fields by their requested size, and cap the total.

Also cap `first` per list field, exactly as in a REST list endpoint, and set a request timeout so a query that slips through cannot run indefinitely.

For a first-party client, persisted queries are the strongest control: the server accepts only a known set of query hashes, which removes arbitrary query construction entirely.

Disable introspection in production. It is convenient in development and publishes your entire schema — including fields and mutations an attacker would otherwise have to guess.

## Authorize per field, in resolvers

```ts
const resolvers = {
  Query: {
    order: async (_parent, { id }, ctx) => {
      if (!ctx.userId) throw new GraphQLError("Unauthorized", { extensions: { code: "UNAUTHENTICATED" } })
      const order = await findOrder(id)
      if (!order || order.customerId !== ctx.customerIdFor(ctx.userId)) {
        throw new GraphQLError("Not found", { extensions: { code: "NOT_FOUND" } })
      }
      return order
    },
  },
}
```

A single request can reach many types through many paths, so a check at the entry point is not sufficient — a nested field can expose a record the top-level query was allowed to fetch. Authorize where the data is loaded, and take the identity from the verified context, never from an argument.

Return the same error for absent and forbidden where enumeration matters.

## Handle errors and rate limiting

GraphQL returns 200 with an `errors` array and partial data, so a client checking only the status code misses failures. Use `extensions.code` for a machine-readable reason, and never leak a database message or stack trace — mask unexpected errors and log the original with a request id.

Because everything arrives at one path, path-based rate limiting does not work. Limit on operation cost or on operation name instead, and keep the endpoint out of any limiter keyed by URL alone.

## Verify

```bash
curl -s http://localhost:4000/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ orders(first: 5) { data { id customer { email } } } }"}' | jq
curl -s http://localhost:4000/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ __schema { types { name } } }"}' | jq '.errors'
curl -s http://localhost:4000/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ orders { data { customer { orders { data { customer { email } } } } } } }"}' | jq '.errors'
```

Check: introspection is refused with production settings; a query past the depth limit is rejected before executing; and — the important one — count the database queries behind a list-with-nested-field request and confirm it is a small constant rather than one per row. Enable query logging and read the count.

Then confirm a query for another user's record returns not-found, an oversized `first` is clamped, and an unexpected resolver error returns a masked message with no stack trace.

## Report

State the endpoint and schema surface, the loaders added and the measured query count before and after for a nested list, the depth and complexity limits and the caps on list arguments, whether introspection is disabled in production and whether persisted queries are in use, where authorization happens and that identity comes from the verified context, the error masking and codes, how rate limiting is keyed given the single path, and the verification including the introspection, depth, query-count, and cross-user checks.
