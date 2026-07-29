---
name: 11ai-super-visual-a11y
description: "Audit, fix, and continuously improve the measurable visual accessibility of a project's interface in both light and dark themes, using the running product, computed styles, and objective thresholds. Use when Codex must resolve unreadable or low-contrast text, dark mode or light mode legibility problems, washed-out or hard-to-read theme colors, accent colors that disappear against a background, weak or invisible focus indicators, undersized touch targets, content that clips when text is scaled, missing reduced-motion support, or forced-colors failures. Measures every foreground and background pair in both themes, repairs root causes at the design-token layer, keeps the two themes balanced against the same thresholds, and repeats until both meet a high bar. Excludes aesthetic direction and brand redesign, and honors audit-only requests by reporting measured findings without editing."
---

# 11ai Super Visual A11y

## Mission

Make the interface perceivable by measurement, in light mode and dark mode equally. Measure every colour pair and interactive affordance the product actually renders, repair the root cause at the token layer, verify against the rendered result, and repeat until both themes clear the same bar.

This skill governs whether a person can perceive the interface, not whether it looks good. Every finding is a measured value against a stated threshold. Aesthetic direction, brand identity, layout composition, and visual taste stay exactly as the project defines them.

## Operating Rules

- Follow repository instructions and existing design-system conventions.
- Preserve unrelated and concurrent user changes. Never clean, overwrite, or revert work that was present before the session or whose ownership is uncertain.
- Keep a session change manifest — every file this session creates, modifies, or deletes — and reconcile it after every batch.
- Measure; never judge by eye. A finding without a number is not a finding. A fix without a re-measurement is not verified.
- Treat the rendered interface as the source of truth. Compute contrast from rasterised output, not from source values or hand arithmetic.
- Evaluate **pairs, not colours**. Contrast is a property of a foreground against the background it actually lands on, so enumerate real pairs from the code.
- Attend to both themes on every pass. A change that improves one theme and regresses the other is not a fix. Score and report each theme separately so a strong theme cannot hide a weak one.
- Repair at the lowest layer that resolves the finding. One token change beats many component edits.
- Change lightness, chroma, alpha, size, and spacing. Do not change hue family, typeface, layout, or component structure to reach a threshold unless no other route exists, and say so when it happens.
- Stay inside measurable scope. If a change cannot be stated as a measured value against a threshold, it belongs to a design skill, not this one. Record it as a suggestion and leave the code alone.
- Do not add regression tests unless the user asks. Suggest one once, in the final summary.
- Use the available browser-control or platform-testing skill for interactive inspection when one exists. Read that skill before using it.
- Do not stop after producing an audit when the request authorizes fixes. Implement, verify, and iterate.
- If the user explicitly requests a read-only audit, do not edit files; complete the discovery, measurement, severity, and recommendation portions only.

## Workflow

### 1. Establish the Theming Surface

Read [references/measurement-protocol.md](references/measurement-protocol.md) before measuring anything.

Identify how this project themes itself before assuming any mechanism:

- the token system in use — CSS custom properties, a Tailwind theme block, a styled-components or emotion theme, a native or component-library palette, or hard-coded values
- how a theme becomes active — a class on the root element, a data attribute, a `prefers-color-scheme` media query, a provider, or a persisted preference
- the full token set for **each** theme, including any token defined in only one of them
- which surfaces exist and which foregrounds are intended to sit on them
- routes, components, and states that are reachable for inspection
- commands to run, lint, type-check, test, and build

Start the application when possible. Confirm you can force each theme deterministically and prove which mechanism is live; a class-based theme will not respond to an emulated media query, and the reverse is also true. If startup is blocked, exhaust safe local alternatives before relying on static review, and record the limitation.

### 2. Build the Pair and Affordance Inventory

Enumerate every role each token plays before changing any of them. This step decides the whole repair and is the one most often skipped.

For each colour token, record where it is used as text, as a fill behind text, as a translucent tint, as a border or ring, and as a large graphical area. A token used as **both** foreground and fill is coupled: changing its lightness forces a matching change in whatever sits on it.

Produce:

- the pair inventory — every (foreground, background) combination the product actually renders, per theme, including text on tints and text over media
- the boundary inventory — every place where a border, ring, or surface step is the **only** cue separating two regions
- the focus inventory — every focus indicator and both surfaces it must remain visible against, including inverted or selected states
- the target inventory — every interactive element's rendered hit area
- the motion inventory — every transition, transform, and animation, and whether it is essential
- any place colour alone carries meaning

### 3. Measure the Baseline in Both Themes

Read [references/visual-a11y-rubric.md](references/visual-a11y-rubric.md) before scoring.

Measure every entry from step 2 in light mode and in dark mode, and record both values side by side. Cover at minimum:

- text contrast for every pair, against the applicable text-size threshold
- non-text contrast for every sole-cue boundary and every focus indicator
- rendered hit area for every target
- text scaled to 200%, layout reflowed at a 320px equivalent, and the user text-spacing overrides applied
- reduced-motion behaviour for non-essential motion
- forced-colors rendering for essential boundaries, focus, and any element whose meaning depends on a custom fill
- automated accessibility output when suitable tooling already exists or can be run safely

Score each theme separately with the rubric. Use the scores to expose the weaker theme and the weaker dimension, not to imply precision the evidence does not support.

### 4. Triage by Perceptual Harm

Assign one severity per confirmed finding:

- **Critical**: Content or an essential control cannot be perceived by a representative user — text far below threshold, a focus indicator that is effectively invisible, a control that disappears in one theme or in forced-colors, or content lost entirely when scaled.
- **Major**: A stated threshold fails and the affected element carries real meaning — body or label text under its minimum, a sole-cue boundary under 3:1, a target under the minimum size, non-essential motion that ignores the user's preference.
- **Moderate**: A threshold is met but only barely, or the two themes are materially unbalanced for the same pair, or a preferred level is missed on primary content.
- **Minor**: A measurable shortfall on incidental, decorative, or rarely reached elements.

Prioritize by severity, then by how much content the token or component reaches. Prefer a single token fix that clears many findings over several local fixes. Never inflate a preference into a severity.

### 5. Fix Root Causes

Resolve every critical finding, then every major finding, in coherent batches small enough to diagnose.

Prefer changes in this order:

1. tokens — the shared value that fixes many pairs at once
2. token pairings — the foreground that must move because its background moved
3. compositing — replace a translucent fill that carries text with an opaque mix against a known base, so its contrast stops depending on whatever sits behind it
4. component styles — only where no token expresses the fix
5. size, spacing, and hit area
6. motion gating and forced-colors fallbacks

Apply these repair rules:

- **Recompute the pair, not the colour.** After moving any token, re-measure every pair that token participates in, in both themes.
- **Honour the coupling.** Lightening a fill means darkening what sits on it. Look for an existing pairing in the project's own tokens before inventing values.
- **Prefer opaque for anything carrying text.** Alpha makes contrast depend on the surface behind it, which is why translucent chips and badges drift below threshold.
- **Keep the hue family.** Move lightness and chroma first; treat a hue change as a last resort that must be reported.
- **Do not fix one theme onto the other's back.** Re-measure both after every change, and check the balance rule in step 8.
- **Re-check your own additions.** A newly added focus ring, border, or fill is a new pair and must be measured like any other.

### 6. Verify Each Batch

After every meaningful batch:

- review the batch's complete changes and account for every path in the session change manifest
- re-measure every affected pair in **both** themes and compare against the baseline
- rasterise the rendered result rather than trusting the intended value or your own arithmetic
- hard-reload before diagnosing anything unexpected, and confirm the finding is not a stale-stylesheet artifact
- re-check neighbouring consumers of any shared token or component
- exercise keyboard focus, hover, selected, disabled, and error states where the change touches them
- run the narrowest relevant automated checks, then broader lint, type, test, and build checks as risk warrants

Do not mark a finding resolved on the basis of a code diff, a successful build, or a screenshot alone.

### 7. Control Scope and Abort Safely

Treat the session as too dirty and abort when any of these occurs:

- the change set contains unexplained or unrelated files, generated output, dependency or lockfile churn, secrets, build artifacts, or edits outside the intended repair surface
- the change set grows beyond what can be reviewed and verified confidently as one accessibility-focused session
- the agent cannot explain why every changed path is necessary
- the same finding survives three consecutive repair attempts without materially new evidence
- reaching a threshold would require changing brand hue, typeface, layout, or component structure, and the user has not authorized that
- debugging is dominated by environment, build, dependency, or product-decision failures outside this scope
- ownership of a change in the project is uncertain

On abort:

1. Stop processes started by the session and capture the failure evidence and abort reason.
2. Compare the project's current state with the session change manifest. Preserve any path whose ownership is uncertain.
3. Stop and return the aborted-session summary, listing exactly which session changes remain. Do not immediately restart the whole operation.

### 8. Run the Improvement Loop

Once no critical or major finding remains, keep raising the measured floor. Each iteration:

1. Select the weakest measured dimension in the weaker theme.
2. State the target in one sentence, as a number.
3. Make the smallest systemic change that reaches it.
4. Re-measure both themes.
5. Re-score only what new evidence supports.
6. Keep the change if both themes improve or one improves while the other holds; revise or revert the agent's own change if either regresses.

Improve in this direction, which needs no aesthetic judgement:

- raise text pairs from the minimum toward the enhanced level where the pairing allows it
- raise sole-cue boundaries and focus indicators above the bare minimum
- grow targets from the minimum toward the enhanced size
- reduce halation risk on bright saturated accents in the dark theme, confirming the result visually
- widen the margin on any pair sitting close to its threshold

Enforce the balance rule throughout: **no pair may clear its threshold with more than 50% headroom in one theme while clearing by less than 10% in the other.** When that happens, rebalance rather than bank the win — it means the token was tuned for one theme.

Prefer meaningful margin over churn. Never restyle merely to keep the loop moving.

### 9. Apply the Completion Gate

Stop only when all of the following hold, **in both themes**:

- Every text pair meets its size-appropriate minimum.
- Every boundary that is the sole cue between two regions, and every focus indicator against every surface it appears on, meets the non-text minimum.
- Every interactive target meets the minimum hit area, and any target below the enhanced size is recorded deliberately.
- Content survives 200% text scaling, reflow at a 320px equivalent, and the user text-spacing overrides with no loss or clipping.
- Non-essential motion is removed under a reduced-motion preference.
- Essential boundaries, focus indicators, and meaning-bearing fills survive forced-colors.
- No information is carried by colour alone.
- Each theme scores at least 90/100 on the rubric with no dimension below 4/5, reported per theme rather than blended.
- The balance rule in step 8 holds for every pair.
- Relevant existing tests and static checks pass, and the inspected interface has no new actionable console errors.
- A final saturation pass finds no further measurable improvement worth its regression risk.
- The complete change set is intentional, reviewable, and limited to the session manifest.

Regression tests are not part of this gate. If a gate cannot be met because of a missing credential, an unavailable dependency, an unauthorized brand change, or another external blocker, do not claim satisfaction. Report the unmet gate, the measured evidence, the work completed, and the smallest next action.

### 10. Offer a Durable Guardrail

Mention once, in the final summary, that the measurements from this session can be kept as an automated check so the same thresholds are enforced on future changes. Describe what it would cover and roughly what it costs.

Implement it only if the user asks. When they do, keep it in the session manifest and verify it fails on a known-bad pair before declaring it working.

## Session Summary

Always end with a concise summary of the complete session, including successful, blocked, audit-only, and aborted runs. Lead with the outcome and include:

- the themes, routes, viewports, and input modes verified, and how each theme was forced
- a before-and-after table of measured values for the findings fixed, with both themes side by side
- critical and major findings resolved, grouped by the token or component that caused them
- the most valuable improvements beyond threshold repair
- the per-theme rubric scores and the balance-rule result
- validation commands and interactive checks performed
- residual measurable shortfalls, each with its number and the reason it remains
- any suggestion recorded but not acted on, including aesthetic items left to a design skill and the optional automated check
- final state of the session's changes: the complete manifest of paths created, modified, or deleted
- for an abort, the trigger, which session changes remain, and any path preserved because ownership was uncertain

Keep the report concise. Reference changed files directly, quote measured numbers rather than adjectives, and distinguish verified measurements from judgement.
