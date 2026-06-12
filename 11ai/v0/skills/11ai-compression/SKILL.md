---
name: 11ai-compression
description: Compress markdown and text guidance files locally without external LLM or Claude CLI calls. Use when Codex needs to shorten SKILL.md, CLAUDE.md, prompts, runbooks, or other natural-language instruction files while preserving headings, fenced code, inline code, links, URLs, paths, and markdown structure.
---

# 11ai Compression

## Overview

Use this skill to reduce token-heavy guidance files with local deterministic scripts. Compress prose only. Keep structure and technical artifacts stable enough that the result stays usable by humans and agents.

## Workflow

1. Confirm the file is natural-language guidance, not code or config.
2. Run the local compressor.
3. Validate preserved regions.
4. Review the diff. Keep the compressed file only if meaning still holds.

## Commands

Compress in place and keep a backup:

```bash
python3 ./scripts/compress_markdown.py path/to/file.md --in-place --backup
```

Preview to stdout:

```bash
python3 ./scripts/compress_markdown.py path/to/file.md
```

Validate a compressed file against its backup or source:

```bash
python3 ./scripts/validate_markdown.py path/to/original.md path/to/compressed.md
```

## Preserve Exactly

- YAML frontmatter
- markdown headings
- fenced code blocks
- inline code
- markdown links and raw URLs
- file paths and commands
- list markers and numbered list structure

If unsure whether text is prose or technical content, leave it unchanged.

## Compression Rules

- Drop filler, hedging, and repeated framing.
- Prefer short verbs and direct statements.
- Merge repeated ideas.
- Keep one example when many examples teach the same pattern.
- Compress paragraphs harder than commands or labels.
- Preserve meaning; do not rewrite the file into a different policy.

## Safe Targets

- `SKILL.md`
- `CLAUDE.md`
- prompt libraries
- runbooks
- checklists
- notes and instruction files

## Avoid

- source code
- JSON, YAML, TOML, `.env`, lockfiles
- docs where exact prose is legally or contractually important
- files where headings or surrounding text are part of tests

## Scripts

Use [scripts/compress_markdown.py](./scripts/compress_markdown.py) for local compression and [scripts/validate_markdown.py](./scripts/validate_markdown.py) for preservation checks.
