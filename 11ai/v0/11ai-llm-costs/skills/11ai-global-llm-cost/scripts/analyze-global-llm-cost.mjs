#!/usr/bin/env node

import { createHash } from "node:crypto"
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { basename, dirname, extname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const argv = process.argv.slice(2)
const option = (name) => {
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] : null
}
const options = (name) => argv.flatMap((arg, index) => arg === name && argv[index + 1] ? [argv[index + 1]] : [])

if (argv.includes("--help")) {
  console.log("usage: node analyze-global-llm-cost.mjs [--pricing pricing.json] [--output report-folder] [--output-dir report-folder] [--codex-home dir] [--claude-home dir] [--gemini-home dir] [--cline-tasks dir] [--roo-tasks dir] [--opencode-db file] [--include dir-or-file]")
  process.exit(0)
}

const VALUE_OPTIONS = new Set(["--pricing", "--output", "--output-dir", "--codex-home", "--claude-home", "--gemini-home", "--cline-tasks", "--roo-tasks", "--opencode-db", "--include"])
for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index]
  if (!VALUE_OPTIONS.has(arg)) throw new Error(`unknown argument: ${arg}`)
  if (!argv[index + 1] || argv[index + 1].startsWith("--")) throw new Error(`missing value for ${arg}`)
  index += 1
}

const generatedAt = new Date().toISOString()
const generatedTime = new Date(generatedAt)
const filenameTimestamp = generatedAt.replaceAll(":", "-").replaceAll(".", "-")
const reportName = `11ai-global-llm-cost-${filenameTimestamp}`
const reportPackageName = `11ai-global-llm-cost-reports-${filenameTimestamp}`
const explicitOutputDir = option("--output-dir") ?? option("--output")
if (option("--output-dir") && option("--output")) throw new Error("use either --output or --output-dir, not both")
const outputDir = resolve(explicitOutputDir ?? join(homedir(), "Desktop", "11ai-global-llm-cost-reports", reportPackageName))
const markdownOutput = join(outputDir, `${reportName}.md`)
const htmlOutput = join(outputDir, `${reportName}.html`)

const skillRoot = fileURLToPath(new URL("..", import.meta.url))
const pricingCandidates = [
  option("--pricing") ? resolve(option("--pricing")) : null,
  join(process.cwd(), "llm-pricing.json"),
  join(homedir(), ".llm-cost", "pricing.json"),
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
const externalSessions = new Map()
const includedFiles = new Map()
const discovery = { accountsConsidered: 0, nativeFilesConsidered: 0, codexSessions: 0, claudeSessions: 0, geminiSessions: 0, clineSessions: 0, rooSessions: 0, opencodeSessions: 0, unreadableFiles: 0, limitations: [], scopeDescription: "" }
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
  const external = externalSessions.get(resolve(file))
  if (external) return `${external.harness}-session/${external.account}/${external.label}`
  const included = includedFiles.get(resolve(file))
  if (included) return `included/${included.label}`
  return basename(file)
}

function folderLabel(file) {
  const external = externalSessions.get(resolve(file))
  if (external) return external.cwd ? workspaceLabel(external.cwd, external.userHome) : "unknown workspace"
  return includedFiles.get(resolve(file))?.rootLabel ?? "included"
}

function workspaceLabel(cwd, userHome = null) {
  const absolute = resolve(cwd)
  if (userHome) {
    const rel = relative(resolve(userHome), absolute).replaceAll("\\", "/")
    if (rel === "") return "~"
    if (!rel.startsWith("..")) return `~/${rel}`
  }
  return absolute.replaceAll("\\", "/")
}

function walk(dir, files = []) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return files }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue
    const file = join(dir, entry.name)
    if (entry.isDirectory()) walk(file, files)
    else if (entry.isFile() && JSON_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push(file)
  }
  return files
}

function walkSessionFiles(dir, files = []) {
  try {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) return files
  } catch { return files }
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return files }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
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
      cwd: Array.isArray(record.directories) && typeof record.directories[0] === "string" ? resolve(record.directories[0]) : null,
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
    } catch { /* no-op */ }
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

function conventionalUserHomes() {
  const homes = new Set([resolve(homedir())])
  for (const parent of ["/Users", "/home"]) {
    let entries = []
    try { entries = readdirSync(parent, { withFileTypes: true }) } catch { continue }
    for (const entry of entries) if (entry.isDirectory()) homes.add(resolve(parent, entry.name))
  }
  if (existsSync("/root")) homes.add("/root")
  return [...homes].sort()
}

function discoverNativeSessions() {
  const explicitCodex = option("--codex-home") ?? process.env.CODEX_HOME ?? null
  const explicitClaude = option("--claude-home") ?? process.env.CLAUDE_CONFIG_DIR ?? null
  const explicitGemini = option("--gemini-home") ?? (process.env.GEMINI_CLI_HOME ? join(process.env.GEMINI_CLI_HOME, ".gemini") : null)
  const explicitCline = option("--cline-tasks") ?? null
  const explicitRoo = option("--roo-tasks") ?? null
  const explicitOpenCode = options("--opencode-db").length > 0
  discovery.scopeDescription = [
    ["Codex", explicitCodex], ["Claude", explicitClaude], ["Gemini", explicitGemini],
    ["Cline", explicitCline], ["Roo", explicitRoo], ["OpenCode", explicitOpenCode],
  ].map(([name, explicit]) => `${name}: ${explicit ? "explicit override" : "all readable conventional homes"}`).join("; ")
  const userHomes = conventionalUserHomes()
  const sources = []
  if (explicitCodex) {
    const home = resolve(explicitCodex)
    sources.push({ harness: "codex", home, userHome: dirname(home), account: basename(dirname(home)), roots: [join(home, "sessions"), join(home, "archived_sessions")] })
  } else {
    for (const userHome of userHomes) {
      const home = join(userHome, ".codex")
      sources.push({ harness: "codex", home, userHome, account: basename(userHome), roots: [join(home, "sessions"), join(home, "archived_sessions")] })
    }
  }
  if (explicitClaude) {
    const home = resolve(explicitClaude)
    sources.push({ harness: "claude", home, userHome: dirname(home), account: basename(dirname(home)), roots: [join(home, "projects")] })
  } else {
    for (const userHome of userHomes) {
      const home = join(userHome, ".claude")
      sources.push({ harness: "claude", home, userHome, account: basename(userHome), roots: [join(home, "projects")] })
    }
  }
  if (explicitGemini) {
    const home = resolve(explicitGemini)
    sources.push({ harness: "gemini", home, userHome: dirname(home), account: basename(dirname(home)), roots: [join(home, "tmp")] })
  } else {
    for (const userHome of userHomes) {
      const home = join(userHome, ".gemini")
      sources.push({ harness: "gemini", home, userHome, account: basename(userHome), roots: [join(home, "tmp")] })
    }
  }
  const addTaskSource = (harness, requested, extensionId) => {
    if (requested) {
      const taskRoot = resolve(requested)
      const userHome = dirname(taskRoot)
      sources.push({ harness, home: dirname(taskRoot), userHome, account: basename(userHome), roots: [taskRoot] })
      return
    }
    for (const userHome of userHomes) {
      const roots = harness === "cline"
        ? [join(userHome, ".cline", "data", "tasks"), ...vscodeTaskRoots(userHome, extensionId)]
        : vscodeTaskRoots(userHome, extensionId)
      sources.push({ harness, home: userHome, userHome, account: basename(userHome), roots })
    }
  }
  addTaskSource("cline", explicitCline, "saoudrizwan.claude-dev")
  addTaskSource("roo", explicitRoo, "rooveterinaryinc.roo-cline")
  discovery.accountsConsidered = new Set(sources.map((source) => source.userHome)).size
  const discovered = []
  for (const source of sources) {
    for (const sessionRoot of source.roots) {
      for (const file of walkSessionFiles(sessionRoot)) {
        if ((source.harness === "cline" || source.harness === "roo") && basename(file) !== "ui_messages.json") continue
        if (source.harness === "gemini" && !file.replaceAll("\\", "/").includes("/chats/")) continue
        discovery.nativeFilesConsidered += 1
        let metadata = {}
        try {
          if (source.harness === "gemini") metadata = geminiSessionMetadata(file) ?? {}
          else if (source.harness === "cline" || source.harness === "roo") metadata = { cwd: taskWorkspace(file), id: basename(dirname(file)) }
          else metadata = nativeSessionMetadata(file) ?? {}
        } catch {
          discovery.unreadableFiles += 1
          continue
        }
        const rel = relative(source.home, file).replaceAll("\\", "/") || basename(file)
        externalSessions.set(resolve(file), { ...metadata, harness: source.harness, account: source.account, userHome: source.userHome, label: rel })
        discovered.push(resolve(file))
        if (source.harness === "codex") discovery.codexSessions += 1
        if (source.harness === "claude") discovery.claudeSessions += 1
        if (source.harness === "gemini") discovery.geminiSessions += 1
        if (source.harness === "cline") discovery.clineSessions += 1
        if (source.harness === "roo") discovery.rooSessions += 1
      }
    }
  }
  return discovered
}

function discoverIncludedFiles() {
  const files = []
  for (const requested of options("--include")) {
    const target = resolve(requested)
    if (!existsSync(target)) throw new Error(`included path does not exist: ${target}`)
    const stat = statSync(target)
    const candidates = stat.isDirectory() ? walk(target) : stat.isFile() && JSON_EXTENSIONS.has(extname(target).toLowerCase()) ? [target] : []
    const rootLabel = basename(target) || "root"
    for (const file of candidates) {
      const label = stat.isDirectory() ? `${rootLabel}/${relative(target, file).replaceAll("\\", "/")}` : basename(file)
      includedFiles.set(resolve(file), { label, rootLabel })
      files.push(resolve(file))
    }
  }
  return files
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
  return firstValue(record?.effort, record?.payload?.effort, record?.metadata?.effort)
}

function timeFrom(record) {
  return iso(firstValue(record?.timestamp, record?.created_at, record?.createdAt, record?.created, record?.time?.completed, record?.time?.created, record?.time, record?.info?.time?.completed, record?.info?.time?.created, record?.payload?.timestamp))
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
  return [...groups.entries()].map(([model, group], index) => baseThread(file, index, "google", "gemini", model, addTokens(group.tokens), group.records, group.usages, null, metadata?.sessionId))
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
      record: { ...record, timestamp: record.ts ?? record.timestamp }, usage, model, provider, cost: firstFinite(usage.cost),
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
    file, index, group[0].provider, harness, group[0].model,
    addTokens(group.map((entry) => entry.tokens)), group.map((entry) => entry.record), group.map((entry) => entry.usage),
    sumReported(group.map((entry) => entry.cost)), externalSessions.get(resolve(file))?.id,
  ))
}

async function parseOpenCodeDatabase(file, userHome, account) {
  let DatabaseSync
  try { ({ DatabaseSync } = await import("node:sqlite")) } catch {
    discovery.limitations.push("OpenCode SQLite discovery requires a Node.js runtime with node:sqlite support; JSON exports remain supported through --include.")
    return []
  }
  let database
  try {
    database = new DatabaseSync(file, { readOnly: true })
    const rows = database.prepare("SELECT id, directory, cost, tokens_input, tokens_output, tokens_reasoning, tokens_cache_read, tokens_cache_write, model, time_created, time_updated FROM session").all()
    const result = []
    for (const row of rows) {
      let modelInfo = {}
      try { modelInfo = typeof row.model === "string" ? JSON.parse(row.model) : (row.model ?? {}) } catch { modelInfo = {} }
      const model = firstValue(modelInfo.id, modelInfo.modelID, modelInfo.modelId) ?? "unknown"
      const provider = String(firstValue(modelInfo.providerID, modelInfo.providerId, modelInfo.provider, providerFrom({ model }, {}, model))).toLowerCase()
      const input = firstFinite(row.tokens_input, 0)
      const output = firstFinite(row.tokens_output, 0)
      const reasoning = firstFinite(row.tokens_reasoning, 0)
      const cacheRead = firstFinite(row.tokens_cache_read, 0)
      const cacheWrite = firstFinite(row.tokens_cache_write, 0)
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
      }, [{ timestamp: row.time_created }, { timestamp: row.time_updated }], [{ input, output, reasoning, cacheRead, cacheWrite }], firstFinite(row.cost), row.id)
      thread.sourceFile = `opencode-session/${account}/${basename(file)}/${row.id}`
      thread.folder = typeof row.directory === "string" ? workspaceLabel(row.directory, userHome) : "unknown workspace"
      result.push(thread)
    }
    discovery.opencodeSessions += result.length
    return result
  } catch (error) {
    discovery.unreadableFiles += 1
    discovery.limitations.push(`OpenCode database ${account}/${basename(file)} could not be read: ${error.message}`)
    return []
  } finally {
    try { database?.close() } catch { /* no-op */ }
  }
}

function opencodeDatabaseCandidates() {
  const explicit = options("--opencode-db")
  if (explicit.length) return explicit.map((file) => ({ file: resolve(file), userHome: dirname(resolve(file)), account: basename(dirname(resolve(file))) }))
  const candidates = []
  for (const userHome of conventionalUserHomes()) {
    const dataHome = userHome === homedir() && process.env.XDG_DATA_HOME ? resolve(process.env.XDG_DATA_HOME) : join(userHome, ".local", "share")
    for (const dir of [join(dataHome, "opencode"), join(userHome, "Library", "Application Support", "opencode")]) {
      let entries = []
      try { entries = readdirSync(dir, { withFileTypes: true }) } catch { continue }
      for (const entry of entries) if (entry.isFile() && /^opencode.*\.db$/i.test(entry.name)) candidates.push({ file: join(dir, entry.name), userHome, account: basename(userHome) })
    }
  }
  return candidates
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

function windowDefinitions() {
  const yearStart = new Date(generatedTime.getFullYear(), 0, 1)
  const monthStart = new Date(generatedTime.getFullYear(), generatedTime.getMonth(), 1)
  const past7Start = new Date(generatedTime.getTime() - 7 * 24 * 60 * 60 * 1000)
  return [
    { title: "All time", start: null, description: "Every recognized thread, including threads without a usable timestamp." },
    { title: "Year to date", start: yearStart, description: `Threads attributed from ${yearStart.toISOString()} through ${generatedAt}.` },
    { title: "Month to date", start: monthStart, description: `Threads attributed from ${monthStart.toISOString()} through ${generatedAt}.` },
    { title: "Past 7 days", start: past7Start, description: `Threads attributed from ${past7Start.toISOString()} through ${generatedAt}.` },
  ]
}

function threadTime(thread) {
  const value = thread.finishedAt ?? thread.startedAt
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function threadsForWindow(threads, start) {
  if (!start) return threads
  return threads.filter((thread) => {
    const date = threadTime(thread)
    return date && date >= start && date <= generatedTime
  })
}

function windowSection(definition, threads) {
  const total = rollup(threads)
  const priced = threads.filter((thread) => thread.costMethod === "derived")
  const reported = threads.filter((thread) => thread.costMethod === "reported")
  const unknown = threads.filter((thread) => !finite(thread.cost.totalUsd))
  const providers = [...groupBy(threads, (thread) => thread.provider).entries()]
    .sort((a, b) => (rollup(b[1]).costUsd ?? -1) - (rollup(a[1]).costUsd ?? -1))
  const harnesses = [...groupBy(threads, (thread) => thread.harness).entries()]
    .sort((a, b) => (rollup(b[1]).costUsd ?? -1) - (rollup(a[1]).costUsd ?? -1))
  const models = [...groupBy(threads, (thread) => `${thread.provider} / ${thread.model}`).entries()]
    .sort((a, b) => (rollup(b[1]).costUsd ?? -1) - (rollup(a[1]).costUsd ?? -1))
  const workspaces = [...groupBy(threads, (thread) => thread.folder).entries()]
    .sort((a, b) => (rollup(b[1]).costUsd ?? -1) - (rollup(a[1]).costUsd ?? -1))
  const sortedThreads = [...threads].sort((a, b) => (b.cost.totalUsd ?? -1) - (a.cost.totalUsd ?? -1) || (b.tokens.providerTotal ?? -1) - (a.tokens.providerTotal ?? -1) || a.sourceFile.localeCompare(b.sourceFile))
  const inputTotal = sumKnown(threads.map((thread) => thread.tokens.inputTotal))
  const cachedInput = sumKnown(threads.map((thread) => thread.tokens.cachedInputRead))
  const outputTotal = sumKnown(threads.map((thread) => thread.tokens.outputTotal))
  const reasoningTotal = sumKnown(threads.map((thread) => thread.tokens.reasoningOutput))
  const noRows = (message) => threads.length ? null : message

  return [
    `## ${definition.title}`,
    "",
    definition.description,
    "",
    "### Totals",
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
    "### Cost by provider",
    "",
    noRows("No threads fall in this period.") ?? table(["Provider", "Threads", "Known tokens", "Known cost", "Priced", "Unpriced"], [...providers.map(([key, items]) => {
      const r = rollup(items)
      return [key, fmtInt(r.threadCount), fmtInt(r.tokens), fmtUsd(r.costUsd), fmtInt(r.knownCostThreads), fmtInt(r.threadCount - r.knownCostThreads)]
    }), ["Total", fmtInt(total.threadCount), fmtInt(total.tokens), fmtUsd(total.costUsd), fmtInt(total.knownCostThreads), fmtInt(total.threadCount - total.knownCostThreads)]]),
    "",
    "### Cost by harness",
    "",
    noRows("No threads fall in this period.") ?? table(["Harness", "Threads", "Known tokens", "Known cost", "Reported-cost sum", "Average tokens / thread", "Average known cost / priced thread"], [...harnesses.map(([key, items]) => {
      const r = rollup(items)
      return [key, fmtInt(r.threadCount), fmtInt(r.tokens), fmtUsd(r.costUsd), fmtUsd(sumReported(items.map((item) => item.reportedCostUsd))), fmtInt(r.threadCount ? r.tokens / r.threadCount : null), fmtUsd(r.knownCostThreads ? r.costUsd / r.knownCostThreads : null)]
    }), ["Total", fmtInt(total.threadCount), fmtInt(total.tokens), fmtUsd(total.costUsd), fmtUsd(sumReported(threads.map((item) => item.reportedCostUsd))), fmtInt(total.threadCount ? total.tokens / total.threadCount : null), fmtUsd(total.knownCostThreads ? total.costUsd / total.knownCostThreads : null)]]),
    "",
    "### Cost by model",
    "",
    noRows("No threads fall in this period.") ?? table(["Provider / model", "Threads", "Input", "Cached", "Output", "Tokens", "Cost"], [...models.map(([key, items]) => [
      key,
      fmtInt(items.length),
      fmtInt(sumKnown(items.map((item) => item.tokens.inputTotal))),
      fmtInt(sumKnown(items.map((item) => item.tokens.cachedInputRead))),
      fmtInt(sumKnown(items.map((item) => item.tokens.outputTotal))),
      fmtInt(rollup(items).tokens),
      fmtUsd(rollup(items).costUsd),
    ]), ["Total", fmtInt(total.threadCount), fmtInt(inputTotal), fmtInt(cachedInput), fmtInt(outputTotal), fmtInt(total.tokens), fmtUsd(total.costUsd)]]),
    "",
    "### Cost by workspace",
    "",
    "Workspace comes from a native session's recorded working directory; supplemental logs are grouped by included root.",
    "",
    noRows("No threads fall in this period.") ?? table(["Workspace", "Threads", "Tokens", "Known cost", "Priced", "Unpriced"], [...workspaces.map(([key, items]) => {
      const r = rollup(items)
      return [key, fmtInt(r.threadCount), fmtInt(r.tokens), fmtUsd(r.costUsd), fmtInt(r.knownCostThreads), fmtInt(r.threadCount - r.knownCostThreads)]
    }), ["Total", fmtInt(total.threadCount), fmtInt(total.tokens), fmtUsd(total.costUsd), fmtInt(total.knownCostThreads), fmtInt(total.threadCount - total.knownCostThreads)]]),
    "",
    "### Token composition",
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
    "### Thread detail",
    "",
    noRows("No threads fall in this period.") ?? table(["Thread", "Source", "Workspace", "Provider / model", "Attributed at", "Tokens", "Selected cost", "Harness reported", "Method", "Duration"], sortedThreads.map((thread) => [
      thread.threadId,
      thread.sourceFile,
      thread.folder,
      `${thread.provider} / ${thread.model}${thread.effort ? ` / ${thread.effort}` : ""}`,
      threadTime(thread)?.toISOString() ?? "n/a",
      fmtInt(thread.tokens.providerTotal),
      fmtUsd(thread.cost.totalUsd),
      fmtUsd(thread.reportedCostUsd),
      thread.costMethod === "derived" ? `derived${thread.pricingStatus === "matched-stale" ? " (stale rate)" : ""}` : thread.costMethod,
      fmtDuration(thread.startedAt, thread.finishedAt),
    ])),
    "",
  ]
}

function report({ threads, stats, malformed, duplicateIds }) {
  const reported = threads.filter((thread) => thread.costMethod === "reported")
  const stale = threads.filter((thread) => thread.pricingStatus === "matched-stale")
  const unmatched = threads.filter((thread) => thread.pricingStatus === "unmatched")
  const partial = threads.filter((thread) => thread.pricingStatus === "partial")
  const pricingRows = [...groupBy(threads.filter((thread) => thread.pricing), (thread) => `${thread.provider} / ${thread.model}`).entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
  const anomalies = []
  for (const thread of threads) {
    if (thread.model === "unknown") anomalies.push(`${thread.sourceFile}: model is unavailable`)
    if (thread.provider === "unknown") anomalies.push(`${thread.sourceFile}: provider is unavailable`)
    if (!thread.startedAt || !thread.finishedAt) anomalies.push(`${thread.sourceFile}: timestamps are incomplete; the thread appears in All time but requires a usable timestamp for dated periods`)
    if (thread.pricingStatus === "unmatched") anomalies.push(`${thread.sourceFile}: no pricing catalog match for ${thread.provider} / ${thread.model}`)
    if (thread.pricingStatus === "partial") anomalies.push(`${thread.sourceFile}: pricing is incomplete for one or more observed token classes`)
    if (thread.reportedCostUsd !== null && thread.costMethod === "derived" && Math.abs(thread.reportedCostUsd - thread.cost.totalUsd) > 0.01) anomalies.push(`${thread.sourceFile}: reported ${fmtUsd(thread.reportedCostUsd)} differs from derived ${fmtUsd(thread.cost.totalUsd)}`)
  }
  for (const file of malformed) anomalies.push(`malformed JSON ignored: ${file}`)
  for (const id of duplicateIds) anomalies.push(`logical thread identity appears in multiple source files: ${id}`)

  const lines = [
    "# Global LLM Cost Report",
    "",
    `> Generated ${generatedAt} · Scope: ${stats.scopeDescription} · Prices are USD per 1M tokens unless noted`,
    "",
    "## Scan coverage",
    "",
    table(["Coverage", "Value"], [
      ["Files visited", fmtInt(stats.filesVisited)],
      ["JSON/JSONL/NDJSON files inspected", fmtInt(stats.candidateFiles)],
      ["Local accounts considered", fmtInt(stats.accountsConsidered)],
      ["Native discovery scope", stats.scopeDescription],
      ["Native session files metadata-checked", fmtInt(stats.nativeFilesConsidered)],
      ["Codex sessions", fmtInt(stats.codexSessions)],
      ["Claude sessions", fmtInt(stats.claudeSessions)],
      ["Gemini CLI sessions", fmtInt(stats.geminiSessions)],
      ["Cline tasks", fmtInt(stats.clineSessions)],
      ["Roo Code tasks", fmtInt(stats.rooSessions)],
      ["OpenCode sessions", fmtInt(stats.opencodeSessions)],
      ["Supplemental JSON-family files", fmtInt(stats.includedFiles)],
      ["Files containing usage records", fmtInt(stats.recognizedFiles)],
      ["Malformed records", fmtInt(malformed.length)],
      ["Unreadable native files skipped", fmtInt(stats.unreadableFiles)],
      ["Pricing catalog", pricingPath === join(skillRoot, "references", "pricing.json") ? "bundled default" : pricingPath ?? "none"],
      ["Oldest observed thread", threads.map((thread) => thread.startedAt).filter(Boolean).sort()[0] ?? "n/a"],
      ["Newest observed thread", threads.map((thread) => thread.finishedAt).filter(Boolean).sort().at(-1) ?? "n/a"],
    ]),
    "",
    ...windowDefinitions().flatMap((definition) => windowSection(definition, threadsForWindow(threads, definition.start))),
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
    "- Discover Codex, Claude Code, Gemini CLI, Cline, Roo Code, and OpenCode usage in conventional native local stores for every readable local account. Do not filter by project or recorded working directory.",
    "- Recursively inspect JSON, JSONL, and NDJSON files below each explicit `--include` path, excluding dependency, VCS, cache, virtual-environment, and build directories.",
    "- Use the last cumulative Codex token-count event; deduplicate Claude streaming records; aggregate Gemini per-message counters and Cline/Roo API request metrics; read OpenCode's session ledger in read-only mode; aggregate generic usage records by provider and model.",
    "- Attribute a whole thread to its finish timestamp, falling back to its start timestamp. All time includes undated threads; dated periods exclude them. Year-to-date and month-to-date use the machine's local calendar boundaries, while Past 7 days is a rolling 168-hour window.",
    "- Preserve provider-native usage semantics: OpenAI cached input is a subset of input, while Anthropic cache buckets are disjoint. Reasoning tokens are a subset of output.",
    "- Treat missing values as unavailable. Sum known totals for overview coverage, but surface every incomplete or unpriced thread in the detail and limitations sections.",
    "- Do not include prompts, message text, secrets, or raw transcripts in this report. Native source labels and normalized workspace paths are the traceability boundary.",
    "",
    "_LLM token cost analysis by [11ai-global-llm-cost](https://ai.rj11.io/skills/11ai-global-llm-cost)._",
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
    const signature = line === "_LLM token cost analysis by [11ai-global-llm-cost](https://ai.rj11.io/skills/11ai-global-llm-cost)._"
    if (signature) {
      closeAllSections()
      const signatureHtml = inlineHtml(line).replace(
        '<a href="https://ai.rj11.io/skills/11ai-global-llm-cost">',
        '<a href="https://ai.rj11.io/skills/11ai-global-llm-cost" target="_blank" rel="noopener noreferrer">',
      )
      body.push(`<p class="signature">${signatureHtml}</p>`)
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
      body.push("<div class=\"table-wrap\"><table><thead><tr>")
      body.push(headers.map((cell) => `<th>${inlineHtml(cell)}</th>`).join(""))
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

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Global LLM Cost Report</title>
  <style>
    :root { color-scheme: light dark; --bg: #f6f7fb; --card: #fff; --text: #172033; --muted: #5d6678; --line: #dce1ea; --accent: #3157d5; }
    @media (prefers-color-scheme: dark) { :root { --bg: #10131a; --card: #181d27; --text: #edf1f7; --muted: #aab3c3; --line: #303848; --accent: #8da8ff; } }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { width: min(1180px, calc(100% - 32px)); margin: 32px auto; padding: 40px; background: var(--card); border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 12px 36px rgba(0,0,0,.08); }
    h1 { margin-top: 0; font-size: clamp(2rem, 4vw, 3rem); letter-spacing: -.035em; }
    .report-section { margin: 1rem 0; overflow: hidden; border: 1px solid var(--line); border-radius: 12px; background: color-mix(in srgb, var(--card) 96%, var(--accent)); }
    .report-section.level-2 { margin-top: 1.5rem; }
    .report-section.level-3 { margin: .85rem 0; }
    summary { display: flex; align-items: center; gap: .7rem; padding: 1rem 1.2rem; cursor: pointer; color: var(--text); font-weight: 750; list-style: none; user-select: none; }
    summary::-webkit-details-marker { display: none; }
    summary::before { content: "▸"; flex: 0 0 auto; color: var(--accent); transition: transform .15s ease; }
    details[open] > summary::before { transform: rotate(90deg); }
    .level-2 > summary { font-size: 1.3rem; }
    .level-3 > summary { font-size: 1.05rem; }
    .section-body { padding: 0 1.2rem 1.2rem; border-top: 1px solid var(--line); }
    p, li { color: var(--muted); }
    blockquote { margin: 1.5rem 0; padding: 1rem 1.25rem; border-left: 4px solid var(--accent); background: color-mix(in srgb, var(--accent) 7%, transparent); color: var(--muted); }
    .table-wrap { margin: 1rem 0 1.75rem; overflow-x: auto; border: 1px solid var(--line); border-radius: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    th, td { padding: .7rem .8rem; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); white-space: nowrap; }
    th { background: color-mix(in srgb, var(--accent) 8%, transparent); color: var(--text); }
    tr:last-child td { border-bottom: 0; }
    code { padding: .1rem .3rem; border-radius: 4px; background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--text); }
    a { color: var(--accent); }
    .signature { margin-top: 3rem; padding-top: 1.25rem; border-top: 1px solid var(--line); }
    @media (max-width: 700px) { main { width: 100%; margin: 0; padding: 24px 16px; border: 0; border-radius: 0; } }
  </style>
</head>
<body>
<main>
${body.join("\n")}
</main>
</body>
</html>
`
}

const nativeFiles = discoverNativeSessions()
const supplementalFiles = discoverIncludedFiles()
const files = [...new Set([...nativeFiles, ...supplementalFiles].map((file) => resolve(file)))]
const stats = {
  filesVisited: 0,
  candidateFiles: files.length,
  accountsConsidered: discovery.accountsConsidered,
  scopeDescription: discovery.scopeDescription,
  nativeFilesConsidered: discovery.nativeFilesConsidered,
  codexSessions: discovery.codexSessions,
  claudeSessions: discovery.claudeSessions,
  geminiSessions: discovery.geminiSessions,
  clineSessions: discovery.clineSessions,
  rooSessions: discovery.rooSessions,
  opencodeSessions: 0,
  includedFiles: supplementalFiles.length,
  unreadableFiles: discovery.unreadableFiles,
  recognizedFiles: 0,
}
let malformed = []
const threads = []
const logicalSources = new Map()
for (const candidate of opencodeDatabaseCandidates()) {
  discovery.nativeFilesConsidered += 1
  const databaseThreads = await parseOpenCodeDatabase(candidate.file, candidate.userHome, candidate.account)
  if (databaseThreads.length) stats.recognizedFiles += 1
  for (const thread of databaseThreads) {
    const priced = priceThread(thread)
    Object.assign(thread, priced)
    threads.push(thread)
    if (thread.logicalId) logicalSources.set(thread.logicalId, [...(logicalSources.get(thread.logicalId) ?? []), thread.sourceFile])
  }
}
stats.nativeFilesConsidered = discovery.nativeFilesConsidered
stats.opencodeSessions = discovery.opencodeSessions
for (const file of files) {
  stats.filesVisited += 1
  if (resolve(file) === markdownOutput || resolve(file) === htmlOutput) continue
  let parsed
  try { parsed = readRecords(file) } catch (error) {
    malformed.push(`${sourceLabel(file)}: unreadable (${error.message})`)
    continue
  }
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
const markdown = report({ threads, stats, malformed, duplicateIds })
const html = htmlReport(markdown)
mkdirSync(outputDir, { recursive: true })
writeFileSync(markdownOutput, markdown, { flag: explicitOutputDir ? "w" : "wx" })
writeFileSync(htmlOutput, html, { flag: explicitOutputDir ? "w" : "wx" })
console.log(JSON.stringify({
  output: outputDir,
  outputDirectory: outputDir,
  markdownReport: markdownOutput,
  htmlReport: htmlOutput,
  filesInspected: stats.candidateFiles,
  accountsConsidered: stats.accountsConsidered,
  scope: stats.scopeDescription,
  nativeFilesMetadataChecked: stats.nativeFilesConsidered,
  codexSessions: stats.codexSessions,
  claudeSessions: stats.claudeSessions,
  geminiSessions: stats.geminiSessions,
  clineSessions: stats.clineSessions,
  rooSessions: stats.rooSessions,
  opencodeSessions: stats.opencodeSessions,
  supplementalFilesInspected: stats.includedFiles,
  unreadableNativeFiles: stats.unreadableFiles,
  recognizedFiles: stats.recognizedFiles,
  threads: threads.length,
  knownTokens: threads.filter((thread) => finite(thread.tokens.providerTotal)).length,
  knownCosts: threads.filter((thread) => finite(thread.cost.totalUsd)).length,
  costUsd: sumKnown(threads.map((thread) => thread.cost.totalUsd)),
  periods: Object.fromEntries(windowDefinitions().map((definition) => {
    const items = threadsForWindow(threads, definition.start)
    const totals = rollup(items)
    return [definition.title, { threads: items.length, knownTokens: totals.tokens, knownCostUsd: totals.costUsd }]
  })),
  malformedRecords: malformed.length,
}, null, 2))
