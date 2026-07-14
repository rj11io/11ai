---
name: 11ai-super-skill-qa
description: "Synchronize a clean Git repository from origin, allowing an automatic conflict-free merge of incoming changes when fast-forwarding is impossible, then continuously audit, repair, and verify AI skill packaging across common harnesses until it reaches a high-confidence compatibility bar. Use when Codex must QA SKILL.md frontmatter and formatting, remove nonportable YAML block scalars, reconcile missing Codex or Claude metadata, test real skill discovery, validate plugin and marketplace manifests, check catalogs and package contents, repair creator templates that reintroduce defects, or add deterministic CI guardrails without changing skill routine content. Abort and restore session-owned changes when the diff becomes unsafe or troubleshooting outweighs progress. Commit or push only when explicitly instructed, using Conventional Commits."
---

# 11ai Super Skill QA

## Mission

Make a repository's skills structurally valid, discoverable, consistently packaged, and verifiably compatible with its declared harnesses without rewriting what the skills do.

Read [references/skill-qa-playbook.md](references/skill-qa-playbook.md) before auditing. Use its compatibility layers, evidence requirements, severity rubric, and command checklist.

## Operating Rules

- Run the Git synchronization gate before reading skill implementations, installing dependencies, or starting the QA routine.
- Start only from a clean working tree. Never stash, discard, commit, or absorb pre-existing work to manufacture a clean state.
- Limit edits to formatting, frontmatter, harness metadata, manifests, discovery configuration, catalogs, packaging, validation, and creator instructions that directly cause packaging drift.
- Preserve every skill's parsed name and description unless they are invalid and a correction is required. Preserve routine bodies byte-for-byte except when repairing packaging or validation guidance in a skill that creates skills.
- Do not invoke repository-local skill creators while auditing them. Use the active harness's trusted root/system guidance and inspect local creators as ordinary source files until they pass QA.
- Treat common-harness support as layered, not symmetric: core skill metadata, harness-specific per-skill metadata, plugin manifests, marketplaces, and generic installer discovery have different contracts.
- Verify unstable formats against current authoritative documentation and installed harness validators. Do not rely only on remembered schemas or a permissive application parser.
- Test actual discovery and packaged artifacts. A recursive filesystem count does not prove that a real installer, plugin loader, or published package finds the same skills.
- Prefer deterministic, dependency-light validation that fails on malformed or missing configuration. Do not preserve lenient fallbacks that hide harness-breaking errors.
- Keep a session change manifest and reconcile it with Git status after every batch. Preserve unrelated and concurrent work.
- Do not deploy, mutate external services, or change skill behavior under a packaging request.
- Do not create task-result commits or push by default. A clean merge commit created only to synchronize incoming origin changes is the sole automatic commit exception.
- Always return the required session summary, including when stopped at preflight or aborted.

## Workflow

### 1. Synchronize and establish the rollback baseline

Complete this gate before the intended QA routine:

1. Locate the repository root and confirm the current directory belongs to the intended Git worktree.
2. Check for an in-progress merge, rebase, cherry-pick, revert, or bisect. Stop and report if one exists.
3. Require an attached current branch with an unambiguous configured upstream on `origin`. Record the branch, upstream, and current commit as `PRE_SYNC_HEAD`.
4. Run `git status --porcelain=v1 --untracked-files=all`. If it returns any entry, stop and list the dirty paths. Do not stash, clean, restore, pull, or edit anything.
5. Run `git fetch origin --prune`. Stop and report authentication, network, missing-ref, or remote-configuration failures.
6. Pull the current upstream with fast-forward only. If and only if histories have diverged, verify the tree remains clean and merge the fetched upstream with a non-interactive merge message.
7. Accept the synchronization merge only when it completes without conflicts and leaves the tree clean. On conflict, abort the merge, verify `HEAD` equals `PRE_SYNC_HEAD`, and stop. Never resolve synchronization conflicts as part of this skill.
8. Do not rebase, autostash, squash, amend, force, rewrite history, or use a merge for failures unrelated to divergence.
9. Record the synchronized commit as `BASELINE_HEAD` and confirm the complete tree is clean.
10. Start a session manifest of every tracked path changed and every untracked path created by this session.

### 2. Define the compatibility contract

Inventory the repository before deciding what is missing:

1. Find every skill recursively and record its directory, parsed name, description, resources, harness metadata, and owning collection or plugin.
2. Read repository instructions, package manifests, group catalogs, websites, release workflows, validators, and creator templates that publish or discover skills.
3. Identify the compatibility surfaces the repository actually declares: Agent Skills-compatible consumers, Codex metadata, Claude plugins or marketplaces, generic skills installers, npm or archive packaging, and generated catalogs.
4. Record expected counts by group and by distribution artifact. Distinguish per-skill configuration from group- or repository-level packaging.
5. Define explicit exclusions. Unless requested, do not review instructional quality, rewrite descriptions for style, rename valid skills, reorganize directories, or alter routine behavior.

When compatibility expectations are ambiguous, infer them from existing distribution claims and configuration. Ask only when competing choices would create a breaking layout or a new distribution surface.

### 3. Establish a semantics-preserving baseline

Before editing:

1. Capture Git status, the complete skill inventory, and hashes or normalized snapshots of every skill body.
2. Parse all frontmatter with a strict YAML parser and separately inspect its physical representation. Valid YAML can still be nonportable to simpler harness readers.
3. Validate every existing harness-specific file with the strongest available official or root/system validator.
4. Exercise the documented installer or plugin loader in list-only or validation mode and compare discovered names and counts with the recursive inventory.
5. Inspect the dry-run package or archive contents rather than assuming repository files are shipped.
6. Resolve relative resource links; validate script syntax and executable bits; reject tracked generated, editor, or operating-system artifacts.
7. Build a finding ledger with path, layer, evidence, severity, root-cause hypothesis, safe repair, and verification command.

Rank findings by parse or load failure, missing discovery, missing required configuration, package omission, catalog drift, prevention gaps, and cosmetic consistency. Treat a real harness silently omitting skills as a critical discovery defect.

### 4. Repair in coherent layers

Work from the portable core outward. After each batch, run focused validation and inspect the scoped diff.

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
- Reconcile root and group catalogs, counts, website group configuration, install commands, and generated pages with the canonical inventory.
- Remove lenient parsing fallbacks that allow a website or catalog build to succeed on metadata rejected by real harnesses.

#### Root causes and prevention

- Inspect local skill creators, templates, and examples for stale paths, malformed frontmatter patterns, missing harness metadata, or absent validation steps.
- Repair only their packaging and validation guidance unless the user separately requests behavioral changes.
- Add a deterministic repository validator and CI or release preflight when the project lacks durable enforcement. Make it compare inventories across core skills, harness metadata, plugin paths, catalogs, and package contents where practical.

### 5. Continue until materially satisfied

After the first repair pass, rebuild the inventory from disk and run fresh reviews from different evidence surfaces:

1. **Format and semantics pass:** strict parsing, physical YAML form, folder/name equality, duplicate detection, links, scripts, and proof that routine bodies did not drift.
2. **Harness and discovery pass:** official validators, real list/load commands, per-group component counts, version policy, and documented install commands.
3. **Distribution and prevention pass:** dry-run package contents, catalogs and generated pages, strict application parsing, creator templates, CI, release synchronization, and final diff ownership.

When a pass finds a material issue, add it to the ledger, repair it, verify it, and restart the clean-pass count. Finish only when:

- every intended skill parses under the portable core policy
- every declared harness has complete, valid configuration at the correct layer
- real discovery and loader counts exactly match the recursive inventory and expected group counts
- the distributable artifact contains all required skill and harness files and no forbidden artifacts
- catalogs, documented commands, and generated pages match the inventory
- creator templates and automated checks no longer reproduce the defect classes found
- no skill routine content changed outside explicitly authorized creator packaging guidance
- relevant official, root/system, repository, package, and application checks pass apart from clearly separated pre-existing failures
- two consecutive fresh passes reveal no new critical or major compatibility defect
- every changed path is intentional and `git diff --check` passes

### 6. Abort and restore when work becomes unsafe

Abort instead of continuing when:

- the tree gains unexpected, unrelated, unowned, or unexplained changes
- generated output, dependency churn, caches, secrets, or artifacts make the diff unreviewable
- repairs require broad skill-content rewrites, breaking renames, or structural migration beyond the user's scope
- two focused attempts on the same harness or tooling blocker fail without materially new evidence
- troubleshooting starts to outweigh progress on compatibility QA
- safe completion requires destructive Git operations, history rewriting, force pushing, or new authority

On abort:

1. Stop session-started processes and capture status, diff, evidence, and the abort reason.
2. Reconcile Git status with the session manifest and preserve any path whose ownership is uncertain.
3. Confirm `HEAD` still equals `BASELINE_HEAD` and no task-result commit exists.
4. Restore only session-owned tracked paths from `BASELINE_HEAD` with path-scoped `git restore`.
5. Remove only untracked files explicitly recorded as session-created. Never use blanket `git clean`, `git reset --hard`, blanket restore, or history rewriting.
6. Verify `HEAD` and status. If concurrent changes prevent full restoration, preserve and report them rather than risking user work.
7. Stop and return the aborted-session summary.

### 7. Commit and push only when explicitly instructed

After the completion gate and final diff review:

1. Confirm the current request explicitly authorizes a commit, a push, or both. Permission to edit does not imply either.
2. Stage only reviewed session-manifest paths and inspect the staged diff.
3. Create focused Conventional Commits, normally `fix(skills): <imperative summary>` or `feat(skills): <imperative summary>`.
4. If commit alone was requested, report its hash and stop.
5. Push only when explicitly requested, to the configured current-branch upstream, without force or retargeting.
6. If commit or push fails, do not amend, rebase, force, rewrite history, or enter extended troubleshooting. Report the exact state and stop.

The synchronization merge from step 1 establishes the baseline and never authorizes pushing by itself.

## Required Session Summary

Always end with a concise, evidence-based summary containing:

- outcome: completed, blocked, stopped at preflight, or aborted and rolled back
- synchronization result: branch, upstream, `PRE_SYNC_HEAD`, fetch and integration method, `BASELINE_HEAD`, and clean-start confirmation
- audited inventory and declared compatibility surfaces
- findings and repairs grouped by portable core, harness configuration, discovery/distribution, and root-cause prevention
- proof of semantic and routine-body preservation
- official harness validators, real discovery/load commands, package checks, catalogs, application checks, and their results
- fresh review-pass count and what each lens found
- remaining pre-existing failures, limitations, untested harnesses, and residual risk
- final Git state, session-manifest paths, commit hash, and push result when applicable
- for an abort: trigger, restored and preserved paths, final `HEAD`, and clean-baseline status

Never claim compatibility with a harness, package, installer, release path, or generated catalog that was not actually checked.
