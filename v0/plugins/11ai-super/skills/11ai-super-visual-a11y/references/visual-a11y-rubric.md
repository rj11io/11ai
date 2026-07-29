# Visual Accessibility Rubric

Use this rubric for baselining, prioritization, and the completion gate. Score measured behaviour, never intent, effort, or taste.

Score **each theme separately**. A blended score lets a strong theme hide a weak one, which is the failure this rubric exists to prevent.

## Thresholds

These are the numbers every finding is measured against. "Minimum" is the bar the completion gate enforces; "enhanced" is the direction the improvement loop moves toward.

| What | Minimum | Enhanced | Source |
| --- | ---: | ---: | --- |
| Body and label text | 4.5:1 | 7:1 | WCAG 1.4.3 / 1.4.6 |
| Large text — ≥24px, or ≥18.66px bold | 3:1 | 4.5:1 | WCAG 1.4.3 / 1.4.6 |
| UI component and graphical-object boundaries | 3:1 | — | WCAG 1.4.11 |
| Focus indicator against every adjacent surface | 3:1 | — | WCAG 1.4.11 / 2.4.11 |
| Interactive target hit area | 24×24 px | 44×44 px | WCAG 2.5.8 / 2.5.5 |
| Text scaling without loss | 200% | — | WCAG 1.4.4 |
| Reflow without two-axis scrolling | 320px equivalent | — | WCAG 1.4.10 |
| User text-spacing overrides | line-height 1.5×, letter-spacing 0.12em, word-spacing 0.16em, paragraph 2em | — | WCAG 1.4.12 |
| Non-essential motion under reduced-motion | removed | — | WCAG 2.3.3 |
| Information carried by colour alone | none | — | WCAG 1.4.1 |

Disabled controls are exempt from contrast minimums. Record them as observations, not findings.

Pure decoration that carries no meaning and no boundary is exempt from 1.4.11. Decide this from what the element communicates, not from how it is named.

### A note on the dark theme

The WCAG 2.x ratio is known to **overestimate** contrast for light text on dark backgrounds. A dark-theme pair measuring at the minimum will read as weaker than a light-theme pair measuring the same. Two consequences:

- Treat the dark theme's margin as the more suspect of the two, and prefer headroom there.
- Where a dark-theme pair matters and sits near the minimum, cross-check with APCA and confirm visually. Approximate APCA guidance, still draft: `Lc 75` for body text, `Lc 60` for large or medium text, `Lc 45` for non-text and boundaries.

Report WCAG 2.x as the governing number, since that is what audits check. Use APCA as corroboration, never as a substitute.

## Scoring

Score each dimension from 1 to 5, per theme:

- **1 — Excludes users:** Essential content or controls cannot be perceived.
- **2 — Failing:** Multiple stated minimums fail on content that carries meaning.
- **3 — At the line:** Minimums are met but with little margin, or isolated failures remain on secondary elements.
- **4 — Sound:** All minimums met with real margin; only limited non-blocking shortfalls.
- **5 — Robust:** Minimums cleared comfortably, enhanced levels reached on primary content, and the theme holds up under scaling, reflow, reduced motion, and forced colors.

Calculate the weighted total as:

`sum((dimension score / 5) × dimension weight)`

Do not award 4 or 5 without measured evidence from the rendered interface. A high total never overrides a critical or major finding.

| Dimension | Weight | Evaluate |
| --- | ---: | --- |
| Text legibility | 25 | Every text pair against its size-appropriate threshold, on every surface it lands on, including tints and media |
| Non-text and boundary contrast | 15 | Borders, rings, surface steps, icons, and graphics wherever they are the sole cue |
| Focus visibility | 15 | Indicator contrast against every surface it appears on, including inverted and selected states, plus indicator area |
| Target size and separation | 10 | Rendered hit area and spacing for every interactive element |
| Text scaling and reflow | 10 | 200% scaling, 320px reflow, user text-spacing overrides, long and localized content |
| Motion and vestibular safety | 10 | Reduced-motion honouring, auto-motion controls, flashing |
| Mode robustness | 10 | Forced colors, and parity between the two themes |
| Colour independence | 5 | No state, status, or category conveyed by colour alone |

## Evidence Checklist

### Text Legibility

- Measure every foreground against every background it actually renders on, not one representative surface.
- Include text on translucent tints, and remember the tint composites against whatever sits behind it.
- Include text over imagery, video, and gradients, where the worst-case region is what counts.
- Apply the large-text allowance only where the rendered size genuinely qualifies; small uppercase labels do not.
- Include placeholder text, helper text, timestamps, counts, and disabled-adjacent secondary text.
- Check the accent colour in every role it plays, especially when it serves as both text and fill.

### Non-text and Boundary Contrast

- Identify every border, ring, or surface step that is the **only** thing separating two regions, and hold it to 3:1.
- A hairline border at low opacity is the most common failure here.
- Where two surfaces differ by fill alone, either the fill step or the border must be perceivable.
- Include icons that carry meaning without an adjacent label, and the strokes of charts, dividers, and inputs.
- Include the boundary of unfilled inputs, checkboxes, radios, and toggles in every state.

### Focus Visibility

- Every focusable element must show a visible indicator; check keyboard traversal, not just hover.
- Measure the indicator against **every** surface it can appear on. An indicator tuned to the page background often fails on a card, a selected fill, or an inverted control.
- Check indicators on elements whose own background changes with state.
- Confirm the indicator is not clipped by an ancestor's overflow.
- Check indicator thickness and area, not only its colour.

### Target Size and Separation

- Measure the rendered hit area, including padding, not the icon or glyph.
- Check icon-only buttons, close affordances, chips, table row actions, pagination, and controls in dense toolbars.
- Note the WCAG exceptions honestly: inline links in text, targets with sufficient spacing, essential sizing, and user-agent defaults.
- Check spacing between adjacent targets, not only each target alone.

### Text Scaling and Reflow

- Scale text to 200% and confirm nothing is clipped, overlapped, or made unreachable.
- Reflow to a 320px equivalent and confirm no two-axis scrolling except where the content itself requires it.
- Apply the 1.4.12 spacing overrides and check clamped, truncated, and fixed-height regions first — they fail before anything else.
- Test long, localized, and realistic content rather than short fixtures.
- Confirm sticky and fixed regions never cover content once text grows.

### Motion and Vestibular Safety

- Confirm a reduced-motion preference removes non-essential transitions, transforms, parallax, and autoplay.
- Check that gating is applied consistently; partial coverage is the usual defect.
- Confirm anything moving for more than five seconds can be paused, stopped, or hidden.
- Confirm nothing flashes more than three times per second.

### Mode Robustness

- Render under forced colors and confirm essential boundaries, focus indicators, and meaning-bearing fills survive.
- Designs carried by 1px borders and shadow-based rings are the most exposed here.
- Confirm each theme is reachable and correctly applied by the project's actual mechanism.
- Confirm no token is defined in only one theme, leaving the other to inherit an unintended value.
- Flag bright saturated accents in the dark theme as a halation risk when lightness is high and chroma is high, and confirm the result visually. This is a heuristic, not a threshold.
- Compare the two themes pair by pair and apply the balance rule.

### Colour Independence

- Confirm status, validity, category, selection, and required-ness are conveyed by text, shape, icon, or position as well as colour.
- Check success, warning, error, and info states, and any legend or chart series.

## Coverage Matrix

Record coverage compactly so one well-tuned theme or surface cannot hide the rest.

| Pair or element | Theme | Surface | Measured | Threshold | Headroom | Result |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Example: body text | dark | card | 8.29:1 | 4.5:1 | +84% | Pass |
| Example: body text | light | card | 5.36:1 | 4.5:1 | +19% | Pass |

Add a row per pair per theme. Headroom is `(measured / threshold) − 1`; it is what the balance rule is checked against.

Record targets, scaling, reflow, motion, and forced-colors results in the same table with their own thresholds, so a single artifact carries the whole gate.
