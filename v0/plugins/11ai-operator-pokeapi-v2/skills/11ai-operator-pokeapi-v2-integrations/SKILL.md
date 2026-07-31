---
name: 11ai-operator-pokeapi-v2-integrations
description: "Connect a cache-first PokéAPI v2 client to server applications, browser-facing APIs, static generation, background jobs, test suites, CI, and supported wrapper libraries while centralizing request budgets, observability, persistence, and same-origin URL validation. Use when wiring PokéAPI into an application stack, sharing cached data across processes, preventing per-browser amplification, or making builds and tests deterministic."
---
# 11ai PokéAPI v2 integrations

The seam to protect is between application demand and the public API. Resolve the runtime, deployment topology, cache owner, persistence boundary, and expected query volume before wiring any consumer.

## Inspect the integration surfaces

```bash
rg -n "pokeapi\.co|api/v2|POKEAPI_|pokemon-species" . --glob '!node_modules' --glob '!dist' --glob '!build'
rg -n "fetch\(|axios|requests\.|CachedSession|serviceWorker|generateStaticParams|cron" . --glob '!node_modules'
```

Identify server routes, browser calls, build-time generation, workers, scheduled jobs, tests, and CI. Locate which layer owns persistence and whether several processes can miss on the same key concurrently.

## Wire one shared boundary

Prefer one server-side adapter that accepts only validated relative PokéAPI v2 paths, checks the shared persistent cache, enforces list caps and request concurrency, and returns a reduced application response. Browser clients should call that adapter rather than send one public request per user.

Static generation and jobs must use the same adapter. Preview their unique canonical URLs and miss count before execution; do not re-fetch the full dataset on every build or schedule a broad refresh. Tests should use recorded fixtures or a temporary seeded cache, with live tests opt-in and bounded to one known resource.

Read [references/integrations.md](references/integrations.md) for server, browser, build, test, CI, and wrapper-library patterns.

## Verify end to end

Run one narrow flow and observe both layers:

1. First application request produces at most one upstream network request and a durable cache entry.
2. A second application request, ideally through another process, is a cache hit.
3. Concurrent identical requests coalesce to one upstream request.
4. A caller-supplied absolute URL for another origin is rejected.
5. A list stops at its configured cap and reports remaining results.
6. A transient failure does not erase the last-known-good body or start an unbounded retry loop.

Do not test with a full Pokédex, generation, region, or endpoint crawl.

## Integration guardrails

Keep the cache shared when deployment architecture permits it; per-instance ephemeral caches can multiply requests after every restart or scale-out. If persistence cannot be shared, state the amplification risk and choose a preseed or managed cache deliberately.

Do not proxy arbitrary URLs, expose cache purge or refresh controls publicly, trust browser-supplied pagination limits, or log full response bodies. Changing cache backends, keys, or retention can invalidate all entries; preview the resulting miss volume and request approval.

## Report

State each consumer, the shared adapter and cache owner, persistence and locking model, URL validation, list and concurrency bounds, counters exposed, live-test policy, and verification results including first-read versus second-read network requests. Hand client setup to setup, cache policy to cache, and failing flows to troubleshooting.
