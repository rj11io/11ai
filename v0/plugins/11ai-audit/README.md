# 11ai Audit

Evidence-backed, read-only audits for codebases and their dependencies.

## Skill

| Skill | Use it for |
| --- | --- |
| [`11ai-audit-sec-deps-scripts`](./skills/11ai-audit-sec-deps-scripts/SKILL.md) | Auditing declared, locked, installed, and resolvable dependencies; running authoritative package-manager audits; and prioritizing vulnerabilities, malware, and host-computer risks |

## Safety model

The dependency audit is read-only and fail-closed. It never treats missing
coverage as a clean result, and it separates installed vulnerabilities from
lockfile-only, unresolved, and coverage-gap evidence.

Each audit writes a UTF-8 Markdown report named
`11ai-audit-sec-deps-scripts-report-YYYYMMDDTHHMMSSZ.md` in the project root of
the scan boundary.
