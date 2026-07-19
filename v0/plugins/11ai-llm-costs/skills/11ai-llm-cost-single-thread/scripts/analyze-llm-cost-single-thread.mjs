#!/usr/bin/env node

import { createHash } from "node:crypto"
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const argv = process.argv.slice(2)
const option = (name) => {
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] : null
}

const VALUE_OPTIONS = new Set(["--pricing", "--output", "--codex-home", "--claude-home", "--gemini-home", "--cline-tasks", "--roo-tasks", "--opencode-db", "--thread"])
const FLAG_OPTIONS = new Set(["--project-only", "--help"])
let positional = null
for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index]
  if (VALUE_OPTIONS.has(arg)) {
    if (!argv[index + 1] || argv[index + 1].startsWith("--")) throw new Error(`missing value for ${arg}`)
    index += 1
    continue
  }
  if (FLAG_OPTIONS.has(arg)) continue
  if (arg.startsWith("--")) throw new Error(`unknown argument: ${arg}`)
  if (positional !== null) throw new Error(`unexpected positional argument: ${arg}`)
  positional = arg
}

if (argv.includes("--help")) {
  console.log("usage: node analyze-llm-cost-single-thread.mjs [root-folder] [--thread id-or-source] [--pricing pricing.json] [--output report.md] [--codex-home dir] [--claude-home dir] [--gemini-home dir] [--cline-tasks dir] [--roo-tasks dir] [--opencode-db file] [--project-only]")
  console.log("defaults: --thread uses CODEX_THREAD_ID when available")
  process.exit(0)
}

const threadRoot = resolve(process.cwd())
const root = resolve(positional ?? threadRoot)
const threadSelector = option("--thread") ?? process.env.CODEX_THREAD_ID
if (!threadSelector) throw new Error("no thread selector is available; pass --thread <thread-id-or-source> or run inside a Codex thread that exposes CODEX_THREAD_ID")
const generatedAt = new Date().toISOString()
const filenameTimestamp = generatedAt.replaceAll(":", "-").replaceAll(".", "-")
const reportSkillName = "11ai-llm-cost-single-thread"
const reportTitle = "Single-Thread LLM Cost Report"
const reportName = `${reportSkillName}-${filenameTimestamp}`
const reportsRootName = `${reportSkillName}-reports`
const reportPackageName = `${reportsRootName}-${filenameTimestamp}`
const reportSkillUrl = `https://ai.rj11.io/skills/${reportSkillName}`
const reportSignature = `_LLM token cost analysis by [${reportSkillName}](${reportSkillUrl})._`
const explicitOutput = option("--output")
const markdownOutput = resolve(explicitOutput ?? join(threadRoot, reportsRootName, reportPackageName, `${reportName}.md`))
const htmlOutput = markdownOutput.toLowerCase().endsWith(".md") ? `${markdownOutput.slice(0, -3)}.html` : `${markdownOutput}.html`
const output = markdownOutput
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
const SESSION_EXTENSIONS = new Set([".json", ".jsonl", ".ndjson"])
const ACTIVE_GAP_MS = 5 * 60 * 1000
const externalSessions = new Map()
const discovery = { nativeFilesConsidered: 0, nativeSessionsMatched: 0, codexSessions: 0, claudeSessions: 0, geminiSessions: 0, clineSessions: 0, rooSessions: 0, opencodeSessions: 0, limitations: [] }
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

function globRegex(pattern) {
  return new RegExp(`^${String(pattern).split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`, "i")
}

function isWithin(parent, child) {
  const rel = relative(resolve(parent), resolve(child))
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}

function sourceLabel(file) {
  const external = externalSessions.get(resolve(file))
  if (external) return `${external.harness}-session/${external.label}`
  return relative(root, file).replaceAll("\\", "/") || "."
}

function folderLabel(file) {
  const external = externalSessions.get(resolve(file))
  if (external?.cwd) {
    const rel = relative(root, external.cwd).replaceAll("\\", "/")
    return !rel || rel === "." ? "." : rel.split("/")[0]
  }
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

function walkSessionFiles(dir, files = []) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return files
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = join(dir, entry.name)
    if (entry.isDirectory()) walkSessionFiles(file, files)
    else if (entry.isFile() && SESSION_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push(file)
  }
  return files
}

function readPrefix(file, limit = 256 * 1024) {
  const fd = openSync(file, "r")
  try {
    const size = Math.min(statSync(file).size, limit)
    const buffer = Buffer.alloc(size)
    const bytes = readSync(fd, buffer, 0, size, 0)
    return buffer.subarray(0, bytes).toString("utf8")
  } finally {
    closeSync(fd)
  }
}

function nativeSessionMetadata(file) {
  const lines = readPrefix(file).split(/\r?\n/)
  for (const line of lines) {
    if (!line.trim()) continue
    let record
    try { record = JSON.parse(line) } catch { continue }
    const cwd = firstValue(record?.cwd, record?.payload?.cwd, record?.metadata?.cwd, record?.session?.cwd)
    if (!cwd || typeof cwd !== "string") continue
    return {
      cwd: resolve(cwd),
      id: firstValue(record?.sessionId, record?.session_id, record?.payload?.id, record?.payload?.session_id),
    }
  }
  return null
}

function geminiSessionMetadata(file) {
  const lines = readPrefix(file).split(/\r?\n/)
  for (const line of lines) {
    if (!line.trim()) continue
    let record
    try { record = JSON.parse(line) } catch { continue }
    if (!record?.sessionId && !record?.projectHash && !Array.isArray(record?.directories)) continue
    return {
      id: record.sessionId ?? null,
      projectHash: record.projectHash ?? null,
      directories: Array.isArray(record.directories) ? record.directories.filter((value) => typeof value === "string").map((value) => resolve(value)) : [],
    }
  }
  return null
}

function taskWorkspace(file) {
  for (const name of ["task_metadata.json", "history_item.json"]) {
    const metadataFile = join(dirname(file), name)
    if (!existsSync(metadataFile)) continue
    try {
      const metadata = JSON.parse(readFileSync(metadataFile, "utf8"))
      const cwd = firstValue(metadata?.cwdOnTaskInitialization, metadata?.cwd, metadata?.workspace, metadata?.workspacePath)
      if (typeof cwd === "string") return resolve(cwd)
    } catch { /* ignored and reported only if the usage file is selected */ }
  }
  return null
}

function vscodeTaskRoots(userHome, extensionId) {
  return [
    join(userHome, "Library", "Application Support", "Code", "User", "globalStorage", extensionId, "tasks"),
    join(userHome, ".config", "Code", "User", "globalStorage", extensionId, "tasks"),
    join(userHome, ".vscode-server", "data", "User", "globalStorage", extensionId, "tasks"),
  ]
}

function discoverNativeSessions() {
  if (argv.includes("--project-only")) return []
  const codexHome = resolve(option("--codex-home") ?? process.env.CODEX_HOME ?? join(homedir(), ".codex"))
  const claudeHome = resolve(option("--claude-home") ?? process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude"))
  const geminiHome = resolve(option("--gemini-home") ?? (process.env.GEMINI_CLI_HOME ? join(process.env.GEMINI_CLI_HOME, ".gemini") : join(homedir(), ".gemini")))
  const clineRoots = option("--cline-tasks")
    ? [resolve(option("--cline-tasks"))]
    : [join(homedir(), ".cline", "data", "tasks"), ...vscodeTaskRoots(homedir(), "saoudrizwan.claude-dev")]
  const rooRoots = option("--roo-tasks")
    ? [resolve(option("--roo-tasks"))]
    : vscodeTaskRoots(homedir(), "rooveterinaryinc.roo-cline")
  const sources = [
    { harness: "codex", home: codexHome, roots: [join(codexHome, "sessions"), join(codexHome, "archived_sessions")] },
    { harness: "claude", home: claudeHome, roots: [join(claudeHome, "projects")] },
    { harness: "gemini", home: geminiHome, roots: [join(geminiHome, "tmp")] },
    { harness: "cline", home: dirname(clineRoots[0]), roots: clineRoots },
    { harness: "roo", home: dirname(rooRoots[0]), roots: rooRoots },
  ]
  const matched = []
  for (const source of sources) {
    for (const sessionRoot of source.roots) {
      for (const file of walkSessionFiles(sessionRoot)) {
        if ((source.harness === "cline" || source.harness === "roo") && basename(file) !== "ui_messages.json") continue
        if (source.harness === "gemini" && !file.replaceAll("\\", "/").includes("/chats/")) continue
        discovery.nativeFilesConsidered += 1
        let metadata
        let matches = false
        if (source.harness === "gemini") {
          metadata = geminiSessionMetadata(file)
          matches = Boolean(metadata && (metadata.projectHash === sha(root) || metadata.directories.some((directory) => isWithin(root, directory))))
          if (metadata && !metadata.cwd) metadata.cwd = root
        } else if (source.harness === "cline" || source.harness === "roo") {
          const cwd = taskWorkspace(file)
          metadata = cwd ? { cwd, id: basename(dirname(file)) } : null
          matches = Boolean(cwd && isWithin(root, cwd))
        } else {
          metadata = nativeSessionMetadata(file)
          matches = Boolean(metadata && isWithin(root, metadata.cwd))
        }
        if (!matches) continue
        const rel = relative(source.home, file).replaceAll("\\", "/") || basename(file)
        externalSessions.set(resolve(file), { ...metadata, harness: source.harness, label: rel })
        matched.push(resolve(file))
        discovery.nativeSessionsMatched += 1
        if (source.harness === "codex") discovery.codexSessions += 1
        if (source.harness === "claude") discovery.claudeSessions += 1
        if (source.harness === "gemini") discovery.geminiSessions += 1
        if (source.harness === "cline") discovery.clineSessions += 1
        if (source.harness === "roo") discovery.rooSessions += 1
      }
    }
  }
  return matched
}

function readRecords(file) {
  const text = readFileSync(file, "utf8")
  const malformed = []
  if (extname(file).toLowerCase() === ".json") {
    try {
      const value = JSON.parse(text)
      const nested = value && !Array.isArray(value) && typeof value === "object"
        ? ["messages", "records", "events", "items"].flatMap((key) => Array.isArray(value[key]) ? value[key] : [])
        : []
      return { records: Array.isArray(value) ? value : [value, ...nested], malformed }
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
    record.info?.tokens,
  ]
  return candidates.find(looksLikeUsage) ?? null
}

function modelFrom(record, usage) {
  return firstValue(record?.model, record?.modelID, record?.modelId, record?.info?.modelID, record?.info?.modelId, record?.message?.model, record?.response?.model, record?.payload?.model, usage?.model) ?? "unknown"
}

function providerFrom(record, usage, model = modelFrom(record, usage)) {
  const explicit = firstValue(record?.provider, record?.providerID, record?.providerId, record?.info?.providerID, record?.info?.providerId, record?.payload?.provider, usage?.provider)
  if (explicit) return String(explicit).toLowerCase()
  if (String(model).toLowerCase().startsWith("claude")) return "anthropic"
  if (/^(gpt|o[1-9]|chatgpt)/i.test(String(model))) return "openai"
  if (/^gemini/i.test(String(model))) return "google"
  if (usage && ("cache_creation_input_tokens" in usage || "cache_read_input_tokens" in usage)) return "anthropic"
  return "unknown"
}

function effortFrom(record) {
  return firstValue(
    record?.effort,
    record?.reasoning_effort,
    record?.reasoningEffort,
    record?.payload?.effort,
    record?.payload?.reasoning_effort,
    record?.payload?.reasoningEffort,
    record?.metadata?.effort,
    record?.metadata?.reasoning_effort,
    record?.metadata?.reasoningEffort,
  )
}

function timeFrom(record) {
  return iso(firstValue(record?.timestamp, record?.startTime, record?.endTime, record?.created_at, record?.createdAt, record?.created, record?.updated_at, record?.updatedAt, record?.time?.completed, record?.time?.updated, record?.time?.created, record?.time, record?.info?.time?.completed, record?.info?.time?.updated, record?.info?.time?.created, record?.payload?.timestamp))
}

function timingFrom(records) {
  const points = [...new Set(records.map(timeFrom).filter(Boolean).map((value) => new Date(value).getTime()).filter(Number.isFinite))].sort((a, b) => a - b)
  const startedAt = points.length ? new Date(points[0]).toISOString() : null
  const finishedAt = points.length ? new Date(points.at(-1)).toISOString() : null
  if (points.length < 2) return { startedAt, finishedAt, wallTimeMs: null, activeTimeMs: null, timestampCount: points.length }
  const wallTimeMs = points.at(-1) - points[0]
  const activeTimeMs = points.slice(1).reduce((sum, point, index) => sum + Math.min(point - points[index], ACTIVE_GAP_MS), 0)
  return { startedAt, finishedAt, wallTimeMs, activeTimeMs, timestampCount: points.length }
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
    record?.info?.sessionID,
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
    record?.info?.cost,
  )
}

function normalizeUsage(usage, provider) {
  const input = firstFinite(usage?.input_tokens, usage?.prompt_tokens, usage?.input)
  const output = firstFinite(usage?.output_tokens, usage?.completion_tokens, usage?.output)
  const total = firstFinite(usage?.total_tokens)
  const reasoning = firstFinite(usage?.reasoning_output_tokens, usage?.reasoning, usage?.output_tokens_details?.reasoning_tokens, usage?.completion_tokens_details?.reasoning_tokens)
  const separateReasoning = usage?.reasoning !== undefined
  const outputTotal = finite(output) && finite(reasoning) && separateReasoning ? output + reasoning : output
  const cached = firstFinite(usage?.cached_input_tokens, usage?.input_tokens_details?.cached_tokens, usage?.prompt_tokens_details?.cached_tokens)
  const cacheRead = firstFinite(usage?.cache_read_input_tokens, usage?.cache?.read)
  const cacheWrite5m = firstFinite(usage?.cache_creation?.ephemeral_5m_input_tokens, usage?.cache?.write)
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
      outputTotal,
      reasoningOutput: reasoning,
      nonReasoningOutput: separateReasoning ? output : finite(output) && finite(reasoning) ? output - reasoning : null,
      providerTotal: firstFinite(total, finite(inputTotal) && finite(outputTotal) ? inputTotal + outputTotal : null),
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
      outputTotal,
      reasoningOutput: reasoning,
      nonReasoningOutput: separateReasoning ? output : finite(output) && finite(reasoning) ? output - reasoning : null,
      providerTotal: firstFinite(total, finite(input) && finite(outputTotal) ? input + outputTotal : null),
    }
  }

  return {
    inputTotal: input,
    inputUncached: input,
    cachedInputRead: cached,
    cacheWrite5m: cacheWrite5m ?? cacheWriteCombined,
    cacheWrite1h,
    outputTotal,
    reasoningOutput: reasoning,
    nonReasoningOutput: separateReasoning ? output : finite(output) && finite(reasoning) ? output - reasoning : null,
    providerTotal: firstFinite(total, finite(input) && finite(outputTotal) ? input + outputTotal : null),
  }
}

function addTokens(items) {
  const fields = ["inputTotal", "inputUncached", "cachedInputRead", "cacheWrite5m", "cacheWrite1h", "outputTotal", "reasoningOutput", "nonReasoningOutput", "providerTotal"]
  return Object.fromEntries(fields.map((field) => [field, sumNullable(items.map((item) => item[field]))]))
}

function baseThread(file, index, provider, harness, model, tokens, records, usageList, reportedCostUsd = null, logicalId = null) {
  const timing = timingFrom(records)
  const threadKey = `${sourceLabel(file)}|${provider}|${harness}|${model}|${index}`
  return {
    threadId: `${provider}:${sha(threadKey).slice(0, 20)}`,
    provider,
    harness,
    model,
    effort: records.map(effortFrom).filter(Boolean).at(-1) ?? null,
    logicalId: logicalId ? String(logicalId) : null,
    parentThreadId: null,
    nativeAgentDepth: null,
    selectionRole: null,
    selectionDepth: null,
    sourceFile: sourceLabel(file),
    folder: folderLabel(file),
    ...timing,
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
  const meta = records.find((record) => record?.type === "session_meta")
  const context = records.filter((record) => record?.type === "turn_context" && record?.payload?.model).at(-1)?.payload ?? {}
  const provider = "openai"
  const model = context.model ?? "unknown"
  const sourceSubagent = meta?.payload?.source?.subagent
  const isSubagent = meta?.payload?.thread_source === "subagent" || Boolean(sourceSubagent)
  const thread = baseThread(
    file,
    0,
    provider,
    "codex",
    model,
    normalizeUsage(usage ?? {}, provider),
    records,
    usage ? [usage] : [],
    null,
    firstValue(meta?.payload?.id, meta?.payload?.session_id),
  )
  if (isSubagent) {
    thread.parentThreadId = firstValue(
      meta?.payload?.parent_thread_id,
      meta?.payload?.parentThreadId,
      sourceSubagent?.thread_spawn?.parent_thread_id,
      sourceSubagent?.thread_spawn?.parentThreadId,
    )
    thread.nativeAgentDepth = firstFinite(meta?.payload?.agent_depth, sourceSubagent?.thread_spawn?.depth)
  }
  return [thread]
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

function parseGemini(file, records) {
  const metadata = records.find((record) => record?.sessionId || record?.projectHash)
  const groups = new Map()
  for (const record of records) {
    if (record?.type !== "gemini" || !record?.tokens) continue
    const usage = record.tokens
    const model = record.model ?? "unknown"
    const cached = firstFinite(usage.cached, 0)
    const input = firstFinite(usage.input)
    const output = firstFinite(usage.output)
    const thoughts = firstFinite(usage.thoughts, 0)
    const tool = firstFinite(usage.tool, 0)
    const normalized = {
      inputTotal: finite(input) ? input + tool : null,
      inputUncached: finite(input) ? Math.max(0, input - cached) + tool : null,
      cachedInputRead: cached,
      cacheWrite5m: 0,
      cacheWrite1h: 0,
      outputTotal: finite(output) ? output + thoughts : null,
      reasoningOutput: thoughts,
      nonReasoningOutput: output,
      providerTotal: firstFinite(usage.total, finite(input) && finite(output) ? input + tool + output + thoughts : null),
    }
    const group = groups.get(model) ?? { records: [], usages: [], tokens: [] }
    group.records.push(record)
    group.usages.push(usage)
    group.tokens.push(normalized)
    groups.set(model, group)
  }
  return [...groups.entries()].map(([model, group], index) => baseThread(file, index, "google", "gemini", model, addTokens(group.tokens), [metadata, ...group.records].filter(Boolean), group.usages, null, metadata?.sessionId))
}

function parseClineFamily(file, records, harness) {
  const entries = []
  for (const record of records) {
    if (record?.type !== "say" || !["api_req_started", "deleted_api_reqs", "subagent_usage"].includes(record?.say)) continue
    let usage
    try { usage = typeof record.text === "string" ? JSON.parse(record.text) : record.text } catch { continue }
    if (!usage || [usage.tokensIn, usage.tokensOut, usage.cacheWrites, usage.cacheReads, usage.cost].every((value) => number(value) === null)) continue
    const model = firstValue(usage.model, usage.modelId, usage.modelID, record.model) ?? "unknown"
    const provider = providerFrom({ provider: firstValue(usage.provider, usage.apiProtocol), model }, usage, model)
    const tokensIn = firstFinite(usage.tokensIn, 0)
    const tokensOut = firstFinite(usage.tokensOut, 0)
    const cacheWrites = firstFinite(usage.cacheWrites, 0)
    const cacheReads = firstFinite(usage.cacheReads, 0)
    entries.push({
      record: { ...record, timestamp: record.ts ?? record.timestamp },
      usage,
      model,
      provider,
      cost: firstFinite(usage.cost),
      tokens: {
        inputTotal: tokensIn + cacheWrites + cacheReads,
        inputUncached: tokensIn,
        cachedInputRead: cacheReads,
        cacheWrite5m: cacheWrites,
        cacheWrite1h: 0,
        outputTotal: tokensOut,
        reasoningOutput: null,
        nonReasoningOutput: tokensOut,
        providerTotal: tokensIn + cacheWrites + cacheReads + tokensOut,
      },
    })
  }
  const groups = new Map()
  for (const entry of entries) {
    const key = `${entry.provider}|${entry.model}`
    groups.set(key, [...(groups.get(key) ?? []), entry])
  }
  return [...groups.values()].map((group, index) => baseThread(
    file,
    index,
    group[0].provider,
    harness,
    group[0].model,
    addTokens(group.map((entry) => entry.tokens)),
    group.map((entry) => entry.record),
    group.map((entry) => entry.usage),
    sumReported(group.map((entry) => entry.cost)),
    externalSessions.get(resolve(file))?.id,
  ))
}

async function parseOpenCodeDatabase(file) {
  let DatabaseSync
  try { ({ DatabaseSync } = await import("node:sqlite")) } catch {
    discovery.limitations.push("OpenCode SQLite discovery requires a Node.js runtime with node:sqlite support; exported JSON can still be supplied inside the project.")
    return []
  }
  let database
  try {
    database = new DatabaseSync(file, { readOnly: true })
    const rows = database.prepare("SELECT id, directory, cost, tokens_input, tokens_output, tokens_reasoning, tokens_cache_read, tokens_cache_write, model, time_created, time_updated FROM session").all()
    const result = []
    for (const row of rows) {
      if (typeof row.directory !== "string" || !isWithin(root, row.directory)) continue
      let modelInfo = {}
      try { modelInfo = typeof row.model === "string" ? JSON.parse(row.model) : (row.model ?? {}) } catch { modelInfo = {} }
      const model = firstValue(modelInfo.id, modelInfo.modelID, modelInfo.modelId) ?? "unknown"
      const provider = String(firstValue(modelInfo.providerID, modelInfo.providerId, modelInfo.provider, providerFrom({ model }, {}, model))).toLowerCase()
      const input = firstFinite(row.tokens_input, 0)
      const output = firstFinite(row.tokens_output, 0)
      const reasoning = firstFinite(row.tokens_reasoning, 0)
      const cacheRead = firstFinite(row.tokens_cache_read, 0)
      const cacheWrite = firstFinite(row.tokens_cache_write, 0)
      const record = { timestamp: row.time_created, created_at: row.time_created }
      const thread = baseThread(file, result.length, provider, "opencode", model, {
        inputTotal: input + cacheRead + cacheWrite,
        inputUncached: input,
        cachedInputRead: cacheRead,
        cacheWrite5m: cacheWrite,
        cacheWrite1h: 0,
        outputTotal: output + reasoning,
        reasoningOutput: reasoning,
        nonReasoningOutput: output,
        providerTotal: input + cacheRead + cacheWrite + output + reasoning,
      }, [record, { timestamp: row.time_updated }], [{ input, output, reasoning, cacheRead, cacheWrite }], firstFinite(row.cost), row.id)
      thread.sourceFile = `opencode-session/${basename(file)}/${row.id}`
      const rel = relative(root, resolve(row.directory)).replaceAll("\\", "/")
      thread.folder = !rel || rel === "." ? "." : rel.split("/")[0]
      result.push(thread)
    }
    discovery.opencodeSessions += result.length
    discovery.nativeSessionsMatched += result.length
    return result
  } catch (error) {
    discovery.limitations.push(`OpenCode database ${basename(file)} could not be read: ${error.message}`)
    return []
  } finally {
    try { database?.close() } catch { /* no-op */ }
  }
}

function opencodeDatabaseCandidates() {
  if (argv.includes("--project-only")) return []
  const explicit = option("--opencode-db")
  if (explicit) return [resolve(explicit)]
  const dataHome = process.env.XDG_DATA_HOME ? resolve(process.env.XDG_DATA_HOME) : join(homedir(), ".local", "share")
  const dirs = [join(dataHome, "opencode"), join(homedir(), "Library", "Application Support", "opencode")]
  const files = []
  for (const dir of dirs) {
    let entries = []
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { continue }
    for (const entry of entries) if (entry.isFile() && /^opencode.*\.db$/i.test(entry.name)) files.push(join(dir, entry.name))
  }
  return files
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

function priceFor(model, provider) {
  const entries = Array.isArray(pricing.models) ? pricing.models : []
  return entries.find((entry) => (!entry.provider || entry.provider === provider) && (entry.match ?? []).some((pattern) => globRegex(pattern).test(model ?? ""))) ?? null
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
  const rate = priceFor(thread.model, thread.provider)
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
  if (cost.totalUsd === null && finite(thread.reportedCostUsd)) {
    cost.totalUsd = thread.reportedCostUsd
    return {
      cost,
      pricing: { provider: rate.provider ?? thread.provider, match: rate.match, per1M: p, effectiveDate: rate.effectiveDate ?? null, sourceUrl: rate.sourceUrl ?? null, verifiedAt: rate.verifiedAt ?? null, ageDays: pricingAgeDays(rate) },
      pricingStatus: "reported",
      costMethod: "reported",
    }
  }
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
  const wallValues = items.map((item) => item.wallTimeMs)
  const activeValues = items.map((item) => item.activeTimeMs)
  return {
    threadCount: items.length,
    knownTokenThreads: tokenValues.filter(finite).length,
    knownCostThreads: costValues.filter(finite).length,
    tokens: tokenValues.some(finite) ? sumKnown(tokenValues) : null,
    costUsd: costValues.some(finite) ? sumKnown(costValues) : null,
    knownWallThreads: wallValues.filter(finite).length,
    knownActiveThreads: activeValues.filter(finite).length,
    wallTimeMs: wallValues.some(finite) ? sumKnown(wallValues) : null,
    activeTimeMs: activeValues.some(finite) ? sumKnown(activeValues) : null,
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

function fmtDurationMs(value) {
  if (!finite(value)) return "n/a"
  const totalSeconds = Math.max(0, Math.round(value / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours ? `${hours}h` : null, minutes ? `${minutes}m` : null, seconds || (!hours && !minutes) ? `${seconds}s` : null].filter(Boolean).join(" ")
}

function fmtUsdPerActiveHour(costUsd, activeTimeMs) {
  return finite(costUsd) && finite(activeTimeMs) && activeTimeMs > 0 ? fmtUsd(costUsd / (activeTimeMs / 3600000)) : "n/a"
}

function fmtUsdPerThread(costUsd, threadCount) {
  return finite(costUsd) && finite(threadCount) && threadCount > 0 ? fmtUsd(costUsd / threadCount) : "n/a"
}

function fmtPct(numerator, denominator) {
  return finite(numerator) && denominator > 0 ? `${(numerator / denominator * 100).toFixed(1)}%` : "n/a"
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
  const selectedRoots = threads.filter((thread) => thread.selectionDepth === 0)
  const includedSubagents = threads.filter((thread) => finite(thread.selectionDepth) && thread.selectionDepth > 0)
  const priced = threads.filter((thread) => thread.costMethod === "derived")
  const reported = threads.filter((thread) => thread.costMethod === "reported")
  const unknown = threads.filter((thread) => !finite(thread.cost.totalUsd))
  const providers = [...groupBy(threads, (thread) => thread.provider).entries()]
    .sort((a, b) => rollup(b[1]).costUsd - rollup(a[1]).costUsd)
  const harnesses = [...groupBy(threads, (thread) => thread.harness).entries()]
    .sort((a, b) => rollup(b[1]).costUsd - rollup(a[1]).costUsd)
  const models = [...groupBy(threads, (thread) => `${thread.provider} / ${thread.model}`).entries()]
    .sort((a, b) => rollup(b[1]).costUsd - rollup(a[1]).costUsd)
  const modelEfforts = [...groupBy(threads, (thread) => `${thread.provider} / ${thread.model}\u0000${thread.effort ?? "n/a"}`).entries()]
    .sort((a, b) => (rollup(b[1]).costUsd ?? -1) - (rollup(a[1]).costUsd ?? -1) || a[0].localeCompare(b[0]))
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
    if (!thread.startedAt || !thread.finishedAt) anomalies.push(`${thread.sourceFile}: timestamps are unavailable`)
    else if (!finite(thread.wallTimeMs)) anomalies.push(`${thread.sourceFile}: wall and active time require at least two distinct timestamps`)
    if (thread.pricingStatus === "unmatched") anomalies.push(`${thread.sourceFile}: no pricing catalog match for ${thread.provider} / ${thread.model}`)
    if (thread.pricingStatus === "partial") anomalies.push(`${thread.sourceFile}: pricing is incomplete for one or more observed token classes`)
    if (thread.reportedCostUsd !== null && thread.costMethod === "derived" && Math.abs(thread.reportedCostUsd - thread.cost.totalUsd) > 0.01) anomalies.push(`${thread.sourceFile}: reported ${fmtUsd(thread.reportedCostUsd)} differs from derived ${fmtUsd(thread.cost.totalUsd)}`)
  }
  for (const file of malformed) anomalies.push(`malformed JSON ignored: ${file}`)
  for (const id of duplicateIds) anomalies.push(`logical thread identity appears in multiple source files: ${id}`)

  const lines = [
    `# ${reportTitle}`,
    "",
    "## Totals",
    "",
    table(["Metric", "Value"], [
      ["Threads recognized", fmtInt(total.threadCount)],
      ["Selected root threads", fmtInt(selectedRoots.length)],
      ["Included sub-agent threads", fmtInt(includedSubagents.length)],
      ["Threads with measured tokens", `${fmtInt(total.knownTokenThreads)} / ${fmtInt(total.threadCount)}`],
      ["Threads with derived cost", `${fmtInt(priced.length)} / ${fmtInt(total.threadCount)}`],
      ["Threads with reported-only cost", fmtInt(reported.length)],
      ["Threads with unavailable or partial cost", fmtInt(unknown.length)],
      ["Measured/provider tokens", fmtInt(total.tokens)],
      ["Known cost", fmtUsd(total.costUsd)],
      ["Estimated active time", fmtDurationMs(total.activeTimeMs)],
      ["Cost / active hour", fmtUsdPerActiveHour(total.costUsd, total.activeTimeMs)],
      ["Sum of thread wall time", fmtDurationMs(total.wallTimeMs)],
      ["Cost / wall hour", fmtUsdPerActiveHour(total.costUsd, total.wallTimeMs)],
      ["Cost / thread", fmtUsdPerThread(total.costUsd, total.threadCount)],
      ["Cost coverage", fmtPct(total.knownCostThreads, total.threadCount)],
      ["Input tokens", fmtInt(inputTotal)],
      ["Cached input", `${fmtInt(cachedInput)} (${fmtPct(cachedInput, inputTotal)})`],
      ["Output tokens", fmtInt(outputTotal)],
      ["Reasoning output", `${fmtInt(reasoningTotal)} (${fmtPct(reasoningTotal, outputTotal)})`],
      ["Threads with measurable wall time", `${fmtInt(total.knownWallThreads)} / ${fmtInt(total.threadCount)}`],
      ["Threads with estimated active time", `${fmtInt(total.knownActiveThreads)} / ${fmtInt(total.threadCount)}`],
      ["Active / wall time", fmtPct(total.activeTimeMs, total.wallTimeMs)],
    ]),
    "",
    "The known-cost total includes derived API-equivalent prices and harness-reported costs. It is not necessarily an invoice, especially for subscription, enterprise, batch, priority, or negotiated usage.",
    "",
    "## Scan coverage",
    "",
    table(["Coverage", "Value"], [
      ["Files visited", fmtInt(stats.filesVisited)],
      ["JSON/JSONL/NDJSON files inspected", fmtInt(stats.candidateFiles)],
      ["Project JSON-family files", fmtInt(stats.projectCandidateFiles)],
      ["Native session files metadata-checked", fmtInt(stats.nativeFilesConsidered)],
      ["Project-associated native sessions", fmtInt(stats.nativeSessionsMatched)],
      ["Codex sessions", fmtInt(stats.codexSessions)],
      ["Claude sessions", fmtInt(stats.claudeSessions)],
      ["Gemini CLI sessions", fmtInt(stats.geminiSessions)],
      ["Cline tasks", fmtInt(stats.clineSessions)],
      ["Roo Code tasks", fmtInt(stats.rooSessions)],
      ["OpenCode sessions", fmtInt(stats.opencodeSessions)],
      ["Files containing usage records", fmtInt(stats.recognizedFiles)],
      ["Malformed records", fmtInt(malformed.length)],
      ["Pricing catalog", pricingPath ? (pricingPath.startsWith(root) ? sourceLabel(pricingPath) : "bundled default") : "none"],
      ["Oldest observed thread", threads.map((thread) => thread.startedAt).filter(Boolean).sort()[0] ?? "n/a"],
      ["Newest observed thread", threads.map((thread) => thread.finishedAt).filter(Boolean).sort().at(-1) ?? "n/a"],
    ]),
    "",
    "## Cost by provider",
    "",
    table(["Provider", "Threads", "Input", "Cached", "Output", "Tokens", "Known cost", "Active time", "Cost / active hour", "Wall time", "Cost / wall hour", "Cost / thread", "Priced", "Unpriced"], [...providers.map(([key, items]) => {
      const r = rollup(items)
      return [key, fmtInt(r.threadCount), fmtInt(sumKnown(items.map((item) => item.tokens.inputTotal))), fmtInt(sumKnown(items.map((item) => item.tokens.cachedInputRead))), fmtInt(sumKnown(items.map((item) => item.tokens.outputTotal))), fmtInt(r.tokens), fmtUsd(r.costUsd), fmtDurationMs(r.activeTimeMs), fmtUsdPerActiveHour(r.costUsd, r.activeTimeMs), fmtDurationMs(r.wallTimeMs), fmtUsdPerActiveHour(r.costUsd, r.wallTimeMs), fmtUsdPerThread(r.costUsd, r.threadCount), fmtInt(r.knownCostThreads), fmtInt(r.threadCount - r.knownCostThreads)]
    }), ["Total", fmtInt(total.threadCount), fmtInt(inputTotal), fmtInt(cachedInput), fmtInt(outputTotal), fmtInt(total.tokens), fmtUsd(total.costUsd), fmtDurationMs(total.activeTimeMs), fmtUsdPerActiveHour(total.costUsd, total.activeTimeMs), fmtDurationMs(total.wallTimeMs), fmtUsdPerActiveHour(total.costUsd, total.wallTimeMs), fmtUsdPerThread(total.costUsd, total.threadCount), fmtInt(total.knownCostThreads), fmtInt(total.threadCount - total.knownCostThreads)]]),
    "",
    "## Cost by harness",
    "",
    table(["Harness", "Threads", "Input", "Cached", "Output", "Tokens", "Known cost", "Active time", "Cost / active hour", "Wall time", "Cost / wall hour", "Cost / thread", "Reported-cost sum", "Average tokens / thread", "Priced", "Unpriced"], [...harnesses.map(([key, items]) => {
      const r = rollup(items)
      return [key, fmtInt(r.threadCount), fmtInt(sumKnown(items.map((item) => item.tokens.inputTotal))), fmtInt(sumKnown(items.map((item) => item.tokens.cachedInputRead))), fmtInt(sumKnown(items.map((item) => item.tokens.outputTotal))), fmtInt(r.tokens), fmtUsd(r.costUsd), fmtDurationMs(r.activeTimeMs), fmtUsdPerActiveHour(r.costUsd, r.activeTimeMs), fmtDurationMs(r.wallTimeMs), fmtUsdPerActiveHour(r.costUsd, r.wallTimeMs), fmtUsdPerThread(r.costUsd, r.threadCount), fmtUsd(sumReported(items.map((item) => item.reportedCostUsd))), fmtInt(r.threadCount ? r.tokens / r.threadCount : null), fmtInt(r.knownCostThreads), fmtInt(r.threadCount - r.knownCostThreads)]
    }), ["Total", fmtInt(total.threadCount), fmtInt(inputTotal), fmtInt(cachedInput), fmtInt(outputTotal), fmtInt(total.tokens), fmtUsd(total.costUsd), fmtDurationMs(total.activeTimeMs), fmtUsdPerActiveHour(total.costUsd, total.activeTimeMs), fmtDurationMs(total.wallTimeMs), fmtUsdPerActiveHour(total.costUsd, total.wallTimeMs), fmtUsdPerThread(total.costUsd, total.threadCount), fmtUsd(sumReported(threads.map((item) => item.reportedCostUsd))), fmtInt(total.threadCount ? total.tokens / total.threadCount : null), fmtInt(total.knownCostThreads), fmtInt(total.threadCount - total.knownCostThreads)]]),
    "",
    "## Cost by model",
    "",
    table(["Provider / model", "Threads", "Input", "Cached", "Output", "Tokens", "Cost", "Active time", "Cost / active hour", "Wall time", "Cost / wall hour", "Cost / thread"], [...models.map(([key, items]) => {
      const r = rollup(items)
      return [key, fmtInt(items.length), fmtInt(sumKnown(items.map((item) => item.tokens.inputTotal))), fmtInt(sumKnown(items.map((item) => item.tokens.cachedInputRead))), fmtInt(sumKnown(items.map((item) => item.tokens.outputTotal))), fmtInt(r.tokens), fmtUsd(r.costUsd), fmtDurationMs(r.activeTimeMs), fmtUsdPerActiveHour(r.costUsd, r.activeTimeMs), fmtDurationMs(r.wallTimeMs), fmtUsdPerActiveHour(r.costUsd, r.wallTimeMs), fmtUsdPerThread(r.costUsd, r.threadCount)]
    }), ["Total", fmtInt(total.threadCount), fmtInt(inputTotal), fmtInt(cachedInput), fmtInt(outputTotal), fmtInt(total.tokens), fmtUsd(total.costUsd), fmtDurationMs(total.activeTimeMs), fmtUsdPerActiveHour(total.costUsd, total.activeTimeMs), fmtDurationMs(total.wallTimeMs), fmtUsdPerActiveHour(total.costUsd, total.wallTimeMs), fmtUsdPerThread(total.costUsd, total.threadCount)]]),
    "",
    "## Cost by model by effort",
    "",
    table(["Provider / model", "Effort", "Threads", "Input", "Cached", "Output", "Tokens", "Known cost", "Active time", "Cost / active hour", "Wall time", "Cost / wall hour", "Cost / thread"], [...modelEfforts.map(([key, items]) => {
      const [model, effort] = key.split("\u0000")
      const r = rollup(items)
      return [model, effort, fmtInt(r.threadCount), fmtInt(sumKnown(items.map((item) => item.tokens.inputTotal))), fmtInt(sumKnown(items.map((item) => item.tokens.cachedInputRead))), fmtInt(sumKnown(items.map((item) => item.tokens.outputTotal))), fmtInt(r.tokens), fmtUsd(r.costUsd), fmtDurationMs(r.activeTimeMs), fmtUsdPerActiveHour(r.costUsd, r.activeTimeMs), fmtDurationMs(r.wallTimeMs), fmtUsdPerActiveHour(r.costUsd, r.wallTimeMs), fmtUsdPerThread(r.costUsd, r.threadCount)]
    }), ["Total", "All efforts", fmtInt(total.threadCount), fmtInt(inputTotal), fmtInt(cachedInput), fmtInt(outputTotal), fmtInt(total.tokens), fmtUsd(total.costUsd), fmtDurationMs(total.activeTimeMs), fmtUsdPerActiveHour(total.costUsd, total.activeTimeMs), fmtDurationMs(total.wallTimeMs), fmtUsdPerActiveHour(total.costUsd, total.wallTimeMs), fmtUsdPerThread(total.costUsd, total.threadCount)]]),
    "",
    "## Cost by root and child folder",
    "",
    "The folder is the direct child of the scanned root; files directly in the root are grouped as `.`.",
    "",
    table(["Folder", "Threads", "Input", "Cached", "Output", "Tokens", "Known cost", "Active time", "Cost / active hour", "Wall time", "Cost / wall hour", "Cost / thread", "Priced", "Unpriced"], [...folders.map(([key, items]) => {
      const r = rollup(items)
      return [key, fmtInt(r.threadCount), fmtInt(sumKnown(items.map((item) => item.tokens.inputTotal))), fmtInt(sumKnown(items.map((item) => item.tokens.cachedInputRead))), fmtInt(sumKnown(items.map((item) => item.tokens.outputTotal))), fmtInt(r.tokens), fmtUsd(r.costUsd), fmtDurationMs(r.activeTimeMs), fmtUsdPerActiveHour(r.costUsd, r.activeTimeMs), fmtDurationMs(r.wallTimeMs), fmtUsdPerActiveHour(r.costUsd, r.wallTimeMs), fmtUsdPerThread(r.costUsd, r.threadCount), fmtInt(r.knownCostThreads), fmtInt(r.threadCount - r.knownCostThreads)]
    }), ["Total", fmtInt(total.threadCount), fmtInt(inputTotal), fmtInt(cachedInput), fmtInt(outputTotal), fmtInt(total.tokens), fmtUsd(total.costUsd), fmtDurationMs(total.activeTimeMs), fmtUsdPerActiveHour(total.costUsd, total.activeTimeMs), fmtDurationMs(total.wallTimeMs), fmtUsdPerActiveHour(total.costUsd, total.wallTimeMs), fmtUsdPerThread(total.costUsd, total.threadCount), fmtInt(total.knownCostThreads), fmtInt(total.threadCount - total.knownCostThreads)]]),
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
    table(["Thread", "Relationship", "Parent thread", "Source", "Provider / model / effort", "Input", "Cached", "Output", "Tokens", "Selected cost", "Active time", "Cost / active hour", "Wall time", "Cost / wall hour", "Harness reported", "Method"], sortedThreads.map((thread) => [
      thread.threadId,
      thread.selectionDepth === 0 ? "Selected task" : `Sub-agent (depth ${thread.selectionDepth})`,
      thread.selectionDepth === 0 ? "n/a" : thread.parentThreadId ?? "n/a",
      thread.sourceFile,
      `${thread.provider} / ${thread.model} / ${thread.effort ?? "n/a"}`,
      fmtInt(thread.tokens.inputTotal),
      fmtInt(thread.tokens.cachedInputRead),
      fmtInt(thread.tokens.outputTotal),
      fmtInt(thread.tokens.providerTotal),
      fmtUsd(thread.cost.totalUsd),
      fmtDurationMs(thread.activeTimeMs),
      fmtUsdPerActiveHour(thread.cost.totalUsd, thread.activeTimeMs),
      fmtDurationMs(thread.wallTimeMs),
      fmtUsdPerActiveHour(thread.cost.totalUsd, thread.wallTimeMs),
      fmtUsd(thread.reportedCostUsd),
      thread.costMethod === "derived" ? `derived${thread.pricingStatus === "matched-stale" ? " (stale rate)" : ""}` : thread.costMethod,
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
    "### Pricing catalog match detail",
    "",
    pricingRows.length ? table(["Provider / model", "Match", "Rates per 1M", "Effective", "Verified", "Source"], pricingRows.map(([key, items]) => {
      const pricing = items[0].pricing
      const rates = Object.entries(pricing.per1M ?? {}).map(([name, value]) => `${name}=${value === null ? "n/a" : value}`).join(", ")
      return [key, (pricing.match ?? []).join(", "), rates, pricing.effectiveDate ?? "n/a", pricing.verifiedAt ?? "n/a", pricing.sourceUrl ?? "n/a"]
    })) : "No model matched the available pricing catalogs.",
    "",
    "Update the pricing override and rerun when rates are stale or unmatched.",
    "",
    "## Anomalies and limitations",
    "",
    [...anomalies, ...discovery.limitations].length ? [...anomalies, ...discovery.limitations].map((item) => `- ${item}`).join("\n") : "- None detected by the analyzer.",
    "",
    "## Methodology",
    "",
    "- Recursively inspect JSON, JSONL, and NDJSON files below the requested root, excluding dependency, VCS, cache, virtual-environment, and build directories.",
    "- Discover Codex, Claude Code, Gemini CLI, Cline, Roo Code, and OpenCode usage from their native local stores. Include only sessions whose recorded project directory or project hash belongs to the requested root.",
    "- Use the last cumulative Codex token-count event; deduplicate Claude streaming records; aggregate Gemini per-message counters and Cline/Roo API request metrics; read OpenCode's session ledger in read-only mode; aggregate generic usage records by provider and model.",
    "- Preserve provider-native usage semantics: OpenAI cached input is a subset of input, while Anthropic cache buckets are disjoint. Reasoning tokens are a subset of output.",
    "- Measure wall time from the first to last distinct timestamp observed for a thread. Estimate active time by summing consecutive timestamp gaps with each gap capped at five minutes; report both as unavailable when fewer than two distinct timestamps exist.",
    "- Starting from the exactly selected task, recursively include Codex sessions whose native metadata identifies the selected task or an included descendant as their parent. Do not infer sub-agent relationships from working directories, timestamps, or fork metadata alone.",
    "- Retain explicitly linked sub-agent sessions even when cumulative token usage is unavailable; show their token and cost fields as unavailable rather than silently omitting the task.",
    "- Calculate cost per wall hour and cost per active hour by dividing known cost by the corresponding summed measurable duration. Report the rate as unavailable when cost or duration is unavailable or duration is zero.",
    "- Calculate cost per thread by dividing known cost by every recognized thread in the row. Incomplete cost coverage can therefore understate this rate. Per-thread detail omits the metric because it would duplicate selected cost.",
    "- Treat missing values as unavailable. Sum known totals for overview coverage, but surface every incomplete or unpriced thread in the detail and limitations sections.",
    "- Do not include prompts, message text, secrets, or raw transcripts in this report. Source-relative paths are the traceability boundary.",
    "",
    `> Generated ${generatedAt} · Root: \`.\` · Prices are USD per 1M tokens unless noted`,
    "",
    reportSignature,
    "",
  ]
  return lines.join("\n")
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function inlineHtml(value) {
  let html = escapeHtml(value)
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
  html = html.replace(/^_([\s\S]+)_$/, "<em>$1</em>")
  return html
}

function markdownCells(line) {
  const cells = []
  let cell = ""
  let escaped = false
  for (const char of line.slice(1, -1)) {
    if (escaped) {
      cell += char
      escaped = false
    } else if (char === "\\") {
      escaped = true
    } else if (char === "|") {
      cells.push(cell.trim())
      cell = ""
    } else {
      cell += char
    }
  }
  cells.push(cell.trim())
  return cells
}

function htmlReport(markdown) {
  const lines = markdown.split(/\r?\n/)
  const body = []
  const sectionLevels = []
  const closeSection = () => {
    body.push("</div></details>")
    sectionLevels.pop()
  }
  const closeSectionsThrough = (level) => {
    while (sectionLevels.length && sectionLevels.at(-1) >= level) closeSection()
  }
  const closeAllSections = () => {
    while (sectionLevels.length) closeSection()
  }
  for (let index = 0; index < lines.length;) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      if (level === 1) {
        closeAllSections()
        body.push(`<h1>${inlineHtml(heading[2])}</h1>`)
      } else {
        closeSectionsThrough(level)
        body.push(`<details class="report-section level-${level}"><summary><span class="section-title">${inlineHtml(heading[2])}</span></summary><div class="section-body">`)
        sectionLevels.push(level)
      }
      index += 1
      continue
    }
    const signature = line === reportSignature
    if (signature) {
      closeAllSections()
      const signatureHtml = inlineHtml(line).replace(
        `<a href="${reportSkillUrl}">`,
        `<a href="${reportSkillUrl}" target="_blank" rel="noopener noreferrer">`,
      )
      body.push(`<p class="signature">${signatureHtml}</p>`)
      index += 1
      continue
    }
    if (line.startsWith("> Generated ")) {
      closeAllSections()
      body.push(`<blockquote class="generation-message">${inlineHtml(line.slice(2))}</blockquote>`)
      index += 1
      continue
    }
    if (line.startsWith("> ")) {
      body.push(`<blockquote>${inlineHtml(line.slice(2))}</blockquote>`)
      index += 1
      continue
    }
    if (line.startsWith("| ") && /^\|(?:\s*---\s*\|)+$/.test(lines[index + 1] ?? "")) {
      const headers = markdownCells(line)
      index += 2
      const rows = []
      while (index < lines.length && lines[index].startsWith("| ")) {
        rows.push(markdownCells(lines[index]))
        index += 1
      }
      body.push('<div class="table-wrap"><table><thead><tr>')
      body.push(headers.map((cell) => `<th scope="col" aria-sort="none"><button type="button" class="sort-button">${inlineHtml(cell)}<span class="sort-indicator" aria-hidden="true"></span></button></th>`).join(""))
      body.push("</tr></thead><tbody>")
      for (const row of rows) body.push(`<tr>${row.map((cell) => `<td>${inlineHtml(cell)}</td>`).join("")}</tr>`)
      body.push("</tbody></table></div>")
      continue
    }
    if (line.startsWith("- ")) {
      const items = []
      while (index < lines.length && lines[index].startsWith("- ")) {
        items.push(`<li>${inlineHtml(lines[index].slice(2))}</li>`)
        index += 1
      }
      body.push(`<ul>${items.join("")}</ul>`)
      continue
    }
    body.push(`<p>${inlineHtml(line)}</p>`)
    index += 1
  }
  closeAllSections()

  return String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LLM Cost Report</title>
  <style>
    :root { color-scheme: light dark; --bg: #f6f7fb; --card: #fff; --text: #172033; --muted: #5d6678; --line: #dce1ea; --accent: #3157d5; }
    @media (prefers-color-scheme: dark) { :root { --bg: #10131a; --card: #181d27; --text: #edf1f7; --muted: #aab3c3; --line: #303848; --accent: #8da8ff; } }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { width: 100%; margin: 0; padding: 16px 20px 24px; background: transparent; }
    h1 { margin: 0 0 .75rem; font-size: clamp(1.65rem, 3vw, 2.4rem); letter-spacing: -.035em; }
    .report-section { margin: .55rem 0; overflow: hidden; border: 1px solid var(--line); border-radius: 8px; background: color-mix(in srgb, var(--card) 96%, var(--accent)); }
    .report-section.level-2 { margin-top: .8rem; }
    .report-section.level-3 { margin: .45rem 0; }
    summary { display: flex; align-items: center; gap: .5rem; padding: .62rem .78rem; cursor: pointer; color: var(--text); font-weight: 750; list-style: none; user-select: none; }
    summary::-webkit-details-marker { display: none; }
    summary::before { content: "▸"; flex: 0 0 auto; color: var(--accent); transition: transform .15s ease; }
    details[open] > summary::before { transform: rotate(90deg); }
    .level-2 > summary { font-size: 1.12rem; }
    .level-3 > summary { font-size: .98rem; }
    .section-body { padding: 0 .78rem .72rem; border-top: 1px solid var(--line); }
    p, li { margin: .45rem 0; color: var(--muted); }
    blockquote { margin: .75rem 0; padding: .65rem .8rem; border-left: 3px solid var(--accent); background: color-mix(in srgb, var(--accent) 7%, transparent); color: var(--muted); }
    .table-wrap { margin: .55rem 0 .9rem; overflow-x: auto; border: 1px solid var(--line); border-radius: 7px; }
    table { width: 100%; border-collapse: collapse; font-size: .82rem; }
    th, td { text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); white-space: nowrap; }
    td { padding: .42rem .52rem; }
    th { padding: 0; background: color-mix(in srgb, var(--accent) 8%, transparent); color: var(--text); }
    .sort-button { display: flex; width: 100%; align-items: center; gap: .3rem; padding: .42rem .52rem; border: 0; background: transparent; color: inherit; font: inherit; font-weight: 700; text-align: left; white-space: nowrap; cursor: pointer; }
    .sort-button:hover, .sort-button:focus-visible { background: color-mix(in srgb, var(--accent) 14%, transparent); outline: none; }
    .sort-indicator { min-width: .8em; color: var(--accent); }
    th[aria-sort="descending"] .sort-indicator::after { content: "▼"; }
    th[aria-sort="ascending"] .sort-indicator::after { content: "▲"; }
    tr:last-child td { border-bottom: 0; }
    code { padding: .1rem .3rem; border-radius: 4px; background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--text); }
    a { color: var(--accent); }
    .generation-message { margin-top: 1rem; }
    .signature { margin-top: .75rem; padding-top: .75rem; border-top: 1px solid var(--line); }
    @media (max-width: 700px) { main { padding: 10px; } }
  </style>
</head>
<body>
<main>
${body.join("\n")}
</main>
<script>
  (() => {
    const sortValue = (cell) => {
      const text = (cell?.textContent ?? "").trim()
      const lower = text.toLowerCase()
      if (!text || lower === "n/a" || lower === "none" || lower === "unknown") return { kind: 2, value: null }
      if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
        const timestamp = Date.parse(text)
        if (Number.isFinite(timestamp)) return { kind: 0, value: timestamp }
      }
      let durationSeconds = 0
      let durationParts = 0
      const durationRemainder = lower.replace(/(\d+(?:\.\d+)?)\s*([hms])/g, (_match, amount, unit) => {
        durationSeconds += Number(amount) * ({ h: 3600, m: 60, s: 1 })[unit]
        durationParts += 1
        return ""
      }).trim()
      if (durationParts && !durationRemainder) return { kind: 0, value: durationSeconds }
      const normalized = text.replaceAll(",", "").replace(/^\$/, "").replace(/%$/, "").trim()
      if (/^-?\d+(?:\.\d+)?$/.test(normalized)) return { kind: 0, value: Number(normalized) }
      const ratio = /^(-?\d+(?:\.\d+)?)\s*\//.exec(normalized)
      if (ratio) return { kind: 0, value: Number(ratio[1]) }
      return { kind: 1, value: lower }
    }
    const compareValues = (left, right, direction) => {
      if (left.kind === 2 && right.kind === 2) return 0
      if (left.kind === 2) return 1
      if (right.kind === 2) return -1
      const comparison = left.kind === 0 && right.kind === 0
        ? left.value - right.value
        : String(left.value).localeCompare(String(right.value), undefined, { numeric: true, sensitivity: "base" })
      return direction === "descending" ? -comparison : comparison
    }
    document.querySelectorAll("table").forEach((table) => {
      const headers = [...table.querySelectorAll("thead th")]
      const body = table.tBodies[0]
      if (!body) return
      ;[...body.rows].forEach((row, index) => { row.dataset.originalIndex = String(index) })
      headers.forEach((header, column) => {
        const button = header.querySelector(".sort-button")
        if (!button) return
        button.title = "Sort descending"
        button.addEventListener("click", () => {
          const direction = header.getAttribute("aria-sort") === "descending" ? "ascending" : "descending"
          headers.forEach((item) => item.setAttribute("aria-sort", "none"))
          header.setAttribute("aria-sort", direction)
          headers.forEach((item) => {
            const itemButton = item.querySelector(".sort-button")
            if (itemButton) itemButton.title = item === header && direction === "descending" ? "Sort ascending" : "Sort descending"
          })
          const rows = [...body.rows]
          const totals = rows.filter((row) => (row.cells[0]?.textContent ?? "").trim().toLowerCase() === "total")
          const sortable = rows.filter((row) => !totals.includes(row))
          sortable.sort((left, right) => compareValues(sortValue(left.cells[column]), sortValue(right.cells[column]), direction) || Number(left.dataset.originalIndex) - Number(right.dataset.originalIndex))
          body.replaceChildren(...sortable, ...totals)
        })
      })
    })
  })()
</script>
</body>
</html>
`
}

const projectFiles = walk(root)
const nativeFiles = discoverNativeSessions()
const files = [...new Set([...projectFiles, ...nativeFiles].map((file) => resolve(file)))]
const stats = {
  filesVisited: 0,
  candidateFiles: files.length,
  projectCandidateFiles: projectFiles.length,
  nativeFilesConsidered: discovery.nativeFilesConsidered,
  nativeSessionsMatched: discovery.nativeSessionsMatched,
  codexSessions: discovery.codexSessions,
  claudeSessions: discovery.claudeSessions,
  geminiSessions: discovery.geminiSessions,
  clineSessions: discovery.clineSessions,
  rooSessions: discovery.rooSessions,
  opencodeSessions: 0,
  recognizedFiles: 0,
}
let malformed = []
const threads = []
const logicalSources = new Map()
for (const database of opencodeDatabaseCandidates()) {
  discovery.nativeFilesConsidered += 1
  const databaseThreads = await parseOpenCodeDatabase(database)
  if (databaseThreads.length) stats.recognizedFiles += 1
  for (const thread of databaseThreads) {
    const priced = priceThread(thread)
    Object.assign(thread, priced)
    threads.push(thread)
    if (thread.logicalId) logicalSources.set(thread.logicalId, [...(logicalSources.get(thread.logicalId) ?? []), thread.sourceFile])
  }
}
stats.nativeFilesConsidered = discovery.nativeFilesConsidered
stats.nativeSessionsMatched = discovery.nativeSessionsMatched
stats.opencodeSessions = discovery.opencodeSessions
for (const file of files) {
  stats.filesVisited += 1
  if (resolve(file) === markdownOutput || resolve(file) === htmlOutput) continue
  const parsed = readRecords(file)
  malformed = malformed.concat(parsed.malformed)
  if (!parsed.records.length) continue
  const harness = externalSessions.get(resolve(file))?.harness
  let parsedThreads = harness === "gemini" ? parseGemini(file, parsed.records) : []
  if (!parsedThreads.length && harness === "cline") parsedThreads = parseClineFamily(file, parsed.records, "cline")
  if (!parsedThreads.length && harness === "roo") parsedThreads = parseClineFamily(file, parsed.records, "roo")
  if (!parsedThreads.length) parsedThreads = parseCodex(file, parsed.records)
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
let reportThreads = threads
if (threadSelector) {
  const selector = String(threadSelector)
  const selectorBase = basename(selector)
  const directMatches = threads.filter((thread) => [thread.threadId, thread.logicalId, thread.sourceFile, basename(thread.sourceFile)].filter(Boolean).includes(selector) || basename(thread.sourceFile) === selectorBase)
  if (!directMatches.length) throw new Error(`no recognized thread matched selector: ${selector}`)
  const identities = new Set(directMatches.map((thread) => thread.logicalId ?? thread.sourceFile))
  if (identities.size > 1) throw new Error(`thread selector is ambiguous across ${identities.size} logical threads: ${selector}`)
  const selectionDepths = new Map([...identities].map((identity) => [String(identity), 0]))
  let expanded = true
  while (expanded) {
    expanded = false
    for (const thread of threads) {
      const identity = String(thread.logicalId ?? thread.sourceFile)
      if (selectionDepths.has(identity) || !thread.parentThreadId) continue
      const parentDepth = selectionDepths.get(String(thread.parentThreadId))
      if (!finite(parentDepth)) continue
      selectionDepths.set(identity, parentDepth + 1)
      expanded = true
    }
  }
  reportThreads = threads
    .filter((thread) => selectionDepths.has(String(thread.logicalId ?? thread.sourceFile)))
    .map((thread) => ({
      ...thread,
      selectionDepth: selectionDepths.get(String(thread.logicalId ?? thread.sourceFile)),
      selectionRole: selectionDepths.get(String(thread.logicalId ?? thread.sourceFile)) === 0 ? "selected-root" : "sub-agent",
    }))
}
const reportDuplicateIds = duplicateIds.filter((id) => reportThreads.some((thread) => thread.logicalId === id))
const markdown = report({ threads: reportThreads, stats, malformed, duplicateIds: reportDuplicateIds })
const html = htmlReport(markdown)
mkdirSync(dirname(markdownOutput), { recursive: true })
writeFileSync(markdownOutput, markdown, { flag: explicitOutput ? "w" : "wx" })
writeFileSync(htmlOutput, html, { flag: explicitOutput ? "w" : "wx" })
console.log(JSON.stringify({
  root,
  threadRoot,
  output,
  outputDirectory: dirname(markdownOutput),
  markdownReport: markdownOutput,
  htmlReport: htmlOutput,
  filesInspected: stats.candidateFiles,
  projectFilesInspected: stats.projectCandidateFiles,
  nativeFilesMetadataChecked: stats.nativeFilesConsidered,
  nativeSessionsMatched: stats.nativeSessionsMatched,
  codexSessions: stats.codexSessions,
  claudeSessions: stats.claudeSessions,
  geminiSessions: stats.geminiSessions,
  clineSessions: stats.clineSessions,
  rooSessions: stats.rooSessions,
  opencodeSessions: stats.opencodeSessions,
  recognizedFiles: stats.recognizedFiles,
  threadSelector,
  threads: reportThreads.length,
  rootThreads: reportThreads.filter((thread) => thread.selectionDepth === 0).length,
  subagentThreads: reportThreads.filter((thread) => finite(thread.selectionDepth) && thread.selectionDepth > 0).length,
  knownTokens: reportThreads.filter((thread) => finite(thread.tokens.providerTotal)).length,
  knownCosts: reportThreads.filter((thread) => finite(thread.cost.totalUsd)).length,
  costUsd: sumKnown(reportThreads.map((thread) => thread.cost.totalUsd)),
  wallTimeMs: rollup(reportThreads).wallTimeMs,
  activeTimeMs: rollup(reportThreads).activeTimeMs,
  malformedRecords: malformed.length,
}, null, 2))
