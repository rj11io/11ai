---
name: 11ai-operator-pokeapi-v2-pokemon
description: "Read and relate PokéAPI v2 Pokémon resources including battle instances, species, forms, abilities, types, stats, natures, characteristics, egg groups, growth rates, colors, habitats, and shapes while distinguishing identifiers and caching every followed link. Use when looking up a Pokémon, comparing forms or types, reading species lore or breeding data, or joining Pokémon metadata across resource families."
---
# 11ai PokéAPI v2 Pokémon

Resolve whether the task means a battle-ready `pokemon`, biological `pokemon-species`, or visual `pokemon-form` resource before requesting anything. Their IDs and fields are not interchangeable, even when names look related.

## Inspect first

Check the persistent cache for the exact canonical URL and inspect any known related URLs already stored. Start with one resource, not a list:

```text
GET https://pokeapi.co/api/v2/pokemon/NAME/
GET https://pokeapi.co/api/v2/pokemon-species/NAME/
GET https://pokeapi.co/api/v2/pokemon-form/NAME/
```

Use the canonical name from the caller or a cached list. Do not guess form suffixes, assume species ID equals Pokémon ID, or search by crawling detail endpoints. If the name is uncertain, request one bounded list page through `11ai-operator-pokeapi-v2-cheatsheet`.

## Read the right resource

Use `pokemon` for abilities, base experience, held items, moves, sprites, stats, types, weight, and the link to species. Use `pokemon-species` for evolution-chain URL, egg groups, flavor text, generation, growth rate, habitat, varieties, and capture metadata. Use `pokemon-form` for form-specific names, sprites, types, and version group.

```bash
jq '{id,name,types:[.types[].type.name],abilities:[.abilities[].ability.name],species:.species.url}' BODY.json
jq '{id,name,generation:.generation.name,evolution_chain:.evolution_chain.url,varieties:[.varieties[].pokemon.name]}' SPECIES.json
```

Filter localized `names`, `genera`, and `flavor_text_entries` by the requested language. Filter versioned values by the exact version or version group supplied; never return the first array element as if it were universal.

Follow only the resource URLs required for the answer. Put ability, type, nature, stat, egg-group, growth-rate, and other links through the same cache, and deduplicate identical URLs before requesting them.

## Compare and traverse safely

For a comparison, resolve all requested canonical URLs, report which are cache hits, and state the number of misses before fetching. Keep concurrency at the repository's explicit bound or serialize the misses. Do not hydrate every move, ability, variety, sprite, and encounter link for a general Pokémon lookup.

Sprites and artwork live on separate media URLs. Treat them as separate cacheable objects with their own content type and size checks; do not store binary data in the JSON response entry or download all sprite variants by default.

`GET pokemon/NAME/encounters` can return a large nested array. Hand it to `11ai-operator-pokeapi-v2-locations` and filter by version before following location-area links.

## Verify and report

Verify each response's `id` and `name`, keep resource-family labels in the output, and mention every followed link. Report canonical URLs, cache hits and misses, network requests, requested language and game discriminator, and any unresolved form or species ambiguity. Hand evolution links to `11ai-operator-pokeapi-v2-evolution`, cache faults to cache, and HTTP or shape failures to troubleshooting.
