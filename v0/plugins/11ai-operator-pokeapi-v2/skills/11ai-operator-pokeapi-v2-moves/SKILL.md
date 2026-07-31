---
name: 11ai-operator-pokeapi-v2-moves
description: "Read and relate PokéAPI v2 moves, move ailments, battle styles, categories, damage classes, learn methods, targets, numeric machine records, contest types, contest effects, and super contest effects with version-aware filtering and cache-first links. Use when examining move mechanics, learnability, machines, targets, damage classes, or contest behavior."
---
# 11ai PokéAPI v2 moves

Establish the move, game version or version group, language, and whether the task concerns battle mechanics, learnability, a machine, or contest behavior. These dimensions live in different arrays and endpoints.

## Inspect first

```text
GET https://pokeapi.co/api/v2/move/NAME/
GET https://pokeapi.co/api/v2/machine/ID/
GET https://pokeapi.co/api/v2/contest-effect/ID/
GET https://pokeapi.co/api/v2/super-contest-effect/ID/
```

Check each canonical URL in the persistent cache first. `machine`, `contest-effect`, and `super-contest-effect` are numeric-ID-only resources; do not use a move ID as a machine ID or scan machine records to guess one.

## Read battle and learn data

```bash
jq '{id,name,accuracy,power,pp,priority,type:.type.name,damage_class:.damage_class.name,target:.target.name}' MOVE.json
jq --arg language "$LANGUAGE" --arg version_group "$VERSION_GROUP" '[.flavor_text_entries[] | select(.language.name == $language and .version_group.name == $version_group)]' MOVE.json
```

Treat `null` accuracy, power, or effect chance as meaningful, not zero. Effect text may contain a placeholder tied to `effect_chance`; keep the numeric field and chosen language entry together.

For a Pokémon's move list, filter `version_group_details` by the exact version group and learn method. A move being present somewhere in the array does not mean it is learnable in every game or by every method.

## Follow machines and contests

A move's `machines` array already relates a machine URL to a `version_group`; follow only the selected entry and cache it. Verify the machine response links back to the expected move and item before reporting a TM or HM.

Contest type, contest effect, and super contest effect describe a separate ruleset. Filter their localized effect or flavor text by language and do not project contest fields onto battle behavior.

For move taxonomy such as ailment, category, damage class, learn method, target, or battle style, use the linked named resource. Deduplicate URLs and avoid recursively requesting every move in a category.

## Bulk guardrails

Before comparing many moves, preview the exact move names, cached count, miss count, and number of linked machine or taxonomy requests. Obtain approval for an unrequested bulk traversal, then use the configured concurrency bound and single-flight cache. Never enumerate every machine or move to build a local index during a single lookup.

## Verify and report

Verify move `id` and `name`, selected version group, learn method, language, and any machine's linked move and item. Report canonical URLs, cache hits and misses, network-request count, and omitted dimensions. Hand Pokémon learnsets to `11ai-operator-pokeapi-v2-pokemon`, item links to items, and cache or request failures to the corresponding cache or troubleshooting skill.
