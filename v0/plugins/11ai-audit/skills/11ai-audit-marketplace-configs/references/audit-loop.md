# The audit loop: rubric, ledger, lenses, satisfaction bar, report

## Severity rubric

| Severity | Meaning | Examples |
| --- | --- | --- |
| Critical | Fails a vendor's required schema validation, or breaks discovery or install in at least one target ecosystem | Empty `capabilities` array in a Codex manifest; a marketplace source path that does not resolve; a skill name that differs from its directory |
| Major | Spec violation or drift that ships wrong information to users or silently disables a feature | Wrong counts in a published README; a mistyped optional field a client silently ignores; non-https URL where the schema demands https; broken relative link in SKILL.md |
| Moderate | Inconsistency or convention breach nothing currently validates | Two category vocabularies across paired files; description drift between paired manifests where parity is policy |
| Minor / informational | Hygiene, dead weight, or unused headroom worth knowing about | Stale scratch files; unreachable validator branches; spec features the repo could adopt |

Confidence gates severity: a finding stays a candidate until the exact rule and the
exact observed value are both in the ledger entry. When a repo rule is stricter than
the vendor rule, audit against the stricter one and say which rule fired.

## Finding ledger

Keep one ledger for the whole session. Every entry carries:

```text
id:            MC-<sequence>
surface:       <file path>
rule:          <reference section and rule line>
observed:      <the actual value or state, quoted>
expected:      <what the rule requires>
severity:      critical | major | moderate | minor
confidence:    confirmed | candidate | disproved
first-seen:    pass <n>
status:        open | reported | disproved
recommended:   <smallest complete fix, one sentence>
```

Disproved candidates stay in the ledger with the disproving evidence — they prevent
re-flagging the same non-issue on later passes.

## Pass lenses

Use a meaningfully different lens each pass; cycle when findings keep appearing.

1. **Schema lens** — each file alone against its own spec section: required fields,
   types, enums, limits, patterns, path resolution.
2. **Cross-file lens** — the consistency rules: coverage both directions, name and
   version agreement, description parity, catalog claims, count phrases in prose as
   well as digits.
3. **Catalog and docs lens** — what READMEs, websites, and install instructions
   promise versus what the files deliver; what the package distribution actually
   ships.
4. **Freshness lens** — when the network allows, re-fetch the live schemas and docs
   listed in the conformance reference; diff against the bundled snapshot; flag rules
   that changed and re-run affected checks. Offline, record the freshness check as a
   coverage gap.

## Satisfaction bar

The audit is satisfied when all of these hold:

- Two consecutive passes produced zero new confirmed findings.
- Every critical and major finding is confirmed-and-reported or disproved — none
  left as candidates.
- Every surface in the inventory was checked against every applicable rule section,
  or the gap is listed under coverage gaps with a reason.
- A freshness pass ran, or its absence is recorded as a coverage gap.

Stop early — and say so in the report — when surfaces are unreadable, the
environment blocks required checks, or the user narrows the scope mid-audit.

## Report template

Write to the audited project root as
`11ai-audit-marketplace-configs-report-YYYYMMDDTHHMMSSZ.md` (UTC timestamp):

```markdown
# Marketplace configs audit — <project> — <timestamp>

## Verdict
Satisfied / Not satisfied (reason). Passes run: <n>. Rules snapshot: 2026-08-06;
freshness pass: run / skipped (reason).

## Inventory
Surfaces found, with counts (marketplaces, plugin manifests per ecosystem, skills,
sidecars, validators and catalog files consulted).

## Findings
By severity, each with: id, file, rule, observed vs expected, evidence, recommended
fix. Fixes are recommendations only — this audit changes nothing.

## Disproved candidates
What looked wrong but is allowed, with the disproving rule.

## Coverage gaps
What could not be checked and why.

## Pass history
One line per pass: lens, new findings, re-verified findings, duration.
```

End the session with the summary the skill contract requires: surfaces audited, pass
count, open findings by severity, report path.
