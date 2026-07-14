# README Guidelines

## What a good README contains

Order matters — put the most useful thing first. Not every section applies to every folder; skip what doesn't.

1. **One-line purpose.** What this folder/package/app is, in a sentence a newcomer understands.
2. **How to use it.** The commands that actually work today: install, run, build, test. Copy them from `package.json` scripts or CI workflows — never from memory.
3. **How it fits in.** Where this piece sits relative to the rest of the repo, if that isn't obvious.
4. **Setup and requirements.** Environment variables, tokens, accounts, or tools needed before the commands work.
5. **Gotchas.** Anything surprising: non-obvious defaults, order-sensitive steps, known limitations.

Keep it short. Every line must earn its place — a README nobody finishes reading helps nobody.

## Does this folder need a README?

Say **yes** when:

- It's a publishable package or a deployable app.
- It's a group of related tools or skills where the folder name alone doesn't explain the set.
- It's a scripts directory whose scripts take arguments, need env vars, or run in a specific order.
- New contributors keep having to ask what the folder is for.

Say **no** when:

- The folder holds one file whose name says it all.
- It's build output, vendored code, or generated files.
- A parent README already covers it well in a section — link to that instead of duplicating it.

Duplication is the main failure mode: two READMEs describing the same thing will drift apart. Prefer one README with a link over two copies.

## Verifying claims before writing them

- Commands: confirm the script exists in `package.json` (or the file exists and is executable).
- Paths: confirm the file or folder exists at the path you name.
- Env vars: confirm the code actually reads them (grep for the variable name).
- Behavior: confirm from the code, a config file, or a CI workflow — not from an older README.

If you can't verify a claim, leave it out and mention it in the session summary as an open question.

## Conventional Commits for documentation changes

Use the `docs` type. Scope is optional — use it when the change is confined to one area.

```
docs: update readmes across packages with current scripts
docs(www): add readme for the website app
docs(skills): document the codebase skills group
docs: fix stale setup steps in root readme
```

One commit for the whole pass is fine. Split into several only when the changes serve clearly different areas and a reviewer would benefit from seeing them apart.
