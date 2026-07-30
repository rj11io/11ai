---
name: 11ai-operator-git-submodules
description: "Operate Git submodules predictably, covering adding one and what gets committed, cloning and initializing recursively, updating to a pinned commit versus tracking a branch, committing a pointer change, running commands across submodules, removing one completely, and the settings that stop a plain clone or pull leaving them empty or stale. Use when a submodule must be added, updated, pinned, or removed, or when a clone has empty submodule directories."
---
# 11ai Git submodules

The parent repository records a **commit**, not a branch. Every confusing submodule behaviour follows from that: a plain clone leaves the directory empty, a plain pull does not update the contents, and a change inside a submodule is invisible to the parent until the new pointer is committed there too.

## Inspect first

```bash
git submodule status --recursive
cat .gitmodules
git config --get-regexp '^submodule\.'
git submodule summary
git diff --submodule=log
```

`git submodule status` prefixes tell you the state at a glance: `-` not initialized, `+` checked out at a commit different from the one recorded, `U` has merge conflicts, and a bare space means it matches.

A `+` is the state to understand before doing anything else. It means the submodule's working directory is at some other commit — someone moved it, or an update pulled a new one — and committing in the parent now would pin that commit, possibly unintentionally.

Note that `.gitmodules` records the branch to *track* when asked, but the parent still pins a commit regardless.

## Add a submodule

```bash
git submodule add https://github.com/ORG/LIB.git vendor/lib
git submodule add -b main https://github.com/ORG/LIB.git vendor/lib
git status --short
git commit -m "chore: add lib submodule"
```

Two things get committed: the `.gitmodules` entry and a special gitlink entry recording the exact commit. Both must be committed together, or a clone gets a configuration with no pointer or the reverse.

Use an HTTPS URL unless every contributor and every pipeline has SSH access to that repository. An SSH URL in `.gitmodules` breaks cloning for anyone without a key, including most CI runners.

## Clone and keep in step

```bash
git clone --recurse-submodules URL
git submodule update --init --recursive
git submodule update --init --recursive --depth 1
```

A clone without `--recurse-submodules` leaves the directories empty, and the build fails with missing files rather than anything mentioning submodules. Make it automatic for everyone:

```bash
git config --global submodule.recurse true
```

That makes `git pull`, `git checkout`, and `git switch` update submodule contents to the recorded commits. Without it, switching branches in the parent leaves submodules at the previous branch's commits — code from two different states, silently.

## Update the pinned commit

```bash
git submodule update --remote vendor/lib
cd vendor/lib && git fetch && git checkout TAG && cd -
git -C vendor/lib log --oneline -3
git add vendor/lib
git commit -m "chore: bump lib to TAG"
```

`--remote` moves the submodule to the tip of its tracked branch; checking out a tag directly pins a specific release, which is usually what a dependency should be.

Either way, the update is not real until the parent commits the new pointer. `git add vendor/lib` stages the gitlink — note it is the directory path, not files inside it. Report the old and new commits in the message so the bump is reviewable.

Never commit a parent pointer to a submodule commit that has not been pushed to the submodule's own remote. Everyone else's `submodule update` then fails on a commit that does not exist for them, and the parent repository is broken until it is pushed.

```bash
git submodule foreach 'git fetch --prune'
git submodule foreach --recursive 'git status --short'
```

## Remove one completely

Removal takes four steps, and skipping any leaves the repository in a half state:

```bash
git submodule deinit -f vendor/lib
git rm vendor/lib
rm -rf .git/modules/vendor/lib
git commit -m "chore: remove lib submodule"
```

`deinit` clears the working directory and configuration, `git rm` removes the gitlink and the `.gitmodules` entry, and deleting `.git/modules/vendor/lib` removes the cached repository — without that last step, re-adding a submodule at the same path fails with a confusing already-exists error.

`git rm` here deletes the submodule's working directory. Check for uncommitted work inside it first and get approval for the path.

## Verify and report

```bash
git submodule status --recursive
git -C vendor/lib log -1 --format='%H %d %s'
rm -rf /tmp/clone-check && git clone --recurse-submodules . /tmp/clone-check && ls /tmp/clone-check/vendor/lib
```

The clone check is the one that matters: it proves a fresh clone gets populated submodules at the intended commits. Remove the scratch clone afterwards.

Report each submodule with its path, URL, tracked branch if any, and pinned commit before and after; whether the submodule commit is pushed to its own remote; what was committed in the parent; and the fresh-clone verification. Say explicitly what contributors must run on their own machines — usually `git submodule update --init --recursive` — for the change to take effect.
