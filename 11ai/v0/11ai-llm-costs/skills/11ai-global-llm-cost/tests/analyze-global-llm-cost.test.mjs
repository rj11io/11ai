import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { DatabaseSync } from "node:sqlite"

const skillRoot = fileURLToPath(new URL("..", import.meta.url))
const analyzer = join(skillRoot, "scripts", "analyze-global-llm-cost.mjs")
const fixtureRoot = mkdtempSync(join(tmpdir(), "11ai-global-llm-cost-"))

function writeJsonl(file, records) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`)
}

function run(args, env = {}) {
  const result = spawnSync(process.execPath, [analyzer, ...args], { encoding: "utf8", env: { ...process.env, ...env } })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

try {
  const codexHome = join(fixtureRoot, "codex")
  const claudeHome = join(fixtureRoot, "claude")
  const geminiHome = join(fixtureRoot, "gemini")
  const clineTasks = join(fixtureRoot, "cline-tasks")
  const rooTasks = join(fixtureRoot, "roo-tasks")
  const opencodeDb = join(fixtureRoot, "opencode.db")
  const supplemental = join(fixtureRoot, "exports")
  const reportDir = join(fixtureRoot, "report")
  const secondReportDir = join(fixtureRoot, "report-2")
  const recent = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const older = "2020-01-15T12:00:00.000Z"

  writeJsonl(join(codexHome, "sessions", "recent.jsonl"), [
    { timestamp: recent, type: "session_meta", payload: { id: "codex-recent", cwd: join(fixtureRoot, "workspace-a") } },
    { timestamp: recent, type: "turn_context", payload: { model: "gpt-5.6-sol", effort: "high" } },
    { timestamp: recent, type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 1000, cached_input_tokens: 600, output_tokens: 100, reasoning_output_tokens: 40, total_tokens: 1100 } } } },
  ])
  writeJsonl(join(codexHome, "archived_sessions", "old-unrelated-workspace.jsonl"), [
    { timestamp: older, type: "session_meta", payload: { id: "codex-old", cwd: join(fixtureRoot, "completely-unrelated-workspace") } },
    { timestamp: older, type: "turn_context", payload: { model: "gpt-5.6-sol" } },
    { timestamp: older, type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 500, cached_input_tokens: 0, output_tokens: 50, total_tokens: 550 } } } },
  ])
  writeJsonl(join(claudeHome, "projects", "fixture", "old.jsonl"), [
    { timestamp: older, cwd: join(fixtureRoot, "workspace-b"), sessionId: "claude-old", message: { id: "message-1", model: "claude-sonnet-4-6", usage: { input_tokens: 200, cache_creation_input_tokens: 20, cache_read_input_tokens: 80, output_tokens: 50 } } },
  ])
  writeJsonl(join(geminiHome, "tmp", "hash", "chats", "recent.jsonl"), [
    { sessionId: "gemini-recent", projectHash: "hash", startTime: recent, directories: [join(fixtureRoot, "workspace-c")] },
    { id: "gemini-message", timestamp: recent, type: "gemini", model: "gemini-2.5-pro", tokens: { input: 300, output: 40, cached: 100, thoughts: 10, total: 350 } },
  ])
  mkdirSync(join(clineTasks, "task-1"), { recursive: true })
  writeFileSync(join(clineTasks, "task-1", "task_metadata.json"), JSON.stringify({ cwdOnTaskInitialization: join(fixtureRoot, "workspace-d") }))
  writeFileSync(join(clineTasks, "task-1", "ui_messages.json"), JSON.stringify([
    { ts: Date.parse(recent), type: "say", say: "api_req_started", text: JSON.stringify({ modelId: "claude-sonnet-4-6", provider: "anthropic", tokensIn: 20, tokensOut: 5, cacheWrites: 2, cacheReads: 3, cost: 0.01 }) },
  ]))
  mkdirSync(join(rooTasks, "task-2"), { recursive: true })
  writeFileSync(join(rooTasks, "task-2", "task_metadata.json"), JSON.stringify({ cwd: join(fixtureRoot, "workspace-e") }))
  writeFileSync(join(rooTasks, "task-2", "ui_messages.json"), JSON.stringify([
    { ts: Date.parse(recent), type: "say", say: "api_req_started", text: JSON.stringify({ modelId: "gpt-5.6-sol", provider: "openai", tokensIn: 30, tokensOut: 6, cacheWrites: 0, cacheReads: 4, cost: 0.02 }) },
  ]))
  const database = new DatabaseSync(opencodeDb)
  database.exec("CREATE TABLE session (id TEXT, directory TEXT, cost REAL, tokens_input INTEGER, tokens_output INTEGER, tokens_reasoning INTEGER, tokens_cache_read INTEGER, tokens_cache_write INTEGER, model TEXT, time_created INTEGER, time_updated INTEGER)")
  database.prepare("INSERT INTO session VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("opencode-1", join(fixtureRoot, "workspace-f"), 0.03, 40, 8, 2, 5, 1, JSON.stringify({ id: "gpt-5.6-sol", providerID: "openai" }), Date.parse(recent), Date.parse(recent))
  database.close()
  mkdirSync(supplemental, { recursive: true })
  writeFileSync(join(supplemental, "undated.json"), JSON.stringify({
    id: "generic-undated",
    provider: "openai",
    model: "gpt-5.6-sol",
    usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 },
  }))

  const harnessArgs = ["--codex-home", codexHome, "--claude-home", claudeHome, "--gemini-home", geminiHome, "--cline-tasks", clineTasks, "--roo-tasks", rooTasks, "--opencode-db", opencodeDb]
  const summary = run([...harnessArgs, "--include", supplemental, "--output", reportDir])
  assert.equal(summary.outputDirectory, reportDir)
  assert.equal(dirname(summary.markdownReport), reportDir)
  assert.equal(dirname(summary.htmlReport), reportDir)
  assert.equal(summary.nativeFilesMetadataChecked, 7)
  assert.equal(summary.scope, "Codex: explicit override; Claude: explicit override; Gemini: explicit override; Cline: explicit override; Roo: explicit override; OpenCode: explicit override")
  assert.equal(summary.codexSessions, 2)
  assert.equal(summary.claudeSessions, 1)
  assert.equal(summary.geminiSessions, 1)
  assert.equal(summary.clineSessions, 1)
  assert.equal(summary.rooSessions, 1)
  assert.equal(summary.opencodeSessions, 1)
  assert.equal(summary.supplementalFilesInspected, 1)
  assert.equal(summary.recognizedFiles, 8)
  assert.equal(summary.threads, 8)
  assert.equal(summary.knownCosts, 7)
  assert.equal(summary.periods["All time"].threads, 8)
  assert.equal(summary.periods["Past 7 days"].threads, 5)

  const markdown = readFileSync(summary.markdownReport, "utf8")
  const html = readFileSync(summary.htmlReport, "utf8")
  assert.match(markdown, /^## All time$/m)
  assert.equal((markdown.match(/^### Totals$/gm) ?? []).length, 4)
  assert.equal((markdown.match(/^### Cost by harness$/gm) ?? []).length, 4)
  assert.match(markdown, /\| Harness \| Threads \| Known tokens \| Known cost \| Reported-cost sum \|/)
  assert.match(markdown, /\| Total \| 8 \|/)
  assert.match(markdown, /Scope: Codex: explicit override; Claude: explicit override; Gemini: explicit override/)
  assert.match(markdown, /^## Year to date$/m)
  assert.match(markdown, /^## Month to date$/m)
  assert.match(markdown, /^## Past 7 days$/m)
  assert.match(markdown, /codex-session\/[^/]+\/sessions\/recent\.jsonl/)
  assert.match(markdown, /codex-session\/[^/]+\/archived_sessions\/old-unrelated-workspace\.jsonl/)
  assert.match(markdown, /claude-session\/[^/]+\/projects\/fixture\/old\.jsonl/)
  assert.match(markdown, /included\/exports\/undated\.json/)
  assert.match(markdown, /gemini-session\/[^/]+\/tmp\/hash\/chats\/recent\.jsonl/)
  assert.match(markdown, /cline-session\/[^/]+\/cline-tasks\/task-1\/ui_messages\.json/)
  assert.match(markdown, /roo-session\/[^/]+\/roo-tasks\/task-2\/ui_messages\.json/)
  assert.match(markdown, /opencode-session\/[^/]+\/opencode\.db\/opencode-1/)
  assert.ok(markdown.endsWith("_LLM token cost analysis by [11ai-global-llm-cost](https://ai.rj11.io/skills/11ai-global-llm-cost)._\n"))
  assert.doesNotMatch(markdown, new RegExp(fixtureRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  const htmlSections = html.match(/<details class="report-section level-[23]">/g) ?? []
  assert.equal(htmlSections.length, (markdown.match(/^#{2,3} /gm) ?? []).length)
  assert.equal((html.match(/<\/details>/g) ?? []).length, htmlSections.length)
  assert.match(html, /<summary><span class="section-title">All time<\/span><\/summary>/)
  assert.equal((html.match(/<summary><span class="section-title">Totals<\/span><\/summary>/g) ?? []).length, 4)
  assert.equal((html.match(/<summary><span class="section-title">Cost by harness<\/span><\/summary>/g) ?? []).length, 4)
  assert.match(html, /<summary><span class="section-title">Year to date<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Month to date<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Past 7 days<\/span><\/summary>/)
  assert.doesNotMatch(html, /<details\b[^>]*\bopen\b[^>]*>/)
  assert.match(html, /<table>/)
  assert.match(html, /codex-session\/[^/]+\/sessions\/recent\.jsonl/)
  assert.ok(html.indexOf('class="section-title">All time</span>') < html.indexOf('class="section-title">Year to date</span>'))
  assert.ok(html.indexOf('class="section-title">Year to date</span>') < html.indexOf('class="section-title">Month to date</span>'))
  assert.ok(html.indexOf('class="section-title">Month to date</span>') < html.indexOf('class="section-title">Past 7 days</span>'))
  assert.match(html, /<a href="https:\/\/ai\.rj11\.io\/skills\/11ai-global-llm-cost">11ai-global-llm-cost<\/a>/)
  assert.match(html, /<p class="signature"><em>LLM token cost analysis by /)
  assert.ok(html.indexOf("<h1>") < html.indexOf('<details class="report-section'))
  assert.ok(html.lastIndexOf("</details>") < html.indexOf('<p class="signature">'))
  assert.doesNotMatch(html, new RegExp(fixtureRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))

  const secondSummary = run([...harnessArgs, "--include", supplemental, "--output", secondReportDir])
  assert.deepEqual(secondSummary.periods, summary.periods)
  const normalizeRunTime = (value) => value
    .replace(/^> Generated .*$/m, "> Generated <run-time>")
    .replace(/^Threads attributed from .* through .*\.$/gm, "Threads attributed from <period-start> through <run-time>.")
  assert.equal(normalizeRunTime(readFileSync(secondSummary.markdownReport, "utf8")), normalizeRunTime(markdown))
  const normalizeHtmlRunTime = (value) => value
    .replace(/<blockquote>Generated .*?<\/blockquote>/, "<blockquote>Generated &lt;run-time&gt;</blockquote>")
    .replace(/<p>Threads attributed from .*? through .*?\.<\/p>/g, "<p>Threads attributed from &lt;period-start&gt; through &lt;run-time&gt;.</p>")
  assert.equal(normalizeHtmlRunTime(readFileSync(secondSummary.htmlReport, "utf8")), normalizeHtmlRunTime(html))

  const fakeHome = join(fixtureRoot, "home")
  const fakeDesktop = join(fakeHome, "Desktop")
  mkdirSync(fakeDesktop, { recursive: true })
  const defaultSummary = run(harnessArgs, { HOME: fakeHome })
  const reportsRoot = join(fakeDesktop, "11ai-global-llm-cost-reports")
  assert.equal(dirname(defaultSummary.outputDirectory), reportsRoot)
  assert.match(basename(defaultSummary.outputDirectory), /^11ai-global-llm-cost-reports-\d{4}-\d{2}-\d{2}T/)
  assert.equal(dirname(defaultSummary.markdownReport), defaultSummary.outputDirectory)
  assert.equal(dirname(defaultSummary.htmlReport), defaultSummary.outputDirectory)
  assert.match(basename(defaultSummary.markdownReport), /^11ai-global-llm-cost-\d{4}-\d{2}-\d{2}T.*\.md$/)
  assert.equal(basename(defaultSummary.htmlReport), `${basename(defaultSummary.markdownReport, ".md")}.html`)
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true })
}
