---
name: 11ai-operator-pokeapi-v2-cheatsheet
description: "Answer quick PokéAPI v2 questions with a compact reference for resource paths, named and unnamed identifiers, pagination, linked resources, language and version filtering, cache-first requests, and fair-use boundaries. Use when someone asks which PokéAPI v2 endpoint or query shape to use, or wants a fast lookup rather than a guided workflow."
---
# 11ai PokéAPI v2 cheatsheet

A lookup surface for the consumption-only REST API at `https://pokeapi.co/api/v2/`. Lead with the smallest cache-first `GET`; hand multi-resource work to the matching operation skill.

## Request shapes

```text
GET https://pokeapi.co/api/v2/ENDPOINT/NAME/
GET https://pokeapi.co/api/v2/ENDPOINT/ID/
GET https://pokeapi.co/api/v2/ENDPOINT/?limit=LIMIT&offset=OFFSET
```

Most resources accept a name or numeric ID. `characteristic`, `contest-effect`, `evolution-chain`, `machine`, and `super-contest-effect` are unnamed and require numeric IDs. Preserve the trailing slash and normalize the full query before using it as a cache key.

```bash
CACHE_FILE="CACHE_DIR/KEY.json"
test -f "$CACHE_FILE" && jq . "$CACHE_FILE"
curl --fail --silent --show-error "https://pokeapi.co/api/v2/pokemon/ditto/"
```

Never run the network command until the local lookup misses. Store a successful body before returning it to the caller; see `11ai-operator-pokeapi-v2-cache` for an atomic implementation.

## Domain routes

| Area | Resource paths |
| --- | --- |
| Pokémon | `pokemon`, `pokemon-species`, `pokemon-form`, `ability`, `type`, `stat`, `nature`, `egg-group`, `growth-rate` |
| Moves | `move`, `machine`, `move-ailment`, `move-category`, `move-damage-class`, `move-learn-method`, `move-target`, contest effects |
| Items | `item`, `item-attribute`, `item-category`, `item-fling-effect`, `item-pocket`, `berry`, `berry-firmness`, `berry-flavor` |
| Locations | `region`, `location`, `location-area`, `pal-park-area`, encounter methods and conditions |
| Evolution | `evolution-chain`, `evolution-trigger` |
| Games | `generation`, `version`, `version-group`, `pokedex`, `language` |

Read [references/endpoint-matrix.md](references/endpoint-matrix.md) for the complete official endpoint grouping and identifier shape.

## Pagination and links

List endpoints default to 20 results and return `count`, `next`, `previous`, and `results`. Start with the default page, inspect `count`, then choose a bounded `limit` and cap before following `next`. Do not use a huge `limit` as a shortcut around fair use.

Resource relations are URLs, not embedded objects. Follow only the links needed to answer the task and put each linked URL through the same cache. Do not recursively hydrate a response graph by default.

Localized strings carry a `language` resource; game-dependent values usually carry `version` or `version_group`. Filter those arrays locally from the cached body.

## Fair-use response shape

Answer with the endpoint and cache key first. Then state which identifier form is accepted, whether another resource link must be followed, and which language or game discriminator applies. For a live operation, report cache hits, misses, and network requests. Send Pokémon to `11ai-operator-pokeapi-v2-pokemon`, cache design to `11ai-operator-pokeapi-v2-cache`, and failures to `11ai-operator-pokeapi-v2-troubleshooting`.
