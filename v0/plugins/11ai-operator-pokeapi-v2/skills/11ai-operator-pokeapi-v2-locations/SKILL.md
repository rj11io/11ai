---
name: 11ai-operator-pokeapi-v2-locations
description: "Read and relate PokéAPI v2 regions, locations, location areas, Pal Park areas, Pokémon encounter routes, encounter methods, conditions, and condition values while filtering nested encounter chances by version and caching each requested resource. Use when finding where a Pokémon appears, listing encounters in an area, resolving region geography, or interpreting encounter requirements."
---
# 11ai PokéAPI v2 locations

Establish the exact Pokémon or location area, game version, and whether the answer needs geography, encounter probability, method, level range, or conditions. Encounter data is version-specific and nested; an unfiltered answer is usually wrong.

## Inspect first

```text
GET https://pokeapi.co/api/v2/region/NAME/
GET https://pokeapi.co/api/v2/location/NAME/
GET https://pokeapi.co/api/v2/location-area/NAME/
GET https://pokeapi.co/api/v2/pokemon/NAME/encounters
```

Check each canonical URL in the persistent cache. Do not assume a location and location area share a name or ID, and do not crawl all location areas to find a Pokémon when its dedicated encounters route supplies links.

## Read geography

A region links to locations, Pokédexes, main generation, and version groups. A location links to its region and areas. A location area holds encounter method rates and Pokémon encounters. Follow that hierarchy only as far as the task requires.

```bash
jq '{id,name,region:.region.name,areas:[.areas[].name]}' LOCATION.json
jq '{id,name,location:.location.name,methods:[.encounter_method_rates[].encounter_method.name]}' AREA.json
```

Filter localized names by the requested language. Pal Park areas describe a separate transfer mechanic and should not be treated as ordinary wild encounter areas.

## Interpret encounters

For `pokemon/NAME/encounters`, select the exact `version_details[].version.name`. For a location-area response, select the requested Pokémon, then the same version before reading encounter details.

Preserve `chance`, `min_level`, `max_level`, encounter method, and all condition values together. Multiple encounter detail entries are alternatives; do not add chances across methods or conditions unless the game model explicitly supports that calculation.

Resolve condition values through `encounter-condition-value` only when their names are insufficient. Cache method, condition, and condition-value resources independently and deduplicate their URLs.

## Bound traversals

Location-area bodies can be large. For region-wide work, preview the region's location count, cached bodies, detail misses, and expected bytes if known. Require approval for an unrequested full-region traversal, serialize or use the configured low concurrency, and stop at the user-approved cap.

Do not poll encounters, recursively fetch every Pokémon in an area, or download sprites as part of location work.

## Verify and report

Verify names and links at each boundary: region to location, location to area, and encounter to version. Report selected version, method and conditions, level range and chance, canonical URLs, cache hits and misses, and network-request count. Hand Pokémon identity issues to the Pokémon skill, game discriminators to games, and cache or response failures to cache or troubleshooting.
