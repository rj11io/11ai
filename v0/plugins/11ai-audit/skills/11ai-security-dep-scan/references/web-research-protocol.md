# Version enumeration and web research protocol

Use this protocol for every dependency scan and proposed install/update. Keep
queries read-only and preserve an evidence row for each exact candidate.

## 1. Enumerate versions from the configured source

Query the source named by the manifest, lockfile, and package-manager config.
Do not silently substitute a public registry for a private mirror.

| Ecosystem | Read-only version evidence | Candidate notes |
| --- | --- | --- |
| npm, pnpm, Yarn | `npm view --json <name> versions time dist-tags deprecated repository maintainers dist` or the configured registry's equivalent metadata endpoint | Apply npm SemVer rules, aliases, overrides/resolutions, `engines`, OS/CPU constraints, prerelease rules, and the exact registry. Retain a locked deprecated version. Never use `npx`. |
| PyPI | `GET https://pypi.org/pypi/<normalized-name>/json` or the configured PEP 503/691 index | Use all release keys/files, `requires_python`, yanked state, platform/wheel tags, extras, environment markers, and prerelease rules. Project JSON metadata is publisher-supplied; hashes and upload times are evidence, not trust. |
| Cargo | Read the configured registry index entry; each JSON line represents one crate version | Apply the Cargo requirement, target condition, feature activation, `rust_version`, source replacement, checksum, and yanked state. Include build dependencies because build scripts run on the host. |
| Go modules | `go list -m -versions -retracted -json <module>` or the configured module proxy's `/<escaped-module>/@v/list` endpoint | Include retracted versions when a lock/query can select them. Honor `replace`, excludes, module path major versions, toolchain, `GOPRIVATE`, `GONOSUMDB`, and proxy order. Avoid commands that build or install. |
| RubyGems | `GET https://rubygems.org/api/v1/versions/<name>.json` or the configured source's compact index | Apply every Gemfile requirement, platform, Ruby/RubyGems requirement, prerelease rule, source block, and lockfile platform. Retain a locked yanked version. |

Official format references:

- npm registry metadata through [`npm view`](https://docs.npmjs.com/cli/commands/npm-view)
- [PyPI JSON API](https://docs.pypi.org/api/json/)
- [Cargo registry index format](https://doc.rust-lang.org/cargo/reference/registry-index.html)
- [Go module listing and `-versions`/`-retracted`](https://pkg.go.dev/cmd/go)
- [RubyGems version API](https://guides.rubygems.org/rubygems-org-api/)

For non-registry specs, preserve source identity. Pin git to a full commit and
URL artifacts to a digest. Treat a branch, tag that can move, unversioned URL,
local path outside the scan boundary, or unavailable private source as
unverified. Do not search private identifiers publicly without permission.

## 2. Expand the possible transitive graph

For each direct exact candidate, read only its registry/index dependency
metadata. Resolve each child constraint under every applicable target condition
and add the resulting exact candidates. Repeat to a fixed point. Track:

```text
candidate key = ecosystem + normalized name + exact version + source + target
reachability = parent candidate + dependency kind + marker/feature/platform
```

Include production, development, optional, peer, build, extra, and feature-gated
dependencies when the selected scan target can activate them. Scan all targets
the user may install. If a package manager's metadata cannot express the same
resolution as the real resolver, record that mismatch as a coverage gap.

## 3. Query structured advisory and malware sources

Use exact versions, not package-only queries, for the candidate ledger:

1. Send OSV candidate batches to `POST https://api.osv.dev/v1/querybatch` using
   the canonical OSV ecosystem/name/version or purl. Follow every per-result
   `next_page_token`, then fetch `GET /v1/vulns/<id>` for full records.
2. Query GitHub Global Security Advisories for the exact `package@version` with
   `type=reviewed`. Repeat with `type=malware`; GitHub excludes malware from the
   default response. Query `type=unreviewed` as supplemental evidence when
   available, and label it unreviewed.
3. Check the OpenSSF Malicious Packages dataset explicitly. OSV can ingest its
   records, but an independent explicit check makes the malware coverage and
   dataset timestamp auditable.
4. Run the ecosystem-native audit in `audit-command-matrix.md` for the locked or
   resolved graph. Native audit results do not replace candidate-universe checks.

Primary references:

- [OSV API and batch queries](https://google.github.io/osv.dev/api/)
- [GitHub Global Security Advisories REST API](https://docs.github.com/en/rest/security-advisories/global-advisories)
- [OpenSSF Malicious Packages](https://github.com/ossf/malicious-packages)

Record HTTP status, pagination completion, query time, and response identity.
Deduplicate advisory aliases such as GHSA/CVE/OSV IDs without discarding sources.

## 4. Search the live web for every candidate

Search each candidate key. Batching multiple exact queries into one tool request
is allowed; sampling candidates or using one package-only query in place of all
exact-version queries is not.

Run these query families with the canonical quoted package name, quoted exact
version, ecosystem, and registry/repository hostname:

```text
"<package>" "<version>" <ecosystem> (critical vulnerability OR CVE OR GHSA OR RCE OR "command execution")
"<package>" "<version>" <ecosystem> (malware OR malicious OR trojan OR stealer OR cryptominer OR backdoor)
"<package>" "<version>" <ecosystem> (compromised OR hijacked OR "account takeover" OR "dependency confusion" OR protestware)
```

Also run once per package/source identity:

```text
"<package>" <registry-or-repository> (malware OR compromised OR hijacked OR typosquat OR removed OR deprecated OR takeover)
```

Add publisher, scope/namespace, repository owner, or purl terms when names are
ambiguous. For scoped names, search the complete scope and name. Search a renamed
or transferred repository under both old and new identities. Open relevant
results; never classify from snippets alone.

Prefer evidence in this order:

1. registry quarantine/removal notice or ecosystem security advisory;
2. GHSA/CVE/OSV and upstream maintainer/security advisory;
3. official incident response or law-enforcement notice;
4. security research that supplies reproducible indicators and exact versions;
5. community reports as leads only, requiring corroboration.

Capture the exact query, candidate key, URLs opened, publisher and publication/
update dates, access timestamp, result summary, and contradictions. A result
published before the candidate release may still describe a package-wide issue;
verify version bounds. A result published after a purported fix may supersede
earlier guidance.

## 5. Apply fail-closed completion rules

Before returning `NO KNOWN CRITICAL EVIDENCE`, prove:

```text
candidate keys
== keys with exact OSV checks and complete pagination
== keys with GitHub reviewed checks
== keys with GitHub malware checks
== keys with OpenSSF malicious-package checks
== keys with all three exact-version web query families
```

Also require one completed package-identity web query per unique source identity.
Every candidate must have every mandatory check. Any timeout, rate limit,
unavailable private registry, ambiguous name, missing target condition, mutable
source, or unsupported range/resolver rule yields `UNVERIFIED / COVERAGE GAP`.
Never turn a partial scan, empty search result, or lack of public reports into a
safety claim.
