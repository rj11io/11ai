# Skill QA Playbook

Use this playbook to distinguish compatibility layers, rank findings, and choose evidence. Verify current schemas and CLI syntax from authoritative sources before applying fixes because harness contracts change.

## Compatibility layers

| Layer | Typical artifact | Unit | What it proves |
| --- | --- | --- | --- |
| Portable skill core | `<skill>/SKILL.md` | Skill | A compatible reader can identify and load the skill |
| Codex presentation | `<skill>/agents/openai.yaml` | Skill | Codex can present and invoke the skill with valid UI metadata |
| Claude plugin | `<plugin>/.claude-plugin/plugin.json` | Group/plugin | Claude can load the declared collection and find its skill paths |
| Claude marketplace | `<repo>/.claude-plugin/marketplace.json` | Repository | Claude can discover the repository's plugins |
| Generic installer | Documented list/install command | Repository | The installer discovers the intended skills in the real directory layout |
| Distribution | npm/archive allowlist and dry run | Package | Consumers receive every required file |
| Catalog/application | READMEs, generated pages, strict parser | Repository | Human-facing counts and commands match the canonical inventory |
| Prevention | Validator, CI, release hooks, creator templates | Repository | Fixed defect classes fail before publication or are not regenerated |

Do not treat these as interchangeable. A valid `SKILL.md` does not prove Codex metadata exists; a Claude plugin manifest does not prove generic installer discovery; a recursive website scan does not prove the published package contains the same files.

## Portable core checks

- Opening and closing `---` delimiters are exact, with UTF-8, LF endings, and no BOM.
- Frontmatter parses strictly and uses the repository's portable allowed-key policy.
- `name` is lowercase hyphen-case, no longer than the supported limit, unique, and equal to the skill directory name.
- `description` is a nonempty string within the supported limit and contains both purpose and triggers.
- Physical YAML representation is supported by the simplest declared reader. Reject folded/literal blocks such as `>-` when they have caused failures.
- The body is nonempty and remains unchanged during metadata-only normalization.
- Relative Markdown links resolve; referenced files stay inside the intended skill package.
- Shell, Python, and JavaScript resources pass syntax checks; directly executed scripts have executable bits.
- Resource directories contain intentional files rather than placeholders, build output, caches, or operating-system artifacts.

For bulk rewrites, compare before and after parsed `name`, parsed `description`, and a hash of the body after the closing frontmatter delimiter.

## Codex metadata checks

- Every intended skill has `agents/openai.yaml`.
- String values are quoted and keys use the current allowed field names.
- `interface.display_name` is human-readable and unique where the UI requires it.
- `interface.short_description` satisfies current length constraints.
- `interface.default_prompt` explicitly references the exact `$skill-name` and no other skill accidentally.
- Icon and asset paths resolve inside the skill package.
- Dependencies and policy fields appear only when supported and necessary.

Use the trusted root/system skill validator or generator rather than a repository-local creator that is part of the audit surface.

## Plugin and marketplace checks

- Manifest JSON parses strictly, names match plugin folders, paths are relative as required, and every intended skill is covered.
- Marketplace names are unique and sources resolve to the correct plugin roots.
- Required author, interface, version, policy, or category fields follow the current harness schema rather than another harness's shape.
- The version policy is coherent. If strict semver is required, compare every plugin version with the release source of truth and verify the release process updates and commits the manifests.
- Run the installed harness's strict validator when available.
- Load each plugin or use an equivalent list command and compare actual component names and group counts with the recursive inventory. Schema validation alone may not validate component discovery.

## Discovery and distribution checks

Run the documented list-only installer command. Compare its exact discovered set with the filesystem inventory. Test depth flags when skills use mixed nesting such as both `<group>/<skill>` and `<group>/skills/<skill>`.

Inspect the package manager's dry-run file list or the built archive. Count at least:

- `SKILL.md` files
- per-skill harness metadata
- plugin manifests
- marketplace files
- required references, scripts, examples, and assets
- forbidden `.DS_Store`, caches, secrets, dependency directories, and build artifacts

Do not infer package inclusion from Git tracking or repository presence.

## Catalog and application checks

- Root total equals the recursive skill inventory.
- Every group count and skill list matches its directory.
- New groups appear in curated application configuration where required.
- Installation commands include flags required by the real layout.
- Application parsers fail on invalid metadata instead of falling back to a lenient parser.
- Typecheck, targeted lint, and production build pass for changed catalog code.
- Generated route or page counts account for the updated skill and group inventory.

## Creator and prevention checks

Inspect any skill that creates skills, plus its templates and generators:

- output path matches the repository's real layout
- frontmatter uses the portable canonical form
- all declared harness metadata is generated
- no placeholder is left in final output
- scripts receive executable bits
- validation runs without invoking the generated skill's operational behavior

A repository validator should be deterministic and fail with actionable paths. Prefer checks that run without network access. Add CI on pull requests and release preflight where appropriate. If versions or generated catalogs must track package releases, exercise the synchronization logic against a stale-value fixture or equivalent simulation.

## Severity rubric

- **Critical:** a supported harness cannot parse or load a skill, real discovery silently omits skills, published artifacts omit required files, or a release hook deterministically creates invalid configuration.
- **Major:** required harness metadata is missing, manifest paths are incomplete, counts or install commands materially mislead users, or creator templates reproduce critical defects.
- **Moderate:** broken local links, invalid optional metadata, missing executable bits, stale secondary catalogs, or weak prevention with a clear future failure path.
- **Minor:** cosmetic consistency that does not affect parsing, discovery, installation, or use.

Require direct evidence for critical and major findings. Distinguish current failures from theoretical portability risks and clearly label pre-existing failures outside the packaging scope.

## Useful command shapes

Adapt commands to the repository and current tools:

```bash
find <skills-root> -name SKILL.md
rg -n '^description:\s*[>|]' <skills-root> --glob SKILL.md
git diff --check
<root-skill-validator> <skill-directory>
<harness> plugin validate --strict <plugin-or-marketplace>
<skills-installer> add . --list <required-depth-flags>
<package-manager> pack --dry-run --json
```

Run focused checks after each batch, then repeat the complete inventory, strict harness validation, actual discovery, package inspection, catalog/application checks, and final diff review from scratch.
