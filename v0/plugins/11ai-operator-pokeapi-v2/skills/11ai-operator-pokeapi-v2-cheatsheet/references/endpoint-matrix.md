# PokéAPI v2 endpoint matrix

The official documentation groups the consumption-only API as follows. Every path is relative to `https://pokeapi.co/api/v2/` and supports list pagination. Use the official docs at <https://pokeapi.co/docs/v2> as the source of truth when a response shape changes.

| Domain | Named endpoints | Numeric-ID-only endpoints |
| --- | --- | --- |
| Berries | `berry`, `berry-firmness`, `berry-flavor` | — |
| Contests | `contest-type` | `contest-effect`, `super-contest-effect` |
| Encounters | `encounter-method`, `encounter-condition`, `encounter-condition-value` | — |
| Evolution | `evolution-trigger` | `evolution-chain` |
| Games | `generation`, `pokedex`, `version`, `version-group` | — |
| Items | `item`, `item-attribute`, `item-category`, `item-fling-effect`, `item-pocket` | — |
| Locations | `location`, `location-area`, `pal-park-area`, `region` | — |
| Machines | — | `machine` |
| Moves | `move`, `move-ailment`, `move-battle-style`, `move-category`, `move-damage-class`, `move-learn-method`, `move-target` | — |
| Pokémon | `ability`, `egg-group`, `gender`, `growth-rate`, `nature`, `pokeathlon-stat`, `pokemon`, `pokemon-color`, `pokemon-form`, `pokemon-habitat`, `pokemon-shape`, `pokemon-species`, `stat`, `type` | `characteristic` |
| Utility | `language` | — |

`GET pokemon/ID_OR_NAME/encounters` is a special detail route rather than a list resource. It returns encounter data directly.

## Identifier discipline

Use names when the resource is named and the caller supplied a canonical name. Use IDs when following an official resource URL or when an endpoint is unnamed. Do not assume IDs line up across `pokemon`, `pokemon-species`, `pokemon-form`, `evolution-chain`, `machine`, or any other resource families.

## List discipline

Lists return 20 resources by default. Read `count` before selecting a larger `limit`, preserve `offset` in the cache key, and follow only as many pages as the user-approved cap requires. Cache each list page independently because its full query URL identifies the page.
