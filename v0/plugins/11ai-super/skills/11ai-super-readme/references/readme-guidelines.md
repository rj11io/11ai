# README Guidelines

## What a good README contains

Order matters — put the most useful thing first. Not every section applies to every folder; skip what doesn't.

1. **One-line purpose.** What this folder/package/app is, in a sentence a newcomer understands.
2. **How to use it.** The commands that actually work today: install, run, build, test. Copy them from `package.json` scripts or CI workflows — never from memory.
3. **How it fits in.** Where this piece sits relative to the rest of the repo, if that isn't obvious.
4. **Setup and requirements.** Environment variables, tokens, accounts, or tools needed before the commands work.
5. **Gotchas.** Anything surprising: non-obvious defaults, order-sensitive steps, known limitations.

Keep it short. Every line must earn its place — a README nobody finishes reading helps nobody.

## Issue-severity rubric

Grade every finding in the ledger so passes fix the worst problems first and the exit criteria have a clear meaning. "Material" means severity high or above.

- **Critical** — the README actively misleads: a documented command fails, a setup step breaks the project, a path or package name is wrong, or the README describes something the folder no longer does.
- **High** — essential information is missing: a folder that needs a README has none, a required env var or setup step is undocumented, a major feature or package is never mentioned, or two READMEs contradict each other.
- **Medium** — present but weak: incomplete instructions, unclear purpose statement, stale version numbers, badges, or links that still resolve but point somewhere outdated.
- **Low** — polish: wording, ordering, formatting, tone. Fix in passing when already editing the file; never let low findings alone drive another pass.

## Review lenses for fresh passes

Each improvement pass after the first should use one lens, in roughly this order:

1. **Newcomer** — read each README cold. Could someone new run the commands and understand the folder without opening the code?
2. **Accuracy** — re-verify every command, path, env var, link, and claim against the current code, including text the previous pass didn't touch.
3. **Coverage** — walk the tree again. Is anything important still undocumented? Was any README missed in the first mapping?
4. **Consistency** — do the READMEs agree with each other? Do index READMEs (a root file listing its children) match what actually exists? Is anything duplicated that should be a link?

A pass is "clean" when it produces no new critical or high finding.

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

If you can't verify a claim, leave it out and record it in the session summary as an open question.
