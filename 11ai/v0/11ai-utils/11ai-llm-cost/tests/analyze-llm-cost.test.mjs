import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const skillRoot = fileURLToPath(new URL("..", import.meta.url))
const analyzer = join(skillRoot, "scripts", "analyze-llm-cost.mjs")
const fixtureRoot = mkdtempSync(join(tmpdir(), "11ai-llm-cost-"))

function writeJsonl(file, records) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`)
}

function run(args) {
  const result = spawnSync(process.execPath, [analyzer, ...args], { encoding: "utf8" })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

try {
  const project = join(fixtureRoot, "project")
  const codexHome = join(fixtureRoot, "codex")
  const claudeHome = join(fixtureRoot, "claude")
  const report = join(fixtureRoot, "report.md")
  mkdirSync(project, { recursive: true })

  writeFileSync(join(project, "other-harness.json"), JSON.stringify({
    id: "generic-1",
    provider: "openai",
    model: "gpt-5.6-sol",
    usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 },
  }))

  writeJsonl(join(codexHome, "sessions", "2026", "07", "18", "matching.jsonl"), [
    { type: "session_meta", payload: { id: "codex-matching", cwd: project } },
    { type: "turn_context", payload: { model: "gpt-5.6-sol", effort: "high" } },
    { type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 1000, cached_input_tokens: 600, output_tokens: 100, reasoning_output_tokens: 40, total_tokens: 1100 } } } },
  ])
  writeJsonl(join(codexHome, "sessions", "2026", "07", "18", "unrelated.jsonl"), [
    { type: "session_meta", payload: { id: "codex-unrelated", cwd: join(fixtureRoot, "other-project") } },
    { type: "turn_context", payload: { model: "gpt-5.6-sol" } },
    { type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 9999, output_tokens: 999, total_tokens: 10998 } } } },
  ])
  writeJsonl(join(claudeHome, "projects", "fixture", "matching.jsonl"), [
    { cwd: project, sessionId: "claude-matching", message: { id: "message-1", model: "claude-sonnet-4-6", usage: { input_tokens: 200, cache_creation_input_tokens: 20, cache_read_input_tokens: 80, output_tokens: 50 } } },
  ])

  const summary = run([project, "--codex-home", codexHome, "--claude-home", claudeHome, "--output", report])
  assert.equal(summary.nativeFilesMetadataChecked, 3)
  assert.equal(summary.nativeSessionsMatched, 2)
  assert.equal(summary.codexSessions, 1)
  assert.equal(summary.claudeSessions, 1)
  assert.equal(summary.recognizedFiles, 3)
  assert.equal(summary.threads, 3)
  assert.equal(summary.knownCosts, 3)

  const markdown = readFileSync(report, "utf8")
  assert.match(markdown, /codex-session\/sessions\/2026\/07\/18\/matching\.jsonl/)
  assert.match(markdown, /claude-session\/projects\/fixture\/matching\.jsonl/)
  assert.match(markdown, /other-harness\.json/)
  assert.doesNotMatch(markdown, /unrelated\.jsonl/)
  assert.doesNotMatch(markdown, new RegExp(fixtureRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))

  const localOnly = run([project, "--codex-home", codexHome, "--claude-home", claudeHome, "--project-only", "--output", join(fixtureRoot, "project-only.md")])
  assert.equal(localOnly.nativeFilesMetadataChecked, 0)
  assert.equal(localOnly.nativeSessionsMatched, 0)
  assert.equal(localOnly.threads, 1)
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true })
}
