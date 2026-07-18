#!/usr/bin/env node

import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, extname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const argv = process.argv.slice(2)
const positional = argv.find((arg) => !arg.startsWith("--"))
const option = (name) => {
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] : null
}

if (argv.includes("--help")) {
  console.log("usage: node analyze-llm-cost.mjs [root-folder] [--pricing pricing.json] [--output LLM_COST.md]")
  process.exit(0)
}

const root = resolve(positional ?? ".")
const output = resolve(option("--output") ?? join(root, "LLM_COST.md"))
if (!existsSync(root) || !statSync(root).isDirectory()) throw new Error(`root folder does not exist or is not a directory: ${root}`)

const skillRoot = fileURLToPath(new URL("..", import.meta.url))
const pricingCandidates = [
  option("--pricing") ? resolve(option("--pricing")) : null,
  join(root, "llm-pricing.json"),
  join(root, ".llm-cost", "pricing.json"),
  join(skillRoot, "references", "pricing.json"),
].filter(Boolean)
if (option("--pricing") && !existsSync(resolve(option("--pricing")))) throw new Error(`pricing file does not exist: ${resolve(option("--pricing"))}`)
const pricingPath = pricingCandidates.find((file) => existsSync(file))
const pricing = pricingPath ? JSON.parse(readFileSync(pricingPath, "utf8")) : { models: [] }

const SKIP_DIRS = new Set([
  ".git", ".hg", ".svn", "node_modules", ".next", ".turbo", ".cache", ".parcel-cache",
  "coverage", "dist", "build", "out", "vendor", ".venv", "venv", "__pycache__",
])
const JSON_EXTENSIONS = new Set([".json", ".jsonl", ".ndjson"])
const finite = (value) => typeof value === "number" && Number.isFinite(value)
const number = (value) => {
  if (finite(value)) return value
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value)
  return null
}
const sha = (value) => createHash("sha256").update(value).digest("hex")
const iso = (value) => {
  if (!value) return null
  const date = typeof value === "number" && value < 1_000_000_000_000 ? new Date(value * 1000) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
const firstFinite = (...values) => values.map(number).find(finite) ?? null
const firstValue = (...values) => values.find((value) => value !== undefined && value !== null) ?? null
const sumKnown = (values) => values.filter(finite).reduce((sum, value) => sum + value, 0)
const sumNullable = (values) => values.every(finite) ? values.reduce((sum, value) => sum + value, 0) : null
const sumReported = (values) => values.filter(finite).length ? sumKnown(values) : null
const minDate = (values) => values.filter(Boolean).sort()[0] ?? null
const maxDate = (values) => values.filter(Boolean).sort().at(-1) ?? null

function globRegex(pattern) {
  return new RegExp(`^${String(pattern).split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`, "i")
}

function sourceLabel(file) {
  return relative(root, file).replaceAll("\\", "/") || "."
}

function folderLabel(file) {
  const rel = sourceLabel(file)
  const first = rel.split("/")[0]
  return rel.includes("/") ? first : "."
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue
    const file = join(dir, entry.name)
    if (entry.isDirectory()) walk(file, files)
    else if (entry.isFile() && JSON_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push(file)
  }
  return files
}

function readRecords(file) {
  const text = readFileSync(file, "utf8")
  const malformed = []
  if (extname(file).toLowerCase() === ".json") {
    try {
      const value = JSON.parse(text)
      return { records: Array.isArray(value) ? value : [value], malformed }
    } catch (error) {
      malformed.push(`${sourceLabel(file)}: ${error.message}`)
      return { records: [], malformed }
    }
  }
  const records = []
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue
    try { records.push(JSON.parse(line)) } catch { malformed.push(`${sourceLabel(file)}:${index + 1}`) }
  }
  return { records, malformed }
}

function usageObject(record) {
  if (!record || typeof record !== "object") return null
  const looksLikeUsage = (value) => value && typeof value === "object" && [
    "input_tokens", "prompt_tokens", "output_tokens", "completion_tokens", "total_tokens",
    "cache_creation_input_tokens", "cache_read_input_tokens", "input", "output",
  ].some((key) => number(value[key]) !== null)
  const candidates = [
    record,
    record.usage,
    record.token_usage,
    record.tokenUsage,
    record.tokens,
    record.response?.usage,
    record.result?.usage,
    record.metrics?.usage,
  ]
  return candidates.find(looksLikeUsage) ?? null
}

function modelFrom(record, usage) {
  return firstValue(record?.model, record?.message?.model, record?.response?.model, record?.payload?.model, usage?.model) ?? "unknown"
}

function providerFrom(record, usage, model = modelFrom(record, usage)) {
  const explicit = firstValue(record?.provider, record?.payload?.provider, usage?.provider)
  if (explicit) return String(explicit).toLowerCase()
  if (String(model).toLowerCase().startsWith("claude")) return "anthropic"
  if (/^(gpt|o[1-9]|chatgpt)/i.test(String(model))) return "openai"
  if (usage && ("cache_creation_input_tokens" in usage || "cache_read_input_tokens" in usage)) return "anthropic"
  return "unknown"
}

function effortFrom(record) {
  return firstValue(record?.effort, record?.payload?.effort, record?.metadata?.effort)
}

function timeFrom(record) {
  return iso(firstValue(record?.timestamp, record?.created_at, record?.createdAt, record?.created, record?.time, record?.payload?.timestamp))
}

function logicalIdFrom(record) {
  return firstValue(
    record?.thread_id,
    record?.threadId,
    record?.session_id,
    record?.sessionId,
    record?.conversation_id,
    record?.conversationId,
    record?.payload?.session_id,
    record?.payload?.sessionId,
    record?.payload?.id,
  )
}

function reportedCostFrom(record, usage) {
  return firstFinite(
    record?.cost,
    record?.costUsd,
    record?.cost_usd,
    record?.total_cost,
    record?.total_cost_usd,
    record?.totalCostUsd,
    usage?.cost,
    usage?.costUsd,
    usage?.cost_usd,
    usage?.total_cost,
    usage?.total_cost_usd,
  )
}

function normalizeUsage(usage, provider) {
  const input = firstFinite(usage?.input_tokens, usage?.prompt_tokens, usage?.input)
  const output = firstFinite(usage?.output_tokens, usage?.completion_tokens, usage?.output)
  const total = firstFinite(usage?.total_tokens)
  const reasoning = firstFinite(usage?.reasoning_output_tokens, usage?.output_tokens_details?.reasoning_tokens, usage?.completion_tokens_details?.reasoning_tokens)
  const cached = firstFinite(usage?.cached_input_tokens, usage?.input_tokens_details?.cached_tokens, usage?.prompt_tokens_details?.cached_tokens)
  const cacheRead = firstFinite(usage?.cache_read_input_tokens)
  const cacheWrite5m = firstFinite(usage?.cache_creation?.ephemeral_5m_input_tokens)
  const cacheWrite1h = firstFinite(usage?.cache_creation?.ephemeral_1h_input_tokens)
  const cacheWriteCombined = firstFinite(usage?.cache_creation_input_tokens)
  const isAnthropic = provider === "anthropic" || cacheRead !== null || cacheWrite5m !== null || cacheWrite1h !== null || cacheWriteCombined !== null

  if (isAnthropic) {
    const write5m = cacheWrite5m ?? cacheWriteCombined ?? 0
    const write1h = cacheWrite1h ?? 0
    const read = cacheRead ?? 0
    const inputTotal = input === null ? null : input + write5m + write1h + read
    return {
      inputTotal,
      inputUncached: input,
      cachedInputRead: read,
      cacheWrite5m: write5m,
      cacheWrite1h: write1h,
      outputTotal: output,
      reasoningOutput: reasoning,
      nonReasoningOutput: finite(output) && finite(reasoning) ? output - reasoning : null,
      providerTotal: firstFinite(total, finite(inputTotal) && finite(output) ? inputTotal + output : null),
    }
  }

  if (provider === "openai") {
    const inputTotal = input
    const cachedInputRead = cached ?? 0
    return {
      inputTotal,
      inputUncached: finite(input) ? input - cachedInputRead : null,
      cachedInputRead,
      cacheWrite5m: 0,
      cacheWrite1h: 0,
      outputTotal: output,
      reasoningOutput: reasoning,
      nonReasoningOutput: finite(output) && finite(reasoning) ? output - reasoning : null,
      providerTotal: firstFinite(total, finite(input) && finite(output) ? input + output : null),
    }
  }

  return {
    inputTotal: input,
    inputUncached: input,
    cachedInputRead: cached,
    cacheWrite5m: cacheWrite5m ?? cacheWriteCombined,
    cacheWrite1h,
    outputTotal: output,
    reasoningOutput: reasoning,
    nonReasoningOutput: finite(output) && finite(reasoning) ? output - reasoning : null,
    providerTotal: firstFinite(total, finite(input) && finite(output) ? input + output : null),
  }
}

function addTokens(items) {
  const fields = ["inputTotal", "inputUncached", "cachedInputRead", "cacheWrite5m", "cacheWrite1h", "outputTotal", "reasoningOutput", "nonReasoningOutput", "providerTotal"]
  return Object.fromEntries(fields.map((field) => [field, sumNullable(items.map((item) => item[field]))]))
}

function baseThread(file, index, provider, harness, model, tokens, records, usageList, reportedCostUsd = null, logicalId = null) {
  const times = records.map(timeFrom)
  const threadKey = `${sourceLabel(file)}|${provider}|${harness}|${model}|${index}`
  return {
    threadId: `${provider}:${sha(threadKey).slice(0, 20)}`,
    provider,
    harness,
    model,
    effort: records.map(effortFrom).find(Boolean) ?? null,
    logicalId: logicalId ? String(logicalId) : null,
    sourceFile: sourceLabel(file),
    folder: folderLabel(file),
    startedAt: minDate(times),
    finishedAt: maxDate(times),
    recordCount: records.length,
    usageRecordCount: usageList.length,
    rawUsage: usageList.length === 1 ? usageList[0] : usageList,
    tokens,
    reportedCostUsd,
  }
}

function parseCodex(file, records) {
  const tokenEvents = records.filter((record) => record?.type === "event_msg" && record?.payload?.type === "token_count")
  if (!tokenEvents.length && !records.some((record) => record?.type === "session_meta")) return []
  const usage = tokenEvents.at(-1)?.payload?.info?.total_token_usage
  if (!usage) return []
  const meta = records.find((record) => record?.type === "session_meta")
  const context = records.filter((record) => record?.type === "turn_context" && record?.payload?.model).at(-1)?.payload ?? {}
  const provider = "openai"
  const model = context.model ?? "unknown"
  return [baseThread(
    file,
    0,
    provider,
    "codex",
    model,
    normalizeUsage(usage, provider),
    records,
    [usage],
    null,
    firstValue(meta?.payload?.id, meta?.payload?.session_id),
  )]
}

function isClaudeUsage(record, usage) {
  const model = modelFrom(record, usage)
  return String(model).toLowerCase().startsWith("claude") || usage?.cache_creation_input_tokens !== undefined || usage?.cache_read_input_tokens !== undefined || record?.isSidechain !== undefined
}

function parseClaude(file, records) {
  const byKey = new Map()
  for (const record of records) {
    const usage = record?.usage ?? record?.message?.usage
    if (!usage || !isClaudeUsage(record, usage)) continue
    const model = modelFrom(record, usage)
    const key = firstValue(record?.id, record?.message?.id) ?? sha(JSON.stringify({ model, usage }))
    byKey.set(key, { record, usage, model, provider: "anthropic" })
  }
  const entries = [...byKey.values()]
  if (!entries.length) return []
  const groups = new Map()
  for (const entry of entries) {
    const key = entry.model || "unknown"
    const group = groups.get(key) ?? { entries: [], tokens: [] }
    group.entries.push(entry)
    group.tokens.push(normalizeUsage(entry.usage, entry.provider))
    groups.set(key, group)
  }
  return [...groups.values()].map((group, index) => {
    const groupRecords = group.entries.map((entry) => entry.record)
    return baseThread(file, index, "anthropic", "claude", group.entries[0].model || "unknown", addTokens(group.tokens), groupRecords, group.entries.map((entry) => entry.usage), sumReported(group.entries.map((entry) => reportedCostFrom(entry.record, entry.usage))), logicalIdFrom(group.entries[0].record))
  })
}

function parseGeneric(file, records) {
  const byKey = new Map()
  for (const record of records) {
    const usage = usageObject(record)
    if (!usage) continue
    const model = modelFrom(record, usage)
    const key = firstValue(record?.id, record?.message?.id) ?? sha(JSON.stringify({ model, usage }))
    const provider = providerFrom(record, usage, model)
    byKey.set(key, { record, usage, model, provider })
  }
  const entries = [...byKey.values()]
  if (!entries.length) return []
  const groups = new Map()
  for (const entry of entries) {
    const key = `${entry.provider}|${entry.model}`
    const group = groups.get(key) ?? { entries: [], tokens: [] }
    group.entries.push(entry)
    group.tokens.push(normalizeUsage(entry.usage, entry.provider))
    groups.set(key, group)
  }
  return [...groups.values()].map((group, index) => {
    const groupRecords = group.entries.map((entry) => entry.record)
    return baseThread(file, index, group.entries[0].provider, "generic", group.entries[0].model, addTokens(group.tokens), groupRecords, group.entries.map((entry) => entry.usage), sumReported(group.entries.map((entry) => reportedCostFrom(entry.record, entry.usage))), logicalIdFrom(group.entries[0].record))
  })
}

function priceFor(model) {
  const entries = Array.isArray(pricing.models) ? pricing.models : []
  return entries.find((entry) => (entry.match ?? []).some((pattern) => globRegex(pattern).test(model ?? ""))) ?? null
}

function pricingAgeDays(entry) {
  if (!entry?.verifiedAt) return null
  const time = new Date(entry.verifiedAt).getTime()
  return Number.isFinite(time) ? Math.max(0, (Date.now() - time) / 86400000) : null
}

function costPart(tokens, rate) {
  if (!finite(tokens)) return null
  if (tokens === 0) return 0
  return finite(rate) ? tokens * rate / 1_000_000 : null
}

function priceThread(thread) {
  const rate = priceFor(thread.model)
  if (!rate) {
    return {
      cost: { inputUncachedUsd: null, cachedInputReadUsd: null, cacheWrite5mUsd: null, cacheWrite1hUsd: null, outputUsd: null, totalUsd: finite(thread.reportedCostUsd) ? thread.reportedCostUsd : null },
      pricing: null,
      pricingStatus: finite(thread.reportedCostUsd) ? "reported" : "unmatched",
      costMethod: finite(thread.reportedCostUsd) ? "reported" : "unavailable",
    }
  }
  const p = rate.per1M ?? {}
  const cachedRate = firstFinite(p.cachedInput, p.cacheRead)
  const cost = {
    inputUncachedUsd: costPart(thread.tokens.inputUncached, p.input),
    cachedInputReadUsd: costPart(thread.tokens.cachedInputRead, cachedRate),
    cacheWrite5mUsd: costPart(thread.tokens.cacheWrite5m, p.cacheWrite5m),
    cacheWrite1hUsd: costPart(thread.tokens.cacheWrite1h, p.cacheWrite1h),
    outputUsd: costPart(thread.tokens.outputTotal, p.output),
  }
  const parts = Object.values(cost)
  cost.totalUsd = parts.every((value) => finite(value)) ? parts.reduce((sum, value) => sum + value, 0) : null
  const age = pricingAgeDays(rate)
  return {
    cost,
    pricing: { provider: rate.provider ?? thread.provider, match: rate.match, per1M: p, effectiveDate: rate.effectiveDate ?? null, sourceUrl: rate.sourceUrl ?? null, verifiedAt: rate.verifiedAt ?? null, ageDays: age },
    pricingStatus: cost.totalUsd === null ? "partial" : age !== null && age > 30 ? "matched-stale" : "matched",
    costMethod: cost.totalUsd === null ? "partial" : "derived",
  }
}

function rollup(items) {
  const tokenValues = items.map((item) => item.tokens.providerTotal)
  const costValues = items.map((item) => item.cost.totalUsd)
  return {
    threadCount: items.length,
    knownTokenThreads: tokenValues.filter(finite).length,
    knownCostThreads: costValues.filter(finite).length,
    tokens: tokenValues.some(finite) ? sumKnown(tokenValues) : null,
    costUsd: costValues.some(finite) ? sumKnown(costValues) : null,
  }
}

function escapeCell(value) {
  return String(value ?? "n/a").replaceAll("|", "\\|").replaceAll("\n", " ")
}

function table(headers, rows) {
  const lines = [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`]
  for (const row of rows) lines.push(`| ${row.map(escapeCell).join(" | ")} |`)
  return lines.join("\n")
}

function fmtInt(value) {
  return finite(value) ? Math.round(value).toLocaleString("en-US") : "n/a"
}

function fmtUsd(value) {
  return finite(value) ? `$${value.toFixed(4)}` : "n/a"
}

function fmtPct(numerator, denominator) {
  return finite(numerator) && denominator > 0 ? `${(numerator / denominator * 100).toFixed(1)}%` : "n/a"
}

function fmtDuration(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return "n/a"
  const minutes = (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 60000
  return Number.isFinite(minutes) && minutes >= 0 ? `${minutes.toFixed(1)} min` : "n/a"
}

function groupBy(items, selector) {
  const groups = new Map()
  for (const item of items) {
    const key = selector(item)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return groups
}

function report({ threads, stats, malformed, duplicateIds }) {
  const total = rollup(threads)
  const priced = threads.filter((thread) => thread.costMethod === "derived")
  const reported = threads.filter((thread) => thread.costMethod === "reported")
  const unknown = threads.filter((thread) => !finite(thread.cost.totalUsd))
  const generatedAt = new Date().toISOString()
  const providers = [...groupBy(threads, (thread) => thread.provider).entries()]
    .sort((a, b) => rollup(b[1]).costUsd - rollup(a[1]).costUsd)
  const models = [...groupBy(threads, (thread) => `${thread.provider} / ${thread.model}`).entries()]
    .sort((a, b) => rollup(b[1]).costUsd - rollup(a[1]).costUsd)
  const folders = [...groupBy(threads, (thread) => thread.folder).entries()]
    .sort((a, b) => rollup(b[1]).costUsd - rollup(a[1]).costUsd)
  const sortedThreads = [...threads].sort((a, b) => (b.cost.totalUsd ?? -1) - (a.cost.totalUsd ?? -1) || (b.tokens.providerTotal ?? -1) - (a.tokens.providerTotal ?? -1) || a.sourceFile.localeCompare(b.sourceFile))
  const inputTotal = sumKnown(threads.map((thread) => thread.tokens.inputTotal))
  const cachedInput = sumKnown(threads.map((thread) => thread.tokens.cachedInputRead))
  const outputTotal = sumKnown(threads.map((thread) => thread.tokens.outputTotal))
  const reasoningTotal = sumKnown(threads.map((thread) => thread.tokens.reasoningOutput))
  const stale = threads.filter((thread) => thread.pricingStatus === "matched-stale")
  const unmatched = threads.filter((thread) => thread.pricingStatus === "unmatched")
  const partial = threads.filter((thread) => thread.pricingStatus === "partial")
  const pricingRows = [...groupBy(threads.filter((thread) => thread.pricing), (thread) => `${thread.provider} / ${thread.model}`).entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
  const anomalies = []
  for (const thread of threads) {
    if (thread.model === "unknown") anomalies.push(`${thread.sourceFile}: model is unavailable`)
    if (thread.provider === "unknown") anomalies.push(`${thread.sourceFile}: provider is unavailable`)
    if (!thread.startedAt || !thread.finishedAt) anomalies.push(`${thread.sourceFile}: timestamps are incomplete`)
    if (thread.reportedCostUsd !== null && thread.costMethod === "derived" && Math.abs(thread.reportedCostUsd - thread.cost.totalUsd) > 0.01) anomalies.push(`${thread.sourceFile}: reported ${fmtUsd(thread.reportedCostUsd)} differs from derived ${fmtUsd(thread.cost.totalUsd)}`)
  }
  for (const file of malformed) anomalies.push(`malformed JSON ignored: ${file}`)
  for (const id of duplicateIds) anomalies.push(`logical thread identity appears in multiple source files: ${id}`)

  const lines = [
    "# LLM Cost Report",
    "",
    `> Generated ${generatedAt} · Root: \`.\` · Prices are USD per 1M tokens unless noted`,
    "",
    "## Executive summary",
    "",
    table(["Metric", "Value"], [
      ["Threads recognized", fmtInt(total.threadCount)],
      ["Threads with measured tokens", `${fmtInt(total.knownTokenThreads)} / ${fmtInt(total.threadCount)}`],
      ["Threads with derived cost", `${fmtInt(priced.length)} / ${fmtInt(total.threadCount)}`],
      ["Threads with reported-only cost", fmtInt(reported.length)],
      ["Threads with unavailable or partial cost", fmtInt(unknown.length)],
      ["Measured/provider tokens", fmtInt(total.tokens)],
      ["Known cost", fmtUsd(total.costUsd)],
      ["Cost coverage", fmtPct(total.knownCostThreads, total.threadCount)],
      ["Input tokens", fmtInt(inputTotal)],
      ["Cached input", `${fmtInt(cachedInput)} (${fmtPct(cachedInput, inputTotal)})`],
      ["Output tokens", fmtInt(outputTotal)],
      ["Reasoning output", `${fmtInt(reasoningTotal)} (${fmtPct(reasoningTotal, outputTotal)})`],
    ]),
    "",
    "The known-cost total includes derived API-equivalent prices and harness-reported costs. It is not necessarily an invoice, especially for subscription, enterprise, batch, priority, or negotiated usage.",
    "",
    "## Scan coverage",
    "",
    table(["Coverage", "Value"], [
      ["Files visited", fmtInt(stats.filesVisited)],
      ["JSON/JSONL/NDJSON files inspected", fmtInt(stats.candidateFiles)],
      ["Files containing usage records", fmtInt(stats.recognizedFiles)],
      ["Malformed records", fmtInt(malformed.length)],
      ["Pricing catalog", pricingPath ? (pricingPath.startsWith(root) ? sourceLabel(pricingPath) : "bundled default") : "none"],
      ["Oldest observed thread", threads.map((thread) => thread.startedAt).filter(Boolean).sort()[0] ?? "n/a"],
      ["Newest observed thread", threads.map((thread) => thread.finishedAt).filter(Boolean).sort().at(-1) ?? "n/a"],
    ]),
    "",
    "## Cost by provider",
    "",
    table(["Provider", "Threads", "Known tokens", "Known cost", "Priced", "Unpriced"], providers.map(([key, items]) => {
      const r = rollup(items)
      return [key, fmtInt(r.threadCount), fmtInt(r.tokens), fmtUsd(r.costUsd), fmtInt(r.knownCostThreads), fmtInt(r.threadCount - r.knownCostThreads)]
    })),
    "",
    "## Cost by model",
    "",
    table(["Provider / model", "Threads", "Input", "Cached", "Output", "Tokens", "Cost"], models.map(([key, items]) => [
      key,
      fmtInt(items.length),
      fmtInt(sumKnown(items.map((item) => item.tokens.inputTotal))),
      fmtInt(sumKnown(items.map((item) => item.tokens.cachedInputRead))),
      fmtInt(sumKnown(items.map((item) => item.tokens.outputTotal))),
      fmtInt(rollup(items).tokens),
      fmtUsd(rollup(items).costUsd),
    ])),
    "",
    "## Cost by root and child folder",
    "",
    "The folder is the direct child of the scanned root; files directly in the root are grouped as `.`.",
    "",
    table(["Folder", "Threads", "Tokens", "Known cost", "Priced", "Unpriced"], folders.map(([key, items]) => {
      const r = rollup(items)
      return [key, fmtInt(r.threadCount), fmtInt(r.tokens), fmtUsd(r.costUsd), fmtInt(r.knownCostThreads), fmtInt(r.threadCount - r.knownCostThreads)]
    })),
    "",
    "## Token composition",
    "",
    table(["Token class", "Tokens", "Share of available total", "Meaning"], [
      ["Uncached input", fmtInt(sumKnown(threads.map((thread) => thread.tokens.inputUncached))), fmtPct(sumKnown(threads.map((thread) => thread.tokens.inputUncached)), inputTotal), "Input billed at the base input rate"],
      ["Cached input read", fmtInt(cachedInput), fmtPct(cachedInput, inputTotal), "Provider cache-hit tokens"],
      ["5-minute cache write", fmtInt(sumKnown(threads.map((thread) => thread.tokens.cacheWrite5m))), "n/a", "Anthropic-style ephemeral cache writes"],
      ["1-hour cache write", fmtInt(sumKnown(threads.map((thread) => thread.tokens.cacheWrite1h))), "n/a", "Anthropic-style extended cache writes"],
      ["Output", fmtInt(outputTotal), fmtPct(outputTotal, total.tokens), "Generated output, including reasoning where exposed"],
      ["Reasoning output", fmtInt(reasoningTotal), fmtPct(reasoningTotal, outputTotal), "Subset of output, never added twice"],
    ]),
    "",
    "## Thread detail",
    "",
    table(["Thread", "Source", "Provider / model", "Tokens", "Cost", "Method", "Duration"], sortedThreads.map((thread) => [
      thread.threadId,
      thread.sourceFile,
      `${thread.provider} / ${thread.model}${thread.effort ? ` / ${thread.effort}` : ""}`,
      fmtInt(thread.tokens.providerTotal),
      fmtUsd(thread.cost.totalUsd),
      thread.costMethod === "derived" ? `derived${thread.pricingStatus === "matched-stale" ? " (stale rate)" : ""}` : thread.costMethod,
      fmtDuration(thread.startedAt, thread.finishedAt),
    ])),
    "",
    "## Pricing coverage",
    "",
    table(["Status", "Threads", "Meaning"], [
      ["Matched", fmtInt(threads.filter((thread) => thread.pricingStatus === "matched").length), "Model matched and all required token classes were priced"],
      ["Matched but stale", fmtInt(stale.length), "Matched rate is more than 30 days past verification"],
      ["Partial", fmtInt(partial.length), "A model matched, but one or more required rates or token classes are unavailable"],
      ["Reported", fmtInt(reported.length), "Cost came from the harness record rather than local pricing"],
      ["Unmatched", fmtInt(unmatched.length), "No model pattern matched the pricing catalog"],
    ]),
    "",
    "",
    "### Matched pricing detail",
    "",
    pricingRows.length ? table(["Provider / model", "Match", "Rates per 1M", "Verified", "Source"], pricingRows.map(([key, items]) => {
      const pricing = items[0].pricing
      const rates = Object.entries(pricing.per1M ?? {}).map(([name, value]) => `${name}=${value === null ? "n/a" : value}`).join(", ")
      return [key, (pricing.match ?? []).join(", "), rates, pricing.verifiedAt ?? "n/a", pricing.sourceUrl ?? "n/a"]
    })) : "No model matched the available pricing catalogs.",
    "",
    "Update the pricing override and rerun when rates are stale or unmatched.",
    "",
    "## Anomalies and limitations",
    "",
    anomalies.length ? anomalies.map((item) => `- ${item}`).join("\n") : "- None detected by the analyzer.",
    "",
    "## Methodology",
    "",
    "- Recursively inspect JSON, JSONL, and NDJSON files below the requested root, excluding dependency, VCS, cache, virtual-environment, and build directories.",
    "- Use the last cumulative Codex token-count event; deduplicate Claude streaming records by message ID or exact model/usage payload; aggregate generic usage records by provider and model.",
    "- Preserve provider-native usage semantics: OpenAI cached input is a subset of input, while Anthropic cache buckets are disjoint. Reasoning tokens are a subset of output.",
    "- Treat missing values as unavailable. Sum known totals for overview coverage, but surface every incomplete or unpriced thread in the detail and limitations sections.",
    "- Do not include prompts, message text, secrets, or raw transcripts in this report. Source-relative paths are the traceability boundary.",
    "",
    "_Generated by `11ai-llm-cost`. Source files were not modified._",
    "",
  ]
  return lines.join("\n")
}

const files = walk(root)
const stats = { filesVisited: 0, candidateFiles: files.length, recognizedFiles: 0 }
let malformed = []
const threads = []
const logicalSources = new Map()
for (const file of files) {
  stats.filesVisited += 1
  if (resolve(file) === output) continue
  const parsed = readRecords(file)
  malformed = malformed.concat(parsed.malformed)
  if (!parsed.records.length) continue
  let parsedThreads = parseCodex(file, parsed.records)
  if (!parsedThreads.length) parsedThreads = parseClaude(file, parsed.records)
  if (!parsedThreads.length) parsedThreads = parseGeneric(file, parsed.records)
  if (!parsedThreads.length) continue
  stats.recognizedFiles += 1
  for (const thread of parsedThreads) {
    const priced = priceThread(thread)
    Object.assign(thread, priced)
    threads.push(thread)
    if (thread.logicalId) logicalSources.set(thread.logicalId, [...(logicalSources.get(thread.logicalId) ?? []), thread.sourceFile])
  }
}

const duplicateIds = [...logicalSources.entries()]
  .filter(([, sources]) => new Set(sources).size > 1)
  .map(([id]) => id)
const markdown = report({ threads, stats, malformed, duplicateIds })
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, markdown)
console.log(JSON.stringify({
  root,
  output,
  filesInspected: stats.candidateFiles,
  recognizedFiles: stats.recognizedFiles,
  threads: threads.length,
  knownTokens: threads.filter((thread) => finite(thread.tokens.providerTotal)).length,
  knownCosts: threads.filter((thread) => finite(thread.cost.totalUsd)).length,
  costUsd: sumKnown(threads.map((thread) => thread.cost.totalUsd)),
  malformedRecords: malformed.length,
}, null, 2))
