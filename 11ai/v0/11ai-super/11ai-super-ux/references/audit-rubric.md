# UI/UX Audit Rubric

Use this rubric for baselining, prioritization, and the completion gate. Score observed behavior, not implementation effort or personal taste.

## Scoring

Score each dimension from 1 to 5:

- **1 — Broken:** Core needs regularly fail or the interface excludes representative users.
- **2 — Weak:** Serious recurring friction, confusion, or inconsistency remains.
- **3 — Serviceable:** Main tasks work, but several noticeable problems reduce quality.
- **4 — Strong:** Clear and dependable, with only limited non-blocking weaknesses.
- **5 — Excellent:** Exceptionally clear, efficient, inclusive, coherent, and polished for this product's context.

Calculate the weighted total as:

`sum((dimension score / 5) × dimension weight)`

Do not award 4 or 5 without direct evidence from the running interface. A high total never overrides a critical or major finding.

| Dimension | Weight | Evaluate |
| --- | ---: | --- |
| Task completion and flow | 20 | Core journeys, navigation, reversibility, recovery, efficiency |
| Clarity and information hierarchy | 15 | Orientation, prioritization, readability, scan path, action prominence |
| Interaction and system feedback | 15 | Affordances, state changes, validation, loading, errors, confirmation |
| Accessibility and input inclusion | 15 | Semantics, keyboard, focus, contrast, zoom, motion, labels, alternatives |
| Responsive and adaptive behavior | 10 | Mobile through desktop, touch targets, overflow, density, reflow |
| Consistency and design-system quality | 10 | Tokens, components, patterns, iconography, spacing, behavior |
| Content and trust | 10 | Concision, terminology, guidance, expectation setting, destructive actions |
| Visual craft and delight | 5 | Composition, typography, rhythm, finish, appropriate motion |

## Evidence Checklist

### Task Completion and Flow

- Can a new user identify the page purpose and primary next action quickly?
- Do all core journeys have a clear start, progression, and completion state?
- Are navigation labels and locations predictable?
- Are repeated tasks efficient without sacrificing comprehension?
- Can users cancel, go back, undo, retry, or recover where consequences warrant it?
- Do authentication, permission, offline, timeout, and stale-data states fail safely when relevant?

### Clarity and Information Hierarchy

- Does each screen have one clear purpose and an obvious primary action?
- Does heading order communicate structure without relying only on size or color?
- Are essential content and controls visible before secondary decoration?
- Are density, line length, typography, spacing, and alignment appropriate to the task?
- Are labels specific enough to predict outcomes?
- Can the interface be understood by scanning headings, labels, and actions?

### Interaction and System Feedback

- Do interactive elements look and behave as interactive elements?
- Are hover, focus, active, selected, disabled, loading, success, and error states distinct?
- Does every action receive timely feedback and prevent accidental duplicate submission?
- Are validation messages specific, adjacent to the cause, and helpful about recovery?
- Do empty states explain what happened and what the user can do next?
- Do dialogs, menus, drawers, and overlays manage focus, dismissal, and background interaction correctly?

### Accessibility and Input Inclusion

- Can all core functionality be completed with keyboard only?
- Is focus order logical and focus indication always visible?
- Do controls expose correct names, roles, values, and states?
- Are form fields associated with persistent labels and helpful errors?
- Does meaningful imagery have appropriate alternatives while decorative imagery stays silent?
- Does text and essential non-text UI meet WCAG AA contrast expectations?
- Does content remain usable at 200% zoom and with enlarged text?
- Does reduced-motion preference remove nonessential movement?
- Are targets large and separated enough for touch and motor accessibility?
- Are status changes announced when visual feedback alone is insufficient?

### Responsive and Adaptive Behavior

- Test narrow mobile, intermediate, and desktop widths rather than only presets that look good.
- Check long content, localized text, validation messages, browser zoom, and dynamic data.
- Ensure content reflows without sideways page scrolling unless the content itself requires it.
- Verify sticky and fixed regions never cover essential content or controls.
- Preserve logical reading and focus order when visual layout changes.
- Adapt tables, charts, dense toolbars, and multi-column forms deliberately.
- Keep tap targets reachable and primary actions apparent on small screens.

### Consistency and Design-System Quality

- Use shared tokens for color, spacing, typography, radius, elevation, and motion.
- Use the same component and interaction pattern for the same user intent.
- Avoid visually identical controls with different behavior or different controls for identical behavior.
- Keep icon style, label placement, capitalization, alignment, and density coherent.
- Prefer fixing a primitive when the same defect appears across multiple screens.
- Treat intentional exceptions as exceptions, not accidental drift.

### Content and Trust

- Use the user's language rather than internal implementation terms.
- Keep instructions concise, specific, and available at the point of need.
- State requirements before submission, not only after failure.
- Explain consequences before destructive, costly, public, or irreversible actions.
- Distinguish draft, saved, synced, pending, and failed states truthfully.
- Avoid dark patterns, false urgency, disguised advertising, and manipulative defaults.
- Present privacy, permission, pricing, and data-use implications clearly when relevant.

### Visual Craft and Delight

- Make composition, typography, spacing, color, and imagery reinforce hierarchy.
- Remove decorative noise that competes with content or action.
- Use motion sparingly to explain continuity, causality, or spatial change.
- Ensure polish remains intact with real content, not only ideal fixtures.
- Preserve a distinctive product character while maintaining familiarity where usability benefits.

## Audit Coverage Matrix

Record coverage compactly so a polished happy path does not hide untested states.

| Journey or screen | Role/data state | Viewports | Pointer | Keyboard | Loading/empty/error | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Example: Create item | Signed-in / realistic data | 390, 768, 1440 | Pass | Pass | Pass | Pass |

Add rows for each core journey. Use exact viewport widths only as evidence, never as a substitute for testing the layout around its actual breakpoints.
