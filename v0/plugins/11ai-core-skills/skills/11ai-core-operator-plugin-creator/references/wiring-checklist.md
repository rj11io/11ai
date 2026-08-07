# Wiring checklist

Six files outside the plugin directory must change before `npm run validate-skills` passes. Work through them in this order.

Read the current package version first; three manifests must match it exactly.

```bash
node -p "require('./package.json').version"
```

## 1. Claude manifest

`v0/plugins/11ai-operator-TOOL-ID/.claude-plugin/plugin.json`

```json
{
  "$schema": "https://json.schemastore.org/claude-code-plugin-manifest.json",
  "name": "11ai-operator-TOOL-ID",
  "version": "MATCHES_PACKAGE_JSON",
  "description": "Modular, safety-first skills for common TOOL operations.",
  "author": {
    "name": "rj11io"
  },
  "repository": "https://github.com/rj11io/11ai",
  "license": "Apache-2.0",
  "keywords": [
    "tool",
    "area",
    "area"
  ],
  "skills": "./skills/"
}
```

`name` must equal the directory name, `version` must equal `package.json`, and `skills` must be the exact string `./skills/`. An array or a different path fails. `keywords` is optional and missing from four of the older plugins; include it.

## 2. Codex manifest

`v0/plugins/11ai-operator-TOOL-ID/.codex-plugin/plugin.json`

Same `name`, `version`, and `skills` values, no `$schema`, plus an `interface` block:

```json
{
  "name": "11ai-operator-TOOL-ID",
  "version": "MATCHES_PACKAGE_JSON",
  "description": "Modular, safety-first skills for common TOOL operations.",
  "author": {
    "name": "rj11io"
  },
  "repository": "https://github.com/rj11io/11ai",
  "license": "Apache-2.0",
  "keywords": [
    "tool"
  ],
  "skills": "./skills/",
  "interface": {
    "displayName": "11ai Operator TOOL",
    "shortDescription": "Run common TOOL tasks safely and clearly.",
    "longDescription": "A modular toolbox for the areas this plugin covers, named one by one.",
    "developerName": "rj11io",
    "category": "Developer Tools",
    "capabilities": [],
    "defaultPrompt": "Help me use the 11ai-operator-TOOL-ID skills for this TOOL task."
  }
}
```

## 3. Marketplace entry

`.claude-plugin/marketplace.json` — append to the `plugins` array. The `source` must be exactly `./v0/plugins/` plus the plugin name; anything else fails, and so does an entry for a plugin that does not exist.

```json
{
  "name": "11ai-operator-TOOL-ID",
  "source": "./v0/plugins/11ai-operator-TOOL-ID"
}
```

## 4. Plugin README

`v0/plugins/11ai-operator-TOOL-ID/README.md` — every skill name must appear somewhere in this file. Use the template in [plugin-blueprint.md](plugin-blueprint.md).

## 5. Root README

`README.md` needs three separate edits, each checked by its own rule.

The total sentence, where both numbers must match what the validator counts:

```text
The repository currently contains 156 skills in 20 plugins.
```

A catalog table row, where the count column must equal the number of skill directories:

```text
| [TOOL operator](./v0/plugins/11ai-operator-TOOL-ID/README.md) | 10 | Short summary of what the plugin covers |
```

A layout entry in the indented tree block, with the same count:

```text
    11ai-operator-TOOL-ID/     10 TOOL operation skills under skills/
```

Keep both lists in the same order the file already uses, and recount rather than guessing when you add a skill to an existing plugin.

The count includes a conditional `*-native-skills` bridge when first-party Agent Skills exist. Before counting it, verify that its upstream source is publisher-owned and that the bridge checks compatibility against the same requested/latest technology version encoded by the plugin identity and skill baselines.

## 6. Site catalog

`v0/www/lib/skills.ts` — add an entry to `PLUGIN_CONFIG`. Skill names, counts, and descriptions are read from the skill files at build time; only the slug, directory, title, and tagline live here.

```ts
{
  slug: "operator-TOOL-ID",
  dir: "11ai-operator-TOOL-ID",
  title: "TOOL operator",
  tagline:
    "One sentence naming the areas the plugin covers, ending in reference and troubleshooting.",
},
```

## Verify

```bash
npm run validate-skills
```

The validator checks, in one pass: canonical frontmatter and unique names, the `SKILL.md` path depth, Codex metadata field names and lengths, both manifests against `package.json`, marketplace sources in both directions, plugin READMEs mentioning every skill, root README counts in all three places, relative link targets, script syntax, and tracked `.DS_Store` files.

Common failures and their cause:

- `must contain only a plain name and one JSON-quoted description line` — a multi-line description, a block scalar, or single quotes.
- `short_description must be 25-64 characters` — count it, do not estimate.
- `default_prompt must mention the exact $skill-name` — the skill was renamed and the prompt was not.
- `catalog row for ... must state N skills` — a skill was added without recounting the root README.
- `broken relative link` — a `references/` file named in the skill body but never created.
- `native-skill compatibility drift` — not a validator message; manually audit the bridge's upstream release/content against the operator baseline and the host project's installed major before reporting success.
- `tracked operating-system artifact` — a `.DS_Store` was committed; remove it from the index.
