# 11ai Audit

Evidence-backed, read-only dependency audits.

## Skills

| Skill | Use it for |
| --- | --- |
| [`11ai-audit-sec-deps-scripts`](./skills/11ai-audit-sec-deps-scripts/SKILL.md) | Auditing declared, locked, installed, and resolvable dependencies; running authoritative package-manager audits; and prioritizing vulnerabilities, malware, and host-computer risks |

## Safety model

This audit is read-only and fail-closed. It never treats missing coverage as a
clean result: it separates installed vulnerabilities from lockfile-only,
unresolved, and coverage-gap evidence, and reports each kind on its own.

It writes a UTF-8 Markdown report in the project root of its scan boundary,
named `11ai-audit-sec-deps-scripts-report-YYYYMMDDTHHMMSSZ.md`.

Marketplace and plugin configuration auditing moved to the
[`11ai-plugins-marketplace`](../11ai-plugins-marketplace/README.md) plugin.
