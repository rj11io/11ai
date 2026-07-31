---
name: 11ai-operator-shadcn-v4-troubleshooting
description: "Diagnose shadcn CLI v4 configuration, package runner, alias, resolved-path, primitive-base, Tailwind, CSS-variable, registry, authentication, dependency, component-drift, server-boundary, chart, and build failures from exact evidence. Use when CLI commands fail or copied components render, style, type-check, or interact incorrectly."
---
# 11ai shadcn v4 troubleshooting

Version baseline: shadcn CLI 4.14.1 (stable), verified 2026-07-31; separate CLI failures from owned component modifications, underlying primitive APIs, Tailwind behavior, and third-party library failures.

Separate observed facts from theories. Establish the original command, exact error and exit code, package runner, `components.json`, info output, Git diff, component base, source file, registry, and smallest failing interaction.

## Evidence collection

```bash
npx shadcn@4.14.1 info --json
npx shadcn@4.14.1 docs COMPONENT
npx shadcn@4.14.1 add COMPONENT --diff
git status --short
```

Use preview commands only. Preserve exact stderr and exit code, but redact registry tokens, auth headers, private URLs, user data, and source maps before quoting output.

## Classify the failure

- **Configuration boundary:** `components.json`, aliases, resolved paths, RSC mode, CSS path, or Tailwind family disagrees with the project.
- **Base or API boundary:** Base UI, Radix, or React Aria docs and dependencies are mixed, or an icon library was guessed.
- **Owned-source drift:** the component was customized and a registry diff would overwrite intentional behavior.
- **Styling boundary:** semantic tokens, global CSS, Tailwind extraction, class merging, theme mode, or preset state is wrong.
- **Registry boundary:** namespace, URL, schema, includes, authentication, rate limit, or item dependency resolution failed.
- **Runtime boundary:** a client directive, portal, focus owner, form state, Recharts sizing, or server data contract is incorrect.

## Remediation discipline

Propose one bounded change and state confidence. Ask before `init`, `add`, `apply`, `eject`, auth changes, dependency updates, or file replacement. Use `--dry-run`, `--diff`, or `--view`, then re-run the original check and preserve local customizations.

## Report

State the failing boundary, evidence, cause or uncertainty, proposed fix, files and dependencies affected, security or visual impact, rollback, and verification. If the environment is unclear, hand off to `11ai-operator-shadcn-v4-environment`.
