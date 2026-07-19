import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { DatabaseSync } from "node:sqlite"

const skillRoot = fileURLToPath(new URL("..", import.meta.url))
const analyzer = join(skillRoot, "scripts", "analyze-llm-cost-project.mjs")
const fixtureRoot = mkdtempSync(join(tmpdir(), "11ai-llm-cost-project-"))

function writeJsonl(file, records) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`)
}

function run(args, cwd) {
  const result = spawnSync(process.execPath, [analyzer, ...args], { encoding: "utf8", cwd })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

try {
  const project = join(fixtureRoot, "project")
  const threadRoot = join(fixtureRoot, "thread-root")
  const codexHome = join(fixtureRoot, "codex")
  const claudeHome = join(fixtureRoot, "claude")
  const geminiHome = join(fixtureRoot, "gemini")
  const clineTasks = join(fixtureRoot, "cline-tasks")
  const rooTasks = join(fixtureRoot, "roo-tasks")
  const opencodeDb = join(fixtureRoot, "opencode.db")
  const report = join(fixtureRoot, "report.md")
  mkdirSync(project, { recursive: true })
  mkdirSync(threadRoot, { recursive: true })

  writeFileSync(join(project, "other-harness.json"), JSON.stringify({
    id: "generic-1",
    provider: "openai",
    model: "gpt-5.6-sol",
    usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 },
  }))

  writeJsonl(join(codexHome, "sessions", "2026", "07", "18", "matching.jsonl"), [
    { timestamp: "2026-07-18T09:00:00.000Z", type: "session_meta", payload: { id: "codex-matching", cwd: project } },
    { timestamp: "2026-07-18T09:10:00.000Z", type: "turn_context", payload: { model: "gpt-5.6-sol", effort: "high" } },
    { timestamp: "2026-07-18T09:20:00.000Z", type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 1000, cached_input_tokens: 600, output_tokens: 100, reasoning_output_tokens: 40, total_tokens: 1100 } } } },
  ])
  writeJsonl(join(codexHome, "sessions", "2026", "07", "18", "unrelated.jsonl"), [
    { type: "session_meta", payload: { id: "codex-unrelated", cwd: join(fixtureRoot, "other-project") } },
    { type: "turn_context", payload: { model: "gpt-5.6-sol" } },
    { type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 9999, output_tokens: 999, total_tokens: 10998 } } } },
  ])
  writeJsonl(join(claudeHome, "projects", "fixture", "matching.jsonl"), [
    { cwd: project, sessionId: "claude-matching", message: { id: "message-1", model: "claude-sonnet-4-6", output_config: { effort: "medium" }, usage: { input_tokens: 200, cache_creation_input_tokens: 20, cache_read_input_tokens: 80, output_tokens: 50 } } },
  ])

  writeJsonl(join(geminiHome, "tmp", "project-hash", "chats", "session.jsonl"), [
    { sessionId: "gemini-matching", projectHash: createHash("sha256").update(project).digest("hex"), startTime: "2026-07-18T09:00:00.000Z", directories: [project] },
    { id: "gemini-message", timestamp: "2026-07-18T09:01:00.000Z", type: "gemini", model: "gemini-2.5-pro", tokens: { input: 300, output: 40, cached: 100, thoughts: 10, total: 350 } },
  ])
  mkdirSync(join(clineTasks, "task-1"), { recursive: true })
  writeFileSync(join(clineTasks, "task-1", "task_metadata.json"), JSON.stringify({ cwdOnTaskInitialization: project }))
  writeFileSync(join(clineTasks, "task-1", "ui_messages.json"), JSON.stringify([
    { ts: 1752829200000, type: "say", say: "api_req_started", text: JSON.stringify({ modelId: "claude-sonnet-4-6", provider: "anthropic", tokensIn: 20, tokensOut: 5, cacheWrites: 2, cacheReads: 3, cost: 0.01 }) },
  ]))
  mkdirSync(join(rooTasks, "task-2"), { recursive: true })
  writeFileSync(join(rooTasks, "task-2", "task_metadata.json"), JSON.stringify({ cwd: project }))
  writeFileSync(join(rooTasks, "task-2", "ui_messages.json"), JSON.stringify([
    { ts: 1752829260000, type: "say", say: "api_req_started", text: JSON.stringify({ modelId: "gpt-5.6-sol", provider: "openai", tokensIn: 30, tokensOut: 6, cacheWrites: 0, cacheReads: 4, cost: 0.02 }) },
  ]))
  const database = new DatabaseSync(opencodeDb)
  database.exec("CREATE TABLE session (id TEXT, directory TEXT, cost REAL, tokens_input INTEGER, tokens_output INTEGER, tokens_reasoning INTEGER, tokens_cache_read INTEGER, tokens_cache_write INTEGER, model TEXT, time_created INTEGER, time_updated INTEGER)")
  database.prepare("INSERT INTO session VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("opencode-1", project, 0.03, 40, 8, 2, 5, 1, JSON.stringify({ id: "gpt-5.6-sol", providerID: "openai" }), 1752829300000, 1752829360000)
  database.close()

  const harnessArgs = ["--codex-home", codexHome, "--claude-home", claudeHome, "--gemini-home", geminiHome, "--cline-tasks", clineTasks, "--roo-tasks", rooTasks, "--opencode-db", opencodeDb]
  const summary = run([project, ...harnessArgs, "--output", report])
  assert.equal(summary.output, report)
  assert.equal(summary.markdownReport, report)
  assert.equal(summary.htmlReport, join(fixtureRoot, "report.html"))
  assert.equal(summary.nativeFilesMetadataChecked, 7)
  assert.equal(summary.nativeSessionsMatched, 6)
  assert.equal(summary.codexSessions, 1)
  assert.equal(summary.claudeSessions, 1)
  assert.equal(summary.geminiSessions, 1)
  assert.equal(summary.clineSessions, 1)
  assert.equal(summary.rooSessions, 1)
  assert.equal(summary.opencodeSessions, 1)
  assert.equal(summary.recognizedFiles, 7)
  assert.equal(summary.threads, 7)
  assert.equal(summary.knownCosts, 6)
  assert.equal(summary.wallTimeMs, 1320000)
  assert.equal(summary.activeTimeMs, 720000)

  const markdown = readFileSync(report, "utf8")
  const html = readFileSync(summary.htmlReport, "utf8")
  assert.match(markdown, /^# Project LLM Cost Report$/m)
  assert.match(markdown, /^## Totals$/m)
  assert.match(markdown, /^## Cost by harness$/m)
  assert.match(markdown, /^## Cost by model by effort$/m)
  const levelTwoHeadings = markdown.match(/^## .+$/gm) ?? []
  assert.equal(levelTwoHeadings[levelTwoHeadings.indexOf("## Cost by model") + 1], "## Cost by model by effort")
  assert.match(markdown, /\| openai \/ gpt-5\.6-sol \| high \| 1 \| 1,000 \| 600 \| 100 \| 1,100 \|/)
  assert.match(markdown, /\| anthropic \/ claude-sonnet-4-6 \| medium \|/)
  assert.match(markdown, /\| Sum of thread wall time \| 22m \|/)
  assert.match(markdown, /\| Estimated active time \| 12m \|/)
  assert.match(markdown, /\| Harness \| Threads \| Input \| Cached \| Output \| Tokens \| Known cost \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Cost \/ thread \| Reported-cost sum \| Average tokens \/ thread \| Priced \| Unpriced \|/)
  assert.match(markdown, /\| Provider \| Threads \| Input \| Cached \| Output \| Tokens \| Known cost \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Cost \/ thread \| Priced \| Unpriced \|/)
  assert.match(markdown, /\| Provider \/ model \| Threads \| Input \| Cached \| Output \| Tokens \| Cost \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Cost \/ thread \|/)
  assert.match(markdown, /\| Folder \| Threads \| Input \| Cached \| Output \| Tokens \| Known cost \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Cost \/ thread \| Priced \| Unpriced \|/)
  assert.match(markdown, /\| Thread \| Source \| Provider \/ model \/ effort \| Input \| Cached \| Output \| Tokens \| Selected cost \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Harness reported \| Method \|/)
  assert.match(markdown, /\| Total \| 7 \| 1,805 \| 792 \| 241 \| 2,046 \|/)
  assert.match(markdown, /\| Cost \/ thread \| \$0\./)
  assert.match(markdown, /codex-session\/sessions\/2026\/07\/18\/matching\.jsonl/)
  assert.match(markdown, /claude-session\/projects\/fixture\/matching\.jsonl/)
  assert.match(markdown, /other-harness\.json/)
  assert.match(markdown, /gemini-session\/tmp\/project-hash\/chats\/session\.jsonl/)
  assert.match(markdown, /cline-session\/cline-tasks\/task-1\/ui_messages\.json/)
  assert.match(markdown, /roo-session\/roo-tasks\/task-2\/ui_messages\.json/)
  assert.match(markdown, /opencode-session\/opencode\.db\/opencode-1/)
  assert.ok(markdown.endsWith("_LLM token cost analysis by [11ai-llm-cost-project](https://ai.rj11.io/skills/11ai-llm-cost-project)._\n"))
  assert.ok(markdown.lastIndexOf("> Generated ") > markdown.indexOf("## Methodology"))
  assert.ok(markdown.lastIndexOf("> Generated ") < markdown.lastIndexOf("_LLM token cost analysis"))
  assert.doesNotMatch(markdown, /unrelated\.jsonl/)
  assert.doesNotMatch(markdown, new RegExp(fixtureRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  const htmlSections = html.match(/<details class="report-section level-[23]">/g) ?? []
  assert.equal(htmlSections.length, (markdown.match(/^#{2,3} /gm) ?? []).length)
  assert.equal((html.match(/<\/details>/g) ?? []).length, htmlSections.length)
  assert.match(html, /<summary><span class="section-title">Totals<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Pricing catalog match detail<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Cost by model by effort<\/span><\/summary>/)
  assert.doesNotMatch(html, /<details\b[^>]*\bopen\b[^>]*>/)
  assert.match(html, /<a href="https:\/\/ai\.rj11\.io\/skills\/11ai-llm-cost-project" target="_blank" rel="noopener noreferrer">11ai-llm-cost-project<\/a>/)
  assert.match(html, /<p class="signature"><em>LLM token cost analysis by /)
  assert.equal((html.match(/<th\b/g) ?? []).length, (html.match(/class="sort-button"/g) ?? []).length)
  assert.ok((html.match(/<th scope="col" aria-sort="none">/g) ?? []).length > 0)
  assert.doesNotMatch(html, /<th[^>]+aria-sort="(?:ascending|descending)"/)
  assert.match(html, /const direction = header\.getAttribute\("aria-sort"\) === "descending" \? "ascending" : "descending"/)
  assert.match(html, /body\.replaceChildren\(\.\.\.sortable, \.\.\.totals\)/)
  assert.ok(html.indexOf("<h1>") < html.indexOf('<details class="report-section'))
  assert.match(html, /main \{ width: 100%; margin: 0; padding: 16px 20px 24px; background: transparent; \}/)
  assert.doesNotMatch(html, /main \{[^}]*box-shadow/)
  assert.ok(html.lastIndexOf("</details>") < html.indexOf('<blockquote class="generation-message">'))
  assert.ok(html.indexOf('<blockquote class="generation-message">') < html.indexOf('<p class="signature">'))
  assert.doesNotMatch(html, /unrelated\.jsonl/)
  assert.doesNotMatch(html, new RegExp(fixtureRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))

  const localOnly = run([project, ...harnessArgs, "--project-only", "--output", join(fixtureRoot, "project-only.md")])
  assert.equal(localOnly.nativeFilesMetadataChecked, 0)
  assert.equal(localOnly.nativeSessionsMatched, 0)
  assert.equal(localOnly.threads, 1)

  const defaultSummary = run([project, ...harnessArgs, "--project-only"], threadRoot)
  const resolvedThreadRoot = realpathSync(threadRoot)
  const reportsRoot = join(resolvedThreadRoot, "11ai-llm-cost-project-reports")
  const defaultReportDir = dirname(defaultSummary.markdownReport)
  assert.equal(defaultSummary.root, project)
  assert.equal(defaultSummary.threadRoot, resolvedThreadRoot)
  assert.equal(defaultSummary.outputDirectory, defaultReportDir)
  assert.equal(dirname(defaultReportDir), reportsRoot)
  assert.match(basename(defaultReportDir), /^11ai-llm-cost-project-reports-\d{4}-\d{2}-\d{2}T/)
  assert.equal(dirname(defaultSummary.markdownReport), defaultReportDir)
  assert.equal(dirname(defaultSummary.htmlReport), defaultReportDir)
  assert.match(basename(defaultSummary.markdownReport), /^11ai-llm-cost-project-\d{4}-\d{2}-\d{2}T.*\.md$/)
  assert.equal(basename(defaultSummary.htmlReport), `${basename(defaultSummary.markdownReport, ".md")}.html`)
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true })
}
