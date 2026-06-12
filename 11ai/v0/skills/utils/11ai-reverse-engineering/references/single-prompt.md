# Single prompt — paste into Claude Code from inside the cloned repo

```text
Reverse engineer this repository and produce a single self-contained markdown file named
`11ai-reverse-engineering-{timestamp}.md` in the current directory (get the timestamp by
running `date +%Y%m%d-%H%M%S`). The file must let someone rebuild a BETTER version of this
project without ever seeing the original.

PROCESS
1. Recon: map the tree (skip node_modules/build output/lockfiles), read manifests, configs,
   CI, Dockerfiles, README. Identify stack, versions, entry points, and how it runs.
2. Extract the fundamentals, each with real (sanitized) code snippets of 5–30 lines and
   file references:
   - core business logic and algorithms (the things that ARE the product)
   - end-to-end data flows (entry → transform → persist → exit)
   - data models, schemas, API contracts
   - state management and concurrency
   - external integrations (keep the WHAT, sanitize the WHO)
   - auth/permissions, error handling, retries, validation — including where they're MISSING
   - any non-obvious cleverness a rebuild must preserve
3. Critique the original with evidence: bugs, race conditions, injection risks, deprecated
   or vulnerable dependencies, tight coupling, missing tests/validation/observability.
4. Rebuild blueprint (the longest section):
   - table mapping original tech → modern replacement → why (prefer current LTS,
     maintained, boring-but-proven)
   - target architecture diagram (mermaid) + walkthrough of improved data flows
   - ordered step-by-step build plan from empty directory to feature parity, with
     acceptance criteria per milestone
   - modernized version of every key snippet: typed, validated, error-handled, testable
   - explicit sections for testing strategy, observability, security, CI/CD
   - every critique item restated as a guardrail ("pitfall to avoid")

SANITIZATION (mandatory)
Replace ALL branded, personal, custom, or company-identifying information with consistent
placeholders — never omit, always substitute so structure survives:
company → {{COMPANY_NAME}}, product/brand → {{PRODUCT_NAME}}, people/emails → {{AUTHOR}} /
{{USER_EMAIL}}, internal domains/URLs → {{API_BASE_URL}} / app.example.com, secrets/keys/
connection strings → {{API_KEY}} / {{DATABASE_URL}} (never reproduce any part of a real
secret, even truncated), client identifiers → {{CLIENT_ID}}, internal service names →
generic role names like {{BILLING_SERVICE}}, branded copy/prompts → {{BRAND_COPY}} + one
line describing intent. End the document with a placeholder glossary. Before finishing,
grep your draft for every real identifier you saw during extraction and confirm none leaked.

DOCUMENT STRUCTURE
1. What this project is · 2. Original architecture · 3. Core implementation pieces ·
4. Data flows · 5. Data models & contracts · 6. External integrations · 7. Critique of
the original · 8. Rebuild blueprint · 9. Placeholder glossary

When done, report the output file path.
```
