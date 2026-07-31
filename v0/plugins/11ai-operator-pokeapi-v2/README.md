# 11ai PokéAPI v2 operator

Twelve standalone skills for consuming PokéAPI v2 with local caching, bounded pagination, and fair-use checks around every network request.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-pokeapi-v2-cheatsheet`](./skills/11ai-operator-pokeapi-v2-cheatsheet/SKILL.md) | Looking up resource paths, list shapes, pagination, and cache-first request patterns |
| [`11ai-operator-pokeapi-v2-environment`](./skills/11ai-operator-pokeapi-v2-environment/SKILL.md) | Inspecting the client, base URL, cache, request policy, and connectivity without changing them |
| [`11ai-operator-pokeapi-v2-setup`](./skills/11ai-operator-pokeapi-v2-setup/SKILL.md) | Configuring a cache-first PokéAPI v2 client from zero |
| [`11ai-operator-pokeapi-v2-cache`](./skills/11ai-operator-pokeapi-v2-cache/SKILL.md) | Designing cache keys, reads, revalidation, single-flight requests, eviction, and cache reporting |
| [`11ai-operator-pokeapi-v2-pokemon`](./skills/11ai-operator-pokeapi-v2-pokemon/SKILL.md) | Reading Pokémon, species, forms, abilities, types, stats, natures, and related taxonomy |
| [`11ai-operator-pokeapi-v2-moves`](./skills/11ai-operator-pokeapi-v2-moves/SKILL.md) | Reading moves, machines, battle metadata, learn methods, targets, and contest effects |
| [`11ai-operator-pokeapi-v2-items`](./skills/11ai-operator-pokeapi-v2-items/SKILL.md) | Reading items, pockets, categories, attributes, fling effects, berries, and berry metadata |
| [`11ai-operator-pokeapi-v2-locations`](./skills/11ai-operator-pokeapi-v2-locations/SKILL.md) | Reading regions, locations, areas, encounter conditions, and version-specific encounter data |
| [`11ai-operator-pokeapi-v2-evolution`](./skills/11ai-operator-pokeapi-v2-evolution/SKILL.md) | Resolving species to evolution chains and interpreting branching evolution requirements |
| [`11ai-operator-pokeapi-v2-games`](./skills/11ai-operator-pokeapi-v2-games/SKILL.md) | Reading generations, versions, version groups, Pokédexes, and localized names |
| [`11ai-operator-pokeapi-v2-integrations`](./skills/11ai-operator-pokeapi-v2-integrations/SKILL.md) | Sharing a persistent cache across servers, builds, jobs, tests, and browser-facing applications |
| [`11ai-operator-pokeapi-v2-troubleshooting`](./skills/11ai-operator-pokeapi-v2-troubleshooting/SKILL.md) | Diagnosing cache misses, stale data, 404s, pagination gaps, amplification, and response-shape errors |

Combine skills when a task crosses boundaries. For example, resolve a species through the Pokémon skill, follow its evolution-chain URL with the evolution skill, and let the cache skill deduplicate both requests.

## Safety contract

Check the persistent local cache before every request. PokéAPI's fair-use policy explicitly requires locally caching requested resources even though the service currently publishes no rate limit. A missing numeric rate limit is not permission to crawl or refetch freely.

Use only `GET` against `https://pokeapi.co/api/v2/`. Reject other methods, do not probe undocumented paths, and never treat the sprites/media hosts referenced by responses as part of the same cache entry.

Resolve the exact endpoint, identifier, query, language, version, and version group from the task or repository. Do not guess among Pokémon, species, and form resources, or between version and version-group fields.

For lists, read the first page and its `count` before following `next`. State the intended cap and estimated number of network misses; get approval before an unrequested bulk traversal. Keep concurrency serialized or at the repository's explicit bound, use single-flight per cache key, and never implement unbounded retries.

Treat cache deletion as the destructive operation. Show the exact cache directory, matching keys, file count, and bytes before evicting anything; require approval for a broad purge. Revalidate one resource at a time when freshness is required and preserve a last-known-good body if revalidation fails.

Record cache hit, miss, stale, revalidated, and network-request counts without logging full payloads unnecessarily. PokéAPI needs no credentials, so never add or solicit an API key. Report suspected security issues responsibly rather than probing them.
