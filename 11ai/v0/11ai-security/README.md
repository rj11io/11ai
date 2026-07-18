# 11ai Security

A focused dependency-security plugin for finding vulnerable, suspicious, or
unexpectedly executable packages without installing or running third-party
code.

## Skill

| Skill | Use it for |
| --- | --- |
| [`11ai-security-dep-scan`](./skills/11ai-security-dep-scan/SKILL.md) | Auditing declared, locked, and installed dependencies; running authoritative package-manager audits; and prioritizing critical vulnerabilities that could execute code or harm a developer's computer |

## Safety model

The skill is read-only by default. It never treats missing audit coverage as a
clean result, and it separates confirmed installed vulnerabilities from
lockfile-only, unresolved, and coverage-gap evidence.
