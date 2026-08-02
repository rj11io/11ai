# 11ai Audit

Evidence-backed, read-only audits for codebases and their dependencies.

## Skill

| Skill | Use it for |
| --- | --- |
| [`11ai-audit-security-dependencies`](./skills/11ai-audit-security-dependencies/SKILL.md) | Auditing declared, locked, installed, and resolvable dependencies; running authoritative package-manager audits; and prioritizing vulnerabilities, malware, and host-computer risks |

## Safety model

The dependency audit is read-only and fail-closed. It never treats missing
coverage as a clean result, and it separates installed vulnerabilities from
lockfile-only, unresolved, and coverage-gap evidence.

Each audit writes equivalent Markdown and standalone HTML reports beneath a
unique `11ai-audit-security-dependencies-reports/` run directory.
