// Shared core for the 11ai-benchmarks analyzers. One copy per reporting skill,
// kept byte-identical by v0/scripts/check-benchmarks-drift.mjs. Per-run state and
// the two per-skill functions (baseThread, sourceLabel) are injected via initCore.

import { createHash } from "node:crypto"
import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync, statSync } from "node:fs"
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { classifyThread } from "./harness-support.mjs"
import { GEIST_MONO_UNICODE_RANGE, GEIST_MONO_WOFF2_BASE64, INTER_UNICODE_RANGE, INTER_WOFF2_BASE64 } from "./report-fonts.mjs"
import { pricingAgeDays, resolveHistoricalPrice } from "./pricing-history.mjs"

export const SKIP_DIRS = new Set([
  ".git", ".hg", ".svn", "node_modules", ".next", ".turbo", ".cache", ".parcel-cache",
  "coverage", "dist", "build", "out", "vendor", ".venv", "venv", "__pycache__",
])
export const JSON_EXTENSIONS = new Set([".json", ".jsonl", ".ndjson"])
export const SESSION_EXTENSIONS = new Set([".json", ".jsonl", ".ndjson"])
export const ACTIVE_GAP_MS = 5 * 60 * 1000
export const COST_BY_HEADERS = ["Cost", "Input", "Cached", "Input cost", "Output", "Output cost", "Tokens", "Cost / 1M tokens", "Threads", "Cost / thread", "Active time", "Cost / active hour", "Wall time", "Cost / wall hour", "Output TPS", "Active time / response"]
export const finite = (value) => typeof value === "number" && Number.isFinite(value)
export const number = (value) => {
  if (finite(value)) return value
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value)
  return null
}
export const sha = (value) => createHash("sha256").update(value).digest("hex")
export const iso = (value) => {
  if (!value) return null
  const date = typeof value === "number" && value < 1_000_000_000_000 ? new Date(value * 1000) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
export const firstFinite = (...values) => values.map(number).find(finite) ?? null
export const firstValue = (...values) => values.find((value) => value !== undefined && value !== null) ?? null
export const sumKnown = (values) => values.filter(finite).reduce((sum, value) => sum + value, 0)
export const sumAvailable = (values) => values.some(finite) ? sumKnown(values) : null
export const sumNullable = (values) => values.every(finite) ? values.reduce((sum, value) => sum + value, 0) : null
export const sumReported = (values) => values.filter(finite).length ? sumKnown(values) : null

let discovery, externalSessions, pricing, generatedAt, baseThread, sourceLabel

export function initCore(state) {
  ({ discovery, externalSessions, pricing, generatedAt, baseThread, sourceLabel } = state)
}

export function addTokens(items) {
  const fields = ["inputTotal", "inputUncached", "cachedInputRead", "cacheWrite5m", "cacheWrite1h", "outputTotal", "reasoningOutput", "nonReasoningOutput", "providerTotal"]
  return Object.fromEntries(fields.map((field) => [field, sumNullable(items.map((item) => item[field]))]))
}

export function claudeBillingFingerprint(record, usage) {
  const tokens = normalizeUsage(usage, "anthropic")
  return JSON.stringify([
    modelFrom(record, usage),
    tokens.inputUncached,
    tokens.cachedInputRead,
    tokens.cacheWrite5m,
    tokens.cacheWrite1h,
  ])
}

export function claudeDesktopRoots(userHome) {
  return [
    join(userHome, "Library", "Application Support", "Claude", "claude-code-sessions"),
    join(userHome, ".config", "Claude", "claude-code-sessions"),
    join(userHome, "AppData", "Roaming", "Claude", "claude-code-sessions"),
  ]
}

export function claudeMessageId(record) {
  const value = firstValue(record?.message?.id, record?.id)
  if (value === null) return null
  const id = String(value).trim()
  return id || null
}

export function costByValues(items) {
  const result = rollup(items)
  return [
    fmtUsd(result.costUsd),
    fmtInt(sumAvailable(items.map((item) => item.tokens.inputTotal))),
    fmtInt(sumAvailable(items.map((item) => item.tokens.cachedInputRead))),
    fmtUsd(result.inputCostUsd),
    fmtInt(sumAvailable(items.map((item) => item.tokens.outputTotal))),
    fmtUsd(result.outputCostUsd),
    fmtInt(result.tokens),
    fmtUsdPerMillionTokens(result.costUsd, result.tokens),
    fmtInt(result.threadCount),
    fmtUsdPerThread(result.costUsd, result.threadCount),
    fmtDurationMs(result.activeTimeMs),
    fmtUsdPerActiveHour(result.costUsd, result.activeTimeMs),
    fmtDurationMs(result.wallTimeMs),
    fmtUsdPerActiveHour(result.costUsd, result.wallTimeMs),
    fmtTokensPerSecond(result.outputTokensPerSecond),
    fmtSecondsMs(result.activeMsPerResponse),
  ]
}

export function costPart(tokens, rate) {
  if (!finite(tokens)) return null
  if (tokens === 0) return 0
  return finite(rate) ? tokens * rate / 1_000_000 : null
}

export function coworkCoverageLines(stats) {
  const states = []
  if (stats.coworkLocalSessionsMeasured > 0) states.push("local measured")
  if (stats.coworkRemoteSessionsMeasured > 0) states.push("remote measured")
  if (stats.coworkRemoteSessionsUnavailable > 0) states.push("remote detected, usage unavailable")
  if (!states.length) states.push("none detected")
  return [
    "## Cowork coverage",
    "",
    table(["Cowork state", "Sessions", "Token and cost treatment"], [
      ["Local measured", fmtInt(stats.coworkLocalSessionsMeasured), "Included in measured totals"],
      ["Remote detected", fmtInt(stats.coworkRemoteSessionsDetected), "Detection count; divided into measured and unavailable states below"],
      ["Remote measured", fmtInt(stats.coworkRemoteSessionsMeasured), "Included in measured totals from readable usage records"],
      ["Remote detected, usage unavailable", fmtInt(stats.coworkRemoteSessionsUnavailable), "Excluded from measured totals; never treated as zero usage"],
    ]),
    "",
    `Coverage state: **${states.join("; ")}**.`,
    "",
    ...(stats.coworkRemoteSessionsUnavailable > 0 ? [`> **Cowork coverage warning:** ${fmtInt(stats.coworkRemoteSessionsUnavailable)} remote Cowork session(s) were detected, but their token usage and cost are unavailable. All token and cost totals in this report remain measured totals and exclude that unavailable usage.`, ""] : []),
  ]
}

export function coworkRunStats(items) {
  const sessions = new Map()
  for (const item of items) {
    if (!item.coworkSessionId) continue
    const key = item.logicalThreadKey ?? item.coworkSessionId
    sessions.set(key, Math.max(sessions.get(key) ?? 0, item.coworkSubagentRuns ?? 0))
  }
  return { sessions: sessions.size, subagents: [...sessions.values()].reduce((sum, count) => sum + count, 0) }
}

export function coworkSessionMetadata(file) {
  let sessionDir = dirname(file)
  for (let depth = 0; depth < 10; depth += 1) {
    if (basename(sessionDir).startsWith("local_")) break
    const parent = dirname(sessionDir)
    if (parent === sessionDir) return null
    sessionDir = parent
  }
  if (!basename(sessionDir).startsWith("local_")) return null
  let metadata = {}
  try { metadata = JSON.parse(readFileSync(`${sessionDir}.json`, "utf8")) } catch { /* audit records remain usable without metadata */ }
  const directories = Array.isArray(metadata.userSelectedFolders) ? metadata.userSelectedFolders.filter((value) => typeof value === "string").map((value) => resolve(value)) : []
  const sessionId = firstValue(metadata.sessionId, basename(sessionDir))
  const transcript = relative(sessionDir, file).replaceAll("\\", "/")
  const subagentMatch = transcript.match(/(?:^|\/)subagents\/([^/]+)\.jsonl$/i)
  return {
    id: sessionId,
    coworkSessionId: String(sessionId),
    coworkTranscriptRole: transcript === "audit.jsonl" ? "root" : subagentMatch ? "sub-agent" : "auxiliary",
    coworkSubagentId: subagentMatch?.[1] ?? null,
    title: typeof metadata.title === "string" ? metadata.title : null,
    cwd: directories.length === 1 ? directories[0] : null,
    directories,
    workspaceLabel: directories.length > 1 ? `multi-project session (${directories.length} folders)` : directories.length === 0 ? "session with no selected folder" : null,
  }
}

export function declaredWorkspace(records) {
  for (const record of records) {
    const directories = firstValue(record?.userSelectedFolders, record?.directories, record?.workspace?.folders)
    if (Array.isArray(directories)) {
      const resolved = directories.filter((value) => typeof value === "string" && value.trim()).map((value) => resolve(value))
      if (resolved.length === 1) return { cwd: resolved[0], workspaceLabel: null }
      if (resolved.length > 1) return { cwd: null, workspaceLabel: `multi-project session (${resolved.length} folders)` }
      return { cwd: null, workspaceLabel: "session with no selected folder" }
    }
    const cwd = firstValue(record?.cwd, record?.workspacePath, record?.workspace_path, record?.projectPath, record?.project_path, record?.workspace?.path, record?.metadata?.cwd, record?.payload?.cwd)
    if (typeof cwd === "string" && cwd.trim()) return { cwd: resolve(cwd), workspaceLabel: null }
    const label = firstValue(record?.workspaceLabel, record?.workspace_label)
    if (typeof label === "string" && label.trim()) return { cwd: null, workspaceLabel: label.trim() }
  }
  return null
}

export function effortFrom(record) {
  const effort = firstValue(
    record?.effort,
    record?.effort_level,
    record?.effortLevel,
    record?.reasoning_effort,
    record?.reasoningEffort,
    record?.output_config?.effort,
    record?.outputConfig?.effort,
    record?.request?.output_config?.effort,
    record?.request?.outputConfig?.effort,
    record?.body?.output_config?.effort,
    record?.body?.outputConfig?.effort,
    record?.message?.effort,
    record?.message?.effort_level,
    record?.message?.effortLevel,
    record?.message?.output_config?.effort,
    record?.message?.outputConfig?.effort,
    record?.usage?.effort,
    record?.message?.usage?.effort,
    record?.info?.effort,
    record?.info?.effort_level,
    record?.info?.effortLevel,
    record?.info?.output_config?.effort,
    record?.info?.outputConfig?.effort,
    record?.payload?.effort,
    record?.payload?.effort_level,
    record?.payload?.effortLevel,
    record?.payload?.reasoning_effort,
    record?.payload?.reasoningEffort,
    record?.payload?.output_config?.effort,
    record?.payload?.outputConfig?.effort,
    record?.metadata?.effort,
    record?.metadata?.effort_level,
    record?.metadata?.effortLevel,
    record?.metadata?.reasoning_effort,
    record?.metadata?.reasoningEffort,
    record?.metadata?.output_config?.effort,
    record?.metadata?.outputConfig?.effort,
    record?.settings?.effortLevel,
  )
  if (!effort) return null
  const normalized = String(effort).trim().toLowerCase()
  if (normalized === "light") return "low"
  if (["extra high", "extra-high", "extra_high"].includes(normalized)) return "xhigh"
  if (normalized === "med") return "medium"
  if (normalized === "ultracode") return "xhigh"
  return normalized
}

export function escapeCell(value) {
  return String(value ?? "n/a").replaceAll("|", "\\|").replaceAll("\n", " ")
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function fmtDurationMs(value) {
  if (!finite(value)) return "n/a"
  const totalSeconds = Math.max(0, Math.round(value / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours ? `${hours}h` : null, minutes ? `${minutes}m` : null, seconds || (!hours && !minutes) ? `${seconds}s` : null].filter(Boolean).join(" ")
}

export function fmtInt(value) {
  return finite(value) ? Math.round(value).toLocaleString("en-US") : "n/a"
}

export function fmtPct(numerator, denominator) {
  return finite(numerator) && denominator > 0 ? `${(numerator / denominator * 100).toFixed(1)}%` : "n/a"
}

export function fmtUsd(value) {
  return finite(value) ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}` : "n/a"
}

export function fmtUsdPerActiveHour(costUsd, activeTimeMs) {
  return finite(costUsd) && finite(activeTimeMs) && activeTimeMs > 0 ? fmtUsd(costUsd / (activeTimeMs / 3600000)) : "n/a"
}

export function fmtUsdPerMillionTokens(costUsd, tokens) {
  return finite(costUsd) && finite(tokens) && tokens > 0 ? fmtUsd(costUsd / tokens * 1_000_000) : "n/a"
}

export function fmtUsdPerThread(costUsd, threadCount) {
  return finite(costUsd) && finite(threadCount) && threadCount > 0 ? fmtUsd(costUsd / threadCount) : "n/a"
}

export function groupBy(items, selector) {
  const groups = new Map()
  for (const item of items) {
    const key = selector(item)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return groups
}

export function groupTiming(group) {
  // Slices of one transcript share its timing window and must count once; distinct
  // transcripts in a logical session (Cowork root plus sub-agents) time independently,
  // so the session wall time is the span and the active time is the per-file sum.
  const starts = group.map((item) => Date.parse(item.startedAt ?? "")).filter(Number.isFinite)
  const finishes = group.map((item) => Date.parse(item.finishedAt ?? "")).filter(Number.isFinite)
  const perFile = [...groupBy(group, (item) => item.sourceFile).values()].map((items) => ({
    wallTimeMs: items.map((item) => item.wallTimeMs).filter(finite).reduce((max, value) => Math.max(max, value), -Infinity),
    activeTimeMs: items.map((item) => item.activeTimeMs).filter(finite).reduce((max, value) => Math.max(max, value), -Infinity),
  }))
  const walls = perFile.map((file) => file.wallTimeMs).filter(finite)
  const actives = perFile.map((file) => file.activeTimeMs).filter(finite)
  return {
    startedAt: starts.length ? new Date(Math.min(...starts)).toISOString() : group[0].startedAt ?? null,
    finishedAt: finishes.length ? new Date(Math.max(...finishes)).toISOString() : group[0].finishedAt ?? null,
    wallTimeMs: starts.length && finishes.length ? Math.max(...finishes) - Math.min(...starts) : walls.length ? Math.max(...walls) : null,
    activeTimeMs: actives.length ? actives.reduce((sum, value) => sum + value, 0) : null,
  }
}

export function inlineHtml(value) {
  let html = escapeHtml(value)
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/^_([\s\S]+)_$/, "<em>$1</em>")
  return html
}

export function isClaudeUsage(record, usage) {
  const model = modelFrom(record, usage)
  return String(model).toLowerCase().startsWith("claude") || usage?.cache_creation_input_tokens !== undefined || usage?.cache_read_input_tokens !== undefined || record?.isSidechain !== undefined
}

export function isWithin(parent, child) {
  const rel = relative(resolve(parent), resolve(child))
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}

export function logicalIdFrom(record) {
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

export function logicalThreadRows(items) {
  return [...groupBy(items, (item) => item.logicalThreadKey ?? item.threadId).values()].map((group) => {
    const first = group[0]
    const methods = new Set(group.map((item) => item.costMethod))
    const statuses = new Set(group.map((item) => item.pricingStatus))
    const pricingStatus = statuses.has("invalid") ? "invalid"
      : statuses.has("partial") || (statuses.has("unmatched") && statuses.size > 1) ? "partial"
        : statuses.has("unmatched") ? "unmatched"
          : statuses.has("reported") ? "reported"
            : statuses.has("matched-stale") ? "matched-stale" : "matched"
    return {
      ...first,
      ...groupTiming(group),
      threadId: first.logicalThreadId ?? first.threadId,
      modelLabel: [...new Set(group.map((item) => `${item.provider} / ${item.model} / ${item.effort ?? "n/a"}`))].join("; "),
      tokens: addTokens(group.map((item) => item.tokens)),
      usageRecordCount: sumKnown(group.map((item) => item.usageRecordCount)),
      cost: { totalUsd: sumNullable(group.map((item) => item.cost.totalUsd)) },
      reportedCostUsd: sumReported(group.map((item) => item.reportedCostUsd)),
      costMethod: methods.size === 1 ? [...methods][0] : group.every((item) => finite(item.cost.totalUsd)) ? "mixed" : "unavailable",
      pricingStatus,
    }
  })
}

export function markdownCells(line) {
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

export function modelFrom(record, usage) {
  return firstValue(record?.model, record?.modelID, record?.modelId, record?.info?.modelID, record?.info?.modelId, record?.message?.model, record?.response?.model, record?.payload?.model, usage?.model) ?? "unknown"
}

export function nativeSessionMetadata(file) {
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
  try {
    if (statSync(file).size > 256 * 1024) discovery.limitations.push(`Session metadata not found within the first 256 KB: ${file}`)
  } catch { /* unreadable files are reported by the callers that read them */ }
  return null
}

export function normalizeUsage(usage, provider) {
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

  // Non-Anthropic counters treat cached tokens as a subset of input, and cache-write
  // classes only exist on Anthropic-style counters (routed to the branch above), so
  // OpenAI and generic providers share subset semantics with zero cache writes.
  const cachedInputRead = cached ?? 0
  return {
    inputTotal: input,
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

export function parseClineFamily(file, records, harness) {
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
    // OpenAI-protocol tasks report cached tokens as a subset of prompt tokens;
    // Anthropic-protocol buckets are disjoint.
    const openaiCacheSemantics = String(usage.apiProtocol ?? "").toLowerCase() === "openai"
    const startTs = Date.parse(iso(record.ts ?? record.timestamp) ?? "")
    const nextTs = (() => {
      const index = records.indexOf(record)
      for (let cursor = index + 1; cursor < records.length; cursor += 1) {
        const candidate = Date.parse(iso(records[cursor]?.ts ?? records[cursor]?.timestamp) ?? "")
        if (Number.isFinite(candidate)) return candidate
      }
      return NaN
    })()
    const requestGapMs = Number.isFinite(startTs) && Number.isFinite(nextTs) && nextTs > startTs ? nextTs - startTs : null
    const requestLatencyMs = record.say === "api_req_started" && requestGapMs !== null && requestGapMs <= ACTIVE_GAP_MS ? requestGapMs : null
    entries.push({
      requestLatencyMs,
      record: { ...record, timestamp: record.ts ?? record.timestamp },
      usage,
      model,
      provider,
      cost: firstFinite(usage.cost),
      tokens: openaiCacheSemantics ? {
        inputTotal: tokensIn,
        inputUncached: tokensIn - cacheReads,
        cachedInputRead: cacheReads,
        cacheWrite5m: cacheWrites,
        cacheWrite1h: 0,
        outputTotal: tokensOut,
        reasoningOutput: null,
        nonReasoningOutput: tokensOut,
        providerTotal: tokensIn + cacheWrites + tokensOut,
      } : {
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
  const fullTiming = timingFrom(entries.map((entry) => entry.record))
  return [...groups.values()].map((group, index) => Object.assign(baseThread(
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
  ), fullTiming, { latency: latencyHistogram(group.map((entry) => entry.requestLatencyMs), "request-events") }))
}

export function parseGemini(file, records) {
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
  const fullTiming = timingFrom(records)
  return [...groups.entries()].map(([model, group], index) => Object.assign(baseThread(file, index, "google", "gemini", model, addTokens(group.tokens), [metadata, ...group.records].filter(Boolean), group.usages, null, metadata?.sessionId), fullTiming))
}

export function parseGeneric(file, records, claudeDedup) {
  const byKey = new Map()
  for (const [recordIndex, record] of records.entries()) {
    if (claudeDedup.candidates.has(record) && !claudeDedup.retained.has(record)) continue
    const usage = usageObject(record)
    if (!usage) continue
    const model = modelFrom(record, usage)
    const provider = providerFrom(record, usage, model)
    const id = firstValue(record?.id, record?.message?.id)
    if (id === null || id === undefined) {
      // Records without ids are distinct calls even when their counters are identical.
      byKey.set(`${sha(JSON.stringify({ model, usage }))}\u0000${recordIndex}`, { record, usage, model, provider })
      continue
    }
    const key = `${id}\u0000${model ?? ""}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, { record, usage, model, provider })
    } else if (usageSupersedes(usage, existing.usage)) {
      // Same id with counters that grew (or repeated exactly): a streaming snapshot; keep the latest.
      byKey.set(key, { record, usage, model, provider })
    } else {
      // Same id with counters that did not grow: an export that reuses a session-level id per call; keep both.
      byKey.set(`${key}\u0000${recordIndex}`, { record, usage, model, provider })
    }
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

export function priceThread(thread) {
  const resolved = resolveHistoricalPrice(pricing, { provider: thread.provider, model: thread.model, startedAt: thread.startedAt, finishedAt: thread.finishedAt, now: generatedAt })
  const rate = resolved?.rate ?? null
  const pricingInfo = resolved ? {
    provider: resolved.entry.provider ?? thread.provider,
    match: resolved.entry.match,
    per1M: rate.per1M ?? {},
    effectiveDate: rate.effectiveDate ?? null,
    detectedAt: rate.detectedAt ?? pricing.detectedAt ?? null,
    effectiveFrom: resolved.effectiveFrom,
    effectiveTo: resolved.effectiveTo,
    dateBasis: resolved.dateBasis,
    temporalStatus: resolved.temporalStatus,
    attributedAt: resolved.attributedAt,
    crossedBoundary: resolved.crossedBoundary,
    changeType: rate.changeType ?? null,
    sourceUrl: rate.sourceUrl ?? null,
    verifiedAt: rate.verifiedAt ?? null,
    notes: rate.notes ?? null,
    ageDays: pricingAgeDays(rate, generatedAt),
  } : null
  if (thread.tokenIssues.length) {
    return {
      cost: { inputUncachedUsd: null, cachedInputReadUsd: null, cacheWrite5mUsd: null, cacheWrite1hUsd: null, outputUsd: null, totalUsd: null },
      pricing: pricingInfo,
      pricingStatus: "invalid",
      costMethod: "unavailable",
    }
  }
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
      pricing: pricingInfo,
      pricingStatus: "reported",
      costMethod: "reported",
    }
  }
  const age = pricingAgeDays(rate, generatedAt)
  return {
    cost,
    pricing: pricingInfo,
    pricingStatus: cost.totalUsd === null ? "partial" : age !== null && age > 30 ? "matched-stale" : "matched",
    costMethod: cost.totalUsd === null ? "partial" : "derived",
  }
}

export function providerFrom(record, usage, model = modelFrom(record, usage)) {
  const explicit = firstValue(record?.provider, record?.providerID, record?.providerId, record?.info?.providerID, record?.info?.providerId, record?.payload?.provider, usage?.provider)
  if (explicit) {
    const provider = String(explicit).toLowerCase()
    if (["google-ai", "google-generative-ai", "vertex", "vertexai"].includes(provider)) return "google"
    if (["x.ai", "x-ai"].includes(provider)) return "xai"
    if (provider === "deepseek-ai") return "deepseek"
    if (provider === "mistralai") return "mistral"
    return provider
  }
  if (String(model).toLowerCase().startsWith("claude")) return "anthropic"
  if (/^(gpt|o[1-9]|chatgpt)/i.test(String(model))) return "openai"
  if (/^gemini/i.test(String(model))) return "google"
  if (/^grok/i.test(String(model))) return "xai"
  if (/^deepseek/i.test(String(model))) return "deepseek"
  if (/^(mistral|codestral|devstral|magistral|ministral|open-mistral)/i.test(String(model))) return "mistral"
  if (/^command-/i.test(String(model))) return "cohere"
  if (/^sonar/i.test(String(model))) return "perplexity"
  if (usage && ("cache_creation_input_tokens" in usage || "cache_read_input_tokens" in usage)) return "anthropic"
  return "unknown"
}

export function readPrefix(file, limit = 256 * 1024) {
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

export function readRecords(file) {
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

export function reportedCostFrom(record, usage) {
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

export function fmtTokensPerSecond(value) {
  return finite(value) ? value.toFixed(1) : "n/a"
}

export function fmtSecondsMs(value) {
  return finite(value) ? `${(value / 1000).toFixed(1)}s` : "n/a"
}

export function threadOutputTps(thread) {
  const output = thread.tokens?.outputTotal
  const activeMs = thread.activeTimeMs
  return finite(output) && finite(activeMs) && activeMs > 0 ? output / (activeMs / 1000) : null
}

export function threadActiveMsPerResponse(thread) {
  const activeMs = thread.activeTimeMs
  const responses = thread.usageRecordCount
  return finite(activeMs) && finite(responses) && responses > 0 ? activeMs / responses : null
}

export function rollup(items) {
  const logical = [...groupBy(items, (item) => item.logicalThreadKey ?? item.threadId).values()]
  const tokenValues = items.map((item) => item.tokens.providerTotal)
  const costValues = items.map((item) => item.cost.totalUsd)
  const inputCostValues = items.map((item) => {
    const values = [item.cost.inputUncachedUsd, item.cost.cachedInputReadUsd, item.cost.cacheWrite5mUsd, item.cost.cacheWrite1hUsd]
    return values.some(finite) ? sumKnown(values) : null
  })
  const outputCostValues = items.map((item) => item.cost.outputUsd)
  const timings = logical.map((group) => groupTiming(group))
  const wallValues = timings.map((timing) => timing.wallTimeMs)
  const activeValues = timings.map((timing) => timing.activeTimeMs)
  // Blended pairs: only logical threads where both sides of a ratio are measured count,
  // so a thread with tokens but no timing can never inflate a rate.
  let pairedOutputTokens = 0
  let pairedOutputActiveMs = 0
  let pairedResponses = 0
  let pairedResponseActiveMs = 0
  logical.forEach((group, index) => {
    const activeMs = activeValues[index]
    if (!finite(activeMs) || activeMs <= 0) return
    const outputs = group.map((item) => item.tokens.outputTotal)
    if (outputs.some(finite)) {
      pairedOutputTokens += sumKnown(outputs)
      pairedOutputActiveMs += activeMs
    }
    const responses = sumKnown(group.map((item) => item.usageRecordCount))
    if (responses > 0) {
      pairedResponses += responses
      pairedResponseActiveMs += activeMs
    }
  })
  return {
    outputTokensPerSecond: pairedOutputActiveMs > 0 ? pairedOutputTokens / (pairedOutputActiveMs / 1000) : null,
    activeMsPerResponse: pairedResponses > 0 ? pairedResponseActiveMs / pairedResponses : null,
    threadCount: logical.length,
    knownTokenThreads: logical.filter((group) => group.some((item) => finite(item.tokens.providerTotal))).length,
    knownCostThreads: logical.filter((group) => group.length > 0 && group.every((item) => finite(item.cost.totalUsd))).length,
    tokens: tokenValues.some(finite) ? sumKnown(tokenValues) : null,
    costUsd: costValues.some(finite) ? sumKnown(costValues) : null,
    inputCostUsd: inputCostValues.some(finite) ? sumKnown(inputCostValues) : null,
    outputCostUsd: outputCostValues.some(finite) ? sumKnown(outputCostValues) : null,
    knownWallThreads: wallValues.filter(finite).length,
    knownActiveThreads: activeValues.filter(finite).length,
    wallTimeMs: wallValues.some(finite) ? sumKnown(wallValues) : null,
    activeTimeMs: activeValues.some(finite) ? sumKnown(activeValues) : null,
  }
}

export function table(headers, rows) {
  const lines = [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`]
  for (const row of rows) lines.push(`| ${row.map(escapeCell).join(" | ")} |`)
  return lines.join("\n")
}

export function taskWorkspace(file) {
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

export function timeFrom(record) {
  return iso(firstValue(record?.timestamp, record?.startTime, record?.endTime, record?.created_at, record?.createdAt, record?.created, record?.updated_at, record?.updatedAt, record?.time?.completed, record?.time?.updated, record?.time?.created, record?.time, record?.info?.time?.completed, record?.info?.time?.updated, record?.info?.time?.created, record?.payload?.timestamp))
}

export function timingFrom(records) {
  const points = [...new Set(records.map(timeFrom).filter(Boolean).map((value) => new Date(value).getTime()).filter(Number.isFinite))].sort((a, b) => a - b)
  const startedAt = points.length ? new Date(points[0]).toISOString() : null
  const finishedAt = points.length ? new Date(points.at(-1)).toISOString() : null
  if (points.length < 2) return { startedAt, finishedAt, wallTimeMs: null, activeTimeMs: null, timestampCount: points.length }
  const wallTimeMs = points.at(-1) - points[0]
  const activeTimeMs = points.slice(1).reduce((sum, point, index) => sum + Math.min(point - points[index], ACTIVE_GAP_MS), 0)
  return { startedAt, finishedAt, wallTimeMs, activeTimeMs, timestampCount: points.length }
}

export function tokenIssues(tokens, reportedCostUsd) {
  const issues = []
  for (const [name, value] of Object.entries(tokens)) if (finite(value) && value < 0) issues.push(`${name} is negative (${value})`)
  if (finite(tokens.reasoningOutput) && finite(tokens.outputTotal) && tokens.reasoningOutput > tokens.outputTotal) issues.push(`reasoning output (${tokens.reasoningOutput}) exceeds total output (${tokens.outputTotal})`)
  if (finite(reportedCostUsd) && reportedCostUsd < 0) issues.push(`reported cost is negative (${reportedCostUsd})`)
  return issues
}

export function usageNumbers(usage, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(usage ?? {})) {
    if (typeof value === "number") out[prefix + key] = value
    else if (value && typeof value === "object" && !Array.isArray(value)) usageNumbers(value, `${prefix}${key}.`, out)
  }
  return out
}

export function usageObject(record) {
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

export function usageSupersedes(next, previous) {
  const before = usageNumbers(previous)
  const after = usageNumbers(next)
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if ((after[key] ?? 0) < (before[key] ?? 0)) return false
  }
  return true
}

export function vscodeTaskRoots(userHome, extensionId) {
  return [
    join(userHome, "Library", "Application Support", "Code", "User", "globalStorage", extensionId, "tasks"),
    join(userHome, ".config", "Code", "User", "globalStorage", extensionId, "tasks"),
    join(userHome, ".vscode-server", "data", "User", "globalStorage", extensionId, "tasks"),
    join(userHome, "AppData", "Roaming", "Code", "User", "globalStorage", extensionId, "tasks"),
  ]
}

export function walk(dir, files = []) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch (error) {
    if (existsSync(dir)) discovery.limitations.push(`Directory could not be scanned: ${dir} (${error.message})`)
    return files
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue
    const file = join(dir, entry.name)
    if (entry.isDirectory()) walk(file, files)
    else if (entry.isFile() && JSON_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push(file)
  }
  return files
}

export function walkSessionFiles(dir, files = []) {
  try {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) return files
  } catch (error) {
    discovery.limitations.push(`Native session directory could not be inspected: ${dir} (${error.message})`)
    return files
  }
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch (error) {
    discovery.limitations.push(`Native session directory could not be scanned: ${dir} (${error.message})`)
    return files
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const file = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walkSessionFiles(file, files)
    } else if (entry.isFile() && SESSION_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push(file)
  }
  return files
}

export function buildDataset({ generator, scope, threads, stats, malformed, duplicateIds }) {
  return {
    schemaVersion: 3,
    generator,
    generatedAt,
    scope,
    pricingCatalog: { version: pricing?.version ?? null, updatedAt: pricing?.updatedAt ?? null },
    scan: { ...discovery },
    stats,
    malformed,
    duplicateIds,
    threads,
  }
}

export function datasetReportInputs(dataset) {
  return { threads: dataset.threads, stats: dataset.stats, malformed: dataset.malformed, duplicateIds: dataset.duplicateIds }
}

export function loadDataset(file, expectedSkill) {
  const dataset = JSON.parse(readFileSync(file, "utf8"))
  if (![1, 2, 3].includes(dataset?.schemaVersion)) throw new Error(`unsupported dataset schemaVersion: ${dataset?.schemaVersion}`)
  if (dataset.schemaVersion < 3) upgradeDatasetThreads(dataset)
  if (dataset?.generator?.skill !== expectedSkill) {
    throw new Error(`dataset was generated by '${dataset?.generator?.skill ?? "unknown"}', expected '${expectedSkill}'`)
  }
  return dataset
}

export const LATENCY_BUCKET_EDGES_MS = [250, 500, 1000, 2000, 4000, 8000, 15000, 30000, 60000, 120000, 300000, 600000]

export function latencyHistogram(samplesMs, method = "record-timestamps") {
  const samples = samplesMs.filter((value) => finite(value) && value > 0)
  if (!samples.length) return null
  const buckets = new Array(LATENCY_BUCKET_EDGES_MS.length + 1).fill(0)
  let sumMs = 0
  let minMs = Infinity
  let maxMs = 0
  for (const value of samples) {
    let index = LATENCY_BUCKET_EDGES_MS.findIndex((edge) => value <= edge)
    if (index === -1) index = LATENCY_BUCKET_EDGES_MS.length
    buckets[index] += 1
    sumMs += value
    minMs = Math.min(minMs, value)
    maxMs = Math.max(maxMs, value)
  }
  return { method, count: samples.length, sumMs, minMs, maxMs, buckets }
}

export function mergeLatency(histograms) {
  const usable = histograms.filter((histogram) => histogram?.count)
  if (!usable.length) return null
  const methods = [...new Set(usable.map((histogram) => histogram.method))]
  const merged = { method: methods.length === 1 ? methods[0] : "mixed", count: 0, sumMs: 0, minMs: Infinity, maxMs: 0, buckets: new Array(LATENCY_BUCKET_EDGES_MS.length + 1).fill(0) }
  for (const histogram of usable) {
    merged.count += histogram.count
    merged.sumMs += histogram.sumMs
    merged.minMs = Math.min(merged.minMs, histogram.minMs)
    merged.maxMs = Math.max(merged.maxMs, histogram.maxMs)
    histogram.buckets.forEach((value, index) => { merged.buckets[index] += value })
  }
  return merged
}

export function latencyQuantileMs(histogram, q) {
  if (!histogram?.count) return null
  const target = q * histogram.count
  let cumulative = 0
  for (let index = 0; index < histogram.buckets.length; index += 1) {
    const bucketCount = histogram.buckets[index]
    if (!bucketCount) continue
    if (cumulative + bucketCount >= target) {
      // Clamp bucket bounds to the observed min/max so sparse histograms
      // (for example a single sample) interpolate to real values.
      const lower = Math.max(index === 0 ? 0 : LATENCY_BUCKET_EDGES_MS[index - 1], histogram.minMs)
      const upper = Math.min(index < LATENCY_BUCKET_EDGES_MS.length ? LATENCY_BUCKET_EDGES_MS[index] : Infinity, histogram.maxMs)
      const fraction = Math.max(0, Math.min(1, (target - cumulative) / bucketCount))
      return lower + (Math.max(upper, lower) - lower) * fraction
    }
    cumulative += bucketCount
  }
  return histogram.maxMs
}

export function claudeMessageLatencies(records) {
  // Per response message: last preceding input record (user message or tool result)
  // to the final snapshot of that message. Includes network, queue, and decode time.
  const state = new Map()
  let previousInputTs = null
  for (const record of records) {
    const ts = Date.parse(record?.timestamp ?? "")
    const usage = record?.usage ?? record?.message?.usage
    const id = usage ? claudeMessageId(record) : null
    if (usage && id && isClaudeUsage(record, usage)) {
      const entry = state.get(id) ?? { inputTs: previousInputTs, lastTs: null }
      if (finite(ts)) entry.lastTs = Math.max(entry.lastTs ?? ts, ts)
      state.set(id, entry)
    } else if (finite(ts)) {
      previousInputTs = ts
    }
  }
  const latencies = new Map()
  for (const [id, entry] of state) {
    if (finite(entry.inputTs) && finite(entry.lastTs) && entry.lastTs > entry.inputTs) latencies.set(id, entry.lastTs - entry.inputTs)
  }
  return latencies
}

export function codexTurnLatencies(tokenEvents) {
  // Each token_count event marks the end of a model turn; consecutive event
  // gaps approximate turn durations (model plus in-turn tool time). Gaps above
  // the active-gap cap are idle time between turns, not turns, and are excluded.
  const times = tokenEvents.map((record) => Date.parse(record?.timestamp ?? "")).filter(Number.isFinite)
  const samples = []
  for (let index = 1; index < times.length; index += 1) {
    const delta = times[index] - times[index - 1]
    if (delta > 0 && delta <= ACTIVE_GAP_MS) samples.push(delta)
  }
  return samples
}

export function responseLatencyLines(threads) {
  const fmtLatency = (ms) => (finite(ms) ? `${(ms / 1000).toFixed(1)}s` : "n/a")
  const lines = [
    "## Response latency",
    "",
    "Latency includes network, queue, decode, and in-turn tool time; it is never time-to-first-token. Methods by harness: Claude family measures each response from the last preceding input record to its final snapshot (record-timestamps); Codex measures gaps between consecutive cumulative token events (turn-events); Cline and Roo Code measure each API request to the next recorded event (request-events); OpenCode measures row creation to last update (row-durations). Gemini CLI records one timestamp per response and is excluded; unmeasured responses count toward coverage denominators only. Gap-based methods (turn-events, request-events) exclude gaps above the five-minute active-gap cap as idle time.",
    "",
  ]
  const covered = threads.filter((thread) => thread.latency?.count)
  if (!covered.length) {
    lines.push("No responses carried measurable per-response timestamps in this scope.")
    return lines
  }
  const headers = ["Responses", "p50", "p90", "Mean", "Max", "Mean output tokens / response", "Coverage"]
  const responseUnits = (thread) => Math.max(finite(thread.usageRecordCount) ? thread.usageRecordCount : 0, thread.latency?.count ?? 0)
  const rowFor = (items) => {
    const merged = mergeLatency(items.map((thread) => thread.latency))
    const measuredThreads = items.filter((thread) => thread.latency?.count)
    const outputs = sumKnown(measuredThreads.map((thread) => thread.tokens.outputTotal).filter(finite))
    const responses = sumKnown(measuredThreads.map(responseUnits))
    const denominator = sumKnown(items.map(responseUnits))
    return [
      fmtInt(merged.count),
      fmtLatency(latencyQuantileMs(merged, 0.5)),
      fmtLatency(latencyQuantileMs(merged, 0.9)),
      fmtLatency(merged.count ? merged.sumMs / merged.count : null),
      fmtLatency(merged.maxMs),
      fmtInt(responses > 0 ? outputs / responses : null),
      fmtPct(merged.count, denominator),
    ]
  }
  const grouped = (label, keyOf) => {
    const groups = [...groupBy(threads, keyOf).entries()]
      .filter(([, items]) => items.some((thread) => thread.latency?.count))
      .sort((a, b) => (mergeLatency(b[1].map((t) => t.latency))?.count ?? 0) - (mergeLatency(a[1].map((t) => t.latency))?.count ?? 0) || a[0].localeCompare(b[0]))
    if (!groups.length) return []
    const withMethod = label === "harness"
    const methodOf = (items) => mergeLatency(items.map((thread) => thread.latency))?.method ?? "n/a"
    if (withMethod) {
      return [
        "### Response latency by harness",
        "",
        HARNESS_HINT,
        "",
        table([...HARNESS_TUPLE_HEADERS, ...headers, "Method"], [
          ...groups.map(([key, items]) => [...key.split(" | "), ...rowFor(items), methodOf(items)]),
          ["Total", "", "", "", "", "", ...rowFor(threads), methodOf(threads)],
        ]),
        "",
      ]
    }
    return [
      `### Response latency by ${label}`,
      "",
      table(["Provider / model / effort", ...headers], [
        ...groups.map(([key, items]) => [key, ...rowFor(items)]),
        ["Total", ...rowFor(threads)],
      ]),
      "",
    ]
  }
  lines.push(...grouped("model", (thread) => `${thread.provider} / ${thread.model} / ${thread.effort ?? "n/a"}`))
  lines.push(...grouped("harness", harnessTupleKey))
  if (lines.at(-1) === "") lines.pop()
  return lines
}

export const STORE_NAMES = {
  codex: "codex-rollouts",
  claude: "claude-projects",
  cowork: "cowork-sessions",
  gemini: "gemini-chats",
  cline: "cline-tasks",
  roo: "roo-tasks",
  opencode: "opencode-db",
  generic: "export-files",
}

export const HARNESS_TUPLE_HEADERS = ["Surface", "Runtime", "Store", "Billing mode", "Usage source", "Confidence"]

export const HARNESS_HINT = "A harness is the combination of surface, runtime, store, and billing mode: the product you worked in, the engine that executed it, the usage store the numbers were read from, and how that usage is billed. Usage source and confidence qualify the evidence. Codex sub-agent sessions appear both as codex-subagent rows and in their parent surface's Sub-agent runs."

export function harnessTupleKey(thread) {
  const harness = thread.harness ?? {}
  return [harness.surface, harness.runtime, harness.store, harness.billingMode, harness.usageSource, harness.confidence].map((value) => value ?? "n/a").join(" | ")
}

const SUBAGENT_CAPABLE_STORES = new Set(["cowork-sessions", "claude-projects", "codex-rollouts"])

export function isSubagentThread(thread) {
  if (thread.coworkTranscriptRole) return thread.coworkTranscriptRole === "sub-agent"
  if (thread.store === "claude-projects") return /(^|\/)subagents\//.test(String(thread.sourceFile ?? ""))
  if (thread.store === "codex-rollouts") return String(thread.source ?? "") === "subagent"
  return null
}

export function subagentRunsCell(items) {
  const capable = items.filter((thread) => SUBAGENT_CAPABLE_STORES.has(thread.store))
  if (!capable.length) return "n/a"
  return fmtInt(capable.filter((thread) => isSubagentThread(thread) === true).length)
}

export function upgradeDatasetThreads(dataset) {
  // v1/v2 datasets carry a string harness and flat classification fields.
  for (const thread of dataset.threads ?? []) {
    if (thread.harness && typeof thread.harness === "object") continue
    thread.store = STORE_NAMES[thread.harness] ?? thread.harness ?? thread.store
    delete thread.harness
    thread.harness = classifyThread(thread)
  }
  return dataset
}

export function reportHtmlShell({ title, body }) {
  return String.raw`<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    /* Fonts: the exact latin slices the 11blog site self-hosts (Inter, Geist Mono;
       SIL OFL 1.1, https://openfontlicense.org), embedded so the report stays
       self-contained. The stacks behind them cover other scripts and platforms. */
    @font-face { font-family: "Inter"; font-style: normal; font-weight: 100 900; font-display: swap; src: url(data:font/woff2;base64,${INTER_WOFF2_BASE64}) format("woff2"); unicode-range: ${INTER_UNICODE_RANGE}; }
    @font-face { font-family: "Geist Mono"; font-style: normal; font-weight: 100 900; font-display: swap; src: url(data:font/woff2;base64,${GEIST_MONO_WOFF2_BASE64}) format("woff2"); unicode-range: ${GEIST_MONO_UNICODE_RANGE}; }
    /* Design tokens mirrored from 11blog v0/www/app/globals.css. Square corners by design. */
    :root {
      color-scheme: light;
      --background: oklch(1 0 0);
      --foreground: oklch(0.145 0 0);
      --card: oklch(1 0 0);
      --muted: oklch(0.97 0 0);
      --muted-foreground: oklch(0.556 0 0);
      --primary: oklch(0.508 0.118 165.612);
      --primary-foreground: oklch(0.979 0.021 166.113);
      --border: oklch(0.922 0 0);
      --accent-surface: color-mix(in oklab, var(--primary) 12%, var(--background));
      --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    .dark {
      color-scheme: dark;
      --background: oklch(0.145 0 0);
      --foreground: oklch(0.985 0 0);
      --card: oklch(0.205 0 0);
      --muted: oklch(0.269 0 0);
      --muted-foreground: oklch(0.708 0 0);
      --primary: oklch(0.74 0.15 163);
      --primary-foreground: oklch(0.262 0.051 172.552);
      --border: oklch(1 0 0 / 10%);
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--background); color: var(--foreground); font-family: var(--font-sans); font-size: 14px; line-height: 1.45; }
    main { width: 100%; margin: 0; padding: 16px 20px 24px; background: transparent; }
    h1 { margin: 0 0 .75rem; font-size: clamp(1.45rem, 2.6vw, 2.05rem); letter-spacing: -.035em; }
    #theme-toggle { position: fixed; top: 12px; right: 16px; z-index: 10; padding: .3rem .7rem; border: 1px solid var(--border); background: var(--card); color: var(--foreground); font: inherit; font-size: .8rem; cursor: pointer; }
    #theme-toggle:hover, #theme-toggle:focus-visible { border-color: var(--primary); color: var(--primary); outline: none; }
    .powered-by { display: inline-block; margin-left: .35rem; font-size: .38em; font-weight: 500; letter-spacing: 0; white-space: nowrap; vertical-align: middle; }
    .powered-by a { color: var(--muted-foreground); text-decoration: none; }
    .powered-by a:hover, .powered-by a:focus-visible { color: var(--primary); text-decoration: underline; }
    .report-section { margin: .55rem 0; overflow: hidden; border: 1px solid var(--border); background: var(--card); }
    .report-section.level-2 { margin-top: .8rem; }
    .report-section.level-3 { margin: .45rem 0; }
    summary { display: flex; align-items: center; gap: .5rem; padding: .62rem .78rem; cursor: pointer; color: var(--foreground); font-weight: 750; list-style: none; user-select: none; }
    summary::-webkit-details-marker { display: none; }
    summary::before { content: "▸"; flex: 0 0 auto; color: var(--primary); transition: transform .15s ease; }
    details[open] > summary::before { transform: rotate(90deg); }
    .level-2 > summary { font-size: 1.12rem; }
    .level-3 > summary { font-size: .98rem; }
    .section-body { padding: 0 .78rem .72rem; border-top: 1px solid var(--border); }
    p, li { margin: .45rem 0; color: var(--muted-foreground); }
    blockquote { margin: .75rem 0; padding: .65rem .8rem; border-left: 3px solid var(--primary); background: color-mix(in oklab, var(--primary) 7%, transparent); color: var(--muted-foreground); }
    .table-wrap { margin: .55rem 0 .9rem; overflow-x: auto; border: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; font-size: .82rem; }
    th, td { text-align: left; vertical-align: top; border-bottom: 1px solid var(--border); white-space: nowrap; }
    td { padding: .42rem .52rem; font-variant-numeric: tabular-nums; }
    th { position: relative; padding: 0; background: var(--muted); color: var(--foreground); }
    .sort-button { display: flex; width: 100%; align-items: center; gap: .3rem; padding: .42rem .52rem; border: 0; background: transparent; color: inherit; font: inherit; font-weight: 700; text-align: left; white-space: nowrap; cursor: pointer; }
    .sort-button:hover, .sort-button:focus-visible { background: color-mix(in oklab, var(--primary) 14%, transparent); outline: none; }
    .sort-indicator { min-width: .8em; color: var(--primary); }
    th[aria-sort="descending"] .sort-indicator::after { content: "▼"; }
    th[aria-sort="ascending"] .sort-indicator::after { content: "▲"; }
    .col-resize { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; user-select: none; touch-action: none; }
    .col-resize:hover { background: color-mix(in oklab, var(--primary) 35%, transparent); }
    table.fixed-cols th, table.fixed-cols td { overflow: hidden; text-overflow: ellipsis; }
    tbody tr.highlighted td { background: var(--accent-surface); }
    tr:last-child td { border-bottom: 0; }
    code { padding: .1rem .3rem; background: var(--muted); color: var(--foreground); font-family: var(--font-mono); font-size: .92em; }
    a { color: var(--primary); }
    .generation-message { margin-top: 1rem; }
    .signature { margin-top: .75rem; padding-top: .75rem; border-top: 1px solid var(--border); }
    @media (max-width: 700px) { main { padding: 10px; } }
  </style>
</head>
<body>
<button type="button" id="theme-toggle" aria-pressed="true" title="Toggle color theme">dark</button>
<main>
${body}
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
    const toggle = document.getElementById("theme-toggle")
    if (toggle) {
      toggle.addEventListener("click", () => {
        const dark = document.documentElement.classList.toggle("dark")
        toggle.textContent = dark ? "dark" : "light"
        toggle.setAttribute("aria-pressed", String(dark))
      })
    }
    document.addEventListener("click", (event) => {
      if (event.target.closest("a, button, .col-resize, thead")) return
      const row = event.target.closest("tbody tr")
      if (!row || !row.dataset.rowId) return
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed) return
      row.classList.toggle("highlighted")
    })
    document.addEventListener("pointerdown", (event) => {
      const handle = event.target.closest(".col-resize")
      if (!handle) return
      const th = handle.parentElement
      const table = th.closest("table")
      const headerCells = [...table.tHead.rows[0].cells]
      if (!table.dataset.fixedLayout) {
        const widths = headerCells.map((cell) => cell.getBoundingClientRect().width)
        const colgroup = document.createElement("colgroup")
        for (const width of widths) {
          const col = document.createElement("col")
          col.style.width = width + "px"
          colgroup.append(col)
        }
        table.insertBefore(colgroup, table.firstChild)
        table.style.tableLayout = "fixed"
        table.style.width = widths.reduce((sum, width) => sum + width, 0) + "px"
        table.classList.add("fixed-cols")
        table.dataset.fixedLayout = "true"
      }
      const column = headerCells.indexOf(th)
      const col = table.querySelector("colgroup").children[column]
      const startX = event.clientX
      const startWidth = parseFloat(col.style.width)
      const startTableWidth = parseFloat(table.style.width)
      const move = (moveEvent) => {
        const width = Math.max(0, startWidth + (moveEvent.clientX - startX))
        col.style.width = width + "px"
        table.style.width = (startTableWidth - startWidth + width) + "px"
      }
      const stop = () => {
        document.removeEventListener("pointermove", move)
        document.removeEventListener("pointerup", stop)
      }
      document.addEventListener("pointermove", move)
      document.addEventListener("pointerup", stop)
      event.preventDefault()
    })
  })()
</script>
</body>
</html>
`
}
