import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { DatabaseSync } from "node:sqlite"

const skillRoot = fileURLToPath(new URL("..", import.meta.url))
const analyzer = join(skillRoot, "scripts", "analyze-llm-cost-global.mjs")
const fixtureRoot = mkdtempSync(join(tmpdir(), "11ai-llm-cost-global-"))

function writeJsonl(file, records) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`)
}

function run(args, env = {}, cwd = undefined) {
  const result = spawnSync(process.execPath, [analyzer, ...args], { encoding: "utf8", env: { ...process.env, ...env }, cwd })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

try {
  const codexHome = join(fixtureRoot, "codex")
  const claudeHome = join(fixtureRoot, "claude")
  const claudeDesktopHome = join(fixtureRoot, "claude-desktop")
  const coworkHome = join(fixtureRoot, "cowork")
  const geminiHome = join(fixtureRoot, "gemini")
  const clineTasks = join(fixtureRoot, "cline-tasks")
  const rooTasks = join(fixtureRoot, "roo-tasks")
  const opencodeDb = join(fixtureRoot, "opencode.db")
  const supplemental = join(fixtureRoot, "exports")
  const reportDir = join(fixtureRoot, "report")
  const secondReportDir = join(fixtureRoot, "report-2")
  const recent = new Date().toISOString()
  const older = "2020-01-15T12:00:00.000Z"

  writeJsonl(join(codexHome, "sessions", "recent.jsonl"), [
    { timestamp: recent, type: "session_meta", payload: { id: "codex-recent", cwd: join(fixtureRoot, "workspace-a"), originator: "codex_work_desktop", source: "vscode" } },
    { timestamp: recent, type: "turn_context", payload: { model: "gpt-5.6-sol", effort: "high" } },
    { timestamp: recent, type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 1000, cached_input_tokens: 600, output_tokens: 100, reasoning_output_tokens: 40, total_tokens: 1100 } } } },
  ])
  writeJsonl(join(codexHome, "archived_sessions", "old-unrelated-workspace.jsonl"), [
    { timestamp: older, type: "session_meta", payload: { id: "codex-old", cwd: join(fixtureRoot, "completely-unrelated-workspace") } },
    { timestamp: older, type: "turn_context", payload: { model: "gpt-5.6-sol" } },
    { timestamp: older, type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 500, cached_input_tokens: 0, output_tokens: 50, total_tokens: 550 } } } },
  ])
  writeJsonl(join(claudeHome, "projects", "fixture", "old.jsonl"), [
    { timestamp: "2020-01-15T12:01:00.000Z", cwd: join(fixtureRoot, "workspace-b"), sessionId: "claude-old", message: { id: "message-1", model: "claude-sonnet-4-6", usage: { input_tokens: 200, cache_creation_input_tokens: 20, cache_read_input_tokens: 80, output_tokens: 50 } } },
    { timestamp: "2020-01-15T12:03:00.000Z", cwd: join(fixtureRoot, "workspace-b"), sessionId: "claude-old", message: { id: "message-2", model: "claude-sonnet-4-6", usage: { input_tokens: 100, cache_creation_input_tokens: 10, cache_read_input_tokens: 40, output_tokens: 25 } } },
  ])
  mkdirSync(claudeDesktopHome, { recursive: true })
  writeFileSync(join(claudeDesktopHome, "desktop-session.json"), JSON.stringify({ cliSessionId: "claude-old", sessionId: "desktop-claude-old", title: "Desktop Claude fixture", cwd: join(fixtureRoot, "workspace-b"), effort: "high" }))
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
    surface: "cursor",
    billing_mode: "official-api",
    usage_source: "official-api",
    confidence: "reported",
    provider: "other",
    model: "custom-model",
    cost_usd: 1234.5,
    usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 },
  }))

  const harnessArgs = ["--codex-home", codexHome, "--claude-home", claudeHome, "--claude-desktop-home", claudeDesktopHome, "--cowork-home", coworkHome, "--gemini-home", geminiHome, "--cline-tasks", clineTasks, "--roo-tasks", rooTasks, "--opencode-db", opencodeDb]
  const summary = run([...harnessArgs, "--include", supplemental, "--output", reportDir])
  assert.equal(summary.outputDirectory, reportDir)
  assert.equal(dirname(summary.markdownReport), reportDir)
  assert.equal(dirname(summary.htmlReport), reportDir)
  assert.equal(summary.nativeFilesMetadataChecked, 7)
  assert.equal(summary.scope, "Codex: explicit override; Claude: explicit override; Cowork: explicit override; Gemini: explicit override; Cline: explicit override; Roo: explicit override; OpenCode: explicit override")
  assert.equal(summary.codexSessions, 2)
  assert.equal(summary.claudeSessions, 1)
  assert.equal(summary.claudeDesktopMetadataFiles, 1)
  assert.equal(summary.claudeDesktopMetadataMatches, 1)
  assert.equal(summary.geminiSessions, 1)
  assert.equal(summary.clineSessions, 1)
  assert.equal(summary.rooSessions, 1)
  assert.equal(summary.opencodeSessions, 1)
  assert.equal(summary.supplementalFilesInspected, 1)
  assert.equal(summary.recognizedFiles, 8)
  assert.equal(summary.threads, 8)
  assert.equal(summary.knownCosts, 8)
  assert.deepEqual(Object.keys(summary.periods), ["Past 24 hours", "Past 7 days", "Past 30 days", "Past 60 days", "Past 90 days", "Today", "Month to date", "Quarter to date", "Year to date", "All time"])
  assert.equal(summary.periods["All time"].threads, 8)
  assert.equal(summary.periods["Past 24 hours"].threads, 5)
  assert.equal(summary.periods["Past 7 days"].threads, 5)
  assert.equal(summary.periods["Past 30 days"].threads, 5)
  assert.equal(summary.periods.Today.threads, 5)
  assert.ok(summary.periods["Past 30 days"].threads >= summary.periods["Past 7 days"].threads)

  const markdown = readFileSync(summary.markdownReport, "utf8")
  const html = readFileSync(summary.htmlReport, "utf8")
  assert.match(markdown, /^# Global LLM Cost Report\n\n_powered by \[11ai-llm-cost-global\]\(https:\/\/ai\.rj11\.io\/skills\/11ai-llm-cost-global\)\._\n\n/)
  assert.match(markdown, /Desktop Claude fixture/)
  assert.match(markdown, /claude-desktop-code \/ subscription-or-api-equivalent/)
  const recentMonth = new Date(recent).toLocaleString("en-US", { month: "long", year: "numeric" })
  const recentDate = new Date(recent)
  const recentQuarter = `Q${Math.floor(recentDate.getMonth() / 3) + 1} ${recentDate.getFullYear()}`
  const recentYear = String(recentDate.getFullYear())
  assert.equal(summary.monthlyReports[recentMonth].threads, 5)
  assert.equal(summary.monthlyReports["January 2020"].threads, 2)
  assert.equal(summary.quarterlyReports[recentQuarter].threads, 5)
  assert.equal(summary.quarterlyReports["Q1 2020"].threads, 2)
  assert.equal(summary.yearlyReports[recentYear].threads, 5)
  assert.equal(summary.yearlyReports["2020"].threads, 2)
  assert.deepEqual(markdown.match(/^## .+$/gm), [
    "## Past 24 hours",
    "## Past 7 days",
    "## Past 30 days",
    "## Past 60 days",
    "## Past 90 days",
    "## Today",
    "## Month to date",
    "## Quarter to date",
    "## Year to date",
    "## Monthly reports",
    "## Quarterly reports",
    "## Yearly reports",
    "## All time",
    "## Harness surface coverage",
    "## Cowork coverage",
    "## Scan coverage",
    "## Pricing coverage",
    "## Anomalies and limitations",
    "## Methodology",
  ])
  assert.match(markdown, /^## All time$/m)
  assert.match(markdown, new RegExp(`^### ${recentMonth}$`, "m"))
  assert.match(markdown, /^### January 2020$/m)
  assert.ok(markdown.indexOf(`### ${recentMonth}`) < markdown.indexOf("### January 2020"))
  assert.match(markdown, new RegExp(`^### ${recentQuarter}$`, "m"))
  assert.match(markdown, /^### Q1 2020$/m)
  assert.match(markdown, new RegExp(`^### ${recentYear}$`, "m"))
  assert.match(markdown, /^### 2020$/m)
  assert.equal((markdown.match(/^### Totals$/gm) ?? []).length, 10)
  assert.equal((markdown.match(/^#### Totals$/gm) ?? []).length, 6)
  assert.equal((markdown.match(/^### Cost by harness$/gm) ?? []).length, 10)
  assert.equal((markdown.match(/^#### Cost by harness$/gm) ?? []).length, 6)
  assert.equal((markdown.match(/^### Cost by model by effort$/gm) ?? []).length, 10)
  assert.equal((markdown.match(/^#### Cost by model by effort$/gm) ?? []).length, 6)
  const reportHeadings = markdown.match(/^#{2,4} .+$/gm) ?? []
  const modelHeadingIndexes = reportHeadings.flatMap((heading, index) => heading === "### Cost by model" ? [index] : [])
  assert.equal(modelHeadingIndexes.length, 10)
  for (const index of modelHeadingIndexes) assert.equal(reportHeadings[index + 1], "### Cost by model by effort")
  const monthlyModelHeadingIndexes = reportHeadings.flatMap((heading, index) => heading === "#### Cost by model" ? [index] : [])
  assert.equal(monthlyModelHeadingIndexes.length, 6)
  for (const index of monthlyModelHeadingIndexes) assert.equal(reportHeadings[index + 1], "#### Cost by model by effort")
  const workspaceHeadingIndexes = reportHeadings.flatMap((heading, index) => /^#{3,4} Cost by workspace$/.test(heading) ? [index] : [])
  assert.equal(workspaceHeadingIndexes.length, 16)
  for (const index of workspaceHeadingIndexes) {
    const level = reportHeadings[index].match(/^#+/)[0]
    assert.equal(reportHeadings[index + 1], `${level} Totals`)
  }
  assert.match(markdown, /\| openai \/ gpt-5\.6-sol \| high \|/)
  assert.match(markdown, /\| anthropic \/ claude-sonnet-4-6 \| n\/a \|/)
  assert.match(markdown, /\| Harness \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Measured Cowork sessions \| Sub-agent runs \| Reported-cost sum \| Average tokens \/ thread \| Priced \| Unpriced \|/)
  assert.match(markdown, /\| Provider \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Priced \| Unpriced \|/)
  assert.match(markdown, /\| Provider \/ model \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \|/)
  assert.match(markdown, /\| Provider \/ model \| Effort \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \|/)
  assert.match(markdown, /\| Workspace \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Measured Cowork sessions \| Sub-agent runs \| Priced \| Unpriced \|/)
  assert.match(markdown, /\| Thread \| Source \| Surface \/ billing \| Workspace \| Sub-agents \| Provider \/ model \/ effort \| Attributed at \| Input \| Cached \| Output \| Tokens \| Selected cost \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Harness reported \| Method \|/)
  assert.match(markdown, /\| Cost \/ thread \| \$[\d,]+\./)
  assert.match(markdown, /\| Total \| \$[\d,]+\.\d+ \| [\d,]+ \| [\d,]+ \| \$[\d,]+\.\d+ \| [\d,]+ \| \$[\d,]+\.\d+ \| [\d,]+ \| \$[\d,]+\.\d+ \| 8 \|/)
  assert.match(markdown, /\$1,234\.\d{4}/)
  assert.match(markdown, /Scope: Codex: explicit override; Claude: explicit override; Cowork: explicit override; Gemini: explicit override/)
  assert.match(markdown, /^## Harness surface coverage$/m)
  assert.match(markdown, /\| OpenCode \| Native \| Current message-data and legacy session-ledger schemas \|/)
  assert.match(markdown, /chatgpt-work \/ credits-or-subscription/)
  assert.match(markdown, /cursor \/ official-api/)
  assert.match(markdown, /^## Year to date$/m)
  assert.match(markdown, /^## Quarter to date$/m)
  assert.match(markdown, /^## Month to date$/m)
  assert.match(markdown, /^## Today$/m)
  assert.match(markdown, /^## Past 24 hours$/m)
  assert.match(markdown, /^## Past 7 days$/m)
  assert.match(markdown, /^## Past 30 days$/m)
  assert.match(markdown, /^## Past 60 days$/m)
  assert.match(markdown, /^## Past 90 days$/m)
  assert.match(markdown, /^## Monthly reports$/m)
  assert.match(markdown, /^## Quarterly reports$/m)
  assert.match(markdown, /^## Yearly reports$/m)
  assert.match(markdown, /\| Pricing catalog \| bundled default \(version 3, updated 2026-08-04\) \|/)
  assert.match(markdown, /^### Historical pricing selection$/m)
  assert.match(markdown, /\| Effective-period price \| \d+ \| Rate effective at the thread attribution timestamp \|/)
  assert.match(markdown, /\| Earliest available fallback \| \d+ \| Usage predates known history;/)
  assert.match(markdown, /\| Provider \/ model \| Applied period \| Date basis \| Selection \| Match \| Rates per 1M \| Verified \| Change \| Notes \| Source \|/)
  assert.doesNotMatch(markdown, /^### Models requiring a pricing update$/m)
  assert.match(markdown, /codex-session\/[^/]+\/sessions\/recent\.jsonl/)
  assert.match(markdown, /codex-session\/[^/]+\/archived_sessions\/old-unrelated-workspace\.jsonl/)
  assert.match(markdown, /claude-session\/[^/]+\/projects\/fixture\/old\.jsonl/)
  assert.match(markdown, /included\/exports\/undated\.json/)
  assert.match(markdown, /gemini-session\/[^/]+\/tmp\/hash\/chats\/recent\.jsonl/)
  assert.match(markdown, /cline-session\/[^/]+\/cline-tasks\/task-1\/ui_messages\.json/)
  assert.match(markdown, /roo-session\/[^/]+\/roo-tasks\/task-2\/ui_messages\.json/)
  assert.match(markdown, /opencode-session\/[^/]+\/opencode\.db\/opencode-1/)
  assert.ok(markdown.endsWith("_LLM token cost analysis by [11ai-llm-cost-global](https://ai.rj11.io/skills/11ai-llm-cost-global)._\n"))
  assert.ok(markdown.lastIndexOf("> Generated ") > markdown.indexOf("## Methodology"))
  assert.ok(markdown.lastIndexOf("> Generated ") < markdown.lastIndexOf("_LLM token cost analysis"))
  assert.doesNotMatch(markdown, new RegExp(fixtureRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  const htmlSections = html.match(/<details class="report-section level-[234]">/g) ?? []
  assert.equal(htmlSections.length, (markdown.match(/^#{2,4} /gm) ?? []).length)
  assert.equal((html.match(/<\/details>/g) ?? []).length, htmlSections.length)
  assert.match(html, /<h1>Global LLM Cost Report <span class="powered-by"><a href="https:\/\/ai\.rj11\.io\/skills\/11ai-llm-cost-global" target="_blank" rel="noopener noreferrer">powered by 11ai-llm-cost-global<\/a><\/span><\/h1>/)
  assert.equal((html.match(/powered by 11ai-llm-cost-global/g) ?? []).length, 1)
  assert.match(html, /<summary><span class="section-title">All time<\/span><\/summary>/)
  assert.equal((html.match(/<summary><span class="section-title">Totals<\/span><\/summary>/g) ?? []).length, 16)
  assert.equal((html.match(/<summary><span class="section-title">Cost by harness<\/span><\/summary>/g) ?? []).length, 16)
  assert.equal((html.match(/<summary><span class="section-title">Cost by model by effort<\/span><\/summary>/g) ?? []).length, 16)
  assert.match(html, /<summary><span class="section-title">Year to date<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Quarter to date<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Month to date<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Today<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Past 24 hours<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Past 7 days<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Past 30 days<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Past 60 days<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Past 90 days<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Monthly reports<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Quarterly reports<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Yearly reports<\/span><\/summary>/)
  assert.doesNotMatch(html, /<details\b[^>]*\bopen\b[^>]*>/)
  assert.match(html, /<table>/)
  assert.match(html, /codex-session\/[^/]+\/sessions\/recent\.jsonl/)
  const orderedHtmlSections = ["Past 24 hours", "Past 7 days", "Past 30 days", "Past 60 days", "Past 90 days", "Today", "Month to date", "Quarter to date", "Year to date", "Monthly reports", "Quarterly reports", "Yearly reports", "All time", "Harness surface coverage", "Cowork coverage", "Scan coverage", "Pricing coverage", "Anomalies and limitations", "Methodology"]
  for (let index = 1; index < orderedHtmlSections.length; index += 1) {
    assert.ok(html.indexOf(`class="section-title">${orderedHtmlSections[index - 1]}</span>`) < html.indexOf(`class="section-title">${orderedHtmlSections[index]}</span>`))
  }
  assert.match(html, /<a href="https:\/\/ai\.rj11\.io\/skills\/11ai-llm-cost-global" target="_blank" rel="noopener noreferrer">11ai-llm-cost-global<\/a>/)
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
  assert.doesNotMatch(html, new RegExp(fixtureRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))

  const secondSummary = run([...harnessArgs, "--include", supplemental, "--output", secondReportDir])
  assert.deepEqual(secondSummary.periods, summary.periods)
  assert.deepEqual(secondSummary.monthlyReports, summary.monthlyReports)
  assert.deepEqual(secondSummary.quarterlyReports, summary.quarterlyReports)
  assert.deepEqual(secondSummary.yearlyReports, summary.yearlyReports)
  const normalizeRunTime = (value) => value
    .replace(/^> Generated .*$/m, "> Generated <run-time>")
    .replace(/^Threads attributed from .* through .*\.$/gm, "Threads attributed from <period-start> through <run-time>.")
  assert.equal(normalizeRunTime(readFileSync(secondSummary.markdownReport, "utf8")), normalizeRunTime(markdown))
  const normalizeHtmlRunTime = (value) => value
    .replace(/<blockquote class="generation-message">Generated .*?<\/blockquote>/, '<blockquote class="generation-message">Generated &lt;run-time&gt;</blockquote>')
    .replace(/<p>Threads attributed from .*? through .*?\.<\/p>/g, "<p>Threads attributed from &lt;period-start&gt; through &lt;run-time&gt;.</p>")
  assert.equal(normalizeHtmlRunTime(readFileSync(secondSummary.htmlReport, "utf8")), normalizeHtmlRunTime(html))

  const dedupSupplemental = join(fixtureRoot, "cowork-export")
  const dedupOpenCodeDb = join(fixtureRoot, "dedup-opencode.db")
  const dedupDatabase = new DatabaseSync(dedupOpenCodeDb)
  dedupDatabase.exec("CREATE TABLE session (id TEXT, directory TEXT, cost REAL, tokens_input INTEGER, tokens_output INTEGER, tokens_reasoning INTEGER, tokens_cache_read INTEGER, tokens_cache_write INTEGER, model TEXT, time_created INTEGER, time_updated INTEGER)")
  dedupDatabase.close()
  const claudeUsage = (id, inputTokens, outputTokens, timestamp) => ({
    timestamp,
    cwd: join(fixtureRoot, "cowork-workspace"),
    sessionId: "cowork-parent",
    message: {
      ...(id ? { id } : {}),
      model: "claude-sonnet-4-6",
      usage: { input_tokens: inputTokens, cache_creation_input_tokens: id === "message-1" ? 10 : 0, cache_read_input_tokens: id === "message-1" ? 20 : 0, output_tokens: outputTokens },
    },
  })
  writeJsonl(join(dedupSupplemental, "cowork", "session.jsonl"), [
    claudeUsage("message-1", 2, 5, "2026-08-01T10:00:00.000Z"),
    claudeUsage("message-1", 2, 255, "2026-08-01T10:01:00.000Z"),
    claudeUsage("message-2", 3, 10, "2026-08-01T10:02:00.000Z"),
    claudeUsage(null, 1, 7, "2026-08-01T10:03:00.000Z"),
    claudeUsage(null, 1, 7, "2026-08-01T10:03:30.000Z"),
  ])
  writeJsonl(join(dedupSupplemental, "cowork", "subagents", "agent.jsonl"), [
    claudeUsage("message-1", 2, 255, "2026-08-01T10:01:00.000Z"),
    claudeUsage("message-2", 3, 10, "2026-08-01T10:02:00.000Z"),
  ])
  writeJsonl(join(dedupSupplemental, "cowork", "conflict.jsonl"), [
    claudeUsage("message-conflict", 1, 2, "2026-08-01T10:04:00.000Z"),
    claudeUsage("message-conflict", 2, 3, "2026-08-01T10:05:00.000Z"),
  ])
  const dedupSummary = run([
    "--codex-home", join(fixtureRoot, "dedup-empty-codex"),
    "--claude-home", join(fixtureRoot, "dedup-empty-claude"),
    "--gemini-home", join(fixtureRoot, "dedup-empty-gemini"),
    "--cline-tasks", join(fixtureRoot, "dedup-empty-cline"),
    "--roo-tasks", join(fixtureRoot, "dedup-empty-roo"),
    "--opencode-db", dedupOpenCodeDb,
    "--include", dedupSupplemental,
    "--output", join(fixtureRoot, "dedup-report"),
  ])
  assert.equal(dedupSummary.supplementalFilesInspected, 3)
  assert.equal(dedupSummary.recognizedFiles, 3)
  assert.equal(dedupSummary.threads, 3)
  assert.equal(dedupSummary.periods["All time"].knownTokens, 324)
  assert.equal(dedupSummary.claudeRecordsWithMessageId, 7)
  assert.equal(dedupSummary.claudeUniqueMessageIds, 3)
  assert.equal(dedupSummary.claudeRetainedResponses, 4)
  assert.equal(dedupSummary.claudeDuplicatesRemoved, 3)
  assert.equal(dedupSummary.claudeConflictingMessageIds, 1)
  const dedupMarkdown = readFileSync(dedupSummary.markdownReport, "utf8")
  assert.match(dedupMarkdown, /\| Claude usage records with message IDs \| 7 \|/)
  assert.match(dedupMarkdown, /\| Unique Claude message IDs \| 3 \|/)
  assert.match(dedupMarkdown, /\| Claude billable response variants retained \| 4 \|/)
  assert.match(dedupMarkdown, /\| Claude duplicate records removed \| 3 \|/)
  assert.match(dedupMarkdown, /\| Claude message IDs with billing conflicts \| 1 \|/)
  assert.match(dedupMarkdown, /Claude message [0-9a-f]{12} had 2 conflicting non-output billing variants; retained one highest-output record per variant\./)
  assert.doesNotMatch(dedupMarkdown, /message-conflict/)

  const canonicalEfforts = ["none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra"]
  const capturedEfforts = [...canonicalEfforts, "light"]
  const effortClaudeHome = join(fixtureRoot, "effort-claude")
  const effortTranscript = join(effortClaudeHome, "projects", "fixture", "all-efforts.jsonl")
  const effortTime = (index, offset) => new Date(Date.UTC(2020, 1, 1, 12, index * 2 + offset)).toISOString()
  writeJsonl(effortTranscript, capturedEfforts.map((effort, index) => ({
    timestamp: effortTime(index, 1),
    cwd: join(fixtureRoot, "effort-workspace"),
    sessionId: "claude-all-efforts",
    message: { id: `effort-message-${index}`, model: "claude-sonnet-4-6", output_config: { effort }, usage: { input_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 1 } },
  })))
  const effortSummary = run([
    "--codex-home", join(fixtureRoot, "empty-codex"),
    "--claude-home", effortClaudeHome,
    "--gemini-home", join(fixtureRoot, "empty-gemini"),
    "--cline-tasks", join(fixtureRoot, "empty-cline"),
    "--roo-tasks", join(fixtureRoot, "empty-roo"),
    "--opencode-db", opencodeDb,
    "--output", join(fixtureRoot, "effort-report"),
  ])
  assert.equal(effortSummary.periods["All time"].threads, effortSummary.threads)
  const effortMarkdown = readFileSync(effortSummary.markdownReport, "utf8")
  for (const effort of canonicalEfforts) assert.match(effortMarkdown, new RegExp(`\\| anthropic \\/ claude-sonnet-4-6 \\| ${effort} \\|`))
  assert.doesNotMatch(effortMarkdown, /\| anthropic \/ claude-sonnet-4-6 \| light \|/)

  const fakeHome = join(fixtureRoot, "home")
  const fakeDesktop = join(fakeHome, "Desktop")
  mkdirSync(fakeDesktop, { recursive: true })
  const defaultSummary = run(harnessArgs, { HOME: fakeHome })
  const reportsRoot = join(fakeDesktop, "11ai-llm-cost-global-reports")
  assert.equal(dirname(defaultSummary.outputDirectory), reportsRoot)
  assert.match(basename(defaultSummary.outputDirectory), /^11ai-llm-cost-global-reports-\d{4}-\d{2}-\d{2}T/)
  assert.equal(dirname(defaultSummary.markdownReport), defaultSummary.outputDirectory)
  assert.equal(dirname(defaultSummary.htmlReport), defaultSummary.outputDirectory)
  assert.match(basename(defaultSummary.markdownReport), /^11ai-llm-cost-global-\d{4}-\d{2}-\d{2}T.*\.md$/)
  assert.equal(basename(defaultSummary.htmlReport), `${basename(defaultSummary.markdownReport, ".md")}.html`)

  const currentOpenCodeDb = join(fixtureRoot, "current-opencode.db")
  const currentDatabase = new DatabaseSync(currentOpenCodeDb)
  currentDatabase.exec("CREATE TABLE session (id TEXT PRIMARY KEY, directory TEXT, time_created INTEGER, time_updated INTEGER)")
  currentDatabase.exec("CREATE TABLE message (id TEXT PRIMARY KEY, session_id TEXT, time_created INTEGER, time_updated INTEGER, data TEXT)")
  currentDatabase.prepare("INSERT INTO session VALUES (?, ?, ?, ?)").run("current-session", join(fixtureRoot, "opencode-workspace"), 1752829300000, 1752829360000)
  currentDatabase.prepare("INSERT INTO message VALUES (?, ?, ?, ?, ?)").run("assistant-1", "current-session", 1752829300000, 1752829360000, JSON.stringify({ role: "assistant", providerID: "openai", modelID: "gpt-5.6-sol", cost: 0.04, tokens: { input: 10, output: 3, reasoning: 1, cache: { read: 2, write: 0 } } }))
  currentDatabase.prepare("INSERT INTO message VALUES (?, ?, ?, ?, ?)").run("user-1", "current-session", 1752829290000, 1752829290000, JSON.stringify({ role: "user", tokens: { input: 999, output: 999 } }))
  currentDatabase.close()
  const currentOpenCodeSummary = run([
    "--codex-home", join(fixtureRoot, "current-empty-codex"), "--claude-home", join(fixtureRoot, "current-empty-claude"), "--cowork-home", join(fixtureRoot, "current-empty-cowork"),
    "--gemini-home", join(fixtureRoot, "current-empty-gemini"), "--cline-tasks", join(fixtureRoot, "current-empty-cline"), "--roo-tasks", join(fixtureRoot, "current-empty-roo"),
    "--opencode-db", currentOpenCodeDb, "--output", join(fixtureRoot, "current-opencode-report"),
  ])
  assert.equal(currentOpenCodeSummary.opencodeSessions, 1)
  assert.equal(currentOpenCodeSummary.threads, 1)
  assert.equal(currentOpenCodeSummary.periods["All time"].knownTokens, 16)
  assert.doesNotMatch(readFileSync(currentOpenCodeSummary.markdownReport, "utf8"), /no such column/)

  const coworkNativeHome = join(fixtureRoot, "cowork-native")
  const coworkSessionDir = join(coworkNativeHome, "account", "workspace", "local_cowork-1")
  mkdirSync(dirname(coworkSessionDir), { recursive: true })
  writeFileSync(`${coworkSessionDir}.json`, JSON.stringify({ sessionId: "cowork-1", title: "Cowork fixture title", userSelectedFolders: [join(fixtureRoot, "cowork-workspace")] }))
  const coworkRecord = (output, timestamp) => ({ timestamp, sessionId: "cowork-1", message: { id: "cowork-message-1", model: "claude-sonnet-4-6", usage: { input_tokens: 2, cache_creation_input_tokens: 10, cache_read_input_tokens: 20, output_tokens: output } } })
  writeJsonl(join(coworkSessionDir, "audit.jsonl"), [coworkRecord(5, "2026-01-01T10:00:00.000Z"), coworkRecord(255, "2026-01-01T10:01:00.000Z")])
  writeJsonl(join(coworkSessionDir, ".claude", "projects", "fixture", "subagents", "agent.jsonl"), [coworkRecord(255, "2026-01-01T10:01:00.000Z")])
  writeJsonl(join(coworkSessionDir, ".claude", "projects", "fixture", "subagents", "agent-two.jsonl"), [{ timestamp: "2026-01-01T10:02:00.000Z", sessionId: "cowork-1", message: { id: "cowork-message-2", model: "claude-sonnet-4-6", usage: { input_tokens: 3, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 10 } } }])
  writeFileSync(join(dirname(coworkSessionDir), "remote-session-spaces.json"), JSON.stringify({ entries: [{ sessionId: "remote-cowork-1", folders: [join(fixtureRoot, "cowork-workspace")] }] }))
  const emptyOpenCodeDb = join(fixtureRoot, "empty-opencode.db")
  const emptyDatabase = new DatabaseSync(emptyOpenCodeDb)
  emptyDatabase.exec("CREATE TABLE session (id TEXT, directory TEXT, cost REAL, tokens_input INTEGER, tokens_output INTEGER, tokens_reasoning INTEGER, tokens_cache_read INTEGER, tokens_cache_write INTEGER, model TEXT, time_created INTEGER, time_updated INTEGER)")
  emptyDatabase.close()
  const coworkSummary = run([
    "--codex-home", join(fixtureRoot, "cowork-empty-codex"), "--claude-home", join(fixtureRoot, "cowork-empty-claude"), "--cowork-home", coworkNativeHome,
    "--gemini-home", join(fixtureRoot, "cowork-empty-gemini"), "--cline-tasks", join(fixtureRoot, "cowork-empty-cline"), "--roo-tasks", join(fixtureRoot, "cowork-empty-roo"),
    "--opencode-db", emptyOpenCodeDb, "--output", join(fixtureRoot, "cowork-report"),
  ])
  assert.equal(coworkSummary.coworkSessions, 1)
  assert.equal(coworkSummary.coworkLocalSessionsMeasured, 1)
  assert.equal(coworkSummary.coworkRemoteSessionsDetected, 1)
  assert.equal(coworkSummary.coworkRemoteSessionsMeasured, 0)
  assert.equal(coworkSummary.coworkRemoteSessionsUnavailable, 1)
  assert.equal(coworkSummary.coworkRemoteIndexFiles, 1)
  assert.equal(coworkSummary.coworkTranscriptFiles, 3)
  assert.equal(coworkSummary.coworkSubagentRuns, 2)
  assert.equal(coworkSummary.threads, 1)
  assert.equal(coworkSummary.claudeDuplicatesRemoved, 2)
  const coworkMarkdown = readFileSync(coworkSummary.markdownReport, "utf8")
  assert.match(coworkMarkdown, /\| Measured\/provider tokens \| 300 \|/)
  assert.match(coworkMarkdown, /\| cowork \|/)
  assert.match(coworkMarkdown, /Cowork fixture title/)
  assert.match(coworkMarkdown, /claude-cowork \/ subscription-or-api-equivalent/)
  assert.match(coworkMarkdown, /\| Measured Cowork sessions \| 1 \|/)
  assert.match(coworkMarkdown, /\| Measured Cowork sub-agent runs \| 2 \|/)
  assert.match(coworkMarkdown, /\| Local measured \| 1 \| Included in measured totals \|/)
  assert.match(coworkMarkdown, /\| Remote detected \| 1 \|/)
  assert.match(coworkMarkdown, /\| Remote measured \| 0 \|/)
  assert.match(coworkMarkdown, /\| Remote detected, usage unavailable \| 1 \| Excluded from measured totals; never treated as zero usage \|/)
  assert.match(coworkMarkdown, /Cowork coverage warning:.*All token and cost totals in this report remain measured totals and exclude that unavailable usage\./)

  const declaredExports = join(fixtureRoot, "declared-exports")
  const declaredUsage = (id, workspace) => ({ id, provider: "openai", model: "gpt-5.6-sol", ...workspace, usage: { input_tokens: 10, output_tokens: 1, total_tokens: 11 } })
  mkdirSync(declaredExports, { recursive: true })
  writeFileSync(join(declaredExports, "one.json"), JSON.stringify(declaredUsage("declared-one", { workspacePath: join(fixtureRoot, "declared-workspace") })))
  writeFileSync(join(declaredExports, "multi.json"), JSON.stringify(declaredUsage("declared-multi", { userSelectedFolders: [join(fixtureRoot, "a"), join(fixtureRoot, "b")] })))
  writeFileSync(join(declaredExports, "none.json"), JSON.stringify(declaredUsage("declared-none", { userSelectedFolders: [] })))
  const declaredSummary = run(["--codex-home", join(fixtureRoot, "declared-empty-codex"), "--claude-home", join(fixtureRoot, "declared-empty-claude"), "--cowork-home", join(fixtureRoot, "declared-empty-cowork"), "--gemini-home", join(fixtureRoot, "declared-empty-gemini"), "--cline-tasks", join(fixtureRoot, "declared-empty-cline"), "--roo-tasks", join(fixtureRoot, "declared-empty-roo"), "--opencode-db", emptyOpenCodeDb, "--include", declaredExports, "--output", join(fixtureRoot, "declared-report")])
  assert.equal(declaredSummary.threads, 3)
  const declaredMarkdown = readFileSync(declaredSummary.markdownReport, "utf8")
  assert.match(declaredMarkdown, new RegExp(join(fixtureRoot, "declared-workspace").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  assert.match(declaredMarkdown, /multi-project session \(2 folders\)/)
  assert.match(declaredMarkdown, /session with no selected folder/)

  const legacyHome = join(fixtureRoot, "legacy-home")
  const legacyCwd = join(fixtureRoot, "legacy-cwd")
  const legacyClaudeHome = join(fixtureRoot, "legacy-claude")
  const legacyOpenCodeDb = join(fixtureRoot, "legacy-opencode.db")
  mkdirSync(join(legacyHome, ".llm-cost"), { recursive: true })
  mkdirSync(legacyCwd, { recursive: true })
  const poisonPricing = JSON.stringify({
    version: 1,
    updatedAt: "2020-01-01",
    models: [{ match: ["claude-opus-5*", "claude-unpriced-9*"], provider: "anthropic", per1M: { input: 999, output: 999 } }],
  })
  writeFileSync(join(legacyHome, ".llm-cost", "pricing.json"), poisonPricing)
  writeFileSync(join(legacyCwd, "llm-pricing.json"), poisonPricing)
  writeJsonl(join(legacyClaudeHome, "projects", "fixture", "opus.jsonl"), [
    { timestamp: recent, cwd: join(fixtureRoot, "legacy-workspace"), sessionId: "opus-thread", message: { id: "opus-message", model: "claude-opus-5", usage: { input_tokens: 100, cache_creation_input_tokens: 0, cache_read_input_tokens: 50, output_tokens: 10 } } },
  ])
  writeJsonl(join(legacyClaudeHome, "projects", "fixture", "unpriced.jsonl"), [
    { timestamp: recent, cwd: join(fixtureRoot, "legacy-workspace"), sessionId: "unpriced-thread", message: { id: "unpriced-message", model: "claude-unpriced-9", usage: { input_tokens: 100, cache_creation_input_tokens: 0, cache_read_input_tokens: 50, output_tokens: 10 } } },
  ])
  const legacyDatabase = new DatabaseSync(legacyOpenCodeDb)
  legacyDatabase.exec("CREATE TABLE session (id TEXT, directory TEXT, cost REAL, tokens_input INTEGER, tokens_output INTEGER, tokens_reasoning INTEGER, tokens_cache_read INTEGER, tokens_cache_write INTEGER, model TEXT, time_created INTEGER, time_updated INTEGER)")
  legacyDatabase.close()
  const legacySummary = run([
    "--codex-home", join(fixtureRoot, "legacy-empty-codex"),
    "--claude-home", legacyClaudeHome,
    "--gemini-home", join(fixtureRoot, "legacy-empty-gemini"),
    "--cline-tasks", join(fixtureRoot, "legacy-empty-cline"),
    "--roo-tasks", join(fixtureRoot, "legacy-empty-roo"),
    "--opencode-db", legacyOpenCodeDb,
    "--output", join(fixtureRoot, "legacy-report"),
  ], { HOME: legacyHome }, legacyCwd)
  assert.equal(legacySummary.threads, 2)
  assert.equal(legacySummary.knownCosts, 1)
  const legacyMarkdown = readFileSync(legacySummary.markdownReport, "utf8")
  const legacyHtml = readFileSync(legacySummary.htmlReport, "utf8")
  assert.match(legacyMarkdown, /\| Pricing catalog \| bundled default \(version 3, updated 2026-08-04\) \|/)
  assert.match(legacyMarkdown, /^### Models requiring a pricing update$/m)
  assert.match(legacyMarkdown, /\| anthropic \/ claude-unpriced-9 \| 1 \| 150 \| 50 \| 10 \| 160 \|/)
  assert.match(legacyMarkdown, /Known-cost totals exclude the models above\. Run \[11ai-llm-cost-pricing-update\]\(https:\/\/ai\.rj11\.io\/skills\/11ai-llm-cost-pricing-update\)/)
  assert.match(legacyHtml, /<a href="https:\/\/ai\.rj11\.io\/skills\/11ai-llm-cost-pricing-update" target="_blank" rel="noopener noreferrer">11ai-llm-cost-pricing-update<\/a>/)
  const removedPricingOption = spawnSync(process.execPath, [analyzer, "--pricing", join(legacyCwd, "llm-pricing.json")], { encoding: "utf8", cwd: legacyCwd, env: { ...process.env, HOME: legacyHome } })
  assert.notEqual(removedPricingOption.status, 0)
  assert.match(removedPricingOption.stderr, /unknown argument: --pricing/)
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true })
}
