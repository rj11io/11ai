# Native harness stores

The analyzer reads these stores without modifying them. Layouts are implementation details and may change; use the corresponding CLI override when a harness is configured elsewhere.

## Codex

- Default data root: `~/.codex`; `CODEX_HOME` replaces that root.
- Active rollouts: `$CODEX_HOME/sessions/YYYY/MM/DD/rollout-*.jsonl`; archived rollouts: `$CODEX_HOME/archived_sessions/*.jsonl`.
- Project matching: `session_meta.payload.cwd` must equal the requested root or be one of its descendants.
- Counters: use the last cumulative `event_msg` whose payload type is `token_count`, specifically `info.total_token_usage`. Input includes cached input; reasoning is a subset of output and is not added twice.
- Model and effort: use the latest `turn_context` record. Sessions run with ephemeral persistence or without a cumulative token event cannot be reconstructed from the native store.
- Effort vocabulary: report canonical stored `turn_context.payload.effort` values: `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, and `ultra`. Codex configuration calls the setting `model_reasoning_effort`; UI labels such as `Light` and `Extra High` normalize to the underlying `low` and `xhigh` values.
- Sub-agents: a Codex sub-agent session records `thread_source: "subagent"` and `parent_thread_id` in `session_meta.payload`; newer records may repeat the relationship under `source.subagent.thread_spawn`. Starting from the selected root, follow these parent identities recursively. Retain linked metadata-only sessions with unavailable usage, and do not treat `forked_from_id` or a shared working directory alone as proof of a sub-agent relationship.
- Sources: the official Codex repository's [rollout discovery tests](https://github.com/openai/codex/blob/main/codex-rs/core/tests/suite/rollout_list_find.rs), [token-usage protocol](https://github.com/openai/codex/blob/main/codex-rs/protocol/src/protocol.rs), and [CLI reference](https://developers.openai.com/codex/cli/reference).

## Claude Code

- Default data root: `~/.claude`; `CLAUDE_CONFIG_DIR` replaces that root.
- Project transcripts: `$CLAUDE_CONFIG_DIR/projects/<encoded-project-path>/<session-id>.jsonl`, with subagent transcripts potentially nested below the parent session.
- Project matching: use the transcript's recorded `cwd`; the directory's encoded name is not treated as authoritative.
- Counters: assistant `message.usage` supplies uncached `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`. Where present, split cache creation into its 5-minute and 1-hour buckets.
- Effort: prefer an explicit `effort`, `effort_level`, `effortLevel`, or `output_config.effort` value from request, message, payload, metadata, or settings objects. Normalize Claude Code `ultracode` to API effort `xhigh` and group by model plus recorded effort. Native assistant-response transcripts generally omit the active request effort; leave that history as `n/a` because current settings and model defaults cannot reconstruct an earlier session.
- Deduplication: retain one usage record per assistant message ID because a transcript can contain repeated or streaming representations. Claude Code's internal transcript line schema is not a documented stable API, so ignore unknown record types and keep parsing tolerant.
- Sources: official Claude Code [hook transcript fields](https://code.claude.com/docs/en/hooks), [status-line usage and cost fields](https://code.claude.com/docs/en/statusline), [session resume CLI](https://docs.anthropic.com/en/docs/claude-code/cli-usage), [effort semantics and supported models](https://platform.claude.com/docs/en/build-with-claude/effort), and [prompt-caching accounting](https://platform.claude.com/docs/en/build-with-claude/prompt-caching).

## Gemini CLI

- Default data root: `~/.gemini`; with `GEMINI_CLI_HOME`, the root is `$GEMINI_CLI_HOME/.gemini`.
- Sessions: `.gemini/tmp/<project-hash>/chats/*.jsonl` (older JSON sessions are accepted).
- Project matching: SHA-256 of the absolute root, or a recorded directory at/under the root.
- Counters: `input`, `output`, `cached`, `thoughts`, `tool`, and `total`. Cached input is a subset of input; tool-use prompt tokens are input; thoughts are reasoning output and are not counted twice.
- Sources: [session management](https://geminicli.com/docs/cli/session-management/), [recording schema](https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/services/chatRecordingTypes.ts), and [telemetry token categories](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/telemetry.md).

## Cline

- Current task root: `~/.cline/data/tasks/<task-id>/`.
- Legacy VS Code root: the platform's `Code/User/globalStorage/saoudrizwan.claude-dev/tasks/` directory.
- Usage file: `ui_messages.json`; workspace attribution comes from sibling `task_metadata.json` or `history_item.json`.
- Count only `say` records named `api_req_started`, `deleted_api_reqs`, or `subagent_usage`. Their JSON `text` contains `tokensIn`, `tokensOut`, `cacheWrites`, `cacheReads`, and `cost`.
- Sources: [task storage documentation](https://docs.cline.bot/enterprise-solutions/monitoring/prompt-storage), [metric consolidation](https://github.com/cline/cline/blob/main/apps/vscode/src/shared/getApiMetrics.ts), and [disk filenames](https://github.com/cline/cline/blob/main/apps/vscode/src/core/storage/disk.ts).

## Roo Code

- VS Code task root: the platform's `Code/User/globalStorage/rooveterinaryinc.roo-cline/tasks/` directory; VS Code Server uses `.vscode-server/data/User/globalStorage/...`.
- Usage and task metadata use the same accounting shape as Cline.
- Sources: Roo Code's official [extension manifest](https://github.com/RooCodeInc/Roo-Code/blob/main/src/package.json) and [task persistence implementation](https://github.com/RooCodeInc/Roo-Code/tree/main/src/core/task-persistence).

## OpenCode

- Current database: `opencode*.db` under the XDG data directory's `opencode/` folder (normally `~/.local/share/opencode/`); a macOS Application Support fallback is also checked.
- The `session` ledger supplies directory, timestamps, cost, model/provider JSON, and disjoint input, output, reasoning, cache-read, and cache-write counters.
- Databases are opened read-only. Native database support requires a Node.js runtime providing `node:sqlite`; exported JSON can still be inspected as generic usage.
- Sources: [CLI export/stats commands](https://opencode.ai/docs/cli/), the official [database location code](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/database/database.ts), and [session ledger schema](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/session/sql.ts).

## Provider pricing

Native counters do not guarantee an invoice-equivalent price. Harness-reported cost is retained, while locally derived cost uses the selected pricing catalog. Gemini CLI use may be free, subscription-backed, or API-billed, so unmatched Google models remain visibly unpriced until an exact official rate is supplied; consult [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).
