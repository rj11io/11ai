---
name: 11ai-super-skill-qa
description: "Continuously audit, repair, and verify AI skill packaging across common harnesses until it reaches a high-confidence compatibility bar. Use when Codex must QA SKILL.md frontmatter and formatting, remove nonportable YAML block scalars, reconcile missing Codex or Claude metadata, test real skill discovery, validate plugin and marketplace manifests, check catalogs and package contents, repair creator templates that reintroduce defects, or add deterministic CI guardrails without changing skill routine content. Stops and reports when the change set becomes unmanageable or troubleshooting outweighs progress."
---

# 11ai Super Skill QA

## Mission

Make a repository's skills structurally valid, discoverable, consistently packaged, and verifiably compatible with its declared harnesses without rewriting what the skills do.

Read [references/skill-qa-playbook.md](references/skill-qa-playbook.md) before auditing. Use its compatibility layers, evidence requirements, severity rubric, and command checklist.

## Operating Rules

- Limit edits to formatting, frontmatter, harness metadata, manifests, discovery configuration, catalogs, packaging, validation, and creator instructions that directly cause packaging drift.
- Preserve every skill's parsed name and description unless they are invalid and a correction is required. Preserve routine bodies byte-for-byte except when repairing packaging or validation guidance in a skill that creates skills.
- Do not invoke repository-local skill creators while auditing them. Use the active harness's trusted root/system guidance and inspect local creators as ordinary source files until they pass QA.
- Treat common-harness support as layered, not symmetric: core skill metadata, harness-specific per-skill metadata, plugin manifests, marketplaces, and generic installer discovery have different contracts.
- Verify unstable formats against current authoritative documentation and installed harness validators. Do not rely only on remembered schemas or a permissive application parser.
- Test actual discovery and packaged artifacts. A recursive filesystem count does not prove that a real installer, plugin loader, or published package finds the same skills.
- Prefer deterministic, dependency-light validation that fails on malformed or missing configuration. Do not preserve lenient fallbacks that hide harness-breaking errors.
- Keep a session change manifest — every file this session creates, modifies, renames, or deletes — and reconcile it after every batch. Preserve unrelated and concurrent work.
- Do not deploy, mutate external services, or change skill behavior under a packaging request.
- Always return the required session summary, including when stopped early or aborted.

## Workflow

### 1. Define the compatibility contract

Inventory the repository before deciding what is missing:

1. Find every skill recursively and record its directory, parsed name, description, resources, harness metadata, and owning collection or plugin.
2. Read repository instructions, package manifests, plugin catalogs, websites, release workflows, validators, and creator templates that publish or discover skills.
3. Identify the compatibility surfaces the repository actually declares: Agent Skills-compatible consumers, Codex metadata, Claude plugins or marketplaces, generic skills installers, npm or archive packaging, and generated catalogs.
4. Record expected counts by plugin and by distribution artifact. Distinguish per-skill configuration from plugin- or repository-level packaging.
5. Define explicit exclusions. Unless requested, do not review instructional quality, rewrite descriptions for style, rename valid skills, reorganize directories, or alter routine behavior.

When compatibility expectations are ambiguous, infer them from existing distribution claims and configuration. Ask only when competing choices would create a breaking layout or a new distribution surface.

### 2. Establish a semantics-preserving baseline

Before editing:

1. Start the session change manifest, then capture the complete skill inventory and hashes or normalized snapshots of every skill body.
2. Parse all frontmatter with a strict YAML parser and separately inspect its physical representation. Valid YAML can still be nonportable to simpler harness readers.
3. Validate every existing harness-specific file with the strongest available official or root/system validator.
4. Exercise the documented installer or plugin loader in list-only or validation mode and compare discovered names and counts with the recursive inventory.
5. Inspect the dry-run package or archive contents rather than assuming repository files are shipped.
6. Resolve relative resource links; validate script syntax and executable bits; reject tracked generated, editor, or operating-system artifacts.
7. Build a finding ledger with path, layer, evidence, severity, root-cause hypothesis, safe repair, and verification command.

Rank findings by parse or load failure, missing discovery, missing required configuration, package omission, catalog drift, prevention gaps, and cosmetic consistency. Treat a real harness silently omitting skills as a critical discovery defect.

### 3. Repair in coherent layers

Work from the portable core outward. After each batch, run focused validation and review the batch's complete set of changes.

#### Portable skill core

- Use a conservative frontmatter shape containing only `name` and `description` when widest compatibility is the repository policy.
- Require valid lowercase hyphen-case names, folder equality, uniqueness, size limits, nonempty descriptions, and a nonempty body.
- Normalize descriptions to one physical JSON-compatible quoted line when multiline or folded YAML causes portability failures. Reject block scalars such as `>-`, anchors, aliases, tags, and duplicate keys when the supported readers cannot guarantee them.
- For a bulk normalization, prove that parsed names, parsed descriptions, and routine-body hashes are unchanged.

#### Harness metadata and plugin packaging

- Add or repair required per-skill metadata for every supported harness; validate field names, quoting, length limits, exact skill references, and asset paths.
- Add or repair plugin manifests and marketplaces only where the repository declares plugin distribution. Make manifest paths cover every intended skill and verify that the real loader reports the expected component inventory.
- Use a coherent plugin-version policy. When versions are required, keep them strict-semver and automate synchronization with the release source of truth.
- Do not copy one harness's manifest into another harness mechanically. Follow each current contract and keep unsupported fields out.

#### Discovery, package, and catalogs

- Test the documented generic installer command against the repository layout. Add required recursive or full-depth flags when mixed nesting would otherwise omit skills.
- Ensure published package allowlists include all skill resources, harness metadata, plugin manifests, and marketplace files that consumers need.
- Reconcile root and plugin catalogs, counts, website plugin configuration, install commands, and generated pages with the canonical inventory.
- Remove lenient parsing fallbacks that allow a website or catalog build to succeed on metadata rejected by real harnesses.

#### Root causes and prevention

- Inspect local skill creators, templates, and examples for stale paths, malformed frontmatter patterns, missing harness metadata, or absent validation steps.
- Repair only their packaging and validation guidance unless the user separately requests behavioral changes.
- Add a deterministic repository validator and CI or release preflight when the project lacks durable enforcement. Make it compare inventories across core skills, harness metadata, plugin paths, catalogs, and package contents where practical.

### 4. Continue until materially satisfied

After the first repair pass, rebuild the inventory from disk and run fresh reviews from different evidence surfaces:

1. **Format and semantics pass:** strict parsing, physical YAML form, folder/name equality, duplicate detection, links, scripts, and proof that routine bodies did not drift.
2. **Harness and discovery pass:** official validators, real list/load commands, per-plugin component counts, version policy, and documented install commands.
3. **Distribution and prevention pass:** dry-run package contents, catalogs and generated pages, strict application parsing, creator templates, CI, release synchronization, and final change-set ownership.

When a pass finds a material issue, add it to the ledger, repair it, verify it, and restart the clean-pass count. Finish only when:

- every intended skill parses under the portable core policy
- every declared harness has complete, valid configuration at the correct layer
- real discovery and loader counts exactly match the recursive inventory and expected plugin counts
- the distributable artifact contains all required skill and harness files and no forbidden artifacts
- catalogs, documented commands, and generated pages match the inventory
- creator templates and automated checks no longer reproduce the defect classes found
- no skill routine content changed outside explicitly authorized creator packaging guidance
- relevant official, root/system, repository, package, and application checks pass apart from clearly separated pre-existing failures
- two consecutive fresh passes reveal no new critical or major compatibility defect
- the complete change set is intentional, reviewable, and limited to the session manifest

### 5. Abort when work becomes unsafe

Abort instead of continuing when:

- the project gains unexpected, unrelated, unowned, or unexplained changes
- generated output, dependency churn, caches, secrets, or artifacts make the change set too dirty to review confidently
- repairs require broad skill-content rewrites, breaking renames, or structural migration beyond the user's scope
- two focused attempts on the same harness or tooling blocker fail without materially new evidence
- troubleshooting starts to outweigh progress on compatibility QA
- safe completion requires missing authority or an unapproved scope expansion

On abort:

1. Stop processes started by the session and capture the failure evidence and abort reason for the summary.
2. Compare the project's current state with the session change manifest. Preserve any path whose ownership is uncertain.
3. Stop the routine and return the required aborted-session summary, listing exactly which session changes remain in place. Do not immediately restart the entire operation.

## Required Session Summary

Always end with a concise, evidence-based summary containing:

- outcome: completed, blocked, stopped early, or aborted
- audited inventory and declared compatibility surfaces
- findings and repairs grouped by portable core, harness configuration, discovery/distribution, and root-cause prevention
- proof of semantic and routine-body preservation
- official harness validators, real discovery/load commands, package checks, catalogs, application checks, and their results
- fresh review-pass count and what each lens found
- remaining pre-existing failures, limitations, untested harnesses, and residual risk
- final state of the session's changes: the complete manifest of paths created, modified, or deleted
- for an abort: trigger, which session changes remain in place, and any path preserved because its ownership was uncertain

Never claim compatibility with a harness, package, installer, release path, or generated catalog that was not actually checked.
