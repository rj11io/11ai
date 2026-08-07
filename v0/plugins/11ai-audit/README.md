# 11ai Audit

Evidence-backed, read-only audits for codebases and their dependencies.

## Skills

| Skill | Use it for |
| --- | --- |
| [`11ai-audit-sec-deps-scripts`](./skills/11ai-audit-sec-deps-scripts/SKILL.md) | Auditing declared, locked, installed, and resolvable dependencies; running authoritative package-manager audits; and prioritizing vulnerabilities, malware, and host-computer risks |
| [`11ai-audit-marketplace-configs`](./skills/11ai-audit-marketplace-configs/SKILL.md) | Continuously auditing marketplace, plugin, and skill configuration files against the Claude Code, Claude Cowork, OpenAI Codex, and Agent Skills specifications until no critical or major finding remains |

## Safety model

Every audit in this plugin is read-only and fail-closed. It never treats missing
coverage as a clean result. The dependency audit separates installed
vulnerabilities from lockfile-only, unresolved, and coverage-gap evidence; the
marketplace configs audit separates confirmed findings from disproved candidates
and coverage gaps.

Each audit writes a UTF-8 Markdown report in the project root of its scan
boundary, named `11ai-audit-sec-deps-scripts-report-YYYYMMDDTHHMMSSZ.md` or
`11ai-audit-marketplace-configs-report-YYYYMMDDTHHMMSSZ.md`.
