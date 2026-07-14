---
name: 11ai-reverse-engineering
description: "Reverse engineer a locally cloned repo — extract core logic, data flows, and key implementation pieces (sanitized of all branded/personal/company information), then produce a single markdown blueprint with instructions to rebuild it better using modern technologies and best practices. Use when the user wants to study, reverse engineer, modernize, or rebuild an existing repo."
---

# 11ai Reverse Engineering

You are reverse engineering an existing repository to produce a **rebuild blueprint**: a single, self-contained markdown document that lets someone rebuild a better, modernized version of the project without ever seeing the original.

## Inputs

- **Repo path**: use the path passed as an argument; if none was given, use the current working directory. Verify the path exists and looks like a project (has source files or a manifest) before proceeding. If it doesn't, stop and ask.

## Output contract

- Exactly **one** file: `11ai-reverse-engineering-{timestamp}.md`, written to the current working directory.
- Get the timestamp by running `date +%Y%m%d-%H%M%S` — never invent it.
- The file must be self-contained: someone with no access to the original repo can rebuild the improved version from it alone.

## Phase 1 — Recon

Build a map of the project before reading deeply:

1. List the tree (respect `.gitignore`; skip `node_modules`, build output, lockfiles, vendored deps, binary assets).
2. Read manifests (`package.json`, `pyproject.toml`, `go.mod`, `Gemfile`, `Cargo.toml`, etc.), config files, CI pipelines, Dockerfiles, env templates, and the README.
3. Identify: project type, language(s), framework(s) and their versions, entry points, build/run commands, deployment target, and approximate age of the stack.

For large repos (>~200 source files), fan out parallel `Explore` agents per subsystem instead of reading everything inline.

## Phase 2 — Deep extraction

This is the core of the work. For each subsystem, extract **what matters for a rebuild**:

- **Core business logic** — the algorithms, rules, calculations, and decisions that ARE the product. Quote the actual code (sanitized — see Phase 3) with file references.
- **Data flows** — how data enters, transforms, persists, and exits. Trace the main paths end to end (request → handler → service → store → response; event → processor → sink; etc.).
- **Data models & schemas** — entities, relationships, DB schemas, API contracts, message shapes.
- **State management** — where state lives, how it's mutated, concurrency handling.
- **External integrations** — third-party APIs, queues, storage, auth providers: what they're used for and the shape of the interaction (sanitize the *who*, keep the *what*).
- **Auth & permissions** — how identity and access control work.
- **Error handling & edge cases** — retries, timeouts, validation, fallbacks; also where these are *missing*.
- **Notable cleverness** — anything non-obvious the original got right that a rebuild must preserve.

Include real code snippets for every key piece. Prefer short, focused excerpts (5–30 lines) over file dumps. Annotate each snippet with what it does and why it matters.

## Phase 3 — Sanitization (mandatory, non-negotiable)

The output must contain **zero** branded, custom, personal, or company-identifying information. Replace, never omit — the structure must survive even when the identity is stripped:

| Found in repo | Replace with |
|---|---|
| Company / org name | `{{COMPANY_NAME}}` |
| Product / brand / project codename | `{{PRODUCT_NAME}}` |
| Person names, usernames, emails | `{{AUTHOR}}`, `{{USER_EMAIL}}` |
| Internal/production domains & URLs | `{{API_BASE_URL}}`, `app.example.com` |
| API keys, tokens, secrets, conn strings | `{{API_KEY}}`, `{{DATABASE_URL}}` — never reproduce any part of a real secret, even truncated |
| Customer / client identifiers | `{{CLIENT_ID}}` |
| Internal tool/service names | generic role names: `{{BILLING_SERVICE}}`, `{{ANALYTICS_PROVIDER}}` |
| Proprietary copy, marketing text, prompts with brand voice | `{{BRAND_COPY}}` with a one-line description of intent |

Keep a consistent placeholder vocabulary across the whole document. Before writing the final file, do a verification pass: grep your draft for the identifiers you encountered during extraction (org name, domains, author names) and confirm none leaked through.

## Phase 4 — Critique of the original

List concretely, with evidence:

- Bugs and likely-bug patterns found while reading (race conditions, unhandled errors, injection risks, off-by-ones).
- Deprecated / EOL / vulnerable dependencies and APIs.
- Architectural pitfalls: tight coupling, missing abstractions, god objects, sync-where-async-needed.
- Missing fundamentals: tests, input validation, observability, migrations, idempotency.

Each item should map to a fix in the rebuild blueprint — a critique without a corresponding improvement is incomplete.

## Phase 5 — Rebuild blueprint

Design the better version. It must be **the same product, built right**:

1. **Modern stack mapping** — a table: original tech → recommended modern replacement → why. Prefer current LTS versions, actively maintained libraries, and boring-but-proven choices over hype.
2. **Target architecture** — diagram (mermaid or ASCII) plus a written walkthrough of the improved data flows.
3. **Step-by-step build plan** — ordered, concrete milestones from empty directory to feature parity, each with acceptance criteria. Front-load the core logic extracted in Phase 2.
4. **Improved code** — for each key snippet from Phase 2, show the modernized version side by side or after it: typed, validated, error-handled, testable.
5. **Robustness upgrades** — explicit sections for: input validation, error handling & retries, testing strategy (unit/integration/e2e with suggested tooling), observability (logging/metrics/tracing), security (secrets management, authz, dependency scanning), and CI/CD.
6. **Pitfalls to avoid** — every Phase 4 finding restated as a guardrail for the rebuilder.

## Output document structure

```markdown
# 11ai Reverse Engineering Report — {{PRODUCT_NAME}}
> Generated: <timestamp> · Source: <repo path> · Sanitized: yes

## 1. What this project is        (2–3 paragraphs, plain language)
## 2. Original architecture       (stack, structure, diagram)
## 3. Core implementation pieces  (the Phase 2 extraction, with snippets)
## 4. Data flows                  (end-to-end traces)
## 5. Data models & contracts
## 6. External integrations       (sanitized)
## 7. Critique of the original    (Phase 4)
## 8. Rebuild blueprint           (Phase 5 — the longest section)
## 9. Placeholder glossary        (every {{PLACEHOLDER}} used, with its meaning)
```

## Final checks before finishing

1. Re-run the sanitization grep against the finished file.
2. Confirm every code snippet compiles conceptually (no placeholder-induced syntax breakage beyond the `{{...}}` tokens).
3. Confirm the file exists at `11ai-reverse-engineering-{timestamp}.md` and report its path and section word counts to the user.
