import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
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
  const coworkHome = join(fixtureRoot, "cowork-empty")
  const geminiHome = join(fixtureRoot, "gemini")
  const clineTasks = join(fixtureRoot, "cline-tasks")
  const rooTasks = join(fixtureRoot, "roo-tasks")
  const opencodeDb = join(fixtureRoot, "opencode.db")
  const report = join(fixtureRoot, "report.md")
  mkdirSync(project, { recursive: true })
  mkdirSync(threadRoot, { recursive: true })

  const poisonPricing = JSON.stringify({
    version: 1,
    updatedAt: "2020-01-01",
    models: [{ match: ["gpt-5.6-sol*", "claude-unpriced-9*"], provider: "openai", per1M: { input: 999, output: 999 } }],
  })
  writeFileSync(join(project, "llm-pricing.json"), poisonPricing)
  mkdirSync(join(project, ".llm-cost"), { recursive: true })
  writeFileSync(join(project, ".llm-cost", "pricing.json"), poisonPricing)

  writeFileSync(join(project, "other-harness.json"), JSON.stringify({
    id: "generic-1",
    provider: "other",
    model: "custom-model",
    cost_usd: 1234.5,
    usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 },
  }))

  writeJsonl(join(codexHome, "sessions", "2026", "07", "18", "matching.jsonl"), [
    { timestamp: "2026-07-18T09:00:00.000Z", type: "session_meta", payload: { id: "codex-matching", cwd: project, originator: "t3code_desktop", source: "vscode" } },
    { timestamp: "2026-07-18T09:10:00.000Z", type: "turn_context", payload: { model: "gpt-5.6-sol", effort: "light" } },
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
  database.exec("CREATE TABLE session (id TEXT PRIMARY KEY, directory TEXT, time_created INTEGER, time_updated INTEGER)")
  database.exec("CREATE TABLE message (id TEXT PRIMARY KEY, session_id TEXT, time_created INTEGER, time_updated INTEGER, data TEXT)")
  database.prepare("INSERT INTO session VALUES (?, ?, ?, ?)").run("opencode-1", project, 1752829300000, 1752829360000)
  database.prepare("INSERT INTO message VALUES (?, ?, ?, ?, ?)").run("message-1", "opencode-1", 1752829300000, 1752829360000, JSON.stringify({ role: "assistant", modelID: "gpt-5.6-sol", providerID: "openai", cost: 0.03, tokens: { input: 40, output: 8, reasoning: 2, cache: { read: 5, write: 1 } } }))
  database.prepare("INSERT INTO message VALUES (?, ?, ?, ?, ?)").run("message-user", "opencode-1", 1752829290000, 1752829290000, JSON.stringify({ role: "user", tokens: { input: 999, output: 999 } }))
  database.close()

  const harnessArgs = ["--codex-home", codexHome, "--claude-home", claudeHome, "--cowork-home", coworkHome, "--gemini-home", geminiHome, "--cline-tasks", clineTasks, "--roo-tasks", rooTasks, "--opencode-db", opencodeDb]
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
  assert.equal(summary.knownCosts, 7)
  assert.equal(summary.wallTimeMs, 1320000)
  assert.equal(summary.activeTimeMs, 720000)

  const markdown = readFileSync(report, "utf8")
  const html = readFileSync(summary.htmlReport, "utf8")
  assert.match(markdown, /^# Project LLM Cost Report\n\n_powered by \[11ai-llm-cost-project\]\(https:\/\/ai\.rj11\.io\/skills\/11ai-llm-cost-project\)\._\n\n/)
  assert.match(markdown, /^# Project LLM Cost Report$/m)
  assert.match(markdown, /^## Totals$/m)
  assert.match(markdown, /^## Cost by harness$/m)
  assert.match(markdown, /^## Cost by model by effort$/m)
  assert.match(markdown, /\| Pricing catalog \| bundled default \(version 2, updated 2026-07-26\) \|/)
  assert.doesNotMatch(markdown, /^### Models requiring a pricing update$/m)
  const levelTwoHeadings = markdown.match(/^## .+$/gm) ?? []
  assert.equal(levelTwoHeadings[levelTwoHeadings.indexOf("## Cost by model") + 1], "## Cost by model by effort")
  assert.equal(levelTwoHeadings[levelTwoHeadings.indexOf("## Cost by root and child folder") + 1], "## Totals")
  assert.equal(levelTwoHeadings[levelTwoHeadings.indexOf("## Thread detail") + 1], "## Harness surface coverage")
  assert.equal(levelTwoHeadings[levelTwoHeadings.indexOf("## Harness surface coverage") + 1], "## Scan coverage")
  assert.equal(levelTwoHeadings[levelTwoHeadings.indexOf("## Scan coverage") + 1], "## Pricing coverage")
  assert.match(markdown, /\| openai \/ gpt-5\.6-sol \| low \| \$\d+\.\d+ \| 1,000 \| 600 \| \$\d+\.\d+ \| 100 \| \$\d+\.\d+ \| 1,100 \| \$\d+\.\d+ \| 1 \| \$\d+\.\d+ \|/)
  assert.doesNotMatch(markdown, /\| openai \/ gpt-5\.6-sol \| light \|/)
  assert.match(markdown, /\| anthropic \/ claude-sonnet-4-6 \| medium \|/)
  assert.match(markdown, /\| Sum of thread wall time \| 22m \|/)
  assert.match(markdown, /\| Estimated active time \| 12m \|/)
  assert.match(markdown, /\| Harness \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Reported-cost sum \| Average tokens \/ thread \| Priced \| Unpriced \|/)
  assert.match(markdown, /\| Provider \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Priced \| Unpriced \|/)
  assert.match(markdown, /\| Provider \/ model \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \|/)
  assert.match(markdown, /\| Provider \/ model \| Effort \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \|/)
  assert.match(markdown, /\| Folder \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Priced \| Unpriced \|/)
  assert.match(markdown, /\| Thread \| Source \| Surface \/ billing \| Provider \/ model \/ effort \| Input \| Cached \| Output \| Tokens \| Selected cost \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Harness reported \| Method \|/)
  assert.match(markdown, /\| Total \| \$[\d,]+\.\d+ \| 1,805 \| 792 \| \$[\d,]+\.\d+ \| 241 \| \$[\d,]+\.\d+ \| 2,046 \| \$[\d,]+\.\d+ \| 7 \|/)
  assert.match(markdown, /\$1,234\.\d{4}/)
  assert.match(markdown, /\| Cost \/ thread \| \$[\d,]+\./)
  assert.match(markdown, /codex-session\/sessions\/2026\/07\/18\/matching\.jsonl/)
  assert.match(markdown, /claude-session\/projects\/fixture\/matching\.jsonl/)
  assert.match(markdown, /other-harness\.json/)
  assert.match(markdown, /gemini-session\/tmp\/project-hash\/chats\/session\.jsonl/)
  assert.match(markdown, /cline-session\/cline-tasks\/task-1\/ui_messages\.json/)
  assert.match(markdown, /roo-session\/roo-tasks\/task-2\/ui_messages\.json/)
  assert.match(markdown, /opencode-session\/opencode\.db\/opencode-1/)
  assert.match(markdown, /t3-code \/ underlying-runtime/)
  assert.ok(markdown.endsWith("_LLM token cost analysis by [11ai-llm-cost-project](https://ai.rj11.io/skills/11ai-llm-cost-project)._\n"))
  assert.ok(markdown.lastIndexOf("> Generated ") > markdown.indexOf("## Methodology"))
  assert.ok(markdown.lastIndexOf("> Generated ") < markdown.lastIndexOf("_LLM token cost analysis"))
  assert.doesNotMatch(markdown, /unrelated\.jsonl/)
  assert.doesNotMatch(markdown, new RegExp(fixtureRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  const htmlSections = html.match(/<details class="report-section level-[23]">/g) ?? []
  assert.equal(htmlSections.length, (markdown.match(/^#{2,3} /gm) ?? []).length)
  assert.equal((html.match(/<\/details>/g) ?? []).length, htmlSections.length)
  assert.match(html, /<h1>Project LLM Cost Report <span class="powered-by"><a href="https:\/\/ai\.rj11\.io\/skills\/11ai-llm-cost-project" target="_blank" rel="noopener noreferrer">powered by 11ai-llm-cost-project<\/a><\/span><\/h1>/)
  assert.equal((html.match(/powered by 11ai-llm-cost-project/g) ?? []).length, 1)
  assert.match(html, /<summary><span class="section-title">Totals<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Pricing catalog match detail<\/span><\/summary>/)
  assert.match(html, /<summary><span class="section-title">Cost by model by effort<\/span><\/summary>/)
  assert.ok(html.indexOf('class="section-title">Cost by root and child folder</span>') < html.indexOf('class="section-title">Totals</span>'))
  assert.ok(html.indexOf('class="section-title">Thread detail</span>') < html.indexOf('class="section-title">Scan coverage</span>'))
  assert.ok(html.indexOf('class="section-title">Scan coverage</span>') < html.indexOf('class="section-title">Pricing coverage</span>'))
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

  const unmatchedProject = join(fixtureRoot, "unmatched-project")
  mkdirSync(unmatchedProject, { recursive: true })
  writeFileSync(join(unmatchedProject, "usage.json"), JSON.stringify({
    id: "unpriced-thread",
    provider: "anthropic",
    model: "claude-unpriced-9",
    usage: { input_tokens: 100, cache_read_input_tokens: 50, output_tokens: 10 },
  }))
  writeFileSync(join(unmatchedProject, "synthetic.json"), JSON.stringify({
    id: "synthetic-thread",
    provider: "anthropic",
    model: "<synthetic>",
    usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
  }))
  writeFileSync(join(unmatchedProject, "llm-pricing.json"), poisonPricing)
  mkdirSync(join(unmatchedProject, ".llm-cost"), { recursive: true })
  writeFileSync(join(unmatchedProject, ".llm-cost", "pricing.json"), poisonPricing)
  const unmatchedReport = join(fixtureRoot, "unmatched-report.md")
  const unmatchedSummary = run([unmatchedProject, ...harnessArgs, "--project-only", "--output", unmatchedReport])
  assert.equal(unmatchedSummary.knownCosts, 0)
  const unmatchedMarkdown = readFileSync(unmatchedReport, "utf8")
  const unmatchedHtml = readFileSync(unmatchedSummary.htmlReport, "utf8")
  assert.match(unmatchedMarkdown, /\| Pricing catalog \| bundled default \(version 2, updated 2026-07-26\) \|/)
  assert.match(unmatchedMarkdown, /^### Models requiring a pricing update$/m)
  assert.match(unmatchedMarkdown, /\| anthropic \/ claude-unpriced-9 \| 1 \| 150 \| 50 \| 10 \| 160 \|/)
  const unmatchedCallout = unmatchedMarkdown.slice(unmatchedMarkdown.indexOf("### Models requiring a pricing update"), unmatchedMarkdown.indexOf("### Pricing catalog match detail"))
  assert.doesNotMatch(unmatchedCallout, /<synthetic>/)
  assert.match(unmatchedHtml, /<a href="https:\/\/ai\.rj11\.io\/skills\/11ai-llm-cost-pricing-update" target="_blank" rel="noopener noreferrer">11ai-llm-cost-pricing-update<\/a>/)
  const removedPricingOption = spawnSync(process.execPath, [analyzer, unmatchedProject, "--pricing", join(unmatchedProject, "llm-pricing.json")], { encoding: "utf8", cwd: threadRoot })
  assert.notEqual(removedPricingOption.status, 0)
  assert.match(removedPricingOption.stderr, /unknown argument: --pricing/)

  const dedupProject = join(fixtureRoot, "dedup-project")
  const dedupParent = join(dedupProject, "cowork", "session.jsonl")
  const dedupClaudeUsage = (id, inputTokens, outputTokens, timestamp) => ({
    timestamp,
    cwd: dedupProject,
    sessionId: "cowork-parent",
    message: {
      ...(id ? { id } : {}),
      model: "claude-sonnet-4-6",
      usage: { input_tokens: inputTokens, cache_creation_input_tokens: id === "message-1" ? 10 : 0, cache_read_input_tokens: id === "message-1" ? 20 : 0, output_tokens: outputTokens },
    },
  })
  writeJsonl(dedupParent, [
    dedupClaudeUsage("message-1", 2, 5, "2026-08-01T10:00:00.000Z"),
    dedupClaudeUsage("message-1", 2, 255, "2026-08-01T10:01:00.000Z"),
    dedupClaudeUsage("message-2", 3, 10, "2026-08-01T10:02:00.000Z"),
  ])
  writeJsonl(join(dedupProject, "cowork", "subagents", "agent.jsonl"), [
    dedupClaudeUsage("message-1", 2, 255, "2026-08-01T10:01:00.000Z"),
    dedupClaudeUsage("message-2", 3, 10, "2026-08-01T10:02:00.000Z"),
  ])
  writeJsonl(join(dedupProject, "cowork", "conflict.jsonl"), [
    dedupClaudeUsage("message-conflict", 1, 2, "2026-08-01T10:04:00.000Z"),
    dedupClaudeUsage("message-conflict", 2, 3, "2026-08-01T10:05:00.000Z"),
    dedupClaudeUsage(null, 1, 7, "2026-08-01T10:06:00.000Z"),
    dedupClaudeUsage(null, 1, 7, "2026-08-01T10:07:00.000Z"),
  ])
  const dedupReport = join(fixtureRoot, "dedup-project-report.md")
  const dedupSummary = run([dedupProject, "--project-only", "--output", dedupReport])
  assert.equal(dedupSummary.recognizedFiles, 2)
  assert.equal(dedupSummary.threads, 2)
  assert.equal(dedupSummary.claudeRecordsWithMessageId, 7)
  assert.equal(dedupSummary.claudeUniqueMessageIds, 3)
  assert.equal(dedupSummary.claudeRetainedResponses, 4)
  assert.equal(dedupSummary.claudeDuplicatesRemoved, 3)
  assert.equal(dedupSummary.claudeConflictingMessageIds, 1)
  const dedupMarkdown = readFileSync(dedupReport, "utf8")
  assert.match(dedupMarkdown, /\| Measured\/provider tokens \| 324 \|/)
  assert.match(dedupMarkdown, /\| Claude duplicate records removed \| 3 \|/)
  assert.match(dedupMarkdown, /Claude message [0-9a-f]{12} had 2 conflicting non-output billing variants/)
  assert.doesNotMatch(dedupMarkdown, /message-conflict/)
  const dedupPathSummary = run([dedupProject, "--project-only", "--thread", dedupParent, "--output", join(fixtureRoot, "dedup-path-report.md")])
  assert.equal(dedupPathSummary.threads, 1)
  assert.match(readFileSync(dedupPathSummary.markdownReport, "utf8"), /\| Measured\/provider tokens \| 300 \|/)

  const slicedProject = join(fixtureRoot, "sliced-project")
  mkdirSync(slicedProject, { recursive: true })
  writeJsonl(join(slicedProject, "claude.jsonl"), [
    { timestamp: "2026-07-18T10:00:00.000Z", sessionId: "one-logical-session", message: { id: "slice-low", model: "claude-sonnet-5", output_config: { effort: "low" }, usage: { input_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 1 } } },
    { timestamp: "2026-07-18T10:01:00.000Z", sessionId: "one-logical-session", message: { id: "slice-high", model: "claude-sonnet-5", output_config: { effort: "high" }, usage: { input_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 1 } } },
  ])
  const slicedReport = join(fixtureRoot, "sliced-report.md")
  const slicedSummary = run([slicedProject, "--project-only", "--output", slicedReport])
  assert.equal(slicedSummary.threads, 1)
  assert.equal(slicedSummary.wallTimeMs, 60000)
  assert.equal(slicedSummary.activeTimeMs, 60000)
  const slicedMarkdown = readFileSync(slicedReport, "utf8")
  assert.match(slicedMarkdown, /\| Threads recognized \| 1 \|/)
  assert.match(slicedMarkdown, /anthropic \/ claude-sonnet-5 \/ low; anthropic \/ claude-sonnet-5 \/ high/)

  const invalidProject = join(fixtureRoot, "invalid-project")
  mkdirSync(invalidProject, { recursive: true })
  writeFileSync(join(invalidProject, "usage.json"), JSON.stringify({ id: "invalid-counters", provider: "openai", model: "gpt-5.6-sol", usage: { input_tokens: 10, cached_input_tokens: 20, output_tokens: 1, total_tokens: 11 } }))
  const invalidReport = join(fixtureRoot, "invalid-report.md")
  const invalidSummary = run([invalidProject, "--project-only", "--output", invalidReport])
  assert.equal(invalidSummary.knownCosts, 0)
  assert.equal(invalidSummary.costUsd, null)
  const invalidMarkdown = readFileSync(invalidReport, "utf8")
  assert.match(invalidMarkdown, /\| Invalid \| 1 \|/)
  assert.match(invalidMarkdown, /invalid usage counters: inputUncached is negative/)
  assert.doesNotMatch(invalidMarkdown, /\$-/)

  const incompleteProject = join(fixtureRoot, "incomplete-project")
  mkdirSync(incompleteProject, { recursive: true })
  writeFileSync(join(incompleteProject, "usage.json"), JSON.stringify({ id: "incomplete", provider: "openai", model: "gpt-5.6-sol", usage: { output_tokens: 1, total_tokens: 1 } }))
  const incompleteReport = join(fixtureRoot, "incomplete-report.md")
  run([incompleteProject, "--project-only", "--output", incompleteReport])
  assert.match(readFileSync(incompleteReport, "utf8"), /\| openai \| n\/a \| n\/a \| 0 \|/)

  const unreadableProject = join(fixtureRoot, "unreadable-project")
  const blockedDirectory = join(unreadableProject, "blocked")
  mkdirSync(blockedDirectory, { recursive: true })
  writeFileSync(join(unreadableProject, "usage.json"), JSON.stringify({ id: "readable", provider: "openai", model: "gpt-5.6-sol", usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 } }))
  chmodSync(blockedDirectory, 0o000)
  try {
    const unreadableReport = join(fixtureRoot, "unreadable-report.md")
    const unreadableSummary = run([unreadableProject, "--project-only", "--output", unreadableReport])
    assert.equal(unreadableSummary.threads, 1)
    assert.match(readFileSync(unreadableReport, "utf8"), /Directory could not be scanned:/)
  } finally {
    chmodSync(blockedDirectory, 0o700)
  }

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

  const coworkNativeHome = join(fixtureRoot, "cowork-native")
  const coworkProject = join(fixtureRoot, "cowork-project")
  const coworkSessionDir = join(coworkNativeHome, "account", "workspace", "local_project-cowork")
  mkdirSync(coworkProject, { recursive: true })
  mkdirSync(dirname(coworkSessionDir), { recursive: true })
  writeFileSync(`${coworkSessionDir}.json`, JSON.stringify({ sessionId: "project-cowork", title: "Project Cowork fixture", userSelectedFolders: [coworkProject] }))
  const coworkRecord = (output, timestamp) => ({ timestamp, sessionId: "project-cowork", message: { id: "project-cowork-message", model: "claude-sonnet-4-6", usage: { input_tokens: 2, cache_creation_input_tokens: 10, cache_read_input_tokens: 20, output_tokens: output } } })
  writeJsonl(join(coworkSessionDir, "audit.jsonl"), [coworkRecord(5, "2026-01-01T10:00:00.000Z"), coworkRecord(255, "2026-01-01T10:01:00.000Z")])
  writeJsonl(join(coworkSessionDir, ".claude", "projects", "fixture", "subagents", "agent.jsonl"), [coworkRecord(255, "2026-01-01T10:01:00.000Z")])
  const emptyOpenCodeDb = join(fixtureRoot, "empty-opencode.db")
  const emptyDatabase = new DatabaseSync(emptyOpenCodeDb)
  emptyDatabase.exec("CREATE TABLE session (id TEXT, directory TEXT, cost REAL, tokens_input INTEGER, tokens_output INTEGER, tokens_reasoning INTEGER, tokens_cache_read INTEGER, tokens_cache_write INTEGER, model TEXT, time_created INTEGER, time_updated INTEGER)")
  emptyDatabase.close()
  const coworkReport = join(fixtureRoot, "cowork-project-report.md")
  const coworkSummary = run([coworkProject, "--codex-home", join(fixtureRoot, "cowork-empty-codex"), "--claude-home", join(fixtureRoot, "cowork-empty-claude"), "--cowork-home", coworkNativeHome, "--gemini-home", join(fixtureRoot, "cowork-empty-gemini"), "--cline-tasks", join(fixtureRoot, "cowork-empty-cline"), "--roo-tasks", join(fixtureRoot, "cowork-empty-roo"), "--opencode-db", emptyOpenCodeDb, "--output", coworkReport], threadRoot)
  assert.equal(coworkSummary.coworkSessions, 2)
  assert.equal(coworkSummary.threads, 1)
  assert.equal(coworkSummary.claudeDuplicatesRemoved, 2)
  const coworkMarkdown = readFileSync(coworkReport, "utf8")
  assert.match(coworkMarkdown, /\| Measured\/provider tokens \| 287 \|/)
  assert.match(coworkMarkdown, /Project Cowork fixture/)
  assert.match(coworkMarkdown, /claude-cowork \/ subscription-or-api-equivalent/)
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true })
}
