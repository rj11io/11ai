# Rubric template

Copy into the benchmark repo as `benchmark/rubric.md`, adapt the
dimensions to the benchmark's "skill under test", and freeze it before
scoring anything. Weights must sum to 100.

Anchors are what keep scores comparable across judges and sessions:
every dimension needs a concrete description of what a 1, a 5, and a 10
look like — written so a judge can point at a screenshot and say which
one applies. Vague anchors ("good typography") reintroduce the vibes
this file exists to remove.

```markdown
# Rubric — <benchmark name> (v1, frozen <date>)

Judged from screenshots at the defined surfaces. Scores are 1–10 per
dimension. This file must not change while a judging panel is open; a
changed rubric is a new version and a new results file.

## 1. Information hierarchy (weight: 30)

Does the eye land on the right things in the right order?

- **1** — no visible structure; everything is the same size and weight;
  the most important content is indistinguishable from the least.
- **5** — sections are distinct and ordered sensibly, but emphasis is
  flat or misplaced in spots (a heading weaker than its body, key info
  below the fold for no reason).
- **10** — deliberate reading path at every surface; size, weight,
  spacing, and position all agree about what matters most.

## 2. Typography & spacing (weight: 25)

- **1** — default-looking stack, cramped or erratic spacing, line
  lengths uncomfortable to read.
- **5** — clean but generic; consistent spacing scale with occasional
  collisions or orphans.
- **10** — type choices fit the content's character; measure, leading,
  and rhythm feel designed, not defaulted.

## 3. Surface fidelity (weight: 25)

How well the page holds up across the benchmark's surfaces (mobile /
desktop / print / dark mode — as defined).

- **1** — a surface is broken: horizontal scroll on mobile, clipped
  print output, unreadable dark mode.
- **5** — every surface works but at least one is clearly the
  afterthought (print is just the screen squeezed; mobile stacks
  awkwardly).
- **10** — each surface looks intentionally designed for; print reads
  like a document, mobile like a mobile page, not a shrunken desktop.

## 4. Craft & restraint (weight: 20)

- **1** — decoration without purpose (gradients, cards, borders
  everywhere), inconsistent components, visible bugs or console errors.
- **5** — tidy but timid, or ambitious but rough at the edges.
- **10** — every element earns its place; the design direction is
  confident and consistently executed down to the details.
```

## Adapting it

- Swap dimensions to match the objective: a dashboard benchmark wants a
  "data-viz correctness" dimension (right chart types, honest axes); a
  landing page wants "persuasion structure" (CTA prominence, flow).
- Keep it to 4–6 dimensions. More than that and judges stop
  discriminating between them.
- Put the heaviest weight on the dimension the PROMPT.md names as the
  thing being compared — the rubric and the prompt must agree about what
  the benchmark measures.
