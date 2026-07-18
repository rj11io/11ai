---
name: 11ai-antdesign-cheatsheet
description: "Answer common Ant Design React questions with a compact component chooser, import patterns, API reminders, state-model guidance, and version-aware examples. Use when someone asks which component to use, how to wire a common prop or pattern, or wants a quick Ant Design reference."
---

# Ant Design cheatsheet

Use [references/cheatsheet.md](references/cheatsheet.md) as the first lookup for common operations. Answer the user's specific question, not the whole reference: identify the component, show the smallest relevant import and snippet, name the state model, and call out one likely pitfall.

## Answering questions

1. Inspect `package.json` when the question depends on an API, token, date library, or framework integration. Treat the installed version as authoritative.
2. Search the reference by use case or component name. If it does not cover the question, consult the project's existing usage and the official Ant Design documentation rather than inventing a prop.
3. Prefer current `items`, token, hook, and controlled-state patterns when supported by the installed version, while preserving older project conventions when changing code would be disruptive.
4. Explain whether state is local, controlled, form-owned, route-owned, or server-owned. Most Ant Design bugs are state-model mismatches rather than missing props.
5. Include a version note when the answer differs across the installed version. Mention adjacent setup or troubleshooting work only when it is necessary to make the snippet function.

## Useful response shape

```text
Use: <component>
Import: <small import>
Pattern: <minimal example>
State: <where the source of truth lives>
Watch for: <one likely pitfall>
```

Keep a lookup answer short; offer a code change only when the user asks to implement it.
