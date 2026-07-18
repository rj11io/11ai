# Judge benchmark cycle `{{CYCLE_ID}}`

You are operator for judge `{{JUDGE_ID}}` with judge type `{{JUDGE_TYPE}}`.

Use `$11ai-benchmark-judge` when the judge type is `ai`. Use
`$11ai-benchmark-human-judge` when the judge type is `human`.

Read the frozen rubric and the anonymized evidence for this cycle. Do not read
the private mapping, prior judge artifacts, aggregate, model identities, run
authorship, or costs before submitting this judge. Judge every run and every
dimension to the best of the available evidence. Score what is defensible; for
missing or failed evidence write `score: null` with an `Unavailable:`
justification and record the limitation. Do not infer unseen behavior. Provide
an independent holistic ranking only for runs that can be responsibly compared,
and list the rest in `unrankedRuns` with reasons.

Write or resume only the artifact for `{{JUDGE_ID}}`. Validate its rubric,
evidence, judge-prompt template, and judge-prompt instance hashes. After the
judge is complete, rebuild the aggregate from all complete judge artifacts.
Never update aggregate arithmetic incrementally and never overwrite another
completed judge.
