import assert from "node:assert/strict"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const fixtureRoot = mkdtempSync(join(tmpdir(), "11ai-llm-cost-single-thread-"))
const sourceSkillRoot = fileURLToPath(new URL("..", import.meta.url))
const detachedSkillRoot = join(fixtureRoot, "standalone-skill")
cpSync(sourceSkillRoot, detachedSkillRoot, { recursive: true })
const analyzer = join(detachedSkillRoot, "scripts", "analyze-llm-cost-single-thread.mjs")

function writeJsonl(file, records) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`)
}

function run(args, cwd, env = {}) {
  const result = spawnSync(process.execPath, [analyzer, ...args], { encoding: "utf8", cwd, env: { ...process.env, ...env } })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

try {
  assert.ok(readFileSync(join(detachedSkillRoot, "references", "pricing.json"), "utf8").includes('"models"'))
  assert.match(readFileSync(join(detachedSkillRoot, "references", "harnesses.md"), "utf8"), /^# Native harness stores$/m)

  const project = join(fixtureRoot, "project")
  const threadRoot = join(fixtureRoot, "thread-root")
  const codexHome = join(fixtureRoot, "codex")
  const claudeHome = join(fixtureRoot, "claude")
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

  writeJsonl(join(codexHome, "sessions", "selected.jsonl"), [
    { timestamp: "2026-07-19T10:00:00.000Z", type: "session_meta", payload: { id: "selected-thread", cwd: project } },
    { timestamp: "2026-07-19T10:02:00.000Z", type: "turn_context", payload: { model: "gpt-5.6-sol", effort: "ultra" } },
    { timestamp: "2026-07-19T10:10:00.000Z", type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 1000, cached_input_tokens: 400, output_tokens: 100, reasoning_output_tokens: 30, total_tokens: 1100 } } } },
  ])
  writeJsonl(join(codexHome, "sessions", "child.jsonl"), [
    { timestamp: "2026-07-19T10:03:00.000Z", type: "session_meta", payload: { id: "child-thread", cwd: project, thread_source: "subagent", parent_thread_id: "selected-thread", source: { subagent: { thread_spawn: { parent_thread_id: "selected-thread", depth: 1 } } } } },
    { timestamp: "2026-07-19T10:04:00.000Z", type: "turn_context", payload: { model: "gpt-5.6-sol", effort: "high" } },
    { timestamp: "2026-07-19T10:05:00.000Z", type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 246900000, cached_input_tokens: 0, output_tokens: 0, reasoning_output_tokens: 0, total_tokens: 246900000 } } } },
  ])
  writeJsonl(join(codexHome, "sessions", "grandchild-without-usage.jsonl"), [
    { timestamp: "2026-07-19T10:04:15.000Z", type: "session_meta", payload: { id: "grandchild-thread", cwd: project, thread_source: "subagent", parent_thread_id: "child-thread", source: { subagent: { thread_spawn: { parent_thread_id: "child-thread", depth: 2 } } } } },
    { timestamp: "2026-07-19T10:04:45.000Z", type: "turn_context", payload: { model: "gpt-5.6-sol", effort: "medium" } },
  ])
  writeJsonl(join(codexHome, "sessions", "other.jsonl"), [
    { timestamp: "2026-07-19T11:00:00.000Z", type: "session_meta", payload: { id: "other-thread", cwd: project } },
    { timestamp: "2026-07-19T11:01:00.000Z", type: "turn_context", payload: { model: "gpt-5.6-sol", effort: "low" } },
    { timestamp: "2026-07-19T11:02:00.000Z", type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 9999, output_tokens: 999, total_tokens: 10998 } } } },
  ])
  writeJsonl(join(codexHome, "sessions", "other-child.jsonl"), [
    { timestamp: "2026-07-19T11:03:00.000Z", type: "session_meta", payload: { id: "other-child-thread", cwd: project, thread_source: "subagent", parent_thread_id: "other-thread", source: { subagent: { thread_spawn: { parent_thread_id: "other-thread", depth: 1 } } } } },
    { timestamp: "2026-07-19T11:04:00.000Z", type: "turn_context", payload: { model: "gpt-5.6-sol", effort: "low" } },
    { timestamp: "2026-07-19T11:05:00.000Z", type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 500, output_tokens: 50, total_tokens: 550 } } } },
  ])
  writeJsonl(join(claudeHome, "projects", "fixture", "claude.jsonl"), [
    { timestamp: "2026-07-19T12:00:00.000Z", cwd: project, sessionId: "claude-single", message: { id: "claude-message-1", model: "claude-sonnet-5", output_config: { effort: "ultracode" }, usage: { input_tokens: 200, cache_creation_input_tokens: 20, cache_read_input_tokens: 80, output_tokens: 50 } } },
  ])

  const summary = run([project, "--codex-home", codexHome, "--claude-home", join(fixtureRoot, "no-claude"), "--gemini-home", join(fixtureRoot, "no-gemini"), "--cline-tasks", join(fixtureRoot, "no-cline"), "--roo-tasks", join(fixtureRoot, "no-roo")], threadRoot, { CODEX_THREAD_ID: "selected-thread" })
  assert.equal(summary.threadSelector, "selected-thread")
  assert.equal(summary.threads, 3)
  assert.equal(summary.rootThreads, 1)
  assert.equal(summary.subagentThreads, 2)
  assert.equal(summary.knownTokens, 2)
  assert.equal(summary.knownCosts, 2)
  assert.equal(summary.wallTimeMs, 750000)
  assert.equal(summary.activeTimeMs, 570000)
  assert.match(basename(summary.outputDirectory), /^11ai-llm-cost-single-thread-reports-\d{4}-\d{2}-\d{2}T/)
  assert.match(basename(summary.markdownReport), /^11ai-llm-cost-single-thread-\d{4}-\d{2}-\d{2}T.*\.md$/)

  const markdown = readFileSync(summary.markdownReport, "utf8")
  const html = readFileSync(summary.htmlReport, "utf8")
  assert.match(markdown, /^# Single-Thread LLM Cost Report\n\n_powered by \[11ai-llm-cost-single-thread\]\(https:\/\/ai\.rj11\.io\/skills\/11ai-llm-cost-single-thread\)\._\n\n/)
  assert.match(markdown, /^# Single-Thread LLM Cost Report$/m)
  assert.match(markdown, /^## Cost by model by effort$/m)
  assert.match(markdown, /\| Pricing catalog \| bundled default \(version 2, updated 2026-07-26\) \|/)
  assert.doesNotMatch(markdown, /^### Models requiring a pricing update$/m)
  const levelTwoHeadings = markdown.match(/^## .+$/gm) ?? []
  assert.equal(levelTwoHeadings[levelTwoHeadings.indexOf("## Cost by model") + 1], "## Cost by model by effort")
  assert.equal(levelTwoHeadings[levelTwoHeadings.indexOf("## Cost by root and child folder") + 1], "## Totals")
  assert.equal(levelTwoHeadings[levelTwoHeadings.indexOf("## Thread detail") + 1], "## Scan coverage")
  assert.equal(levelTwoHeadings[levelTwoHeadings.indexOf("## Scan coverage") + 1], "## Pricing coverage")
  assert.match(markdown, /\| openai \/ gpt-5\.6-sol \| ultra \| \$\d+\.\d+ \| 1,000 \| 400 \| \$\d+\.\d+ \| 100 \| \$\d+\.\d+ \| 1,100 \| \$\d+\.\d+ \| 1 \| \$\d+\.\d+ \|/)
  assert.match(markdown, /\| Selected root threads \| 1 \|/)
  assert.match(markdown, /\| Included sub-agent threads \| 2 \|/)
  assert.match(markdown, /\| Sum of thread wall time \| 12m 30s \|/)
  assert.match(markdown, /\| Estimated active time \| 9m 30s \|/)
  assert.match(markdown, /\| Provider \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Priced \| Unpriced \|/)
  assert.match(markdown, /\| Harness \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Reported-cost sum \| Average tokens \/ thread \| Priced \| Unpriced \|/)
  assert.match(markdown, /\| Provider \/ model \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \|/)
  assert.match(markdown, /\| Provider \/ model \| Effort \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \|/)
  assert.match(markdown, /\| Folder \| Cost \| Input \| Cached \| Input cost \| Output \| Output cost \| Tokens \| Cost \/ 1M tokens \| Threads \| Cost \/ thread \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Priced \| Unpriced \|/)
  assert.match(markdown, /\| Thread \| Relationship \| Parent thread \| Source \| Provider \/ model \/ effort \| Input \| Cached \| Output \| Tokens \| Selected cost \| Active time \| Cost \/ active hour \| Wall time \| Cost \/ wall hour \| Harness reported \| Method \|/)
  assert.match(markdown, /\| Cost \/ thread \| \$[\d,]+\./)
  assert.match(markdown, /\$1,234\.\d{4}/)
  assert.match(markdown, /Sub-agent \(depth 1\)/)
  assert.match(markdown, /Sub-agent \(depth 2\)/)
  assert.match(markdown, /child\.jsonl/)
  assert.match(markdown, /grandchild-without-usage\.jsonl/)
  assert.doesNotMatch(markdown, /other\.jsonl/)
  assert.doesNotMatch(markdown, /other-child\.jsonl/)
  assert.ok(markdown.endsWith("_LLM token cost analysis by [11ai-llm-cost-single-thread](https://ai.rj11.io/skills/11ai-llm-cost-single-thread)._\n"))
  assert.ok(markdown.lastIndexOf("> Generated ") > markdown.indexOf("## Methodology"))
  assert.ok(markdown.lastIndexOf("> Generated ") < markdown.lastIndexOf("_LLM token cost analysis"))
  assert.match(html, /<h1>Single-Thread LLM Cost Report <span class="powered-by"><a href="https:\/\/ai\.rj11\.io\/skills\/11ai-llm-cost-single-thread" target="_blank" rel="noopener noreferrer">powered by 11ai-llm-cost-single-thread<\/a><\/span><\/h1>/)
  assert.equal((html.match(/powered by 11ai-llm-cost-single-thread/g) ?? []).length, 1)
  assert.ok(html.indexOf('class="section-title">Cost by root and child folder</span>') < html.indexOf('class="section-title">Totals</span>'))
  assert.ok(html.indexOf('class="section-title">Thread detail</span>') < html.indexOf('class="section-title">Scan coverage</span>'))
  assert.ok(html.indexOf('class="section-title">Scan coverage</span>') < html.indexOf('class="section-title">Pricing coverage</span>'))
  assert.match(html, /<a href="https:\/\/ai\.rj11\.io\/skills\/11ai-llm-cost-single-thread" target="_blank" rel="noopener noreferrer">11ai-llm-cost-single-thread<\/a>/)
  assert.doesNotMatch(html, /<details\b[^>]*\bopen\b[^>]*>/)
  assert.equal((html.match(/<th\b/g) ?? []).length, (html.match(/class="sort-button"/g) ?? []).length)
  assert.ok((html.match(/<th scope="col" aria-sort="none">/g) ?? []).length > 0)
  assert.doesNotMatch(html, /<th[^>]+aria-sort="(?:ascending|descending)"/)
  assert.match(html, /const direction = header\.getAttribute\("aria-sort"\) === "descending" \? "ascending" : "descending"/)
  assert.match(html, /body\.replaceChildren\(\.\.\.sortable, \.\.\.totals\)/)
  assert.match(html, /main \{ width: 100%; margin: 0; padding: 16px 20px 24px; background: transparent; \}/)
  assert.doesNotMatch(html, /main \{[^}]*box-shadow/)
  assert.ok(html.lastIndexOf("</details>") < html.indexOf('<blockquote class="generation-message">'))
  assert.ok(html.indexOf('<blockquote class="generation-message">') < html.indexOf('<p class="signature">'))

  const claudeSummary = run([project, "--thread", "claude-single", "--codex-home", codexHome, "--claude-home", claudeHome, "--gemini-home", join(fixtureRoot, "no-gemini"), "--cline-tasks", join(fixtureRoot, "no-cline"), "--roo-tasks", join(fixtureRoot, "no-roo")], threadRoot)
  assert.equal(claudeSummary.threads, 1)
  assert.match(readFileSync(claudeSummary.markdownReport, "utf8"), /\| anthropic \/ claude-sonnet-5 \| xhigh \|/)

  writeJsonl(join(claudeHome, "projects", "fixture", "unpriced.jsonl"), [
    { timestamp: "2026-07-19T12:10:00.000Z", cwd: project, sessionId: "claude-unpriced", message: { id: "claude-unpriced-message", model: "claude-unpriced-9", usage: { input_tokens: 100, cache_creation_input_tokens: 0, cache_read_input_tokens: 50, output_tokens: 10 } } },
  ])
  const unpricedSummary = run([project, "--thread", "claude-unpriced", "--codex-home", codexHome, "--claude-home", claudeHome, "--gemini-home", join(fixtureRoot, "no-gemini"), "--cline-tasks", join(fixtureRoot, "no-cline"), "--roo-tasks", join(fixtureRoot, "no-roo")], threadRoot)
  assert.equal(unpricedSummary.threads, 1)
  assert.equal(unpricedSummary.knownCosts, 0)
  const unpricedMarkdown = readFileSync(unpricedSummary.markdownReport, "utf8")
  const unpricedHtml = readFileSync(unpricedSummary.htmlReport, "utf8")
  assert.match(unpricedMarkdown, /^### Models requiring a pricing update$/m)
  assert.match(unpricedMarkdown, /\| anthropic \/ claude-unpriced-9 \| 1 \| 150 \| 50 \| 10 \| 160 \|/)
  assert.match(unpricedHtml, /<a href="https:\/\/ai\.rj11\.io\/skills\/11ai-llm-cost-pricing-update" target="_blank" rel="noopener noreferrer">11ai-llm-cost-pricing-update<\/a>/)
  const removedPricingOption = spawnSync(process.execPath, [analyzer, project, "--thread", "selected-thread", "--pricing", join(project, "llm-pricing.json")], { encoding: "utf8", cwd: threadRoot })
  assert.notEqual(removedPricingOption.status, 0)
  assert.match(removedPricingOption.stderr, /unknown argument: --pricing/)

  const selectorProject = join(fixtureRoot, "selector-project")
  const selectedPath = join(selectorProject, "a", "session.jsonl")
  const duplicateBasenamePath = join(selectorProject, "b", "session.jsonl")
  writeJsonl(selectedPath, [{ id: "path-thread-a", provider: "openai", model: "gpt-5.6-sol", usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 } }])
  writeJsonl(duplicateBasenamePath, [{ id: "path-thread-b", provider: "openai", model: "gpt-5.6-sol", usage: { input_tokens: 2, output_tokens: 1, total_tokens: 3 } }])
  const pathSummary = run([selectorProject, "--project-only", "--thread", selectedPath, "--output", join(fixtureRoot, "path-selector.md")], threadRoot)
  assert.equal(pathSummary.threads, 1)
  assert.match(readFileSync(pathSummary.markdownReport, "utf8"), /a\/session\.jsonl/)
  assert.doesNotMatch(readFileSync(pathSummary.markdownReport, "utf8"), /b\/session\.jsonl/)

  const unmatched = spawnSync(process.execPath, [analyzer, project, "--thread", "missing-thread", "--codex-home", codexHome], { encoding: "utf8", cwd: threadRoot })
  assert.notEqual(unmatched.status, 0)
  assert.match(unmatched.stderr, /no recognized thread matched selector: missing-thread/)

  const missingSelector = spawnSync(process.execPath, [analyzer, project, "--codex-home", codexHome], { encoding: "utf8", cwd: threadRoot, env: { ...process.env, CODEX_THREAD_ID: "" } })
  assert.notEqual(missingSelector.status, 0)
  assert.match(missingSelector.stderr, /no thread selector is available/)
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true })
}
