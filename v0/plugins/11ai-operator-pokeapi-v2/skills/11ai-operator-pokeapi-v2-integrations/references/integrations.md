# PokéAPI v2 integration recipes

## Server adapter

Expose application-specific operations instead of a public arbitrary-URL proxy:

```ts
export async function getPokemonSummary(name: string) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error("invalid Pokémon name")
  const result = await pokeApi.get(`pokemon/${name}/`)
  return {
    name: result.data.name,
    types: result.data.types.map((entry) => entry.type.name),
    cache: result.cache,
  }
}
```

Validate the identifier and construct the relative path inside trusted code. If a generic adapter is necessary, parse the URL and require the exact `https://pokeapi.co` origin and `/api/v2/` prefix before cache lookup or network access.

## Browser-facing route

```ts
export async function GET(request: Request) {
  const url = new URL(request.url)
  const name = url.searchParams.get("name") ?? ""
  if (!/^[a-z0-9-]+$/.test(name)) {
    return Response.json({ error: "invalid_name" }, { status: 400 })
  }

  const summary = await getPokemonSummary(name)
  return Response.json(summary, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
  })
}
```

The downstream response cache is separate from the upstream PokéAPI cache. Choose browser/CDN durations from the application's freshness requirements; the numbers above are examples, not PokéAPI policy. The persistent upstream cache must still be checked before any revalidation request reaches PokéAPI.

## Static generation

Before a build, materialize the exact route list and compute unique cache misses. For a small explicit set:

```ts
const names = ["bulbasaur", "charmander", "squirtle"]
const summaries = []
for (const name of names) summaries.push(await getPokemonSummary(name))
```

Keep the set in source or project configuration so a reviewer can see its bound. Do not turn `count` from a list response into thousands of build-time detail requests without approval. Persist the cache between CI runs only if the CI cache key and retention policy are understood; an opaque eviction should not trigger a surprise crawl.

## Background work

Scheduled jobs should process an explicit queue of canonical URLs, deduplicate before execution, skip valid cache hits, and record a request budget. Avoid periodic whole-dataset refreshes. If freshness is needed, spread conditional revalidation with jitter and stop on sustained failures rather than retrying the queue aggressively.

## Tests

Unit tests should inject a fake cache and transport. Integration tests can seed a temporary cache with known JSON fixtures and assert no transport call occurs. A live smoke test must be opt-in, use one small stable resource, populate a persistent developer cache, and assert that its second execution makes zero network calls.

Record fixture provenance as canonical URL and fetch date. Do not silently update every fixture during normal tests; fixture refresh is a reviewed operation.

## Wrapper libraries

The official docs list several auto-caching wrappers for JavaScript, Python, Kotlin, Java, .NET, Swift, PHP, Ruby, Go, Rust, Scala, and Elixir. Before adopting one, verify:

- Its cache is persistent rather than process-local.
- The cache key includes the full query.
- It exposes or permits bounded concurrency, pagination, timeouts, and retries.
- It can report cache hits and network requests.
- It does not eagerly fetch linked resources.
- Its maintenance and runtime compatibility meet the repository's requirements.

An "auto caching" label does not prove that cache survives process restarts or works across application instances.

## Observability

Record counters and latency without full bodies:

```text
pokeapi_cache_hit_total
pokeapi_cache_miss_total
pokeapi_cache_stale_served_total
pokeapi_revalidation_total
pokeapi_network_request_total
pokeapi_retry_total
pokeapi_singleflight_join_total
```

Include endpoint family and outcome only when labels stay low-cardinality. Do not label metrics with Pokémon names, full URLs, offsets, or cache hashes.
