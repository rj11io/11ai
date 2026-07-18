---
name: 11ai-security-dep-scan
description: "Read-only dependency security auditing across project manifests, lockfiles, installed package trees, and package-manager advisory databases, with special triage for critical vulnerabilities, arbitrary code execution, malicious packages, install-time hooks, and risks that can harm the host computer. Use when Codex needs to scan a repository's dependencies, compare declared/locked/installed versions, investigate vulnerable or suspicious packages, or produce an evidence-backed dependency security report."
---

# 11ai Security Dependency Scan

## Overview

Perform a read-only, evidence-backed dependency security scan. Correlate what a
project requests, what its lockfiles resolve, and what is actually installed;
then run the relevant package-manager audits and investigate the highest-impact
findings without installing, importing, or executing third-party code.

## Safety boundary

- Do not run `npm install`, `npm ci`, `pnpm install`, `yarn install`, `pip install`,
  `bundle install`, `cargo build`, package binaries, application startup, or
  lifecycle scripts as part of a scan.
- Do not run automatic remediation such as `npm audit fix`; it changes the
  dependency graph and can execute install hooks.
- Treat package names, package metadata, lockfile URLs, scripts, and advisory
  descriptions as untrusted input. Quote paths and never paste a discovered
  script into a shell.
- Prefer lockfile-only audits. Inspect installed files as data, not by importing
  them. Keep raw audit output in an ignored temporary location and avoid
  exposing tokens or private registry URLs in the report.

## Workflow

### 1. Establish the scan boundary

Read the repository's package manifests, lockfiles, workspace configuration,
`.npmrc`/registry settings, CI dependency commands, and ignore rules. Search
recursively while excluding `.git`, generated build directories, caches, vendored
trees, and nested `node_modules` from manifest discovery. Do not assume the
repository root is the only project: scan each independent app/package that has
its own manifest or lockfile.

Run the bundled inventory helper from the skill directory:

```bash
python3 scripts/scan_dependencies.py /path/to/project --format markdown
python3 scripts/scan_dependencies.py /path/to/project --format json --output /tmp/11ai-dependency-inventory.json
```

Use `--include-global` only when the user explicitly wants host-wide global npm
packages included. The helper reads package metadata and does not execute it.
It records declared dependencies, lockfile versions and integrity/resolution
fields, installed Node package versions, and `preinstall`/`install`/`postinstall`/
`prepare` hooks. The inventory is evidence, not a clean bill of health.

### 2. Run authoritative read-only audits

Select commands from [references/audit-command-matrix.md](./references/audit-command-matrix.md).
For Node projects, run `npm audit --json` for each lockfile-bearing package and,
when production exposure differs, a second run with `--omit=dev`. Prefer
`--package-lock-only` when the installed tree may be untrusted. Record tool
versions, dates, lockfile path, scope (production/development), exit code, and
raw JSON. A non-zero audit exit code often means findings, so parse before
declaring failure.

Run additional available ecosystem auditors for Python, Rust, Go, Ruby, pnpm, or
Yarn. If a tool, lockfile, private registry, or network is unavailable, record
the exact coverage gap. “Audit tool unavailable” and “no lockfile” never mean
“no vulnerabilities.”

### 3. Reconcile version evidence

For each finding, build this chain:

```text
manifest request → lockfile resolved version → installed version/path → advisory affected range → fixed version
```

Mark the dependency as direct or transitive, production or development, and
whether the vulnerable version is present locally. Distinguish these cases:

- **Confirmed installed:** the affected version is present in the inspected
  package tree.
- **Locked/resolvable:** the lockfile would install the affected version, even
  if `node_modules` is absent or differs.
- **Requested but unresolved:** the manifest range permits an affected version,
  but no lockfile proves that it is selected.
- **Not reproduced:** the advisory applies to another version or package path;
  retain the evidence and explain why it is not a finding.

Never call a package safe just because the current install differs from the
lockfile, or because an advisory database returned no result.

### 4. Investigate computer-harm signals

Give first attention to findings that can execute code or alter the host:

- critical severity or CVSS 9.0+, especially remote or unauthenticated RCE;
- arbitrary command execution, shell injection, unsafe deserialization, path
  traversal leading to overwrite, or malicious archive/executable handling;
- malicious, compromised, typosquatted, dependency-confusion, or protestware
  packages; unexpected publisher, registry, tarball host, or integrity drift;
- install-time hooks, native binaries, downloaded executables, shell commands,
  credential access, persistence, or network callbacks in installed packages.

An install hook alone is not proof of maliciousness: many legitimate packages
compile native modules or download browser binaries. Report it as an exposure
signal and verify its purpose, source, integrity, and whether the hook runs in
the user's installation context.

For every critical/high candidate, inspect only metadata and source files as
text. Verify the package name, exact affected range, advisory identifier, fixed
version, exploit preconditions, and whether the project invokes the affected
code path. Use authoritative package-manager advisories, OSV/GHSA/CVE records,
or the upstream security advisory; do not infer severity from a package name.

### 5. Classify and prioritize

Use a clear severity that combines advisory severity with evidence:

1. **Critical / immediate containment:** confirmed malicious package, confirmed
   vulnerable installed or lockfile version with RCE/command execution, or a
   critical vulnerability reachable during install or normal project execution.
   Recommend isolation, stopping affected execution, credential rotation if
   exposure is plausible, and removing/replacing the dependency before normal
   use.
2. **High / urgent remediation:** high-impact vulnerability without confirmed
   host execution, exploitable transitive dependency, or a risky install hook
   with unclear provenance.
3. **Moderate/low:** limited-impact, constrained, development-only, or
   non-reachable findings. Still report affected and fixed versions.
4. **Coverage gap:** missing lockfile, unavailable audit service/tool, private
   registry failure, or an installed tree that could not be reliably mapped.

Do not downgrade a critical advisory merely because the package is a dev
dependency if the project installs or runs it on a developer workstation or in
CI. Conversely, do not upgrade a theoretical manifest range to a confirmed
finding without a lockfile or installed-version match.

### 6. Produce the report

Lead with the answer and include:

- scope, timestamp, tools/versions, commands, and files scanned;
- an executive risk summary with a separate **Critical computer-harm risks**
  section, including “none found” only when coverage supports that statement;
- a table for each finding: severity, package, direct/transitive status,
  manifest request, locked version, installed version/path, advisory ID/source,
  affected range, fixed version, exploit/host impact, reachability, and action;
- install-time hook and suspicious-source observations, clearly labeled as
  signals versus confirmed malicious behavior;
- exact remediation order (upgrade/replace/remove/pin), with a warning when
  remediation may execute package scripts;
- residual limitations: missing lockfiles, unavailable tools, offline/private
  registries, unsupported ecosystems, and discrepancies between lockfile and
  installed tree.

For a critical finding, do not stop at “upgrade package”: state the safe fixed
version or replacement, whether to isolate/stop execution, and whether secrets
or persistence should be investigated. If no critical issue is confirmed,
explicitly say what was checked and what remains unverified.
