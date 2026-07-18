---
name: 11ai-jest-coverage
description: "Collect and interpret Jest coverage for the requested tests or source files, inspect uncovered paths, and make threshold changes only when explicitly requested. Use when the user asks for coverage, a coverage report, a threshold check, or help understanding missing coverage."
---

# Jest coverage

Coverage is evidence about executed code paths, not a substitute for useful
assertions. Keep the test scope explicit and separate measurement from any
threshold or source-code change.

## Collect coverage

Start with the project's existing coverage script. If none exists, forward the
flag through the detected package manager:

```sh
npm test -- --coverage
yarn test --coverage
pnpm test --coverage
bun run test --coverage
```

Useful focused variants include:

```sh
<project-test-command> path/to/file.test.ts --coverage
<project-test-command> --findRelatedTests src/changed.ts --coverage
<project-test-command> --coverage --collectCoverageFrom='src/**/*.{js,ts,tsx}'
```

Confirm the resolved `coverageDirectory`, `collectCoverageFrom`, exclusions,
provider, reporters, and thresholds before interpreting the percentages.

## Read the report

Inspect statements, branches, functions, and lines separately. Find the
uncovered file and line ranges, then trace each range to a behavior or branch:

- If behavior is untested, add or request a focused test.
- If the file is generated, an entrypoint, or intentionally excluded, verify
  the repository's exclusion policy before changing it.
- If the run selected too few tests, rerun the relevant suite before concluding
  that coverage is missing.
- If the threshold fails, report the exact metric and configured threshold.

Coverage thresholds can be global or per path. Never lower one just to make a
run green. If the user asks to change thresholds, show the before/after config
and run the full gate afterward.

## Guardrails

- Do not delete `coverage/` or change reporters without an explicit request.
- Do not claim a coverage percentage without naming the scope and config.
- Do not collect coverage with a mocked module and treat the mock as source
  behavior; explain what was replaced.
- Use the repository's configured coverage provider. Do not switch between
  `babel` and `v8` to hide a discrepancy.

## References

- [Jest CLI options](https://jestjs.io/docs/cli)
- [Jest configuration](https://jestjs.io/docs/configuration)
