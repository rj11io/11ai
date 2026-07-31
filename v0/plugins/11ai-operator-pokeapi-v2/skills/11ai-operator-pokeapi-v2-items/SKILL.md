---
name: 11ai-operator-pokeapi-v2-items
description: "Read and relate PokéAPI v2 items, attributes, categories, pockets, fling effects, berries, berry firmnesses, and berry flavors while preserving version-specific values, item-to-berry links, localized text, and cache-first request accounting. Use when looking up item mechanics, organizing inventory metadata, resolving berries to items, or comparing fling and berry properties."
---
# 11ai PokéAPI v2 items

Resolve whether the task concerns an inventory item, its category or pocket, a fling effect, or the berry resource linked to a berry item. Establish language and game version before selecting localized or versioned fields.

## Inspect first

```text
GET https://pokeapi.co/api/v2/item/NAME/
GET https://pokeapi.co/api/v2/berry/NAME/
GET https://pokeapi.co/api/v2/item-category/NAME/
GET https://pokeapi.co/api/v2/item-pocket/NAME/
```

Check the exact canonical URL in the persistent cache. Do not infer a berry name by stripping `-berry` from an item; use the official link from `berry.item` or category results.

## Read item data

```bash
jq '{id,name,cost,fling_power,fling_effect:.fling_effect.name,category:.category.name}' ITEM.json
jq --arg language "$LANGUAGE" --arg version_group "$VERSION_GROUP" '[.flavor_text_entries[] | select(.language.name == $language and .version_group.name == $version_group)]' ITEM.json
```

Attributes describe behavior, categories group items, and pockets group categories. Follow only the hierarchy needed for the answer and cache each URL. Treat a `null` fling power or effect as absent rather than zero or unknown text.

Sprites are external binary resources. Download only a requested sprite, validate its content type and size, and keep it in a separate media cache rather than the JSON entry.

## Read berries

```bash
jq '{id,name,growth_time,max_harvest,natural_gift_power,size,smoothness,soil_dryness,item:.item.name,type:.natural_gift_type.name}' BERRY.json
jq '[.flavors[] | {potency,flavor:.flavor.name}]' BERRY.json
```

Berry firmness and flavors are independent linked resources. Preserve potency with its flavor and verify the linked item before joining item mechanics. A berry's numeric ID does not imply the same item ID.

## Compare safely

For comparisons, resolve exact names, language, version group, and requested fields first. Preview cached URLs, misses, and linked resources before network access. Do not enumerate every item or berry, download every sprite, or follow every category member without a stated bounded task and approval.

Cache list pages by their full query. If a list or category has more results than the requested cap, stop and report the remaining count instead of following `next` silently.

## Verify and report

Verify response `id`, `name`, resource family, linked category or item, selected language, and version group. Report canonical URLs, cache hits and misses, network requests, and any fields omitted because the needed game discriminator was not supplied. Hand machine items to moves, cache changes to cache, and malformed or missing resources to troubleshooting.
