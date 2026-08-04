#!/usr/bin/env node

import { createHash } from "node:crypto"
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { HARNESS_SURFACE_COVERAGE, classifyThread, readOpenCodeUsageRows } from "./harness-support.mjs"

const argv = process.argv.slice(2)
const option = (name) => {
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] : null
}

const VALUE_OPTIONS = new Set(["--output", "--codex-home", "--claude-home", "--claude-desktop-home", "--cowork-home", "--gemini-home", "--cline-tasks", "--roo-tasks", "--opencode-db", "--thread"])
const FLAG_OPTIONS = new Set(["--project-only", "--single-thread-report", "--help"])
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
  console.log("usage: node analyze-llm-cost-project.mjs [root-folder] [--output report.md] [--codex-home dir] [--claude-home dir] [--claude-desktop-home dir] [--cowork-home dir] [--gemini-home dir] [--cline-tasks dir] [--roo-tasks dir] [--opencode-db file] [--thread id-or-source] [--project-only]")
  process.exit(0)
}

const threadRoot = resolve(process.cwd())
const root = resolve(positional ?? threadRoot)
const threadSelector = option("--thread")
const singleThreadReport = argv.includes("--single-thread-report")
if (singleThreadReport && !threadSelector) throw new Error("single-thread reports require --thread <id-or-source>")
const generatedAt = new Date().toISOString()
const filenameTimestamp = generatedAt.replaceAll(":", "-").replaceAll(".", "-")
const reportSkillName = singleThreadReport ? "11ai-llm-cost-single-thread" : "11ai-llm-cost-project"
const reportTitle = singleThreadReport ? "Single-Thread LLM Cost Report" : "Project LLM Cost Report"
const reportName = `${reportSkillName}-${filenameTimestamp}`
const reportsRootName = `${reportSkillName}-reports`
const reportPackageName = `${reportsRootName}-${filenameTimestamp}`
const reportSkillUrl = `https://ai.rj11.io/skills/${reportSkillName}`
const pricingUpdateSkillUrl = "https://ai.rj11.io/skills/11ai-llm-cost-pricing-update"
const reportPoweredBy = `_powered by [${reportSkillName}](${reportSkillUrl})._`
const reportSignature = `_LLM token cost analysis by [${reportSkillName}](${reportSkillUrl})._`
const explicitOutput = option("--output")
const markdownOutput = resolve(explicitOutput ?? join(threadRoot, reportsRootName, reportPackageName, `${reportName}.md`))
const htmlOutput = markdownOutput.toLowerCase().endsWith(".md") ? `${markdownOutput.slice(0, -3)}.html` : `${markdownOutput}.html`
const output = markdownOutput
if (!existsSync(root) || !statSync(root).isDirectory()) throw new Error(`root folder does not exist or is not a directory: ${root}`)

const skillRoot = fileURLToPath(new URL("..", import.meta.url))
const pricingPath = join(skillRoot, "references", "pricing.json")
if (!existsSync(pricingPath)) throw new Error(`bundled pricing catalog does not exist: ${pricingPath}`)
let pricing
try {
  pricing = JSON.parse(readFileSync(pricingPath, "utf8"))
} catch (error) {
  throw new Error(`bundled pricing catalog is invalid JSON: ${error.message}`)
}
if (!Array.isArray(pricing.models)) throw new Error(`bundled pricing catalog has no models array: ${pricingPath}`)

const SKIP_DIRS = new Set([
  ".git", ".hg", ".svn", "node_modules", ".next", ".turbo", ".cache", ".parcel-cache",
  "coverage", "dist", "build", "out", "vendor", ".venv", "venv", "__pycache__",
])
const JSON_EXTENSIONS = new Set([".json", ".jsonl", ".ndjson"])
const SESSION_EXTENSIONS = new Set([".json", ".jsonl", ".ndjson"])
const ACTIVE_GAP_MS = 5 * 60 * 1000
const externalSessions = new Map()
const claudeDesktopSessions = new Map()
const matchedClaudeDesktopSessions = new Set()
const remoteCoworkSessions = new Map()
const discovery = { nativeFilesConsidered: 0, nativeSessionsMatched: 0, codexSessions: 0, claudeSessions: 0, coworkSessions: 0, coworkLocalSessionsMeasured: 0, coworkRemoteSessionsDetected: 0, coworkRemoteSessionsMeasured: 0, coworkRemoteSessionsUnavailable: 0, coworkRemoteIndexFiles: 0, coworkTranscriptFiles: 0, coworkSubagentRuns: 0, claudeDesktopMetadataFiles: 0, geminiSessions: 0, clineSessions: 0, rooSessions: 0, opencodeSessions: 0, limitations: [] }
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
const sumAvailable = (values) => values.some(finite) ? sumKnown(values) : null
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

function declaredWorkspace(records) {
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

function folderLabel(file, records = []) {
  const external = externalSessions.get(resolve(file))
  if (external?.workspaceLabel) return external.workspaceLabel
  const declared = external?.cwd ? { cwd: external.cwd } : declaredWorkspace(records)
  if (declared?.workspaceLabel) return declared.workspaceLabel
  if (declared?.cwd) {
    const rel = relative(root, declared.cwd).replaceAll("\\", "/")
    return !rel || rel === "." ? "." : rel.split("/")[0]
  }
  const rel = sourceLabel(file)
  const first = rel.split("/")[0]
  return rel.includes("/") ? first : "."
}

function walk(dir, files = []) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch (error) {
    discovery.limitations.push(`Directory could not be scanned: ${dir} (${error.message})`)
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

function walkSessionFiles(dir, files = []) {
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

function coworkSessionMetadata(file) {
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
  return { id: sessionId, coworkSessionId: String(sessionId), coworkTranscriptRole: transcript === "audit.jsonl" ? "root" : subagentMatch ? "sub-agent" : "auxiliary", coworkSubagentId: subagentMatch?.[1] ?? null, title: typeof metadata.title === "string" ? metadata.title : null, cwd: directories.length === 1 ? directories[0] : null, directories, workspaceLabel: directories.length > 1 ? `multi-project session (${directories.length} folders)` : directories.length === 0 ? "session with no selected folder" : null }
}

function claudeDesktopRoots(userHome) {
  return [join(userHome, "Library", "Application Support", "Claude", "claude-code-sessions"), join(userHome, ".config", "Claude", "claude-code-sessions"), join(userHome, "AppData", "Roaming", "Claude", "claude-code-sessions")]
}

function indexClaudeDesktopSessions(explicitRoot = null) {
  for (const desktopRoot of explicitRoot ? [resolve(explicitRoot)] : claudeDesktopRoots(homedir())) {
    for (const file of walkSessionFiles(desktopRoot)) {
      if (extname(file).toLowerCase() !== ".json") continue
      let metadata
      try { metadata = JSON.parse(readFileSync(file, "utf8")) } catch { continue }
      if (typeof metadata?.cliSessionId !== "string" || !metadata.cliSessionId) continue
      discovery.claudeDesktopMetadataFiles += 1
      claudeDesktopSessions.set(metadata.cliSessionId, { sessionId: typeof metadata.sessionId === "string" ? metadata.sessionId : null, title: typeof metadata.title === "string" ? metadata.title : null, cwd: typeof metadata.cwd === "string" ? resolve(metadata.cwd) : typeof metadata.originCwd === "string" ? resolve(metadata.originCwd) : null, effort: typeof metadata.effort === "string" ? metadata.effort : null })
    }
  }
}

function indexRemoteCoworkSessions(file) {
  let metadata
  try { metadata = JSON.parse(readFileSync(file, "utf8")) } catch (error) {
    discovery.limitations.push(`Remote Cowork session index could not be inspected: ${file} (${error.message})`)
    return
  }
  if (!Array.isArray(metadata?.entries)) return
  discovery.coworkRemoteIndexFiles += 1
  for (const entry of metadata.entries) {
    if (typeof entry?.sessionId !== "string" || !entry.sessionId) continue
    const directories = Array.isArray(entry.folders) ? entry.folders.filter((value) => typeof value === "string" && value.trim()).map((value) => resolve(value)) : []
    if (!directories.some((directory) => isWithin(root, directory))) continue
    remoteCoworkSessions.set(entry.sessionId, { sessionId: entry.sessionId, directories })
  }
}

function enrichCoworkFiles(files) {
  for (const file of files) {
    if (extname(file).toLowerCase() !== ".jsonl") continue
    const existing = externalSessions.get(resolve(file))
    if (existing?.harness && existing.harness !== "cowork") continue
    const metadata = coworkSessionMetadata(file)
    if (!metadata) continue
    externalSessions.set(resolve(file), { ...existing, ...metadata, harness: "cowork", label: existing?.label ?? (relative(root, file).replaceAll("\\", "/") || basename(file)) })
  }
  const sessions = new Map()
  for (const [file, metadata] of externalSessions) {
    if (metadata.harness !== "cowork" || !metadata.coworkSessionId) continue
    const session = sessions.get(metadata.coworkSessionId) ?? { files: new Set(), subagents: new Set(), metadata: [] }
    session.files.add(file)
    if (metadata.coworkSubagentId) session.subagents.add(metadata.coworkSubagentId)
    session.metadata.push(metadata)
    sessions.set(metadata.coworkSessionId, session)
  }
  const remoteKeys = new Set(remoteCoworkSessions.keys())
  const measuredKeys = new Set(sessions.keys())
  discovery.coworkSessions = measuredKeys.size
  discovery.coworkLocalSessionsMeasured = [...measuredKeys].filter((key) => !remoteKeys.has(key)).length
  discovery.coworkRemoteSessionsDetected = remoteKeys.size
  discovery.coworkRemoteSessionsMeasured = [...remoteKeys].filter((key) => measuredKeys.has(key)).length
  discovery.coworkRemoteSessionsUnavailable = discovery.coworkRemoteSessionsDetected - discovery.coworkRemoteSessionsMeasured
  if (discovery.coworkRemoteSessionsUnavailable > 0) discovery.limitations.push(`${discovery.coworkRemoteSessionsUnavailable} remote Cowork session(s) were detected without readable usage; measured token and cost totals exclude them.`)
  discovery.coworkTranscriptFiles = [...sessions.values()].reduce((sum, session) => sum + session.files.size, 0)
  discovery.coworkSubagentRuns = [...sessions.values()].reduce((sum, session) => sum + session.subagents.size, 0)
  for (const session of sessions.values()) for (const metadata of session.metadata) metadata.coworkSubagentRuns = session.subagents.size
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
  const explicitClaude = option("--claude-home") ?? process.env.CLAUDE_CONFIG_DIR ?? null
  const explicitClaudeDesktop = option("--claude-desktop-home") ?? null
  if (explicitClaudeDesktop || !explicitClaude) indexClaudeDesktopSessions(explicitClaudeDesktop)
  const codexHome = resolve(option("--codex-home") ?? process.env.CODEX_HOME ?? join(homedir(), ".codex"))
  const claudeHome = resolve(explicitClaude ?? join(homedir(), ".claude"))
  const coworkRoots = option("--cowork-home") ? [resolve(option("--cowork-home"))] : [
    join(homedir(), "Library", "Application Support", "Claude", "local-agent-mode-sessions"),
    join(homedir(), ".config", "Claude", "local-agent-mode-sessions"),
    join(homedir(), "AppData", "Roaming", "Claude", "local-agent-mode-sessions"),
  ]
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
    { harness: "cowork", home: homedir(), roots: coworkRoots },
    { harness: "gemini", home: geminiHome, roots: [join(geminiHome, "tmp")] },
    { harness: "cline", home: dirname(clineRoots[0]), roots: clineRoots },
    { harness: "roo", home: dirname(rooRoots[0]), roots: rooRoots },
  ]
  const matched = []
  for (const source of sources) {
    for (const sessionRoot of source.roots) {
      const sessionFiles = walkSessionFiles(sessionRoot)
      if (source.harness === "cowork") {
        for (const file of sessionFiles) {
          if (basename(file) !== "remote-session-spaces.json") continue
          discovery.nativeFilesConsidered += 1
          indexRemoteCoworkSessions(file)
        }
      }
      for (const file of sessionFiles) {
        if (source.harness === "cowork" && extname(file).toLowerCase() !== ".jsonl") continue
        if ((source.harness === "cline" || source.harness === "roo") && basename(file) !== "ui_messages.json") continue
        if (source.harness === "gemini" && !file.replaceAll("\\", "/").includes("/chats/")) continue
        discovery.nativeFilesConsidered += 1
        let metadata
        let matches = false
        try {
          if (source.harness === "cowork") {
            metadata = coworkSessionMetadata(file)
            matches = Boolean(metadata && metadata.directories.some((directory) => isWithin(root, directory)))
          } else if (source.harness === "gemini") {
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
        } catch (error) {
          discovery.limitations.push(`Native session could not be inspected: ${file} (${error.message})`)
          continue
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

function effortFrom(record) {
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

function tokenIssues(tokens, reportedCostUsd) {
  const issues = []
  for (const [name, value] of Object.entries(tokens)) {
    if (finite(value) && value < 0) issues.push(`${name} is negative (${value})`)
  }
  if (finite(tokens.reasoningOutput) && finite(tokens.outputTotal) && tokens.reasoningOutput > tokens.outputTotal) {
    issues.push(`reasoning output (${tokens.reasoningOutput}) exceeds total output (${tokens.outputTotal})`)
  }
  if (finite(reportedCostUsd) && reportedCostUsd < 0) issues.push(`reported cost is negative (${reportedCostUsd})`)
  return issues
}

function baseThread(file, index, provider, harness, model, tokens, records, usageList, reportedCostUsd = null, logicalId = null) {
  const timing = timingFrom(records)
  const external = externalSessions.get(resolve(file))
  const effectiveHarness = external?.harness ?? harness
  const desktopMetadata = effectiveHarness === "claude" && logicalId ? claudeDesktopSessions.get(String(logicalId)) : null
  if (desktopMetadata && logicalId) matchedClaudeDesktopSessions.add(String(logicalId))
  const meta = records.find((record) => record?.type === "session_meta")?.payload ?? {}
  const threadKey = `${sourceLabel(file)}|${provider}|${effectiveHarness}|${model}|${index}`
  const logicalThreadKey = effectiveHarness === "cowork" && external?.coworkSessionId ? `cowork:${external.coworkSessionId}` : `${effectiveHarness}:${sourceLabel(file)}:${logicalId ? String(logicalId) : "n/a"}`
  const recordedEffort = records.map(effortFrom).filter(Boolean).at(-1) ?? (desktopMetadata?.effort ? effortFrom({ effort: desktopMetadata.effort }) : null)
  return {
    threadId: `${provider}:${sha(threadKey).slice(0, 20)}`,
    provider,
    harness: effectiveHarness,
    originator: firstValue(meta.originator, meta.client, meta.app),
    source: typeof meta.source === "string" ? meta.source : firstValue(meta.thread_source, meta.source?.type),
    title: external?.title ?? desktopMetadata?.title ?? null,
    desktopClaudeSession: Boolean(desktopMetadata),
    desktopClaudeSessionId: desktopMetadata?.sessionId ?? null,
    coworkSessionId: external?.coworkSessionId ?? null,
    coworkTranscriptRole: external?.coworkTranscriptRole ?? null,
    coworkSubagentId: external?.coworkSubagentId ?? null,
    coworkSubagentRuns: external?.coworkSubagentRuns ?? 0,
    declaredSurface: records.map((record) => firstValue(record?.surface, record?.harness_surface, record?.harnessSurface)).find(Boolean) ?? null,
    declaredBillingMode: records.map((record) => firstValue(record?.billing_mode, record?.billingMode)).find(Boolean) ?? null,
    declaredUsageSource: records.map((record) => firstValue(record?.usage_source, record?.usageSource)).find(Boolean) ?? null,
    declaredConfidence: records.map((record) => record?.confidence).find(Boolean) ?? null,
    model,
    effort: recordedEffort,
    effortSource: recordedEffort ? "recorded" : null,
    logicalId: logicalId ? String(logicalId) : null,
    logicalThreadKey,
    logicalThreadId: `${effectiveHarness}:${sha(logicalThreadKey).slice(0, 20)}`,
    sourcePath: resolve(file),
    sourceFile: sourceLabel(file),
    folder: external?.cwd || external?.workspaceLabel ? folderLabel(file, records) : desktopMetadata?.cwd ? folderLabel(file, [{ cwd: desktopMetadata.cwd }]) : folderLabel(file, records),
    ...timing,
    recordCount: records.length,
    usageRecordCount: usageList.length,
    rawUsage: usageList.length === 1 ? usageList[0] : usageList,
    tokens,
    reportedCostUsd,
    tokenIssues: tokenIssues(tokens, reportedCostUsd),
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

function claudeMessageId(record) {
  const value = firstValue(record?.message?.id, record?.id)
  if (value === null) return null
  const id = String(value).trim()
  return id || null
}

function claudeBillingFingerprint(record, usage) {
  const tokens = normalizeUsage(usage, "anthropic")
  return JSON.stringify([
    modelFrom(record, usage),
    tokens.inputUncached,
    tokens.cachedInputRead,
    tokens.cacheWrite5m,
    tokens.cacheWrite1h,
  ])
}

function buildClaudeDedupState(parsedFiles) {
  const candidates = new Set()
  const retained = new Set()
  const recordKeys = new Map()
  const selectorAliases = new Map()
  const byMessage = new Map()
  let ordinal = 0

  for (const [file, parsed] of parsedFiles) {
    for (const record of parsed.records) {
      const usage = record?.usage ?? record?.message?.usage
      if (!usage || !isClaudeUsage(record, usage)) continue
      const messageId = claudeMessageId(record)
      if (!messageId) continue
      const fingerprint = claudeBillingFingerprint(record, usage)
      const fingerprints = byMessage.get(messageId) ?? new Map()
      const entries = fingerprints.get(fingerprint) ?? []
      const timestamp = timeFrom(record)
      entries.push({
        file,
        record,
        fingerprint,
        outputTokens: firstFinite(usage?.output_tokens, usage?.completion_tokens, usage?.output) ?? -1,
        timestampMs: timestamp ? new Date(timestamp).getTime() : -1,
        ordinal,
      })
      fingerprints.set(fingerprint, entries)
      byMessage.set(messageId, fingerprints)
      candidates.add(record)
      ordinal += 1
    }
  }

  const conflicts = []
  let retainedResponses = 0
  for (const [messageId, fingerprints] of byMessage) {
    if (fingerprints.size > 1) conflicts.push({ messageHash: sha(messageId).slice(0, 12), variants: fingerprints.size })
    for (const [fingerprint, entries] of fingerprints) {
      const winner = entries.reduce((best, entry) => {
        if (entry.outputTokens !== best.outputTokens) return entry.outputTokens > best.outputTokens ? entry : best
        if (entry.timestampMs !== best.timestampMs) return entry.timestampMs > best.timestampMs ? entry : best
        return entry.ordinal > best.ordinal ? entry : best
      })
      const aliases = entries.flatMap((entry) => [resolve(entry.file), sourceLabel(entry.file), logicalIdFrom(entry.record)]).filter(Boolean).map(String)
      retained.add(winner.record)
      recordKeys.set(winner.record, `${messageId}\u0000${fingerprint}`)
      selectorAliases.set(winner.record, [...new Set(aliases)])
      retainedResponses += 1
    }
  }

  return {
    candidates,
    retained,
    recordKeys,
    selectorAliases,
    conflicts,
    recordsWithMessageId: candidates.size,
    uniqueMessageIds: byMessage.size,
    retainedResponses,
    duplicatesRemoved: candidates.size - retainedResponses,
  }
}

function parseClaude(file, records, dedup) {
  const byKey = new Map()
  for (const [recordIndex, record] of records.entries()) {
    const usage = record?.usage ?? record?.message?.usage
    if (!usage || !isClaudeUsage(record, usage)) continue
    if (dedup.candidates.has(record) && !dedup.retained.has(record)) continue
    const model = modelFrom(record, usage)
    const key = dedup.recordKeys.get(record) ?? `no-id:${recordIndex}:${sha(JSON.stringify({ model, usage }))}`
    byKey.set(key, { record, usage, model, provider: "anthropic", effort: effortFrom(record), selectorAliases: dedup.selectorAliases.get(record) ?? [] })
  }
  const entries = [...byKey.values()]
  if (!entries.length) return []
  const groups = new Map()
  for (const entry of entries) {
    const key = `${entry.model || "unknown"}\u0000${entry.effort ?? ""}`
    const group = groups.get(key) ?? { entries: [], tokens: [] }
    group.entries.push(entry)
    group.tokens.push(normalizeUsage(entry.usage, entry.provider))
    groups.set(key, group)
  }
  const fullTiming = timingFrom(records)
  return [...groups.values()].map((group, index) => {
    const groupRecords = group.entries.map((entry) => entry.record)
    const thread = Object.assign(baseThread(file, index, "anthropic", "claude", group.entries[0].model || "unknown", addTokens(group.tokens), groupRecords, group.entries.map((entry) => entry.usage), sumReported(group.entries.map((entry) => reportedCostFrom(entry.record, entry.usage))), logicalIdFrom(group.entries[0].record)), fullTiming)
    thread.selectorAliases = [...new Set(group.entries.flatMap((entry) => entry.selectorAliases))]
    return thread
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
  const fullTiming = timingFrom(records)
  return [...groups.entries()].map(([model, group], index) => Object.assign(baseThread(file, index, "google", "gemini", model, addTokens(group.tokens), [metadata, ...group.records].filter(Boolean), group.usages, null, metadata?.sessionId), fullTiming))
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
  ), fullTiming))
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
    const rows = readOpenCodeUsageRows(database)
    const result = []
    for (const row of rows) {
      if (typeof row.directory !== "string" || !isWithin(root, row.directory)) continue
      const model = row.model ?? "unknown"
      const provider = String(firstValue(row.provider, providerFrom({ model }, {}, model))).toLowerCase()
      const input = firstFinite(row.input, 0)
      const output = firstFinite(row.output, 0)
      const reasoning = firstFinite(row.reasoning, 0)
      const cacheRead = firstFinite(row.cacheRead, 0)
      const cacheWrite = firstFinite(row.cacheWrite, 0)
      const record = { timestamp: row.timeCreated, created_at: row.timeCreated }
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
      }, [record, { timestamp: row.timeUpdated }], [{ input, output, reasoning, cacheRead, cacheWrite, schema: row.schema }], firstFinite(row.cost), row.id)
      thread.sourceFile = `opencode-session/${basename(file)}/${row.id}`
      const rel = relative(root, resolve(row.directory)).replaceAll("\\", "/")
      thread.folder = !rel || rel === "." ? "." : rel.split("/")[0]
      result.push(thread)
    }
    const sessionCount = new Set(result.map((thread) => thread.logicalId)).size
    discovery.opencodeSessions += sessionCount
    discovery.nativeSessionsMatched += sessionCount
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

function parseGeneric(file, records, claudeDedup) {
  const byKey = new Map()
  for (const record of records) {
    if (claudeDedup.candidates.has(record) && !claudeDedup.retained.has(record)) continue
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
  if (thread.tokenIssues.length) {
    return {
      cost: { inputUncachedUsd: null, cachedInputReadUsd: null, cacheWrite5mUsd: null, cacheWrite1hUsd: null, outputUsd: null, totalUsd: null },
      pricing: rate ? { provider: rate.provider ?? thread.provider, match: rate.match, per1M: rate.per1M ?? {}, effectiveDate: rate.effectiveDate ?? null, sourceUrl: rate.sourceUrl ?? null, verifiedAt: rate.verifiedAt ?? null, notes: rate.notes ?? null, ageDays: pricingAgeDays(rate) } : null,
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
      pricing: { provider: rate.provider ?? thread.provider, match: rate.match, per1M: p, effectiveDate: rate.effectiveDate ?? null, sourceUrl: rate.sourceUrl ?? null, verifiedAt: rate.verifiedAt ?? null, notes: rate.notes ?? null, ageDays: pricingAgeDays(rate) },
      pricingStatus: "reported",
      costMethod: "reported",
    }
  }
  const age = pricingAgeDays(rate)
  return {
    cost,
    pricing: { provider: rate.provider ?? thread.provider, match: rate.match, per1M: p, effectiveDate: rate.effectiveDate ?? null, sourceUrl: rate.sourceUrl ?? null, verifiedAt: rate.verifiedAt ?? null, notes: rate.notes ?? null, ageDays: age },
    pricingStatus: cost.totalUsd === null ? "partial" : age !== null && age > 30 ? "matched-stale" : "matched",
    costMethod: cost.totalUsd === null ? "partial" : "derived",
  }
}

function rollup(items) {
  const logical = [...groupBy(items, (item) => item.logicalThreadKey ?? item.threadId).values()]
  const tokenValues = items.map((item) => item.tokens.providerTotal)
  const costValues = items.map((item) => item.cost.totalUsd)
  const inputCostValues = items.map((item) => {
    const values = [item.cost.inputUncachedUsd, item.cost.cachedInputReadUsd, item.cost.cacheWrite5mUsd, item.cost.cacheWrite1hUsd]
    return values.some(finite) ? sumKnown(values) : null
  })
  const outputCostValues = items.map((item) => item.cost.outputUsd)
  const wallValues = logical.map((group) => group.map((item) => item.wallTimeMs).find(finite) ?? null)
  const activeValues = logical.map((group) => group.map((item) => item.activeTimeMs).find(finite) ?? null)
  return {
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
  return finite(value) ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}` : "n/a"
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

function fmtUsdPerMillionTokens(costUsd, tokens) {
  return finite(costUsd) && finite(tokens) && tokens > 0 ? fmtUsd(costUsd / tokens * 1_000_000) : "n/a"
}

const COST_BY_HEADERS = ["Cost", "Input", "Cached", "Input cost", "Output", "Output cost", "Tokens", "Cost / 1M tokens", "Threads", "Cost / thread", "Active time", "Cost / active hour", "Wall time", "Cost / wall hour"]

function costByValues(items) {
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
  ]
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

const logicalCount = (items) => new Set(items.map((item) => item.logicalThreadKey ?? item.threadId)).size

function coworkRunStats(items) {
  const sessions = new Map()
  for (const item of items) {
    if (!item.coworkSessionId) continue
    const key = item.logicalThreadKey ?? item.coworkSessionId
    sessions.set(key, Math.max(sessions.get(key) ?? 0, item.coworkSubagentRuns ?? 0))
  }
  return { sessions: sessions.size, subagents: [...sessions.values()].reduce((sum, count) => sum + count, 0) }
}

function coworkCoverageLines(stats) {
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

function logicalThreadRows(items) {
  return [...groupBy(items, (item) => item.logicalThreadKey ?? item.threadId).values()].map((group) => {
    const first = group[0]
    const methods = new Set(group.map((item) => item.costMethod))
    const statuses = new Set(group.map((item) => item.pricingStatus))
    const models = [...new Set(group.map((item) => `${item.provider} / ${item.model} / ${item.effort ?? "n/a"}`))]
    const pricingStatus = statuses.has("invalid") ? "invalid"
      : statuses.has("partial") || (statuses.has("unmatched") && statuses.size > 1) ? "partial"
        : statuses.has("unmatched") ? "unmatched"
          : statuses.has("reported") ? "reported"
            : statuses.has("matched-stale") ? "matched-stale" : "matched"
    return {
      ...first,
      threadId: first.logicalThreadId ?? first.threadId,
      modelLabel: models.join("; "),
      tokens: addTokens(group.map((item) => item.tokens)),
      cost: { totalUsd: sumNullable(group.map((item) => item.cost.totalUsd)) },
      reportedCostUsd: sumReported(group.map((item) => item.reportedCostUsd)),
      costMethod: methods.size === 1 ? [...methods][0] : group.every((item) => finite(item.cost.totalUsd)) ? "mixed" : "unavailable",
      pricingStatus,
    }
  })
}

function report({ threads, stats, malformed, duplicateIds }) {
  const total = rollup(threads)
  const logicalRows = logicalThreadRows(threads)
  const priced = logicalRows.filter((thread) => thread.costMethod === "derived")
  const reported = logicalRows.filter((thread) => thread.costMethod === "reported")
  const unknown = logicalRows.filter((thread) => !finite(thread.cost.totalUsd))
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
  const sortedThreads = logicalRows.sort((a, b) => (b.cost.totalUsd ?? -1) - (a.cost.totalUsd ?? -1) || (b.tokens.providerTotal ?? -1) - (a.tokens.providerTotal ?? -1) || a.sourceFile.localeCompare(b.sourceFile))
  const inputTotal = sumAvailable(threads.map((thread) => thread.tokens.inputTotal))
  const cachedInput = sumAvailable(threads.map((thread) => thread.tokens.cachedInputRead))
  const outputTotal = sumAvailable(threads.map((thread) => thread.tokens.outputTotal))
  const reasoningTotal = sumAvailable(threads.map((thread) => thread.tokens.reasoningOutput))
  const stale = logicalRows.filter((thread) => thread.pricingStatus === "matched-stale")
  const unmatched = logicalRows.filter((thread) => thread.pricingStatus === "unmatched")
  const partial = logicalRows.filter((thread) => thread.pricingStatus === "partial")
  const invalid = logicalRows.filter((thread) => thread.pricingStatus === "invalid")
  const unmatchedSlices = threads.filter((thread) => thread.pricingStatus === "unmatched")
  const actionableUnmatched = [...groupBy(unmatchedSlices.filter((thread) =>
    thread.model !== "unknown" && thread.model !== "<synthetic>" && finite(thread.tokens.providerTotal) && thread.tokens.providerTotal > 0
  ), (thread) => `${thread.provider} / ${thread.model}`).entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const pricingRows = [...groupBy(threads.filter((thread) => thread.pricing), (thread) => `${thread.provider} / ${thread.model}`).entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
  const anomalies = []
  for (const thread of threads) {
    for (const issue of thread.tokenIssues) anomalies.push(`${thread.sourceFile}: invalid usage counters: ${issue}`)
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
    reportPoweredBy,
    "",
    "## Cost by provider",
    "",
    table(["Provider", ...COST_BY_HEADERS, "Priced", "Unpriced"], [...providers.map(([key, items]) => {
      const r = rollup(items)
      return [key, ...costByValues(items), fmtInt(r.knownCostThreads), fmtInt(r.threadCount - r.knownCostThreads)]
    }), ["Total", ...costByValues(threads), fmtInt(total.knownCostThreads), fmtInt(total.threadCount - total.knownCostThreads)]]),
    "",
    "## Cost by harness",
    "",
    table(["Harness", ...COST_BY_HEADERS, "Measured Cowork sessions", "Sub-agent runs", "Reported-cost sum", "Average tokens / thread", "Priced", "Unpriced"], [...harnesses.map(([key, items]) => {
      const r = rollup(items)
      const cowork = coworkRunStats(items)
      return [key, ...costByValues(items), fmtInt(cowork.sessions), fmtInt(cowork.subagents), fmtUsd(sumReported(items.map((item) => item.reportedCostUsd))), fmtInt(r.threadCount ? r.tokens / r.threadCount : null), fmtInt(r.knownCostThreads), fmtInt(r.threadCount - r.knownCostThreads)]
    }), ["Total", ...costByValues(threads), fmtInt(coworkRunStats(threads).sessions), fmtInt(coworkRunStats(threads).subagents), fmtUsd(sumReported(threads.map((item) => item.reportedCostUsd))), fmtInt(total.threadCount ? total.tokens / total.threadCount : null), fmtInt(total.knownCostThreads), fmtInt(total.threadCount - total.knownCostThreads)]]),
    "",
    "## Cost by model",
    "",
    table(["Provider / model", ...COST_BY_HEADERS], [...models.map(([key, items]) => [key, ...costByValues(items)]), ["Total", ...costByValues(threads)]]),
    "",
    "## Cost by model by effort",
    "",
    table(["Provider / model", "Effort", ...COST_BY_HEADERS], [...modelEfforts.map(([key, items]) => {
      const [model, effort] = key.split("\u0000")
      return [model, effort, ...costByValues(items)]
    }), ["Total", "All efforts", ...costByValues(threads)]]),
    "",
    "## Cost by root and child folder",
    "",
    "The folder is the direct child of the scanned root; files directly in the root are grouped as `.`.",
    "",
    table(["Folder", ...COST_BY_HEADERS, "Measured Cowork sessions", "Sub-agent runs", "Priced", "Unpriced"], [...folders.map(([key, items]) => {
      const r = rollup(items)
      const cowork = coworkRunStats(items)
      return [key, ...costByValues(items), fmtInt(cowork.sessions), fmtInt(cowork.subagents), fmtInt(r.knownCostThreads), fmtInt(r.threadCount - r.knownCostThreads)]
    }), ["Total", ...costByValues(threads), fmtInt(coworkRunStats(threads).sessions), fmtInt(coworkRunStats(threads).subagents), fmtInt(total.knownCostThreads), fmtInt(total.threadCount - total.knownCostThreads)]]),
    "",
    "## Totals",
    "",
    table(["Metric", "Value"], [
      ["Threads recognized", fmtInt(total.threadCount)],
      ["Measured Cowork sessions", fmtInt(coworkRunStats(threads).sessions)],
      ["Measured Cowork sub-agent runs", fmtInt(coworkRunStats(threads).subagents)],
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
    "## Token composition",
    "",
    table(["Token class", "Tokens", "Share of available total", "Meaning"], [
      ["Uncached input", fmtInt(sumAvailable(threads.map((thread) => thread.tokens.inputUncached))), fmtPct(sumAvailable(threads.map((thread) => thread.tokens.inputUncached)), inputTotal), "Input billed at the base input rate"],
      ["Cached input read", fmtInt(cachedInput), fmtPct(cachedInput, inputTotal), "Provider cache-hit tokens"],
      ["5-minute cache write", fmtInt(sumAvailable(threads.map((thread) => thread.tokens.cacheWrite5m))), "n/a", "Anthropic-style ephemeral cache writes"],
      ["1-hour cache write", fmtInt(sumAvailable(threads.map((thread) => thread.tokens.cacheWrite1h))), "n/a", "Anthropic-style extended cache writes"],
      ["Output", fmtInt(outputTotal), fmtPct(outputTotal, total.tokens), "Generated output, including reasoning where exposed"],
      ["Reasoning output", fmtInt(reasoningTotal), fmtPct(reasoningTotal, outputTotal), "Subset of output, never added twice"],
    ]),
    "",
    "## Thread detail",
    "",
    table(["Thread", "Source", "Surface / billing", "Sub-agents", "Provider / model / effort", "Input", "Cached", "Output", "Tokens", "Selected cost", "Active time", "Cost / active hour", "Wall time", "Cost / wall hour", "Harness reported", "Method"], sortedThreads.map((thread) => [
      thread.threadId,
      thread.title ? `${thread.title} (${thread.sourceFile})` : thread.sourceFile,
      `${thread.surface} / ${thread.billingMode}`,
      fmtInt(thread.coworkSubagentRuns ?? 0),
      thread.modelLabel,
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
    "## Harness surface coverage",
    "",
    "Native and inherited surfaces contribute token records. Credit, quota, detected-only, and export-only surfaces remain explicit so missing data is not mistaken for zero usage.",
    "",
    table(["Surface", "Coverage", "Handling"], HARNESS_SURFACE_COVERAGE),
    "",
    "### Observed surface classification",
    "",
    table(["Surface", "Runtime", "Billing mode", "Usage source", "Confidence", "Threads"], [...groupBy(threads, (thread) => `${thread.surface}\u0000${thread.runtime}\u0000${thread.billingMode}\u0000${thread.usageSource}\u0000${thread.confidence}`).entries()].map(([key, items]) => [...key.split("\u0000"), fmtInt(logicalThreadRows(items).length)])),
    "",
    ...coworkCoverageLines(stats),
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
      ["Claude desktop metadata files", fmtInt(stats.claudeDesktopMetadataFiles)],
      ["Claude desktop metadata matches", fmtInt(stats.claudeDesktopMetadataMatches)],
      ["Cowork coverage state", stats.coworkRemoteSessionsUnavailable > 0 ? "remote usage incomplete" : stats.coworkSessions > 0 ? "measured" : "none detected"],
      ["Claude Cowork sessions measured", fmtInt(stats.coworkSessions)],
      ["Claude Cowork local sessions measured", fmtInt(stats.coworkLocalSessionsMeasured)],
      ["Claude Cowork remote sessions detected", fmtInt(stats.coworkRemoteSessionsDetected)],
      ["Claude Cowork remote sessions measured", fmtInt(stats.coworkRemoteSessionsMeasured)],
      ["Claude Cowork remote sessions unavailable", fmtInt(stats.coworkRemoteSessionsUnavailable)],
      ["Claude Cowork remote index files", fmtInt(stats.coworkRemoteIndexFiles)],
      ["Claude Cowork local transcript files", fmtInt(stats.coworkTranscriptFiles)],
      ["Claude Cowork local sub-agent runs", fmtInt(stats.coworkSubagentRuns)],
      ["Gemini CLI sessions", fmtInt(stats.geminiSessions)],
      ["Cline tasks", fmtInt(stats.clineSessions)],
      ["Roo Code tasks", fmtInt(stats.rooSessions)],
      ["OpenCode sessions", fmtInt(stats.opencodeSessions)],
      ["Files containing usage records", fmtInt(stats.recognizedFiles)],
      ["Claude usage records with message IDs", fmtInt(stats.claudeRecordsWithMessageId)],
      ["Unique Claude message IDs", fmtInt(stats.claudeUniqueMessageIds)],
      ["Claude billable response variants retained", fmtInt(stats.claudeRetainedResponses)],
      ["Claude duplicate records removed", fmtInt(stats.claudeDuplicatesRemoved)],
      ["Claude message IDs with billing conflicts", fmtInt(stats.claudeConflictingMessageIds)],
      ["Malformed records", fmtInt(malformed.length)],
      ["Pricing catalog", `bundled default (version ${pricing.version ?? "n/a"}, updated ${pricing.updatedAt ?? "n/a"})`],
      ["Oldest observed thread", threads.map((thread) => thread.startedAt).filter(Boolean).sort()[0] ?? "n/a"],
      ["Newest observed thread", threads.map((thread) => thread.finishedAt).filter(Boolean).sort().at(-1) ?? "n/a"],
    ]),
    "",
    "## Pricing coverage",
    "",
    table(["Status", "Threads", "Meaning"], [
      ["Matched", fmtInt(logicalRows.filter((thread) => thread.pricingStatus === "matched").length), "Model matched and all required token classes were priced"],
      ["Matched but stale", fmtInt(stale.length), "Matched rate is more than 30 days past verification"],
      ["Partial", fmtInt(partial.length), "A model matched, but one or more required rates or token classes are unavailable"],
      ["Invalid", fmtInt(invalid.length), "Usage counters violated provider accounting invariants and were not priced"],
      ["Reported", fmtInt(reported.length), "Cost came from the harness record rather than bundled pricing"],
      ["Unmatched", fmtInt(unmatched.length), "No model pattern matched the pricing catalog"],
    ]),
    "",
    ...(actionableUnmatched.length ? [
      "### Models requiring a pricing update",
      "",
      table(["Provider / model", "Threads", "Input", "Cached", "Output", "Tokens"], actionableUnmatched.map(([key, items]) => [
        key,
        fmtInt(logicalCount(items)),
        fmtInt(sumAvailable(items.map((item) => item.tokens.inputTotal))),
        fmtInt(sumAvailable(items.map((item) => item.tokens.cachedInputRead))),
        fmtInt(sumAvailable(items.map((item) => item.tokens.outputTotal))),
        fmtInt(sumAvailable(items.map((item) => item.tokens.providerTotal))),
      ])),
      "",
      `**Pricing update required:** Known-cost totals exclude the models above. Run [11ai-llm-cost-pricing-update](${pricingUpdateSkillUrl}) to verify official rates and update the bundled catalog, then regenerate this report.`,
      "",
    ] : []),
    "### Pricing catalog match detail",
    "",
    pricingRows.length ? table(["Provider / model", "Match", "Rates per 1M", "Effective", "Verified", "Notes", "Source"], pricingRows.map(([key, items]) => {
      const pricing = items[0].pricing
      const rates = Object.entries(pricing.per1M ?? {}).map(([name, value]) => `${name}=${value === null ? "n/a" : value}`).join(", ")
      return [key, (pricing.match ?? []).join(", "), rates, pricing.effectiveDate ?? "n/a", pricing.verifiedAt ?? "n/a", pricing.notes ?? "Standard real-time text-token rates.", pricing.sourceUrl ?? "n/a"]
    })) : "No model matched the bundled pricing catalog.",
    "",
    "Unmatched models remain unpriced until the bundled catalog is updated through the pricing-update skill.",
    "",
    "## Anomalies and limitations",
    "",
    [...anomalies, ...discovery.limitations].length ? [...anomalies, ...discovery.limitations].map((item) => `- ${item}`).join("\n") : "- None detected by the analyzer.",
    "",
    "## Methodology",
    "",
    "- Recursively inspect JSON, JSONL, and NDJSON files below the requested root, excluding dependency, VCS, cache, virtual-environment, and build directories.",
    "- Discover Codex, Claude Code, Gemini CLI, Cline, Roo Code, and OpenCode usage from their native local stores. Include only sessions whose recorded project directory or project hash belongs to the requested root.",
    "- Honor supplemental records that declare a workspace through selected-folder arrays, cwd/project/workspace path fields, or an explicit workspace label; use the containing project path only when no attribution is declared.",
    "- Treat Claude desktop `claude-code-sessions` files as metadata only. Join them to native Claude transcripts by `cliSessionId` without adding usage a second time.",
    "- Detect remote Cowork session indexes separately from readable local transcripts. Keep measured totals numeric, exclude unavailable remote usage, and never reinterpret an unavailable remote session as zero tokens or zero cost.",
    "- Group Cowork root and sub-agent transcripts by their containing local session and count distinct sub-agent transcript identities separately from billable messages.",
    "- Use the last cumulative Codex token-count event; deduplicate Claude usage across all in-scope files by message ID and non-output billing fields, retaining the highest-output snapshot for each billing variant; aggregate Gemini per-message counters and Cline/Roo API request metrics; read OpenCode's session ledger in read-only mode; aggregate generic usage records by provider and model.",
    "- Preserve provider-native usage semantics: OpenAI cached input is a subset of input, while Anthropic cache buckets are disjoint. Reasoning tokens are a subset of output.",
    "- Read effort only from discoverable request, message, payload, metadata, or settings fields and group Claude usage by model and recorded effort. Normalize Claude Code ultracode to xhigh. Never infer a missing effort from current settings or model defaults; report it as n/a.",
    "- Measure wall time from the first to last distinct timestamp observed for a thread. Estimate active time by summing consecutive timestamp gaps with each gap capped at five minutes; report both as unavailable when fewer than two distinct timestamps exist.",
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
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
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
        body.push(`<h1>${inlineHtml(heading[2])} <span class="powered-by"><a href="${reportSkillUrl}" target="_blank" rel="noopener noreferrer">powered by ${reportSkillName}</a></span></h1>`)
      } else {
        closeSectionsThrough(level)
        body.push(`<details class="report-section level-${level}"><summary><span class="section-title">${inlineHtml(heading[2])}</span></summary><div class="section-body">`)
        sectionLevels.push(level)
      }
      index += 1
      continue
    }
    const signature = line === reportSignature
    if (line === reportPoweredBy) {
      index += 1
      continue
    }
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
    .powered-by { display: inline-block; margin-left: .35rem; font-size: .38em; font-weight: 500; letter-spacing: 0; white-space: nowrap; vertical-align: middle; }
    .powered-by a { color: var(--muted); text-decoration: none; }
    .powered-by a:hover, .powered-by a:focus-visible { color: var(--accent); text-decoration: underline; }
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
enrichCoworkFiles(files)
const stats = {
  filesVisited: 0,
  candidateFiles: files.length,
  projectCandidateFiles: projectFiles.length,
  nativeFilesConsidered: discovery.nativeFilesConsidered,
  nativeSessionsMatched: discovery.nativeSessionsMatched,
  codexSessions: discovery.codexSessions,
  claudeSessions: discovery.claudeSessions,
  coworkSessions: discovery.coworkSessions,
  coworkLocalSessionsMeasured: discovery.coworkLocalSessionsMeasured,
  coworkRemoteSessionsDetected: discovery.coworkRemoteSessionsDetected,
  coworkRemoteSessionsMeasured: discovery.coworkRemoteSessionsMeasured,
  coworkRemoteSessionsUnavailable: discovery.coworkRemoteSessionsUnavailable,
  coworkRemoteIndexFiles: discovery.coworkRemoteIndexFiles,
  coworkTranscriptFiles: discovery.coworkTranscriptFiles,
  coworkSubagentRuns: discovery.coworkSubagentRuns,
  claudeDesktopMetadataFiles: discovery.claudeDesktopMetadataFiles,
  claudeDesktopMetadataMatches: 0,
  geminiSessions: discovery.geminiSessions,
  clineSessions: discovery.clineSessions,
  rooSessions: discovery.rooSessions,
  opencodeSessions: 0,
  recognizedFiles: 0,
  claudeRecordsWithMessageId: 0,
  claudeUniqueMessageIds: 0,
  claudeRetainedResponses: 0,
  claudeDuplicatesRemoved: 0,
  claudeConflictingMessageIds: 0,
}
let malformed = []
const threads = []
const logicalSources = new Map()
for (const database of opencodeDatabaseCandidates()) {
  discovery.nativeFilesConsidered += 1
  const databaseThreads = await parseOpenCodeDatabase(database)
  if (databaseThreads.length) stats.recognizedFiles += 1
  for (const thread of databaseThreads) {
    Object.assign(thread, classifyThread(thread))
    const priced = priceThread(thread)
    Object.assign(thread, priced)
    threads.push(thread)
    if (thread.logicalId) logicalSources.set(thread.logicalId, [...(logicalSources.get(thread.logicalId) ?? []), thread.sourceFile])
  }
}
stats.nativeFilesConsidered = discovery.nativeFilesConsidered
stats.nativeSessionsMatched = discovery.nativeSessionsMatched
stats.opencodeSessions = discovery.opencodeSessions
const parsedFiles = new Map()
for (const file of files) {
  stats.filesVisited += 1
  if (resolve(file) === markdownOutput || resolve(file) === htmlOutput) continue
  let parsed
  try { parsed = readRecords(file) } catch (error) {
    malformed.push(`${sourceLabel(file)}: unreadable (${error.message})`)
    continue
  }
  malformed = malformed.concat(parsed.malformed)
  parsedFiles.set(file, parsed)
}
const claudeDedup = buildClaudeDedupState(parsedFiles)
stats.claudeRecordsWithMessageId = claudeDedup.recordsWithMessageId
stats.claudeUniqueMessageIds = claudeDedup.uniqueMessageIds
stats.claudeRetainedResponses = claudeDedup.retainedResponses
stats.claudeDuplicatesRemoved = claudeDedup.duplicatesRemoved
stats.claudeConflictingMessageIds = claudeDedup.conflicts.length
for (const conflict of claudeDedup.conflicts) {
  discovery.limitations.push(`Claude message ${conflict.messageHash} had ${conflict.variants} conflicting non-output billing variants; retained one highest-output record per variant.`)
}
for (const [file, parsed] of parsedFiles) {
  if (!parsed.records.length) continue
  const harness = externalSessions.get(resolve(file))?.harness
  let parsedThreads = harness === "gemini" ? parseGemini(file, parsed.records) : []
  if (!parsedThreads.length && harness === "cline") parsedThreads = parseClineFamily(file, parsed.records, "cline")
  if (!parsedThreads.length && harness === "roo") parsedThreads = parseClineFamily(file, parsed.records, "roo")
  if (!parsedThreads.length) parsedThreads = parseCodex(file, parsed.records)
  if (!parsedThreads.length) parsedThreads = parseClaude(file, parsed.records, claudeDedup)
  if (!parsedThreads.length) parsedThreads = parseGeneric(file, parsed.records, claudeDedup)
  if (!parsedThreads.length) continue
  stats.recognizedFiles += 1
  for (const thread of parsedThreads) {
    Object.assign(thread, classifyThread(thread))
    const priced = priceThread(thread)
    Object.assign(thread, priced)
    threads.push(thread)
    if (thread.logicalId) logicalSources.set(thread.logicalId, [...(logicalSources.get(thread.logicalId) ?? []), thread.sourceFile])
  }
}
stats.claudeDesktopMetadataMatches = matchedClaudeDesktopSessions.size

const duplicateIds = [...logicalSources.entries()]
  .filter(([, sources]) => new Set(sources).size > 1)
  .map(([id]) => id)
let reportThreads = threads
if (threadSelector) {
  const selector = String(threadSelector)
  const pathLike = isAbsolute(selector) || selector.includes("/") || selector.includes("\\")
  const resolvedSelector = pathLike ? resolve(selector) : null
  reportThreads = threads.filter((thread) => {
    if (pathLike) return thread.sourceFile === selector || thread.sourcePath === resolvedSelector || thread.selectorAliases?.includes(resolvedSelector)
    return [thread.threadId, thread.logicalThreadId, thread.logicalId, thread.sourceFile, basename(thread.sourceFile), ...(thread.selectorAliases ?? [])].filter(Boolean).includes(selector)
  })
  if (!reportThreads.length) throw new Error(`no recognized thread matched selector: ${selector}`)
  const identities = new Set(reportThreads.map((thread) => thread.logicalId ?? thread.sourceFile))
  if (identities.size > 1) throw new Error(`thread selector is ambiguous across ${identities.size} logical threads: ${selector}`)
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
  coworkSessions: stats.coworkSessions,
  coworkLocalSessionsMeasured: stats.coworkLocalSessionsMeasured,
  coworkRemoteSessionsDetected: stats.coworkRemoteSessionsDetected,
  coworkRemoteSessionsMeasured: stats.coworkRemoteSessionsMeasured,
  coworkRemoteSessionsUnavailable: stats.coworkRemoteSessionsUnavailable,
  coworkRemoteIndexFiles: stats.coworkRemoteIndexFiles,
  coworkTranscriptFiles: stats.coworkTranscriptFiles,
  coworkSubagentRuns: stats.coworkSubagentRuns,
  claudeDesktopMetadataFiles: stats.claudeDesktopMetadataFiles,
  claudeDesktopMetadataMatches: stats.claudeDesktopMetadataMatches,
  geminiSessions: stats.geminiSessions,
  clineSessions: stats.clineSessions,
  rooSessions: stats.rooSessions,
  opencodeSessions: stats.opencodeSessions,
  recognizedFiles: stats.recognizedFiles,
  claudeRecordsWithMessageId: stats.claudeRecordsWithMessageId,
  claudeUniqueMessageIds: stats.claudeUniqueMessageIds,
  claudeRetainedResponses: stats.claudeRetainedResponses,
  claudeDuplicatesRemoved: stats.claudeDuplicatesRemoved,
  claudeConflictingMessageIds: stats.claudeConflictingMessageIds,
  threadSelector,
  threads: rollup(reportThreads).threadCount,
  knownTokens: rollup(reportThreads).knownTokenThreads,
  knownCosts: rollup(reportThreads).knownCostThreads,
  costUsd: sumAvailable(reportThreads.map((thread) => thread.cost.totalUsd)),
  wallTimeMs: rollup(reportThreads).wallTimeMs,
  activeTimeMs: rollup(reportThreads).activeTimeMs,
  malformedRecords: malformed.length,
}, null, 2))
