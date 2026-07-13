# Harness Reference

Per-CLI details for calling another agent headlessly. Verify a harness exists before using it:

```bash
which claude codex gemini
```

Model ids below are examples current at the time of writing and drift over time. Some harnesses give a headless caller no way to list models (`codex models` requires a terminal, for example), so the reliable recovery when an id is rejected is a cheap probe: try candidate ids on a trivial prompt until one answers.

```bash
codex exec -m gpt-5.5 --sandbox read-only "Reply with exactly: OK" < /dev/null
```

Do not assume omitting the model flag is a safe fallback — Codex's default comes from the user's `~/.codex/config.toml` and can point at a model the installed CLI or account cannot use.

## Claude Code (`claude`) — runs Claude models

Headless mode is `claude -p` (print mode): it runs the full agent loop, prints the result, and exits.

```bash
claude -p "Refactor src/nav.tsx to use the new theme tokens. Print a summary." \
  --model claude-fable-5 \
  --permission-mode acceptEdits \
  --output-format json
```

Key flags:

- `-p, --print` — non-interactive; required when called from another agent.
- `--model` — e.g. `claude-fable-5`, `claude-opus-4-8`, `claude-sonnet-5`, `claude-haiku-4-5-20251001`. Use a small model (Haiku) for cheap one-shot text.
- `--output-format text|json|stream-json` — `json` prints one object at the end; read `.result` for the answer, `.session_id` to resume, `.is_error` to detect failure:
  ```bash
  out=$(claude -p "..." --output-format json)
  echo "$out" | jq -r '.result'
  session=$(echo "$out" | jq -r '.session_id')
  ```
- `--permission-mode` — `default` (blocks on unapproved tools; safest), `acceptEdits` (auto-approves file edits), `plan` (read-only planning). `--dangerously-skip-permissions` approves everything — only with explicit user authorization, ideally sandboxed.
- `--allowedTools` / `--disallowedTools` — scope tools, e.g. `--allowedTools "Read,Grep,Glob"` for a read-only reviewer.
- `--max-turns N` — hard cap on agent loop iterations; good runaway protection.
- `--append-system-prompt "..."` — add standing instructions without polluting the task prompt.
- `--add-dir <path>` — grant access outside the working directory.
- `--resume <session_id>` — continue a previous session with a new `-p` prompt; `--continue` resumes the most recent one.

Prompt can also come from stdin: `cat brief.md | claude -p --output-format json`.

## Codex CLI (`codex`) — runs OpenAI models

Headless mode is `codex exec`: runs the task without the interactive UI.

```bash
codex exec -m gpt-5.6 --sandbox workspace-write -C /path/to/repo \
  --output-last-message /tmp/codex-out.txt \
  "Fix the failing test in tests/api.test.ts and print what you changed." < /dev/null \
  && result=$(cat /tmp/codex-out.txt) \
  || echo "codex failed — see stdout above"
```

Two traps in that pattern, both learned the hard way:

- Redirect stdin (`< /dev/null`). `codex exec` appends piped stdin to the prompt, so a child spawned with an open stdin pipe can block or pick up stray input.
- Check the exit code before reading the output file. On failure Codex exits non-zero, prints the error to stdout, and leaves the `--output-last-message` file empty — `cat` alone silently gives you an empty answer.

Key flags:

- `exec` — non-interactive; required when called from another agent.
- `-m, --model` — e.g. `gpt-5.6`, `gpt-5.6-luna`.
- `--sandbox read-only|workspace-write|danger-full-access` — the permission level. Default to `read-only`; `workspace-write` when it must edit; never `danger-full-access` without explicit user authorization.
- `-C, --cd <dir>` — working directory for the child.
- `--output-last-message <file>` — writes only the agent's final message to a file; the cleanest way to capture the answer.
- `--json` — stream JSONL events to stdout instead (one JSON object per line; the last `agent_message` item carries the final text).
- `--skip-git-repo-check` — needed when the target directory is not a git repo.
- `codex exec resume <session_id> "follow-up"` (or `resume --last`) — continue a previous session.

## Gemini CLI (`gemini`) — runs Google models

```bash
gemini -p "Summarize the API surface of src/lib/*.ts in five bullets." \
  -m gemini-2.5-pro --output-format json
```

- `-p, --prompt` — non-interactive.
- `-m, --model` — e.g. `gemini-2.5-pro`.
- `--output-format json` — structured result; `.response` holds the answer.
- `--yolo` — auto-approves all actions; same caution as skip-permissions above.
- Also accepts stdin: `cat brief.md | gemini -p "Follow the brief above."`

## Timeouts and background runs

Wrap every call with a timeout so a stuck child cannot hang you. `timeout` exists on Linux but not on stock macOS; use the portable perl form when unsure:

```bash
# Linux (GNU coreutils)
timeout 600 claude -p "..." --output-format json || echo "child timed out"

# Portable (works on macOS without coreutils)
perl -e 'alarm shift; exec @ARGV' 600 claude -p "..." --output-format json || echo "child timed out"
```

For long jobs, run in the background and poll, one log file per child:

```bash
codex exec --sandbox workspace-write "long task..." > /tmp/worker-1.log 2>&1 &
```

## Fan-out example

Three workers in parallel, then collect:

```bash
claude -p "Review src/auth for security issues. Print findings only." \
  --allowedTools "Read,Grep,Glob" --output-format json > /tmp/r-claude.json &
codex exec -m gpt-5.6 --sandbox read-only \
  --output-last-message /tmp/r-codex.txt "Review src/auth for security issues." < /dev/null &
gemini -p "Review src/auth for security issues." --output-format json > /tmp/r-gemini.json &
wait
```

Merge the three outputs yourself; where the models disagree, verify against the code before reporting.
