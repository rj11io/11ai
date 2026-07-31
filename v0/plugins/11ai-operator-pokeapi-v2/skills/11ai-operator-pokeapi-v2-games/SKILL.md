---
name: 11ai-operator-pokeapi-v2-games
description: "Read and relate PokéAPI v2 generations, versions, version groups, Pokédexes, and languages while distinguishing their scopes, filtering localized names and flavor text, preserving regional Pokédex numbers, and caching each requested list or detail page. Use when selecting a game context, mapping resources across releases, reading Pokédex membership, or localizing API data."
---
# 11ai PokéAPI v2 games

Resolve whether the task means a generation, individual version, version group, Pokédex, or language before selecting data. These resources overlap but are not interchangeable filters.

## Inspect first

```text
GET https://pokeapi.co/api/v2/generation/NAME/
GET https://pokeapi.co/api/v2/version/NAME/
GET https://pokeapi.co/api/v2/version-group/NAME/
GET https://pokeapi.co/api/v2/pokedex/NAME/
GET https://pokeapi.co/api/v2/language/NAME/
```

Check the full canonical URL in the persistent cache. Use a supplied canonical name or an official linked URL; do not guess game slugs from display names.

## Select the game scope

A generation groups broad content and links to version groups. A version is one release and links to a version group. A version group collects mechanically related versions and carries ordering, generation, regions, methods, and Pokédex links.

```bash
jq '{id,name,generation:.generation.name,versions:[.versions[].name]}' VERSION_GROUP.json
jq '{id,name,version_group:.version_group.name}' VERSION.json
```

Use the exact discriminator present in the domain response. A `version_group` field cannot be filtered with a version name, and a generation does not prove a mechanic is identical across all its versions.

## Read Pokédexes and languages

A Pokédex contains species entries with a Pokédex-specific `entry_number`. Preserve that number with the Pokédex name; it is not necessarily the species or national number. Follow species URLs only for the requested entries and cache them independently.

Filter `names`, `descriptions`, `flavor_text_entries`, and similar arrays by `language.name`. Verify the language is official and the entry exists; do not silently fall back to the first language. If the requested translation is absent, report that absence and ask before choosing a fallback.

For a full Pokédex or generation, preview resource count, cached entries, misses, and intended cap. Do not hydrate every species, move, or item link merely because a parent resource lists them.

## Verify and report

Verify resource `id`, canonical `name`, cross-links, and the selected version, version group, generation, Pokédex, and language. Report canonical URLs, cache hits and misses, network requests, list cap, and any missing localization. Hand species detail to the Pokémon skill, version-specific encounters to locations, moves or items to their skills, and cache or shape failures to cache or troubleshooting.
