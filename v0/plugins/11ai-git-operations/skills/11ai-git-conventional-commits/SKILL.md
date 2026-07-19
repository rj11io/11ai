---
name: 11ai-git-conventional-commits
description: "Choose, compose, and validate Conventional Commits 1.0.0 messages for task commits created by Git operators or focused commit workflows. Use whenever an operator, agent, or user-authorized workflow needs to commit its work, including with 11ai-git-commit, 11ai-git-main-operator, or 11ai-git-branch-operator. This skill governs the message only; it does not authorize staging, committing, amending, pushing, or rewriting history."
---

# 11ai Git conventional commits

Write each task commit according to the [Conventional Commits 1.0.0 specification](https://www.conventionalcommits.org/en/v1.0.0/). Keep repository-specific types, scopes, and wording rules when they are compatible with the specification. If a repository requires an incompatible format, report the conflict instead of silently violating either convention.

## Inspect the commit

Before choosing a message, review the exact staged diff and nearby history:

```bash
git diff --cached --check
git diff --cached --stat
git diff --cached
git log --format=%s -n 20
```

Also inspect commit-message or release configuration when present, such as commitlint, semantic-release, release-please, or repository contribution instructions. Do not infer content from unstaged changes. If the index contains multiple unrelated intents or needs more than one type, stop and split the work into focused commits whenever possible.

## Compose the message

Use this structure:

```text
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

Apply these rules:

1. Use `feat` for a new feature and `fix` for a bug fix.
2. Use another repository-approved type for other work. When the repository defines none, choose a precise conventional type such as `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `chore`, `style`, or `revert`.
3. Add an optional noun scope in parentheses only when it adds useful codebase context, for example `fix(parser):`. Reuse established scopes from repository history or configuration; do not invent a broad or misleading scope.
4. Follow the type or scope with `: `, then a short description of the staged result. Prefer a concise, lowercase, imperative description when repository history does not establish another compatible style.
5. Add a body only when the subject cannot explain important motivation, behavior, or tradeoffs. Start it after one blank line.
6. Add footers after one blank line following the body, or after one blank line following the description when there is no body. Format footer tokens with hyphens instead of spaces and use `: ` or ` #` before the value, for example `Refs: #123` or `Reviewed-by: A. User`.
7. Mark every breaking change with `!` immediately before the colon, a `BREAKING CHANGE: <description>` footer, or both. Use the uppercase `BREAKING CHANGE` spelling in that footer and explain what consumers must change.

Do not invent issue references, reviewers, breaking changes, or release impact. Types other than `feat` and `fix` have no implied Semantic Versioning effect unless the commit contains a breaking change.

## Validate before committing

Confirm that:

- the message describes only the staged diff;
- the type matches the primary intent;
- `feat` denotes a feature and `fix` denotes a bug fix;
- the optional scope is a useful noun and uses repository precedent;
- the header contains a terminal colon followed by one space;
- the body and footer sections have the required blank-line separation;
- every breaking change is explicitly marked;
- the message satisfies any compatible repository lint rules.

Examples:

```text
feat(auth): add passkey sign-in

fix(api): prevent duplicate retry requests

docs: explain local development setup

feat(config)!: replace legacy environment keys

BREAKING CHANGE: use APP_HOST and APP_PORT instead of HOST and PORT.
```

Return the proposed message to the calling Git operator or `11ai-git-commit`. Let that workflow perform its own authorization, staged-content review, commit creation, hook handling, and post-commit verification.
