---
name: 11ai-operator-bash-testing
description: "Lint and test Bash scripts, covering shellcheck severity and directives, shfmt formatting, syntax-only parsing, bats test structure with setup and teardown, stubbing external commands, asserting exit status and output, testing failure paths, and running the checks in a pipeline. Use when a script needs coverage or linting, when shellcheck reports warnings that must be understood or suppressed, or when a script's failure behaviour has never been exercised."
---
# 11ai bash testing

Shell scripts fail on the paths nobody ran: the missing argument, the file with a space in its name, the interrupted run that leaves a temporary directory behind. Linting finds most of it by inspection and costs nothing; tests cover the rest. Start with the linter.

## Lint first

```bash
bash -n script.sh
shellcheck script.sh
shellcheck --severity=warning --format=gcc script.sh
shellcheck -x script.sh
shfmt -i 2 -ci -d script.sh
```

`bash -n` parses without executing, which is the fastest way to catch a syntax error. `shellcheck` then finds the real bugs: unquoted expansions, word splitting, misused test operators, and `local var="$(cmd)"` masking a failure.

Two flags worth knowing. `-x` follows `source` and `.` into other files, which is needed for a script split across a library. `--severity=warning` filters out style notes when triaging a large existing script — fix the errors and warnings first.

Suppress a finding only when you can say why, with the reason on the line:

```bash
# shellcheck disable=SC2086 # word splitting is intended here to pass separate arguments
command $args
```

A bare `disable` with no code or no reason is how a real bug gets silenced. Never add a file-wide disable to make the linter quiet.

```bash
find . -name '*.sh' -print0 | xargs -0 shellcheck
```

## Structure a test

```bash
brew install bats-core
```

```bash
# tests/script.bats
setup() {
  load '../script.sh'
  TMPDIR_TEST="$(mktemp -d)"
}

teardown() {
  rm -rf -- "$TMPDIR_TEST"
}

@test "prints the target" {
  run ./script.sh mytarget
  [ "$status" -eq 0 ]
  [ "$output" = "mytarget" ]
}

@test "exits 2 with no arguments" {
  run ./script.sh
  [ "$status" -eq 2 ]
  [[ "$output" == *"usage"* ]]
}

@test "handles a filename with a space" {
  touch "$TMPDIR_TEST/two words.txt"
  run ./script.sh "$TMPDIR_TEST/two words.txt"
  [ "$status" -eq 0 ]
}
```

```bash
bats tests/
bats --filter 'no arguments' tests/
```

`run` captures the exit status in `$status` and the combined output in `$output`, and it stops a non-zero exit from aborting the test. Without `run`, a failing command ends the test file rather than failing one case.

A script written as functions with a `main "$@"` at the bottom is testable; one that does its work at the top level is not, because sourcing it runs it. Guard the entry point so the file can be sourced:

```bash
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
```

## Test the failure paths

These are the cases that matter, and the ones scripts are usually missing:

- No arguments, and too many arguments.
- A path that does not exist, and one that exists but is the wrong type.
- A filename containing a space, a newline, or a leading dash.
- An external command failing partway through a pipeline.
- An interrupt, verifying the `EXIT` trap cleaned up.
- An unset required environment variable.

Stub an external command by putting a fake earlier on `PATH`, which keeps the test offline and deterministic:

```bash
setup() {
  STUB_DIR="$(mktemp -d)"
  cat > "$STUB_DIR/curl" <<'STUB'
#!/usr/bin/env bash
echo '{"status":"ok"}'
STUB
  chmod +x "$STUB_DIR/curl"
  PATH="$STUB_DIR:$PATH"
}
```

To test a failure, make the stub exit non-zero. A pipeline that only ever sees success has never proven it reports failure.

```bash
@test "reports upstream failure" {
  printf '#!/usr/bin/env bash\nexit 1\n' > "$STUB_DIR/curl"
  chmod +x "$STUB_DIR/curl"
  run ./script.sh target
  [ "$status" -ne 0 ]
}
```

Assert cleanup happened rather than assuming it:

```bash
@test "removes its temporary directory" {
  run ./script.sh target
  [ "$(find /tmp -maxdepth 1 -name 'script.*' | wc -l)" -eq 0 ]
}
```

## Run the checks in a pipeline

```yaml
jobs:
  shell:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: shellcheck $(git ls-files '*.sh')
      - run: shfmt -i 2 -ci -d $(git ls-files '*.sh')
      - run: bats tests/
```

`shfmt -d` shows a diff and exits non-zero rather than rewriting files, which is what a check step should do. Use `git ls-files` so vendored and ignored scripts are not linted.

Add a pre-commit hook for fast feedback, but keep the pipeline as the real gate — a local hook is bypassed with `--no-verify`.

## Verify and report

```bash
shellcheck script.sh; echo "shellcheck exit: $?"
bats tests/; echo "bats exit: $?"
```

Prove a test can fail before trusting it: break the assertion once, confirm the failure is reported, then restore it. A suite that cannot fail proves nothing, and a `bats` file with a typo'd `@test` line is silently skipped.

Report the linter findings fixed and any deliberately suppressed with their reason, the test cases added and which failure paths they cover, the commands to run the checks, whether the pipeline runs them, and the exit codes observed. Say plainly which failure paths remain untested.
