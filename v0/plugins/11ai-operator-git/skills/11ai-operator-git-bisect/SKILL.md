---
name: 11ai-operator-git-bisect
description: "Find the commit that introduced a regression with git bisect, covering a reliable reproduction first, choosing good and bad endpoints, manual and automated runs with a test script, exit codes including skip, narrowing to a path, recovering from a wrong verdict, and always resetting afterwards. Use when a bug appeared between two known points, when a regression must be attributed to a commit, or when a bisect session was left half-finished."
---
# 11ai Git bisect

Bisect is only as good as the test that decides each step. A reproduction that is flaky, or that depends on state left over from a previous checkout, produces a confident answer pointing at an innocent commit. Get the check deterministic before starting, and always reset when finished — an abandoned session leaves the repository on a detached checkout mid-history.

## Establish a reliable check first

```bash
git status --porcelain
git log --oneline -10
git log --oneline GOOD_COMMIT..BAD_COMMIT | wc -l
```

Before starting, satisfy four conditions:

1. **A clean worktree.** Bisect checks out commits repeatedly and will refuse or lose work otherwise.
2. **One command that decides good or bad**, exiting zero when good. A one-line test invocation is ideal; "I look at the page" is not, because you will run it many times.
3. **A confirmed bad commit** — usually `HEAD` — where the check genuinely fails.
4. **A confirmed good commit** where it genuinely passes. Verify this by checking it out and running the check; an assumed-good endpoint that is actually bad makes the whole run meaningless.

Count the commits in the range. Bisect needs roughly log-two steps, so a thousand commits is about ten checks — worth automating.

Rebuild artifacts as part of the check, not once at the start. A stale build directory from a previous step is the most common cause of a wrong verdict.

## Run it manually

```bash
git bisect start
git bisect bad
git bisect good GOOD_COMMIT
```

```bash
git bisect good
git bisect bad
git bisect skip
git bisect log
git bisect visualize
```

After each checkout, run the check and answer. Use `skip` when a commit cannot be tested at all — it does not build, or the feature is absent — rather than guessing; a guess sends bisect down the wrong half.

`git bisect log` is the session record. Save it before doing anything unusual, because it is what lets you replay after a mistake.

## Automate it

```bash
git bisect start BAD_COMMIT GOOD_COMMIT
git bisect run npm test -- path/to/failing.test.ts
git bisect run ./scripts/check-regression.sh
```

The exit code is the interface:

- **0** — good.
- **1 to 124, and 126 or 127** — bad.
- **125** — cannot test this commit; treated as skip.
- **Anything else** — aborts the run.

Note that 126 and 127 mean bad, so a script that is not executable or a missing command reads as "bad" at every commit and blames the earliest one. Test the script at both endpoints before running:

```bash
git checkout GOOD_COMMIT && ./scripts/check-regression.sh; echo "good endpoint: $?"
git checkout BAD_COMMIT && ./scripts/check-regression.sh; echo "bad endpoint: $?"
```

A useful script installs dependencies, builds, runs the narrowest failing test, and returns 125 when the build fails for an unrelated reason.

To narrow to a subset of history:

```bash
git bisect start -- src/billing
```

## Recover and reset

```bash
git bisect log > /tmp/bisect.log
git bisect reset
git bisect replay /tmp/bisect.log
```

If a verdict was wrong, save the log, reset, edit the incorrect line, and replay. That is faster and safer than starting over.

Always finish with:

```bash
git bisect reset
git status --short
git branch --show-current
```

`git bisect reset` returns to the branch you started on. Without it the repository stays on a detached checkout, and later work gets committed somewhere that looks lost.

## Verify and report

```bash
git show FIRST_BAD_COMMIT --stat
git log -1 --format='%H %an %ad %s' FIRST_BAD_COMMIT
```

Confirm the answer by testing the accused commit and its parent directly — the check must fail on one and pass on the other. Bisect's output is a hypothesis until that pair is verified, and a flaky test produces a plausible answer that fails this test.

Read the commit's diff and confirm it plausibly causes the behaviour. A commit that only touches documentation being blamed for a runtime regression means the check was unreliable or the range included a merge that reintroduced the change.

Report the good and bad endpoints, the exact check command and how it was made deterministic, the number of steps and any commits skipped and why, the identified commit with its author, date, subject, and touched files, the direct verification of that commit against its parent, and confirmation that `git bisect reset` returned the repository to its original branch.
