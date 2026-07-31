---
name: 11ai-operator-pokeapi-v2-evolution
description: "Resolve PokéAPI v2 species to numeric evolution-chain resources, walk branching chain links, preserve alternative evolution-detail objects and nullable requirements, read evolution triggers, and cache every species, item, move, location, type, and chain link used in the answer. Use when building an evolution tree, explaining evolution conditions, or diagnosing a missing or incorrect branch."
---
# 11ai PokéAPI v2 evolution

Start from the exact species and its `evolution_chain.url`. An evolution-chain ID is not a Pokémon or species ID, so never construct the chain URL from either one.

## Inspect first

```text
GET https://pokeapi.co/api/v2/pokemon-species/NAME/
GET URL_FROM_SPECIES_EVOLUTION_CHAIN
GET https://pokeapi.co/api/v2/evolution-trigger/NAME/
```

Check the persistent cache for the species and exact linked chain URL before network access. If the caller supplied a form, resolve its Pokémon resource to species first; forms usually share a species chain and must not become invented chain nodes.

## Walk the chain

The chain begins at `chain` and recurses through every `evolves_to` array. Traverse depth-first or breadth-first while preserving branch structure and the species URL at each node.

```bash
jq '{id,baby_trigger_item:.baby_trigger_item.name,root:.chain.species.name,branches:[.chain.evolves_to[].species.name]}' CHAIN.json
```

Do not assume a chain is linear. Keep each `evolution_details` object intact; do not flatten several alternatives into one impossible set of requirements. Preserve `null`, `false`, zero, and empty-string values rather than translating all of them to "not required."

Resolve linked trigger, item, held item, known move, move type, location, party species, party type, and trade species only when needed for the requested explanation. Deduplicate URLs and cache every followed resource.

## Present conditions accurately

Label the direction of every edge as source species to evolved species. For each detail object, report only the non-null or semantically active fields, but keep the original object available for verification. State the requested game context if the caller provides one; do not invent a version filter where the chain record does not supply one.

Baby trigger items belong to the chain root and breeding context, not to every ordinary evolution edge. Evolution triggers provide taxonomy; the detail object provides the concrete constraints.

Before expanding many chains, preview exact species, unique chain URLs, cache hits, misses, and linked-resource estimate. Obtain approval for an unrequested bulk graph and never recursively follow unrelated species or Pokédex lists.

## Verify and report

Verify that the species response links to the chain fetched, every traversed child has a species URL, and each reported requirement comes from its edge's detail object. Report the tree with branches, canonical URLs, cache hits and misses, network-request count, and unresolved nullable semantics. Hand species/form ambiguity to the Pokémon skill, item or move details to their domain skills, and cache or response failures to cache or troubleshooting.
