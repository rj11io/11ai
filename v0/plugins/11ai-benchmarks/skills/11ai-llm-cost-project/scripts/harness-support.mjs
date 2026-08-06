const finite = (value) => typeof value === "number" && Number.isFinite(value)
const number = (value) => finite(value) ? value : typeof value === "string" && value.trim() && Number.isFinite(Number(value)) ? Number(value) : null
const first = (...values) => values.find((value) => value !== undefined && value !== null) ?? null

function parseJson(value, fallback = {}) {
  if (value && typeof value === "object") return value
  try { return JSON.parse(value) } catch { return fallback }
}

function columns(database, table) {
  return new Set(database.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name))
}

export function readOpenCodeUsageRows(database) {
  const sessionColumns = columns(database, "session")
  if (!sessionColumns.has("id")) return []
  const legacy = ["cost", "tokens_input", "tokens_output", "tokens_reasoning", "tokens_cache_read", "tokens_cache_write", "model"].every((name) => sessionColumns.has(name))
  if (legacy) {
    return database.prepare("SELECT id, directory, cost, tokens_input, tokens_output, tokens_reasoning, tokens_cache_read, tokens_cache_write, model, time_created, time_updated FROM session").all().map((row) => {
      const modelInfo = parseJson(row.model)
      return {
        id: row.id,
        directory: row.directory,
        provider: first(modelInfo.providerID, modelInfo.providerId, modelInfo.provider),
        model: first(modelInfo.id, modelInfo.modelID, modelInfo.modelId),
        cost: number(row.cost),
        input: number(row.tokens_input) ?? 0,
        output: number(row.tokens_output) ?? 0,
        reasoning: number(row.tokens_reasoning) ?? 0,
        cacheRead: number(row.tokens_cache_read) ?? 0,
        cacheWrite: number(row.tokens_cache_write) ?? 0,
        timeCreated: row.time_created,
        timeUpdated: row.time_updated,
        schema: "legacy-session",
      }
    })
  }

  const messageColumns = columns(database, "message")
  if (!["session_id", "data"].every((name) => messageColumns.has(name))) return []
  const sessions = new Map(database.prepare("SELECT id, directory, time_created, time_updated FROM session").all().map((row) => [row.id, row]))
  const groups = new Map()
  for (const row of database.prepare("SELECT id, session_id, time_created, time_updated, data FROM message").all()) {
    const data = parseJson(row.data)
    if (data.role !== "assistant" || !data.tokens || typeof data.tokens !== "object") continue
    const provider = String(first(data.providerID, data.providerId, data.provider, "unknown"))
    const model = String(first(data.modelID, data.modelId, data.model, "unknown"))
    const key = `${row.session_id}\u0000${provider}\u0000${model}`
    const session = sessions.get(row.session_id) ?? {}
    const group = groups.get(key) ?? {
      id: row.session_id,
      directory: session.directory,
      provider,
      model,
      cost: 0,
      input: 0,
      output: 0,
      reasoning: 0,
      cacheRead: 0,
      cacheWrite: 0,
      timeCreated: session.time_created ?? row.time_created,
      timeUpdated: session.time_updated ?? row.time_updated,
      schema: "message-data",
    }
    group.cost += number(data.cost) ?? 0
    group.input += number(data.tokens.input) ?? 0
    group.output += number(data.tokens.output) ?? 0
    group.reasoning += number(data.tokens.reasoning) ?? 0
    group.cacheRead += number(data.tokens.cache?.read) ?? 0
    group.cacheWrite += number(data.tokens.cache?.write) ?? 0
    group.timeCreated = Math.min(number(group.timeCreated) ?? Infinity, number(row.time_created) ?? Infinity)
    group.timeUpdated = Math.max(number(group.timeUpdated) ?? -Infinity, number(row.time_updated) ?? -Infinity)
    groups.set(key, group)
  }
  return [...groups.values()].map((row) => ({
    ...row,
    cost: row.cost || 0,
    timeCreated: finite(row.timeCreated) ? row.timeCreated : null,
    timeUpdated: finite(row.timeUpdated) ? row.timeUpdated : null,
  }))
}

export function classifyThread(thread) {
  const originator = String(thread.originator ?? "").toLowerCase()
  const source = String(thread.source ?? "").toLowerCase()
  let surface = thread.harness
  let runtime = thread.harness
  let billingMode = thread.reportedCostUsd !== null ? "harness-reported" : "api-equivalent"
  let usageSource = thread.harness === "opencode" ? "local-db" : "native-transcript"
  let confidence = "reported-tokens"

  if (thread.harness === "codex") {
    runtime = "codex"
    if (originator.includes("codex_work") || originator.includes("chatgpt work")) {
      surface = "chatgpt-work"
      billingMode = "credits-or-subscription"
    } else if (originator.includes("t3code")) {
      surface = "t3-code"
      billingMode = "underlying-runtime"
    } else if (originator.includes("desktop") || source === "vscode") surface = "codex-desktop"
    else if (originator.includes("cli") || source === "cli") surface = "codex-cli"
    else if (source === "exec" || originator.includes("exec")) surface = "codex-exec"
    else if (source === "subagent") surface = "codex-subagent"
    else surface = "codex"
  } else if (thread.harness === "cowork") {
    surface = "claude-cowork"
    runtime = "claude"
    billingMode = "subscription-or-api-equivalent"
  } else if (thread.harness === "claude") {
    surface = thread.desktopClaudeSession ? "claude-desktop-code" : "claude-code"
    runtime = "claude"
    billingMode = "subscription-or-api-equivalent"
  } else if (thread.harness === "gemini") {
    surface = "gemini-cli"
    runtime = "gemini"
    billingMode = "api-subscription-or-free"
  } else if (thread.harness === "cline") surface = "cline"
  else if (thread.harness === "roo") surface = "roo-code"
  else if (thread.harness === "opencode") surface = "opencode"
  else if (thread.harness === "generic") {
    surface = "imported-export"
    runtime = "generic"
    usageSource = "export"
    confidence = "schema-derived"
  }
  if (thread.declaredSurface) surface = String(thread.declaredSurface)
  if (thread.declaredBillingMode) billingMode = String(thread.declaredBillingMode)
  if (thread.declaredUsageSource) usageSource = String(thread.declaredUsageSource)
  if (thread.declaredConfidence) confidence = String(thread.declaredConfidence)
  return { surface, runtime, billingMode, usageSource, confidence }
}

export const HARNESS_SURFACE_COVERAGE = [
  ["Codex CLI / Desktop / exec", "Native", "Codex rollout transcript; originator is preserved"],
  ["ChatGPT Work", "Inherited", "Local Work rollouts are classified separately; cloud-only work requires workspace analytics/export"],
  ["ChatGPT Chat", "Export only", "No trustworthy local per-message token ledger"],
  ["Claude Code / Desktop Code", "Native", "Claude project transcripts with global message-ID deduplication; desktop metadata is joined without adding usage"],
  ["Claude Cowork", "Native + detected remote", "Local audit transcripts are measured; remote indexes are detected and unavailable usage is excluded with a warning"],
  ["Gemini CLI", "Native", "Project chat recordings"],
  ["Google Antigravity", "Quota only", "Quota/credit accounting is not converted into tokens"],
  ["Cline", "Native", "Task API metrics"],
  ["Roo Code", "Native", "Task API metrics"],
  ["OpenCode", "Native", "Current message-data and legacy session-ledger schemas"],
  ["Trae", "Detected only", "Local values are context snapshots, not a billable token ledger"],
  ["Cursor", "API/export", "Team Admin usage events are authoritative; local state is attribution-only"],
  ["Windsurf", "Credits only", "Prompt-credit accounting is not converted into tokens"],
  ["Kiro", "Credits only", "Request credits are not converted into tokens"],
  ["Warp", "Credits only", "Oz credits are not converted into tokens"],
  ["Zed native agent", "Billing/export", "Use Zed billing data; external-agent usage belongs to its runtime"],
  ["T3 Code / Zed external agents", "Inherited", "Underlying Codex, Claude, or OpenCode store is counted once"],
]
