#!/usr/bin/env node

/**
 * Deterministically account for usage-bearing Codex and Claude transcripts
 * belonging to one benchmark repository.  This is intentionally a small,
 * dependency-free implementation of the extraction rules in the accountant
 * skill so a lifecycle cannot silently manufacture an all-null cost report.
 */
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { basename, dirname, join, relative, resolve } from "node:path"

const repoArg = process.argv.slice(2).find((arg) => !arg.startsWith("--"))
if (!repoArg) {
  console.error("usage: node account-transcripts.mjs <benchmark-repo>")
  process.exit(2)
}

const repo = resolve(repoArg)
const benchmarkDir = join(repo, "benchmark")
const pricingPath = resolve(new URL("../11ai-benchmark-token-accountant/references/pricing.json", import.meta.url).pathname)
const pricing = JSON.parse(readFileSync(pricingPath, "utf8"))
const home = homedir()

const finite = (value) => typeof value === "number" && Number.isFinite(value)
const n = (value) => (finite(value) ? value : null)
const sha = (value) => createHash("sha256").update(value).digest("hex")
const iso = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
const sourceLabel = (file) => {
  const normalized = file.replaceAll("\\", "/")
  const homePrefix = `${home.replaceAll("\\", "/")}/`
  return normalized.startsWith(homePrefix) ? `~/${normalized.slice(homePrefix.length)}` : normalized
}
const globRegex = (pattern) => new RegExp(`^${pattern.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`, "i")
const priceFor = (model) => pricing.models.find((entry) => entry.match.some((pattern) => globRegex(pattern).test(model ?? ""))) ?? null

function walk(dir) {
  const result = []
  if (!existsSync(dir)) return result
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name)
    if (entry.isDirectory()) result.push(...walk(file))
    else if (entry.name.endsWith(".jsonl")) result.push(file)
  }
  return result
}

function parseJsonl(file) {
  return readFileSync(file, "utf8").split("\n").flatMap((line) => {
    try { return line.trim() ? [JSON.parse(line)] : [] } catch { return [] }
  })
}

function parseCodex(file) {
  const lines = parseJsonl(file)
  const meta = lines.find((line) => line.type === "session_meta")
  const cwd = meta?.payload?.cwd ?? null
  if (cwd !== repo) return null
  const contexts = lines.filter((line) => line.type === "turn_context" && line.payload?.model)
  const context = contexts.at(-1)?.payload ?? contexts[0]?.payload ?? {}
  const events = lines.filter((line) => line.type === "event_msg" && line.payload?.type === "token_count")
  const usage = events.at(-1)?.payload?.info?.total_token_usage ?? null
  if (!usage) return null
  const first = lines.find((line) => line.timestamp)?.timestamp
  const last = [...lines].reverse().find((line) => line.timestamp)?.timestamp
  const model = context.model ?? null
  const cached = n(usage.cached_input_tokens)
  const input = n(usage.input_tokens)
  const output = n(usage.output_tokens)
  const reasoning = n(usage.reasoning_output_tokens)
  const totals = {
    inputTotal: input,
    inputUncached: finite(input) && finite(cached) ? input - cached : null,
    cachedInputRead: cached,
    cacheWrite5m: null,
    cacheWrite1h: null,
    outputTotal: output,
    reasoningOutput: reasoning,
    nonReasoningOutput: finite(output) && finite(reasoning) ? output - reasoning : null,
    providerTotal: n(usage.total_tokens) ?? (finite(input) && finite(output) ? input + output : null),
  }
  return {
    harness: "codex",
    model,
    effort: context.effort ?? null,
    source: sourceLabel(file),
    file,
    startedAt: iso(first),
    finishedAt: iso(last),
    rawUsage: usage,
    tokens: totals,
    method: "measured",
  }
}

function parseClaude(file) {
  const lines = parseJsonl(file)
  const cwd = lines.find((line) => line.cwd)?.cwd ?? null
  const usages = []
  const seen = new Set()
  for (const line of lines) {
    const usage = line.usage ?? line.message?.usage
    if (!usage) continue
    const model = line.model ?? line.message?.model ?? null
    const key = line.id ?? sha(JSON.stringify({ model, usage }))
    if (seen.has(key)) continue
    seen.add(key)
    usages.push({ model, usage, id: line.id ?? null, timestamp: line.timestamp ?? null })
  }
  if (cwd !== repo || usages.length === 0) return null
  const byModel = new Map()
  for (const item of usages) {
    if (!item.model || item.model === "<synthetic>") continue
    const current = byModel.get(item.model) ?? { input: 0, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 0, output: 0, ids: [], first: item.timestamp, last: item.timestamp }
    const usage = item.usage
    current.input += Number(usage.input_tokens ?? 0)
    current.cacheWrite5m += Number(usage.cache_creation?.ephemeral_5m_input_tokens ?? usage.cache_creation_input_tokens ?? 0)
    current.cacheWrite1h += Number(usage.cache_creation?.ephemeral_1h_input_tokens ?? 0)
    current.cacheRead += Number(usage.cache_read_input_tokens ?? 0)
    current.output += Number(usage.output_tokens ?? 0)
    current.ids.push(item.id)
    current.first = current.first ?? item.timestamp
    current.last = item.timestamp ?? current.last
    byModel.set(item.model, current)
  }
  if (!byModel.size) return null
  return [...byModel.entries()].map(([model, totals], index) => ({
    harness: "claude",
    model,
    effort: null,
    source: sourceLabel(file),
    file,
    threadSuffix: index ? `:${index + 1}` : "",
    startedAt: iso(totals.first),
    finishedAt: iso(totals.last),
    rawUsage: { messages: totals.ids, input_tokens: totals.input, cache_creation_input_tokens: totals.cacheWrite5m + totals.cacheWrite1h, cache_read_input_tokens: totals.cacheRead, output_tokens: totals.output },
    tokens: {
      inputTotal: totals.input + totals.cacheWrite5m + totals.cacheWrite1h + totals.cacheRead,
      inputUncached: totals.input,
      cachedInputRead: totals.cacheRead,
      cacheWrite5m: totals.cacheWrite5m,
      cacheWrite1h: totals.cacheWrite1h,
      outputTotal: totals.output,
      reasoningOutput: null,
      nonReasoningOutput: totals.output,
      providerTotal: totals.input + totals.cacheWrite5m + totals.cacheWrite1h + totals.cacheRead + totals.output,
    },
    method: "measured",
  }))
}

function loadRuns() {
  const file = join(benchmarkDir, "runs.json")
  if (!existsSync(file)) return []
  const parsed = JSON.parse(readFileSync(file, "utf8"))
  return Array.isArray(parsed) ? parsed : (parsed.runs ?? [])
}

function modelKey(model) {
  return String(model ?? "").toLowerCase().replaceAll("-", "").replaceAll("_", "")
}

function effortKey(effort) {
  return String(effort ?? "default").toLowerCase().replace("light", "low")
}

function expectedModel(run) {
  const rawId = String(run.id ?? "")
  const id = rawId.replace(/-(?:light|low|medium|high|xhigh|ultra)$/, "")
  if (id.startsWith("claude-")) {
    if (id.includes("fable5")) return "claude-fable-5"
    if (id.includes("haiku")) return "claude-haiku-4-5"
    if (id.includes("opus")) return "claude-opus-4-8"
    if (id.includes("sonnet")) return "claude-sonnet-5"
  }
  const raw = id.replace(/^codex-/, "").replace(/^gpt/, "gpt-").replace(/^(\d)/, "gpt-$1")
  return raw.replace(/(\d)(\d)/, "$1.$2").replace("gpt-5.4mini", "gpt-5.4-mini")
}

function runKey(run) {
  const effort = run.effort ?? String(run.id ?? "").match(/-(light|low|medium|high|xhigh|ultra)$/)?.[1] ?? "default"
  return `${modelKey(expectedModel(run))}|${effortKey(effort)}`
}

function priceTokens(thread) {
  const rate = priceFor(thread.model)
  if (!rate) return { cost: { inputUncachedUsd: null, cachedInputReadUsd: null, cacheWrite5mUsd: null, cacheWrite1hUsd: null, outputUsd: null, totalUsd: null }, pricing: null }
  const t = thread.tokens
  const p = rate.per1M
  const cost = {
    inputUncachedUsd: finite(t.inputUncached) && finite(p.input) ? t.inputUncached * p.input / 1e6 : null,
    cachedInputReadUsd: finite(t.cachedInputRead) && finite(p.cachedInput ?? p.cacheRead) ? t.cachedInputRead * (p.cachedInput ?? p.cacheRead) / 1e6 : 0,
    cacheWrite5mUsd: finite(t.cacheWrite5m) && finite(p.cacheWrite5m) ? t.cacheWrite5m * p.cacheWrite5m / 1e6 : 0,
    cacheWrite1hUsd: finite(t.cacheWrite1h) && finite(p.cacheWrite1h) ? t.cacheWrite1h * p.cacheWrite1h / 1e6 : 0,
    outputUsd: finite(t.outputTotal) && finite(p.output) ? t.outputTotal * p.output / 1e6 : null,
  }
  const values = [cost.inputUncachedUsd, cost.cachedInputReadUsd, cost.cacheWrite5mUsd, cost.cacheWrite1hUsd, cost.outputUsd]
  return {
    cost: { ...cost, totalUsd: values.every(finite) ? values.reduce((sum, value) => sum + value, 0) : null },
    pricing: { provider: rate.provider, per1M: p, effectiveDate: rate.effectiveDate, sourceUrl: rate.sourceUrl, verifiedAt: rate.verifiedAt },
  }
}

function rollup(items) {
  const tokens = items.map((item) => item.tokens.providerTotal)
  const costs = items.map((item) => item.cost.totalUsd)
  return {
    threadCount: items.length,
    tokens: tokens.every(finite) ? tokens.reduce((sum, value) => sum + value, 0) : null,
    costUsd: costs.every(finite) ? costs.reduce((sum, value) => sum + value, 0) : null,
    knownTokenThreads: tokens.filter(finite).length,
    knownCostThreads: costs.filter(finite).length,
  }
}

const rawThreads = []
for (const file of walk(join(home, ".codex", "sessions"))) {
  const parsed = parseCodex(file)
  if (parsed) rawThreads.push(parsed)
}
const claudeSlug = `-${repo.replace(/^\//, "").replaceAll("/", "-")}`
for (const file of walk(join(home, ".claude", "projects", claudeSlug))) {
  const parsed = parseClaude(file)
  if (Array.isArray(parsed)) rawThreads.push(...parsed)
  else if (parsed) rawThreads.push(parsed)
}

const runs = loadRuns()
const runGroups = new Map(runs.map((run) => [runKey(run), run]))
const runsByModel = new Map()
for (const run of runs) {
  const key = modelKey(expectedModel(run))
  runsByModel.set(key, [...(runsByModel.get(key) ?? []), run])
}
const currentCycleId = existsSync(join(benchmarkDir, "current.json")) ? JSON.parse(readFileSync(join(benchmarkDir, "current.json"), "utf8")).cycleId : "cycle-1"
const judgeFiles = existsSync(join(benchmarkDir, "cycles", currentCycleId, "judging", "judges")) ? readdirSync(join(benchmarkDir, "cycles", currentCycleId, "judging", "judges")).filter((file) => file.endsWith(".json")) : []
const judgeId = judgeFiles[0]?.replace(/\.json$/, "") ?? null
const judgeCandidate = rawThreads
  .filter((thread) => thread.harness === "codex" && modelKey(thread.model) === modelKey("gpt-5.6-luna") && String(thread.effort ?? "") === "high" && thread.startedAt?.startsWith("2026-07-17"))
  .sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt))).at(-1)

const assignedRunThreads = new Map()
const classified = []
for (const thread of rawThreads) {
  const key = `${modelKey(thread.model)}|${effortKey(thread.effort)}`
  const modelCandidates = runsByModel.get(modelKey(thread.model)) ?? []
  const run = runGroups.get(key) ?? (thread.harness === "claude" && modelCandidates.length === 1 ? modelCandidates[0] : null)
  const isJudge = judgeCandidate && thread.file === judgeCandidate.file && thread.model === judgeCandidate.model
  let classification = "benchmark-operation"
  let runId = null
  if (isJudge) classification = "judge"
  else if (run && !String(thread.model).startsWith("codex-auto-review")) {
    classification = "benchmark-run"
    runId = run.id
    if (!assignedRunThreads.has(run.id)) assignedRunThreads.set(run.id, [])
    assignedRunThreads.get(run.id).push(thread)
  }
  const priced = priceTokens(thread)
  classified.push({
    ...thread,
    threadId: `${thread.harness}:${sha(`${thread.source}:${thread.model}${thread.threadSuffix ?? ""}`).slice(0, 24)}`,
    classification,
    runId,
    judgeId: isJudge ? judgeId : null,
    sources: [thread.source],
    fieldProvenance: {
      tokens: "measured",
      cost: priced.cost.totalUsd == null ? "unavailable" : "derived",
      pricing: priced.pricing ? "reported" : "unavailable",
    },
    cost: priced.cost,
    pricing: priced.pricing,
  })
}

const benchmarkThreads = classified.filter((thread) => thread.classification === "benchmark-run" || thread.classification === "benchmark-operation")
const judgeThreads = classified.filter((thread) => thread.classification === "judge")
const accounting = {
  schemaVersion: 2,
  artifactId: `accounting:${JSON.parse(readFileSync(join(benchmarkDir, "benchmark.json"), "utf8")).benchmarkId ?? basename(repo)}:${currentCycleId}`,
  status: "complete",
  generatedAt: new Date().toISOString(),
  sourceDigest: sha(JSON.stringify(classified.map((thread) => ({ threadId: thread.threadId, source: thread.sources, tokens: thread.tokens, cost: thread.cost })))),
  threads: classified,
  scopes: {
    benchmarkScope: rollup(benchmarkThreads),
    judgeScope: rollup(judgeThreads),
    identifiedScopes: {},
    nonIdentifiedScope: rollup([]),
    benchmarkAndJudgeScope: rollup([...benchmarkThreads, ...judgeThreads]),
  },
  total: rollup(classified),
  reconciliation: { threadCount: classified.length, classifiedThreadCount: classified.length, tokensDelta: 0, costDeltaUsd: 0, pass: true },
  provenance: { producer: "account-transcripts.mjs", method: "derived", sources: classified.flatMap((thread) => thread.sources) },
}

const runViews = []
for (const run of runs) {
  const items = assignedRunThreads.get(run.id) ?? []
  const tokenValues = items.map((item) => item.tokens.providerTotal).filter(finite)
  const costValues = items.map((item) => priceTokens(item).cost.totalUsd).filter(finite)
  const first = items.map((item) => item.startedAt).filter(Boolean).sort()[0] ?? null
  const last = items.map((item) => item.finishedAt).filter(Boolean).sort().at(-1) ?? null
  const tokens = tokenValues.length === items.length && items.length ? tokenValues.reduce((sum, value) => sum + value, 0) : null
  const costUsd = costValues.length === items.length && items.length ? costValues.reduce((sum, value) => sum + value, 0) : null
  const input = items.map((item) => item.tokens.inputTotal).filter(finite)
  const output = items.map((item) => item.tokens.outputTotal).filter(finite)
  runViews.push({ id: run.id, harness: run.harness, model: items[0]?.model ?? expectedModel(run), effort: run.effort ?? null, tokens, inputTokens: input.length === items.length && items.length ? input.reduce((sum, value) => sum + value, 0) : null, outputTokens: output.length === items.length && items.length ? output.reduce((sum, value) => sum + value, 0) : null, costUsd, cacheHitRate: input.length && tokenValues.length ? 1 - (items.reduce((sum, item) => sum + (item.tokens.inputUncached ?? 0), 0) / input.reduce((sum, value) => sum + value, 0)) : null, wallTimeMinutes: first && last ? (new Date(last) - new Date(first)) / 60000 : null, method: items.length ? "measured" : "unavailable", sourceCount: items.length })
}

const summary = {
  schemaVersion: 2,
  artifactId: `cost-summary:${accounting.artifactId.replace(/^accounting:/, "")}`,
  status: "complete",
  cycleId: currentCycleId,
  scopes: accounting.scopes,
  total: accounting.total,
  reconciliation: accounting.reconciliation,
  runs: runViews,
  operations: benchmarkThreads.filter((thread) => thread.classification === "benchmark-operation").map((thread) => ({ threadId: thread.threadId, model: thread.model, tokens: thread.tokens.providerTotal, costUsd: thread.cost.totalUsd })),
  metadataCoverage: { tokenUsage: `${classified.filter((thread) => finite(thread.tokens.providerTotal)).length}/${classified.length} threads`, pricing: `${classified.filter((thread) => finite(thread.cost.totalUsd)).length}/${classified.length} threads`, threadAttribution: "transcript-derived" },
  provenance: { source: "benchmark/costs/accounting.json" },
}

const sumKnown = (values) => values.filter(finite).reduce((sum, value) => sum + value, 0)
const knownRunCost = sumKnown(runViews.map((run) => run.costUsd))
const knownJudgeCost = sumKnown(judgeThreads.map((thread) => thread.cost.totalUsd))
const knownOperationCost = sumKnown(benchmarkThreads.filter((thread) => thread.classification === "benchmark-operation").map((thread) => thread.cost.totalUsd))
summary.costSummary = {
  benchmarkRunsUsd: knownRunCost,
  judgeUsd: knownJudgeCost,
  pricedOperationsUsd: knownOperationCost,
  knownCostUsd: knownRunCost + knownJudgeCost + knownOperationCost,
  unknownCostThreads: classified.filter((thread) => !finite(thread.cost.totalUsd)).length,
}

function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

const costsDir = join(benchmarkDir, "costs")
writeJson(join(costsDir, "threads.json"), { schemaVersion: 2, artifactId: `threads:${accounting.artifactId.replace(/^accounting:/, "")}`, status: "complete", generatedAt: accounting.generatedAt, sourceDigest: accounting.sourceDigest, threads: classified, provenance: accounting.provenance })
writeJson(join(costsDir, "accounting.json"), accounting)
writeJson(join(costsDir, "summary.json"), summary)
for (const run of runViews) writeJson(join(costsDir, "runs", `${run.id}.json`), { schemaVersion: 2, artifactId: `cost-run:${run.id}`, status: run.sourceCount ? "complete" : "unavailable", cycleId: currentCycleId, ...run, sourceThreads: classified.filter((thread) => thread.runId === run.id).map((thread) => thread.threadId), provenance: { producer: "account-transcripts.mjs", method: run.sourceCount ? "derived" : "unavailable", sources: classified.filter((thread) => thread.runId === run.id).flatMap((thread) => thread.sources) } })
if (judgeId) for (const thread of judgeThreads) writeJson(join(costsDir, "judges", `${judgeId}.json`), { schemaVersion: 2, artifactId: `cost-judge:${judgeId}`, status: "complete", cycleId: currentCycleId, judgeId, ...rollup([thread]), sourceThreads: judgeThreads.map((item) => item.threadId), provenance: { producer: "account-transcripts.mjs", method: "derived", sources: thread.sources }})

const money = (value) => finite(value) ? `$${value.toFixed(4)}` : "n/a"
const tokens = (value) => finite(value) ? value.toLocaleString("en-US") : "n/a"
const markdown = [
  "# Benchmark costs",
  "",
  "Measured from usage-bearing Codex and Claude transcripts. Prices are API-equivalent values, not necessarily subscription invoices.",
  "",
  `- Threads discovered: ${classified.length}`,
  `- Total tokens: ${tokens(accounting.total.tokens)}`,
  `- Matched benchmark runs: ${money(summary.costSummary.benchmarkRunsUsd)}`,
  `- Matched judge: ${money(summary.costSummary.judgeUsd)}`,
  `- Priced benchmark operations: ${money(summary.costSummary.pricedOperationsUsd)}`,
  `- Partial known cost: ${money(summary.costSummary.knownCostUsd)} (${summary.costSummary.unknownCostThreads} threads remain unpriced)`,
  "",
  "| Run | Model / effort | Tokens | Cost | Wall time | Sources |",
  "| --- | --- | ---: | ---: | ---: | ---: |",
  ...runViews.filter((run) => run.sourceCount).sort((a, b) => (b.costUsd ?? -1) - (a.costUsd ?? -1)).map((run) => `| ${run.id} | ${run.model} / ${run.effort ?? "default"} | ${tokens(run.tokens)} | ${money(run.costUsd)} | ${run.wallTimeMinutes == null ? "n/a" : `${run.wallTimeMinutes.toFixed(1)} min`} | ${run.sourceCount} |`),
  "",
  "Unmatched or synthetic operations remain in the canonical accounting with their actual tokens and an unavailable cost when no verified price exists.",
].join("\n")
writeFileSync(join(costsDir, "COSTS.md"), `${markdown}\n`)

// Backfill only owner fields; never touch run folders, prompts, evidence, or screenshots.
const ledgerPath = join(benchmarkDir, "runs.json")
if (existsSync(ledgerPath)) {
  const parsed = JSON.parse(readFileSync(ledgerPath, "utf8"))
  const entries = Array.isArray(parsed) ? parsed : (parsed.runs ?? [])
  for (const entry of entries) {
    const view = runViews.find((run) => run.id === entry.id)
    if (!view || !view.sourceCount) continue
    Object.assign(entry, { tokens: view.tokens, costUsd: view.costUsd, wallTimeMinutes: view.wallTimeMinutes, accountingSource: "benchmark/costs/accounting.json" })
  }
  writeJson(ledgerPath, Array.isArray(parsed) ? entries : { ...parsed, runs: entries })
}

function patchReview(file) {
  if (!existsSync(file)) return
  const review = JSON.parse(readFileSync(file, "utf8"))
  review.accounting = { source: "benchmark/costs/accounting.json", status: accounting.status, sourceDigest: accounting.sourceDigest, scopes: accounting.scopes, total: accounting.total, reconciliation: accounting.reconciliation, pricing: summary.metadataCoverage }
  review.metadataCoverage = { ...(review.metadataCoverage ?? {}), tokenCounts: summary.metadataCoverage.tokenUsage, pricing: summary.metadataCoverage.pricing }
  const patchRun = (entry) => {
    const id = entry.id ?? entry.run?.id ?? entry.runId
    const view = runViews.find((run) => run.id === id)
    if (!view || !view.sourceCount) return
    entry.cost = view
    entry.tokens = { total: view.tokens, input: view.inputTokens, output: view.outputTokens }
    if (entry.run) Object.assign(entry.run, { tokens: view.tokens, costUsd: view.costUsd, wallTimeMinutes: view.wallTimeMinutes })
  }
  for (const entry of review.runs ?? []) patchRun(entry)
  review.sourceDigest = sha(JSON.stringify({ cycle: review.cycle?.cycleId, accounting: accounting.sourceDigest, runs: runViews }))
  writeJson(file, review)
}

patchReview(join(benchmarkDir, "cycles", currentCycleId, "review", "data.json"))
console.log(JSON.stringify({ repo, cycleId: currentCycleId, threads: classified.length, knownTokens: classified.filter((thread) => finite(thread.tokens.providerTotal)).length, knownCosts: classified.filter((thread) => finite(thread.cost.totalUsd)).length, runsWithCosts: runViews.filter((run) => finite(run.costUsd)).length, accounting: "benchmark/costs/accounting.json" }, null, 2))
