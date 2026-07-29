# Code Quality Playbook

Use this playbook to decide what counts as a finding, how badly it matters, and whether a proposed change earns its risk. Code quality invites taste, and taste does not converge. Every rule here exists to make a judgment checkable by someone other than the agent that made it.

## The Admissibility Test

Apply this before writing any change. A change ships only if it passes all four:

1. **It retires something countable.** Name the thing that goes away: a branch nothing covers, a duplicated block, a level of nesting or indirection, an unreferenced export, a swallowed error, a stale comment, an untested risky path, a misleading name at a boundary. "Reads better" is not a countable thing.
2. **It regresses no other dimension.** Account for what the change adds as well as what it removes. Cutting a function from 40 lines to 12 by adding three new indirection hops is a trade, not a win, and usually a loss.
3. **Its behavior is protected or unchanged.** Either the behavior cannot move, or a test that was proven able to fail now covers it.
4. **It matches the repository's convention.** Not the agent's preference, and not a generic ideal from outside the codebase.

A candidate that fails only the first test is a suggestion. Record it in the summary and leave the code alone.

## Severity Rubric

Assign exactly one severity per confirmed finding. Require direct evidence for critical and major.

**Critical** — wrong behavior, lost data, or an exposure, now or on the next call:

- logic that produces an incorrect result, or corrupts or drops data on a reachable path
- an unvalidated external input reaching a query, a filesystem path, a command, or rendered output
- a broken invariant in async, concurrent, or stateful code — a race, a lost update, an unreleased resource
- an error path that silently continues in a state the rest of the code assumes is valid
- a rewrite about to ship over uncovered behavior, with nothing able to detect a break

**Major** — a real maintenance hazard with a traceable failure path:

- the same logic duplicated across files that must change together, with no shared source
- a risky branch — error handling, a boundary value, a permission check — that no test covers
- a caught error that is swallowed, logged and ignored, or replaced by a value the caller cannot distinguish from success
- a name, type, or signature at a public boundary that states something untrue about what it does
- one unit holding two unrelated responsibilities, where a change to one routinely breaks the other
- a type escape hatch (`any`, a cast, a non-null assertion, a suppression comment) hiding a real mismatch

**Moderate** — a local cost, contained to one place:

- control flow deep or tangled enough to require simulating it mentally to follow
- a comment that no longer matches the code, or that only restates the syntax
- dead code: an unreferenced export, an unreachable branch, a commented-out block
- an abstraction with a single caller and no second one in sight
- a missing note on a non-obvious constraint, workaround, or compatibility decision

**Minor** — cosmetic consistency inside the repository's own convention. Fix in passing; never report as a headline.

Never promote a preference to a severity. If the only cost is that the agent would have written it differently, it is not a finding at all.

## Dimension Lenses

Inspect through each lens separately. Reading a file top to bottom once finds one kind of problem and misses the rest.

| Lens | Look for | Countable signal |
| --- | --- | --- |
| Correctness and contract | error paths, boundary and empty values, null handling, unvalidated input, async ordering, resource cleanup | uncovered risky branch, swallowed error, unvalidated boundary |
| Structure and duplication | responsibility boundaries, coupling, repeated logic, nesting depth | duplicated blocks, nesting levels, units with two reasons to change |
| Naming and interface | domain meaning, public surface, type precision, argument shape | names contradicting behavior, type escape hatches, boolean parameters that select behavior |
| Readability | cleverness with no payoff, misleading abstraction, hidden control flow | indirection hops to understand one call, single-caller abstractions |
| Tests and coverage | untested risky paths, tests coupled to implementation, tests that cannot fail | uncovered branches, tests passing against deliberately broken code |
| Dead weight and consistency | unreferenced code, unused dependencies, drift from convention | unreferenced exports, unused dependencies, commented-out blocks |

## Smell Catalog

Each entry is a finding shape, not a rule to apply everywhere. Check the repository's convention first.

### Swallowed error (Major)

The caller cannot tell success from failure.

```ts
// before — a failure returns the same shape as an empty result
async function loadUser(id: string) {
  try {
    return await db.users.findById(id)
  } catch {
    return null
  }
}
```

```ts
// after — absence and failure are different outcomes
async function loadUser(id: string): Promise<User | null> {
  return db.users.findById(id) // throws on infrastructure failure; null means "no such user"
}
```

Retires: one branch that erased a distinction the caller needs.

### Boolean parameter that selects behavior (Major at a public boundary)

`render(item, true)` cannot be read at the call site, and the flag usually means the function has two jobs.

```ts
// before
function formatDate(date: Date, short: boolean) { … }
```

```ts
// after — two names, each doing one thing
function formatDateShort(date: Date) { … }
function formatDateLong(date: Date) { … }
```

Retires: one branch, plus every unreadable call site. Only do this when call sites actually pass literals.

### Type escape hatch hiding a real mismatch (Major)

```ts
const config = raw as AppConfig // raw is unvalidated JSON from disk
```

The cast does not check anything; it only silences the compiler. Replace it with a validation at the boundary that fails loudly on bad input. If the repository already uses a schema validator, use that one.

Retires: one unvalidated boundary and one false type guarantee.

### Duplication that must change together (Major)

Three files computing the same tax rule is one finding, not three. Extract once, at the boundary that owns the rule — not into a shared `utils` bag.

Retires: N-1 copies. State N.

### Comment that restates the code (Moderate)

```ts
// increment the counter
counter += 1
```

Delete it. Replace only when there is intent the code cannot state:

```ts
// The upstream API rate-limits per calendar day, so the counter resets at UTC midnight, not on our clock.
counter += 1
```

### Abstraction with one caller (Moderate)

A wrapper, factory, or interface with a single implementation and no second one in sight costs a hop of indirection for nothing. Inline it. If a second caller is genuinely coming in this change, keep it and say so.

Retires: one indirection hop.

## When a Comment Earns Its Place

| Situation | Comment? |
| --- | --- |
| Intent — why this approach over the obvious one | Yes |
| An invariant a reader cannot see locally | Yes |
| A non-obvious constraint, workaround, or compatibility decision | Yes, with the reason it exists and what would let it go |
| A side effect not visible in the signature | Yes |
| A public API's expectations and error behavior | Yes |
| Restating what the syntax already says | No — delete |
| Explaining a confusing name | No — fix the name |
| Explaining tangled control flow | No — fix the flow |
| Commented-out code | No — delete it; version control holds it |

Keep comments short and next to the code they describe. A comment that drifts out of date is worse than no comment, so prefer the kind that stays true.

## Choosing the Cheapest Test That Proves the Contract

- **Unit** — pure logic, boundary values, error branches. The default.
- **Integration** — real boundaries: a database, the filesystem, a queue, a service, framework wiring.
- **End to end** — only critical user-visible flows that no lower level can cover honestly.

Rules that matter more than the level:

- Assert on observable behavior, not on internals. A test that breaks on every refactor is a cost, not a safety net.
- Prove a test can fail. Break the behavior deliberately, watch the test go red, restore it. An assertion that never fails protects nothing.
- Never write a test that mirrors the implementation. Restating the code in a second language proves only that the code is what it is.
- When the repository has no test infrastructure at all, do not build one uninvited. Say what coverage the change needs, keep the change small enough to review by eye, and report the gap.

## Characterization Tests Before a Rewrite

A characterization test records what the code does today, without judging whether it is right. It exists to catch a rewrite that changes behavior by accident.

1. Enumerate representative success, boundary, and failure inputs from the real call sites.
2. Assert the current outputs — including the current error types and messages, even ones that look wrong.
3. Run them against the old implementation and confirm they pass.
4. Break the old implementation on purpose and confirm they fail. Restore it.
5. Rewrite in small steps, keeping them green.
6. Correct any behavior that was actually wrong in a separate, clearly stated patch with its own test.

Step 4 is the one that gets skipped, and it is the only step that proves the net has a bottom.

## Not a Finding

Do not report or "fix" these:

- a deliberate repository convention the agent would have written differently
- a style choice the repository's formatter or linter already settled
- a missing feature, or a design the agent would have chosen instead
- a speculative abstraction for a second caller that does not exist
- a performance concern with no measurement — that belongs to a performance skill
- a rename with no countable benefit, when the churn touches many call sites
- generated files, vendored code, or dependencies
- broad reformatting of untouched code

## Useful Command Shapes

Adapt to the repository's real tooling. Prefer the project's own scripts over these.

```bash
git status --porcelain
git diff --check
<package-manager> run lint
<package-manager> run typecheck
<package-manager> run test -- <narrowest-path>
<package-manager> run build
rg -n 'catch\s*\([^)]*\)\s*\{\s*\}' <src>           # empty catch blocks
rg -n '\bas any\b|: any\b|!\.' <src>                # type escape hatches
rg -n '^\s*//.*(TODO|FIXME|HACK|XXX)' <src>         # recorded debt
rg -n '^\s*//\s*(const|let|function|if|return)' <src> # commented-out code
```

Run the narrowest checks after each batch, then the full set again from scratch before the completion gate.
