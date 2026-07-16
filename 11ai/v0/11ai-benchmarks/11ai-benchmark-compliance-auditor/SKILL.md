---
name: 11ai-benchmark-compliance-auditor
description: "Mechanically verify that a finished benchmark run obeyed the hard rules — wrote only inside its folder, added no dependencies, left content and baseline untouched, kept typecheck/lint clean, renders, and passes the content-edit regression test. Writes a pass/fail report to benchmark/audits/. Use after a run finishes, before judging. Every check is a command, not a judgment call; use the judge skill for quality scoring."
---

# 11ai Benchmark Compliance Auditor

A run that broke the rules must not reach judging — a beautiful page that
hardcoded its content or edited the shared baseline didn't do the task.
This skill runs the rule checks as commands and writes a machine-readable
verdict. It never scores quality; that's `$11ai-benchmark-judge`.

## Inputs

- The run id (folder name under `app/`).
- Its ledger entry in `benchmark/runs.json` — specifically
  `baselineCommit`, the snapshot the run's work is diffed against. If
  there's no ledger entry, ask the user for the pre-run commit; without
  one, the folder-isolation checks are not possible and the audit must
  say so rather than fake a pass.

## The checks

Run all of them; don't stop at the first failure — the report should
show everything that went wrong.

**1. Folder isolation.** Every path the run touched is inside its own
folder:

```bash
git diff --name-only <baselineCommit> -- .
git ls-files --others --exclude-standard
```

Anything printed outside the run folder is a violation, with exceptions
for the runner-owned ledger and frozen-prompt files. This form covers
committed, staged, unstaged, and untracked run output; do not require or
create a closeout commit just to make the audit possible.

**2. No new dependencies.** `package.json` and the lockfile are
byte-identical to the baseline:
`git diff <baselineCommit> -- package.json package-lock.json` is
empty, and `node_modules` gained no packages the lockfile doesn't know.

**3. Content untouched.** `git diff <baselineCommit> -- content/`
is empty.

**4. Baseline untouched.** Same empty-diff check for `components/ui/`,
`lib/`, `hooks/`, `app/globals.css`, and `app/layout.tsx`. (Check 1
already implies this; keeping it separate makes the report say *what*
was violated, not just *that* something was.)

**5. Repo health.** `npm run typecheck` and `npm run lint` both exit 0.

**6. It renders.** Boot the dev server on a spare port; `curl` the run's
route; expect HTTP 200 and a non-trivial body. Check the server log for
render errors.

**7. Content-edit regression (the hardcode detector).** While the server
runs:

1. Append a sentinel entry to one content file — a new `## entry` whose
   heading is an unmistakable string like `Audit Sentinel Entry XYZQ`.
2. Re-fetch the run's route and grep the HTML for the sentinel.
3. **Revert the content file** (git checkout) — always, even on failure.

If the sentinel doesn't appear, the run hardcoded content or bypassed
the loader. This is the most important check in the audit: it directly
tests the "editing markdown updates the site with zero code changes"
requirement.

**8. Style-leak scan (warning, not failure).** Grep the run's folder for
global CSS imports that aren't CSS modules (`import "./x.css"` where the
file lacks `.module.`) and for `@page` rules outside CSS modules. These
can leak into other runs' routes on client-side navigation; report as a
warning since the hub's plain `<a>` links mitigate it.

## The report

Write `benchmark/audits/<run-id>.json`:

```json
{
  "runId": "codex-gpt5.5-high",
  "auditedAt": "<ISO timestamp>",
  "baselineCommit": "<hash>",
  "pass": false,
  "checks": [
    { "name": "folder-isolation", "pass": true, "detail": "" },
    { "name": "no-new-dependencies", "pass": true, "detail": "" },
    { "name": "content-untouched", "pass": true, "detail": "" },
    { "name": "baseline-untouched", "pass": true, "detail": "" },
    { "name": "repo-health", "pass": true, "detail": "typecheck 0, lint 0" },
    { "name": "renders", "pass": true, "detail": "HTTP 200" },
    { "name": "content-edit-regression", "pass": false, "detail": "sentinel not found in HTML" },
    { "name": "style-leak-scan", "pass": true, "detail": "warning: @page in globals-like css", "warning": true }
  ]
}
```

`pass` is the AND of all non-warning checks.

## Reporting to the user

Lead with the verdict. On failure, say exactly which rule was broken and
show the evidence (the offending paths, the missing sentinel). Do not
fix violations, rerun the agent, or soften the result — whether a
non-compliant run gets disqualified, re-run, or annotated is the user's
call. On pass, say the run is eligible for `$11ai-benchmark-judge`.
