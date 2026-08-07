#!/usr/bin/env node

import { createHash } from "node:crypto"
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { HARNESS_SURFACE_COVERAGE, classifyThread, readOpenCodeUsageRows } from "./harness-support.mjs"
import { pricingAgeDays, resolveHistoricalPrice } from "./pricing-history.mjs"
import {
  ACTIVE_GAP_MS,
  COST_BY_HEADERS,
  JSON_EXTENSIONS,
  SESSION_EXTENSIONS,
  SKIP_DIRS,
  finite,
  firstFinite,
  firstValue,
  iso,
  number,
  sha,
  sumAvailable,
  sumKnown,
  sumNullable,
  sumReported,
  buildDataset,
  datasetReportInputs,
  initCore,
  loadDataset,
  addTokens,
  claudeBillingFingerprint,
  claudeDesktopRoots,
  claudeMessageId,
  costByValues,
  costPart,
  coworkCoverageLines,
  coworkRunStats,
  coworkSessionMetadata,
  declaredWorkspace,
  effortFrom,
  escapeCell,
  escapeHtml,
  fmtDurationMs,
  fmtInt,
  fmtPct,
  fmtUsd,
  fmtUsdPerActiveHour,
  fmtUsdPerMillionTokens,
  fmtSecondsMs,
  fmtTokensPerSecond,
  fmtUsdPerThread,
  groupBy,
  groupTiming,
  inlineHtml,
  isClaudeUsage,
  isWithin,
  logicalIdFrom,
  logicalThreadRows,
  markdownCells,
  modelFrom,
  nativeSessionMetadata,
  normalizeUsage,
  parseClineFamily,
  parseGemini,
  claudeMessageLatencies,
  codexTurnLatencies,
  latencyHistogram,
  parseGeneric,
  priceThread,
  providerFrom,
  readPrefix,
  readRecords,
  reportedCostFrom,
  responseLatencyLines,
  rollup,
  table,
  threadActiveMsPerResponse,
  threadOutputTps,
  taskWorkspace,
  timeFrom,
  timingFrom,
  tokenIssues,
  usageNumbers,
  usageObject,
  usageSupersedes,
  vscodeTaskRoots,
  walk,
  walkSessionFiles,
} from "./benchmarks-core.mjs"

const argv = process.argv.slice(2)
const option = (name) => {
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] : null
}
const options = (name) => argv.flatMap((arg, index) => arg === name && argv[index + 1] ? [argv[index + 1]] : [])

if (argv.includes("--help")) {
  console.log("usage: node analyze-llm-cost-global.mjs [--output report-folder] [--output-dir report-folder] [--codex-home dir] [--claude-home dir] [--claude-desktop-home dir] [--cowork-home dir] [--gemini-home dir] [--cline-tasks dir] [--roo-tasks dir] [--opencode-db file] [--include dir-or-file] [--from-data data.json]")
  process.exit(0)
}

const VALUE_OPTIONS = new Set(["--output", "--output-dir", "--codex-home", "--claude-home", "--claude-desktop-home", "--cowork-home", "--gemini-home", "--cline-tasks", "--roo-tasks", "--opencode-db", "--include", "--from-data"])
for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index]
  if (!VALUE_OPTIONS.has(arg)) throw new Error(`unknown argument: ${arg}`)
  if (!argv[index + 1] || argv[index + 1].startsWith("--")) throw new Error(`missing value for ${arg}`)
  index += 1
}

const generatedAt = new Date().toISOString()
const generatedTime = new Date(generatedAt)
const filenameTimestamp = generatedAt.replaceAll(":", "-").replaceAll(".", "-")
const reportSkillName = "11ai-benchmarks-machine"
const reportTitle = "AI benchmarks and analysis: Machine Report"
const reportSkillUrl = `https://ai.rj11.io/skills/${reportSkillName}`
const pricingUpdateSkillUrl = "https://ai.rj11.io/skills/11ai-benchmarks-pricing-update"
const reportPoweredBy = `_powered by [${reportSkillName}](${reportSkillUrl})._`
const reportName = `${reportSkillName}-${filenameTimestamp}`
const reportPackageName = `11ai-benchmarks-machine-reports-${filenameTimestamp}`
const explicitOutputDir = option("--output-dir") ?? option("--output")
if (option("--output-dir") && option("--output")) throw new Error("use either --output or --output-dir, not both")
const outputDir = resolve(explicitOutputDir ?? join(homedir(), "Desktop", "11ai-benchmarks-machine-reports", reportPackageName))
const markdownOutput = join(outputDir, `${reportName}.md`)
const htmlOutput = join(outputDir, `${reportName}.html`)
const dataOutput = join(outputDir, `${reportName}.json`)

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

const externalSessions = new Map()
const includedFiles = new Map()
const claudeDesktopSessions = new Map()
const matchedClaudeDesktopSessions = new Set()
const remoteCoworkSessions = new Map()
const REPORT_SIGNATURE = "_AI benchmarks and analysis by [11ai-benchmarks-machine](https://ai.rj11.io/skills/11ai-benchmarks-machine)._"
const discovery = { accountsConsidered: 0, nativeFilesConsidered: 0, codexSessions: 0, claudeSessions: 0, coworkSessions: 0, coworkLocalSessionsMeasured: 0, coworkRemoteSessionsDetected: 0, coworkRemoteSessionsMeasured: 0, coworkRemoteSessionsUnavailable: 0, coworkRemoteIndexFiles: 0, coworkTranscriptFiles: 0, coworkSubagentRuns: 0, claudeDesktopMetadataFiles: 0, geminiSessions: 0, clineSessions: 0, rooSessions: 0, opencodeSessions: 0, unreadableFiles: 0, limitations: [], scopeDescription: "" }
initCore({ discovery, externalSessions, pricing, generatedAt, baseThread, sourceLabel })

function sourceLabel(file) {
  const external = externalSessions.get(resolve(file))
  if (external) return `${external.harness}-session/${external.account}/${external.label}`
  const included = includedFiles.get(resolve(file))
  if (included) return `included/${included.label}`
  return basename(file)
}

function folderLabel(file, records = []) {
  const external = externalSessions.get(resolve(file))
  if (external) return external.workspaceLabel ?? (external.cwd ? workspaceLabel(external.cwd, external.userHome) : "unknown workspace")
  const declared = declaredWorkspace(records)
  if (declared) return declared.workspaceLabel ?? workspaceLabel(declared.cwd)
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

function coworkRootCandidates() {
  const explicit = option("--cowork-home")
  if (explicit) return [resolve(explicit)]
  const roots = []
  for (const userHome of conventionalUserHomes()) {
    roots.push(
      join(userHome, "Library", "Application Support", "Claude", "local-agent-mode-sessions"),
      join(userHome, ".config", "Claude", "local-agent-mode-sessions"),
      join(userHome, "AppData", "Roaming", "Claude", "local-agent-mode-sessions"),
    )
  }
  return roots
}

function indexClaudeDesktopSessions(userHomes, explicitRoot = null) {
  const roots = explicitRoot ? [resolve(explicitRoot)] : userHomes.flatMap(claudeDesktopRoots)
  for (const root of roots) {
      for (const file of walkSessionFiles(root)) {
        if (extname(file).toLowerCase() !== ".json") continue
        let metadata
        try { metadata = JSON.parse(readFileSync(file, "utf8")) } catch { continue }
        if (typeof metadata?.cliSessionId !== "string" || !metadata.cliSessionId) continue
        discovery.claudeDesktopMetadataFiles += 1
        claudeDesktopSessions.set(metadata.cliSessionId, {
          sessionId: typeof metadata.sessionId === "string" ? metadata.sessionId : null,
          title: typeof metadata.title === "string" ? metadata.title : null,
          cwd: typeof metadata.cwd === "string" ? resolve(metadata.cwd) : typeof metadata.originCwd === "string" ? resolve(metadata.originCwd) : null,
          effort: typeof metadata.effort === "string" ? metadata.effort : null,
        })
      }
  }
}

function indexRemoteCoworkSessions(file, account) {
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
    const key = `${account ?? ""}\u0000${entry.sessionId}`
    remoteCoworkSessions.set(key, { sessionId: entry.sessionId, directories })
  }
}

function enrichCoworkFiles(files) {
  const coworkRoots = coworkRootCandidates()
  for (const file of files) {
    if (extname(file).toLowerCase() !== ".jsonl") continue
    if (!coworkRoots.some((dir) => isWithin(dir, file))) continue
    const existing = externalSessions.get(resolve(file))
    if (existing?.harness && existing.harness !== "cowork") continue
    const metadata = coworkSessionMetadata(file)
    if (!metadata) continue
    const included = includedFiles.get(resolve(file))
    externalSessions.set(resolve(file), {
      ...existing,
      ...metadata,
      harness: "cowork",
      account: existing?.account ?? "included",
      userHome: existing?.userHome ?? homedir(),
      label: existing?.label ?? included?.label ?? basename(file),
    })
  }
  const sessions = new Map()
  for (const [file, metadata] of externalSessions) {
    if (metadata.harness !== "cowork" || !metadata.coworkSessionId) continue
    const key = `${metadata.account ?? ""}\u0000${metadata.coworkSessionId}`
    const session = sessions.get(key) ?? { files: new Set(), subagents: new Set(), metadata: [] }
    session.files.add(file)
    if (metadata.coworkSubagentId) session.subagents.add(metadata.coworkSubagentId)
    session.metadata.push(metadata)
    sessions.set(key, session)
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
  const explicitClaudeFlag = option("--claude-home")
  const explicitClaude = explicitClaudeFlag ?? process.env.CLAUDE_CONFIG_DIR ?? null
  const explicitClaudeDesktop = option("--claude-desktop-home") ?? null
  const explicitCowork = option("--cowork-home") ?? null
  const explicitGemini = option("--gemini-home") ?? (process.env.GEMINI_CLI_HOME ? join(process.env.GEMINI_CLI_HOME, ".gemini") : null)
  const explicitCline = option("--cline-tasks") ?? null
  const explicitRoo = option("--roo-tasks") ?? null
  const explicitOpenCode = options("--opencode-db").length > 0
  discovery.scopeDescription = [
    ["Codex", explicitCodex], ["Claude", explicitClaude], ["Cowork", explicitCowork], ["Gemini", explicitGemini],
    ["Cline", explicitCline], ["Roo", explicitRoo], ["OpenCode", explicitOpenCode],
  ].map(([name, explicit]) => `${name}: ${explicit ? "explicit override" : "all readable conventional homes"}`).join("; ")
  const userHomes = conventionalUserHomes()
  // Only the CLI flag opts out of the desktop metadata join; the CLAUDE_CONFIG_DIR
  // env var is a supported home override and must not disable an unrelated source.
  if (explicitClaudeDesktop || !explicitClaudeFlag) indexClaudeDesktopSessions(userHomes, explicitClaudeDesktop)
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
  if (explicitCowork) {
    const home = resolve(explicitCowork)
    sources.push({ harness: "cowork", home, userHome: dirname(home), account: basename(dirname(home)), roots: [home] })
  } else {
    for (const userHome of userHomes) {
      for (const home of [
        join(userHome, "Library", "Application Support", "Claude", "local-agent-mode-sessions"),
        join(userHome, ".config", "Claude", "local-agent-mode-sessions"),
        join(userHome, "AppData", "Roaming", "Claude", "local-agent-mode-sessions"),
      ]) sources.push({ harness: "cowork", home, userHome, account: basename(userHome), roots: [home] })
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
      const sessionFiles = walkSessionFiles(sessionRoot)
      if (source.harness === "cowork") {
        for (const file of sessionFiles) {
          if (basename(file) !== "remote-session-spaces.json") continue
          discovery.nativeFilesConsidered += 1
          indexRemoteCoworkSessions(file, source.account)
        }
      }
      for (const file of sessionFiles) {
        if (source.harness === "cowork" && extname(file).toLowerCase() !== ".jsonl") continue
        if ((source.harness === "cline" || source.harness === "roo") && basename(file) !== "ui_messages.json") continue
        if (source.harness === "gemini" && !file.replaceAll("\\", "/").includes("/chats/")) continue
        discovery.nativeFilesConsidered += 1
        let metadata = {}
        try {
          if (source.harness === "gemini") metadata = geminiSessionMetadata(file) ?? {}
          else if (source.harness === "cowork") metadata = coworkSessionMetadata(file) ?? {}
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

function baseThread(file, index, provider, harness, model, tokens, records, usageList, reportedCostUsd = null, logicalId = null) {
  const timing = timingFrom(records)
  const external = externalSessions.get(resolve(file))
  const effectiveHarness = external?.harness ?? harness
  const desktopMetadata = effectiveHarness === "claude" && logicalId ? claudeDesktopSessions.get(String(logicalId)) : null
  if (desktopMetadata && logicalId) matchedClaudeDesktopSessions.add(String(logicalId))
  const meta = records.find((record) => record?.type === "session_meta")?.payload ?? {}
  const threadKey = `${sourceLabel(file)}|${provider}|${effectiveHarness}|${model}|${index}`
  const logicalThreadKey = effectiveHarness === "cowork" && external?.coworkSessionId
    ? `cowork:${external.account ?? ""}:${external.coworkSessionId}`
    : `${effectiveHarness}:${sourceLabel(file)}:${logicalId ? String(logicalId) : "n/a"}`
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
    folder: external?.cwd || external?.workspaceLabel ? folderLabel(file, records) : desktopMetadata?.cwd ? workspaceLabel(desktopMetadata.cwd) : folderLabel(file, records),
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
  const thread = baseThread(
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
  )
  thread.latency = latencyHistogram(codexTurnLatencies(tokenEvents), "turn-events")
  return [thread]
}

function buildClaudeDedupState(parsedFiles) {
  const candidates = new Set()
  const retained = new Set()
  const recordKeys = new Map()
  const byMessage = new Map()
  let ordinal = 0

  for (const parsed of parsedFiles.values()) {
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
      retained.add(winner.record)
      recordKeys.set(winner.record, `${messageId}\u0000${fingerprint}`)
      retainedResponses += 1
    }
  }

  return {
    candidates,
    retained,
    recordKeys,
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
    byKey.set(key, { record, usage, model, provider: "anthropic", effort: effortFrom(record) })
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
  const messageLatencies = claudeMessageLatencies(records)
  return [...groups.values()].map((group, index) => {
    const groupRecords = group.entries.map((entry) => entry.record)
    const thread = Object.assign(baseThread(file, index, "anthropic", "claude", group.entries[0].model || "unknown", addTokens(group.tokens), groupRecords, group.entries.map((entry) => entry.usage), sumReported(group.entries.map((entry) => reportedCostFrom(entry.record, entry.usage))), logicalIdFrom(group.entries[0].record)), fullTiming)
    const messageIds = [...new Set(groupRecords.map((record) => claudeMessageId(record)).filter(Boolean))]
    thread.latency = latencyHistogram(messageIds.map((id) => messageLatencies.get(id)))
    return thread
  })
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
    const rows = readOpenCodeUsageRows(database)
    const result = []
    for (const row of rows) {
      const model = row.model ?? "unknown"
      const provider = String(firstValue(row.provider, providerFrom({ model }, {}, model))).toLowerCase()
      const input = firstFinite(row.input, 0)
      const output = firstFinite(row.output, 0)
      const reasoning = firstFinite(row.reasoning, 0)
      const cacheRead = firstFinite(row.cacheRead, 0)
      const cacheWrite = firstFinite(row.cacheWrite, 0)
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
      }, [{ timestamp: row.timeCreated }, { timestamp: row.timeUpdated }], [{ input, output, reasoning, cacheRead, cacheWrite, schema: row.schema }], firstFinite(row.cost), row.id)
      const rowCreated = Date.parse(iso(row.timeCreated) ?? "")
      const rowUpdated = Date.parse(iso(row.timeUpdated) ?? "")
      thread.latency = latencyHistogram([Number.isFinite(rowCreated) && Number.isFinite(rowUpdated) ? rowUpdated - rowCreated : null], "row-durations")
      thread.sourceFile = `opencode-session/${account}/${basename(file)}/${row.id}`
      thread.folder = typeof row.directory === "string" ? workspaceLabel(row.directory, userHome) : "unknown workspace"
      result.push(thread)
    }
    discovery.opencodeSessions += new Set(result.map((thread) => thread.logicalId)).size
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

const logicalCount = (items) => new Set(items.map((item) => item.logicalThreadKey ?? item.threadId)).size

function windowDefinitions() {
  const todayStart = new Date(generatedTime.getFullYear(), generatedTime.getMonth(), generatedTime.getDate())
  const yearStart = new Date(generatedTime.getFullYear(), 0, 1)
  const monthStart = new Date(generatedTime.getFullYear(), generatedTime.getMonth(), 1)
  const quarterStart = new Date(generatedTime.getFullYear(), Math.floor(generatedTime.getMonth() / 3) * 3, 1)
  const past24Start = new Date(generatedTime.getTime() - 24 * 60 * 60 * 1000)
  const past7Start = new Date(generatedTime.getTime() - 7 * 24 * 60 * 60 * 1000)
  const past30Start = new Date(generatedTime.getTime() - 30 * 24 * 60 * 60 * 1000)
  const past60Start = new Date(generatedTime.getTime() - 60 * 24 * 60 * 60 * 1000)
  const past90Start = new Date(generatedTime.getTime() - 90 * 24 * 60 * 60 * 1000)
  return [
    { title: "Past 24 hours", start: past24Start, description: `Threads attributed from ${past24Start.toISOString()} through ${generatedAt}.` },
    { title: "Past 7 days", start: past7Start, description: `Threads attributed from ${past7Start.toISOString()} through ${generatedAt}.` },
    { title: "Past 30 days", start: past30Start, description: `Threads attributed from ${past30Start.toISOString()} through ${generatedAt}.` },
    { title: "Past 60 days", start: past60Start, description: `Threads attributed from ${past60Start.toISOString()} through ${generatedAt}.` },
    { title: "Past 90 days", start: past90Start, description: `Threads attributed from ${past90Start.toISOString()} through ${generatedAt}.` },
    { title: "Today", start: todayStart, description: `Threads attributed from ${todayStart.toISOString()} through ${generatedAt}, using the machine's local calendar day.` },
    { title: "Month to date", start: monthStart, description: `Threads attributed from ${monthStart.toISOString()} through ${generatedAt}.` },
    { title: "Quarter to date", start: quarterStart, description: `Threads attributed from ${quarterStart.toISOString()} through ${generatedAt}.` },
    { title: "Year to date", start: yearStart, description: `Threads attributed from ${yearStart.toISOString()} through ${generatedAt}.` },
    { title: "All time", start: null, description: "Every recognized thread, including threads without a usable timestamp." },
  ]
}

function threadTime(thread) {
  const value = thread.finishedAt ?? thread.startedAt
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function monthlyDefinitions(threads) {
  const months = new Map()
  for (const thread of threads) {
    const date = threadTime(thread)
    if (!date || date > generatedTime) continue
    const year = date.getFullYear()
    const month = date.getMonth()
    const key = `${year}-${String(month + 1).padStart(2, "0")}`
    if (months.has(key)) continue
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 1)
    months.set(key, {
      title: start.toLocaleString("en-US", { month: "long", year: "numeric" }),
      start,
      end,
      description: `Threads attributed to the local calendar month from ${start.toISOString()} up to ${end.toISOString()} (exclusive).`,
    })
  }
  return [...months.values()].sort((a, b) => b.start - a.start)
}

function quarterlyDefinitions(threads) {
  const quarters = new Map()
  for (const thread of threads) {
    const date = threadTime(thread)
    if (!date || date > generatedTime) continue
    const year = date.getFullYear()
    const quarter = Math.floor(date.getMonth() / 3)
    const key = `${year}-Q${quarter + 1}`
    if (quarters.has(key)) continue
    const start = new Date(year, quarter * 3, 1)
    const end = new Date(year, quarter * 3 + 3, 1)
    quarters.set(key, {
      title: `Q${quarter + 1} ${year}`,
      start,
      end,
      description: `Threads attributed to the local calendar quarter from ${start.toISOString()} up to ${end.toISOString()} (exclusive).`,
    })
  }
  return [...quarters.values()].sort((a, b) => b.start - a.start)
}

function yearlyDefinitions(threads) {
  const years = new Map()
  for (const thread of threads) {
    const date = threadTime(thread)
    if (!date || date > generatedTime) continue
    const year = date.getFullYear()
    if (years.has(year)) continue
    const start = new Date(year, 0, 1)
    const end = new Date(year + 1, 0, 1)
    years.set(year, {
      title: String(year),
      start,
      end,
      description: `Threads attributed to the local calendar year from ${start.toISOString()} up to ${end.toISOString()} (exclusive).`,
    })
  }
  return [...years.values()].sort((a, b) => b.start - a.start)
}

function threadsForDefinition(threads, definition) {
  if (!definition.start) return threads
  return threads.filter((thread) => {
    const date = threadTime(thread)
    return date && date >= definition.start && date <= generatedTime && (!definition.end || date < definition.end)
  })
}

function windowSection(definition, threads, headingLevel = 2) {
  const heading = "#".repeat(headingLevel)
  const subheading = "#".repeat(headingLevel + 1)
  const total = rollup(threads)
  const logicalRows = logicalThreadRows(threads)
  const priced = logicalRows.filter((thread) => thread.costMethod === "derived")
  const reported = logicalRows.filter((thread) => thread.costMethod === "reported")
  const unknown = logicalRows.filter((thread) => !finite(thread.cost.totalUsd))
  const providers = [...groupBy(threads, (thread) => thread.provider).entries()]
    .sort((a, b) => (rollup(b[1]).costUsd ?? -1) - (rollup(a[1]).costUsd ?? -1) || a[0].localeCompare(b[0]))
  const harnesses = [...groupBy(threads, (thread) => thread.harness).entries()]
    .sort((a, b) => (rollup(b[1]).costUsd ?? -1) - (rollup(a[1]).costUsd ?? -1) || a[0].localeCompare(b[0]))
  const models = [...groupBy(threads, (thread) => `${thread.provider} / ${thread.model}`).entries()]
    .sort((a, b) => (rollup(b[1]).costUsd ?? -1) - (rollup(a[1]).costUsd ?? -1) || a[0].localeCompare(b[0]))
  const modelEfforts = [...groupBy(threads, (thread) => `${thread.provider} / ${thread.model}\u0000${thread.effort ?? "n/a"}`).entries()]
    .sort((a, b) => (rollup(b[1]).costUsd ?? -1) - (rollup(a[1]).costUsd ?? -1) || a[0].localeCompare(b[0]))
  const workspaces = [...groupBy(threads, (thread) => thread.folder).entries()]
    .sort((a, b) => (rollup(b[1]).costUsd ?? -1) - (rollup(a[1]).costUsd ?? -1) || a[0].localeCompare(b[0]))
  const sortedThreads = logicalRows.sort((a, b) => (b.cost.totalUsd ?? -1) - (a.cost.totalUsd ?? -1) || (b.tokens.providerTotal ?? -1) - (a.tokens.providerTotal ?? -1) || a.sourceFile.localeCompare(b.sourceFile))
  const inputTotal = sumAvailable(threads.map((thread) => thread.tokens.inputTotal))
  const cachedInput = sumAvailable(threads.map((thread) => thread.tokens.cachedInputRead))
  const outputTotal = sumAvailable(threads.map((thread) => thread.tokens.outputTotal))
  const reasoningTotal = sumAvailable(threads.map((thread) => thread.tokens.reasoningOutput))
  const noRows = (message) => threads.length ? null : message

  return [
    `${heading} ${definition.title}`,
    "",
    definition.description,
    "",
    `${subheading} Cost by provider`,
    "",
    noRows("No threads fall in this period.") ?? table(["Provider", ...COST_BY_HEADERS, "Priced", "Unpriced"], [...providers.map(([key, items]) => {
      const r = rollup(items)
      return [key, ...costByValues(items), fmtInt(r.knownCostThreads), fmtInt(r.threadCount - r.knownCostThreads)]
    }), ["Total", ...costByValues(threads), fmtInt(total.knownCostThreads), fmtInt(total.threadCount - total.knownCostThreads)]]),
    "",
    `${subheading} Cost by harness`,
    "",
    noRows("No threads fall in this period.") ?? table(["Harness", ...COST_BY_HEADERS, "Measured Cowork sessions", "Sub-agent runs", "Reported-cost sum", "Average tokens / thread", "Priced", "Unpriced"], [...harnesses.map(([key, items]) => {
      const r = rollup(items)
      const cowork = coworkRunStats(items)
      return [key, ...costByValues(items), fmtInt(cowork.sessions), fmtInt(cowork.subagents), fmtUsd(sumReported(items.map((item) => item.reportedCostUsd))), fmtInt(r.threadCount && r.tokens !== null ? r.tokens / r.threadCount : null), fmtInt(r.knownCostThreads), fmtInt(r.threadCount - r.knownCostThreads)]
    }), ["Total", ...costByValues(threads), fmtInt(coworkRunStats(threads).sessions), fmtInt(coworkRunStats(threads).subagents), fmtUsd(sumReported(threads.map((item) => item.reportedCostUsd))), fmtInt(total.threadCount && total.tokens !== null ? total.tokens / total.threadCount : null), fmtInt(total.knownCostThreads), fmtInt(total.threadCount - total.knownCostThreads)]]),
    "",
    `${subheading} Cost by model`,
    "",
    noRows("No threads fall in this period.") ?? table(["Provider / model", ...COST_BY_HEADERS], [...models.map(([key, items]) => [key, ...costByValues(items)]), ["Total", ...costByValues(threads)]]),
    "",
    `${subheading} Cost by model by effort`,
    "",
    noRows("No threads fall in this period.") ?? table(["Provider / model", "Effort", ...COST_BY_HEADERS], [...modelEfforts.map(([key, items]) => {
      const [model, effort] = key.split("\u0000")
      return [model, effort, ...costByValues(items)]
    }), ["Total", "All efforts", ...costByValues(threads)]]),
    "",
    `${subheading} Cost by workspace`,
    "",
    "Workspace comes from native metadata or a supplemental record's declared workspace fields; only unattributed supplemental logs fall back to the included root.",
    "",
    noRows("No threads fall in this period.") ?? table(["Workspace", ...COST_BY_HEADERS, "Measured Cowork sessions", "Sub-agent runs", "Priced", "Unpriced"], [...workspaces.map(([key, items]) => {
      const r = rollup(items)
      const cowork = coworkRunStats(items)
      return [key, ...costByValues(items), fmtInt(cowork.sessions), fmtInt(cowork.subagents), fmtInt(r.knownCostThreads), fmtInt(r.threadCount - r.knownCostThreads)]
    }), ["Total", ...costByValues(threads), fmtInt(coworkRunStats(threads).sessions), fmtInt(coworkRunStats(threads).subagents), fmtInt(total.knownCostThreads), fmtInt(total.threadCount - total.knownCostThreads)]]),
    "",
    `${subheading} Totals`,
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
    `${subheading} Token composition`,
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
    `${subheading} Thread detail`,
    "",
    noRows("No threads fall in this period.") ?? table(["Thread", "Source", "Surface / billing", "Workspace", "Sub-agents", "Provider / model / effort", "Attributed at", "Input", "Cached", "Output", "Tokens", "Selected cost", "Active time", "Cost / active hour", "Wall time", "Cost / wall hour", "Output TPS", "Active time / response", "Harness reported", "Method"], sortedThreads.map((thread) => [
      thread.threadId,
      thread.title ? `${thread.title} (${thread.sourceFile})` : thread.sourceFile,
      `${thread.surface} / ${thread.billingMode}`,
      thread.folder,
      fmtInt(thread.coworkSubagentRuns ?? 0),
      thread.modelLabel,
      threadTime(thread)?.toISOString() ?? "n/a",
      fmtInt(thread.tokens.inputTotal),
      fmtInt(thread.tokens.cachedInputRead),
      fmtInt(thread.tokens.outputTotal),
      fmtInt(thread.tokens.providerTotal),
      fmtUsd(thread.cost.totalUsd),
      fmtDurationMs(thread.activeTimeMs),
      fmtUsdPerActiveHour(thread.cost.totalUsd, thread.activeTimeMs),
      fmtDurationMs(thread.wallTimeMs),
      fmtUsdPerActiveHour(thread.cost.totalUsd, thread.wallTimeMs),
      fmtTokensPerSecond(threadOutputTps(thread)),
      fmtSecondsMs(threadActiveMsPerResponse(thread)),
      fmtUsd(thread.reportedCostUsd),
      thread.costMethod === "derived" ? `derived${thread.pricingStatus === "matched-stale" ? " (stale rate)" : ""}` : thread.costMethod,
    ])),
    "",
  ]
}

function report({ threads, stats, malformed, duplicateIds }) {
  const logicalRows = logicalThreadRows(threads)
  const reported = logicalRows.filter((thread) => thread.costMethod === "reported")
  const stale = logicalRows.filter((thread) => thread.pricingStatus === "matched-stale")
  const unmatched = logicalRows.filter((thread) => thread.pricingStatus === "unmatched")
  const partial = logicalRows.filter((thread) => thread.pricingStatus === "partial")
  const invalid = logicalRows.filter((thread) => thread.pricingStatus === "invalid")
  const unmatchedSlices = threads.filter((thread) => thread.pricingStatus === "unmatched")
  const actionableUnmatched = [...groupBy(unmatchedSlices.filter((thread) =>
    thread.model !== "unknown" && thread.model !== "<synthetic>" && finite(thread.tokens.providerTotal) && thread.tokens.providerTotal > 0
  ), (thread) => `${thread.provider} / ${thread.model}`).entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const pricingRows = [...groupBy(threads.filter((thread) => thread.pricing), (thread) => `${thread.provider} / ${thread.model}\u0000${thread.pricing.effectiveFrom ?? "n/a"}\u0000${thread.pricing.temporalStatus ?? "n/a"}`).entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
  const temporalCount = (status) => logicalRows.filter((thread) => thread.pricing?.temporalStatus === status).length
  const anomalies = []
  for (const thread of threads) {
    for (const issue of thread.tokenIssues) anomalies.push(`${thread.sourceFile}: invalid usage counters: ${issue}`)
    if (thread.model === "unknown") anomalies.push(`${thread.sourceFile}: model is unavailable`)
    if (thread.provider === "unknown") anomalies.push(`${thread.sourceFile}: provider is unavailable`)
    if (!thread.startedAt || !thread.finishedAt) anomalies.push(`${thread.sourceFile}: timestamps are unavailable; the thread appears in All time but requires a usable timestamp for dated periods`)
    else if (!finite(thread.wallTimeMs)) anomalies.push(`${thread.sourceFile}: wall and active time require at least two distinct timestamps`)
    if (thread.pricingStatus === "unmatched") anomalies.push(`${thread.sourceFile}: no pricing catalog match for ${thread.provider} / ${thread.model}`)
    if (thread.pricingStatus === "partial") anomalies.push(`${thread.sourceFile}: pricing is incomplete for one or more observed token classes`)
    if (thread.reportedCostUsd !== null && thread.costMethod === "derived" && Math.abs(thread.reportedCostUsd - thread.cost.totalUsd) > 0.01) anomalies.push(`${thread.sourceFile}: reported ${fmtUsd(thread.reportedCostUsd)} differs from derived ${fmtUsd(thread.cost.totalUsd)}`)
  }
  for (const file of malformed) anomalies.push(`malformed JSON ignored: ${file}`)
  for (const id of duplicateIds) anomalies.push(`logical thread identity appears in multiple source files: ${id}`)

  const definitions = new Map(windowDefinitions().map((definition) => [definition.title, definition]))
  const sectionFor = (title) => {
    const definition = definitions.get(title)
    return windowSection(definition, threadsForDefinition(threads, definition))
  }
  const months = monthlyDefinitions(threads)
  const quarters = quarterlyDefinitions(threads)
  const years = yearlyDefinitions(threads)

  const lines = [
    `# ${reportTitle}`,
    "",
    reportPoweredBy,
    "",
    ...sectionFor("Past 24 hours"),
    ...sectionFor("Past 7 days"),
    ...sectionFor("Past 30 days"),
    ...sectionFor("Past 60 days"),
    ...sectionFor("Past 90 days"),
    ...sectionFor("Today"),
    ...sectionFor("Month to date"),
    ...sectionFor("Quarter to date"),
    ...sectionFor("Year to date"),
    "## Monthly reports",
    "",
    "Calendar-month reports use local calendar boundaries, include only months with dated activity, and appear newest first. Undated threads remain in All time only.",
    "",
    ...(months.length
      ? months.flatMap((definition) => windowSection(definition, threadsForDefinition(threads, definition), 3))
      : ["No dated threads are available for monthly reports.", ""]),
    "## Quarterly reports",
    "",
    "Calendar-quarter reports use local calendar boundaries, include only quarters with dated activity, and appear newest first. Undated threads remain in All time only.",
    "",
    ...(quarters.length
      ? quarters.flatMap((definition) => windowSection(definition, threadsForDefinition(threads, definition), 3))
      : ["No dated threads are available for quarterly reports.", ""]),
    "## Yearly reports",
    "",
    "Calendar-year reports use local calendar boundaries, include only years with dated activity, and appear newest first. Undated threads remain in All time only.",
    "",
    ...(years.length
      ? years.flatMap((definition) => windowSection(definition, threadsForDefinition(threads, definition), 3))
      : ["No dated threads are available for yearly reports.", ""]),
    ...sectionFor("All time"),
    ...responseLatencyLines(threads),
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
      ["Local accounts considered", fmtInt(stats.accountsConsidered)],
      ["Native discovery scope", stats.scopeDescription],
      ["Native session files metadata-checked", fmtInt(stats.nativeFilesConsidered)],
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
      ["Supplemental JSON-family files", fmtInt(stats.includedFiles)],
      ["Files containing usage records", fmtInt(stats.recognizedFiles)],
      ["Claude usage records with message IDs", fmtInt(stats.claudeRecordsWithMessageId)],
      ["Unique Claude message IDs", fmtInt(stats.claudeUniqueMessageIds)],
      ["Claude billable response variants retained", fmtInt(stats.claudeRetainedResponses)],
      ["Claude duplicate records removed", fmtInt(stats.claudeDuplicatesRemoved)],
      ["Claude message IDs with billing conflicts", fmtInt(stats.claudeConflictingMessageIds)],
      ["Malformed records", fmtInt(malformed.length)],
      ["Unreadable native files skipped", fmtInt(stats.unreadableFiles)],
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
    "### Historical pricing selection",
    "",
    table(["Selection", "Threads", "Treatment"], [
      ["Effective-period price", fmtInt(temporalCount("effective-period")), "Rate effective at the thread attribution timestamp"],
      ["Main-price boundary fallback", fmtInt(temporalCount("main-price-boundary-fallback")), "Aggregated usage crossed a price boundary; the rate effective at the thread finish timestamp was applied to the whole thread"],
      ["Earliest available fallback", fmtInt(temporalCount("earliest-available-fallback")), "Usage predates known history; the earliest available rate was applied while the pricing-update workflow seeks an official historical rate"],
      ["Latest available fallback", fmtInt(temporalCount("latest-available-fallback")), "Usage is undated; the latest rate active when the report was generated was applied"],
    ]),
    "",
    ...(temporalCount("earliest-available-fallback") > 0 ? [`**Historical pricing backfill recommended:** ${fmtInt(temporalCount("earliest-available-fallback"))} thread(s) use the earliest available rate because their usage predates the known catalog history. Run [11ai-benchmarks-pricing-update](${pricingUpdateSkillUrl}) to search official historical sources; totals remain numeric using the documented fallback.`, ""] : []),
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
      `**Pricing update required:** Known-cost totals exclude the models above. Run [11ai-benchmarks-pricing-update](${pricingUpdateSkillUrl}) to verify official rates and update the bundled catalog, then regenerate this report.`,
      "",
    ] : []),
    "### Pricing catalog match detail",
    "",
    pricingRows.length ? table(["Provider / model", "Applied period", "Date basis", "Selection", "Match", "Rates per 1M", "Verified", "Change", "Notes", "Source"], pricingRows.map(([key, items]) => {
      const pricing = items[0].pricing
      const rates = Object.entries(pricing.per1M ?? {}).map(([name, value]) => `${name}=${value === null ? "n/a" : value}`).join(", ")
      return [key.split("\u0000")[0], `${pricing.effectiveFrom ?? "n/a"} to ${pricing.effectiveTo ?? "current"}`, pricing.dateBasis ?? "n/a", pricing.temporalStatus ?? "n/a", (pricing.match ?? []).join(", "), rates, pricing.verifiedAt ?? "n/a", pricing.changeType ?? "n/a", pricing.notes ?? "Standard real-time text-token rates.", pricing.sourceUrl ?? "n/a"]
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
    "- Discover Codex, Claude Code, Gemini CLI, Cline, Roo Code, and OpenCode usage in conventional native local stores for every readable local account. Do not filter by project or recorded working directory.",
    "- Recursively inspect JSON, JSONL, and NDJSON files below each explicit `--include` path, excluding dependency, VCS, cache, virtual-environment, and build directories.",
    "- Honor supplemental records that declare a workspace through selected-folder arrays, cwd/project/workspace path fields, or an explicit workspace label; use the included root only when no attribution is declared.",
    "- Treat Claude desktop `claude-code-sessions` files as metadata only. Join them to native Claude transcripts by `cliSessionId` to enrich title, workspace, effort, and surface without adding usage a second time.",
    "- Detect remote Cowork session indexes separately from readable local transcripts. Keep measured totals numeric, exclude unavailable remote usage, and never reinterpret an unavailable remote session as zero tokens or zero cost.",
    "- Group Cowork root and sub-agent transcripts by their containing local session. Count distinct sub-agent transcript identities separately while preserving global message-level billing deduplication.",
    "- Use the last cumulative Codex token-count event; deduplicate Claude usage globally across files by message ID and non-output billing fields, retaining the highest-output snapshot for each billing variant; aggregate Gemini per-message counters and Cline/Roo API request metrics; read OpenCode's session ledger in read-only mode; aggregate generic usage records by provider and model.",
    "- Attribute a whole thread to its finish timestamp, falling back to its start timestamp. All time includes undated threads; dated periods exclude them. Today and calendar-to-date/archive reports use the machine's local boundaries. Past 24 hours and Past 7/30/60/90 days are rolling 24/168/720/1,440/2,160-hour windows.",
    "- Preserve provider-native usage semantics: OpenAI cached input is a subset of input, while Anthropic cache buckets are disjoint. Reasoning tokens are a subset of output.",
    "- Select the catalog rate effective at each thread's finish timestamp, falling back to its start timestamp. When aggregated usage crosses a price boundary, apply that main attribution-time price to the whole thread. When usage predates known history, apply the earliest available rate; when usage is undated, apply the latest rate active at report generation time. Surface every fallback in Historical pricing selection.",
    "- Read effort only from discoverable request, message, payload, metadata, or settings fields and group Claude usage by model and recorded effort. Normalize Claude Code ultracode to xhigh. Never infer a missing effort from current settings or model defaults; report it as n/a.",
    "- Measure wall time from the first to last distinct timestamp observed for a thread. Estimate active time by summing consecutive timestamp gaps with each gap capped at five minutes; report both as unavailable when fewer than two distinct timestamps exist.",
    "- `Output TPS` and `Active time / response` are blended estimates over threads with measured timing: output tokens divided by estimated active seconds, and active time divided by counted usage responses. They include tool execution and log-flush timing, exclude time-to-first-token, and are not benchmarks of a provider's serving speed.",
    "- Calculate cost per wall hour and cost per active hour by dividing known cost by the corresponding summed measurable duration. Report the rate as unavailable when cost or duration is unavailable or duration is zero.",
    "- Calculate cost per thread by dividing known cost by every recognized thread in the row. Incomplete cost coverage can therefore understate this rate. Per-thread detail omits the metric because it would duplicate selected cost.",
    "- Treat missing values as unavailable. Sum known totals for overview coverage, but surface every incomplete or unpriced thread in the detail and limitations sections.",
    "- Do not include prompts, message text, secrets, or raw transcripts in this report. Native source labels and normalized workspace paths are the traceability boundary.",
    "",
    `> Generated ${generatedAt} · Scope: ${stats.scopeDescription} · Prices are USD per 1M tokens unless noted`,
    "",
    REPORT_SIGNATURE,
    "",
  ]
  return lines.join("\n")
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
    const heading = /^(#{1,4})\s+(.+)$/.exec(line)
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
    const signature = line === REPORT_SIGNATURE
    if (line === reportPoweredBy) {
      index += 1
      continue
    }
    if (signature) {
      closeAllSections()
      const signatureHtml = inlineHtml(line).replace(
        '<a href="https://ai.rj11.io/skills/11ai-benchmarks-machine">',
        '<a href="https://ai.rj11.io/skills/11ai-benchmarks-machine" target="_blank" rel="noopener noreferrer">',
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
      body.push("<div class=\"table-wrap\"><table><thead><tr>")
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
  <title>AI benchmarks and analysis: Machine Report</title>
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
    .report-section.level-4 { margin: .35rem 0; }
    summary { display: flex; align-items: center; gap: .5rem; padding: .62rem .78rem; cursor: pointer; color: var(--text); font-weight: 750; list-style: none; user-select: none; }
    summary::-webkit-details-marker { display: none; }
    summary::before { content: "▸"; flex: 0 0 auto; color: var(--accent); transition: transform .15s ease; }
    details[open] > summary::before { transform: rotate(90deg); }
    .level-2 > summary { font-size: 1.12rem; }
    .level-3 > summary { font-size: .98rem; }
    .level-4 > summary { font-size: .9rem; }
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

const fromData = option("--from-data")
if (fromData) {
  const dataset = loadDataset(resolve(fromData), reportSkillName)
  // Render with the catalog identity the dataset was priced against.
  pricing.version = dataset.pricingCatalog?.version ?? pricing.version
  pricing.updatedAt = dataset.pricingCatalog?.updatedAt ?? pricing.updatedAt
  const markdown = report(datasetReportInputs(dataset))
  const html = htmlReport(markdown)
  mkdirSync(dirname(markdownOutput), { recursive: true })
  writeFileSync(markdownOutput, markdown, { flag: explicitOutputDir ? "w" : "wx" })
  writeFileSync(htmlOutput, html, { flag: explicitOutputDir ? "w" : "wx" })
  console.log(JSON.stringify({ fromData: resolve(fromData), markdownReport: markdownOutput, htmlReport: htmlOutput, threads: dataset.threads.length, datasetGeneratedAt: dataset.generatedAt }, null, 2))
  process.exit(0)
}

const nativeFiles = discoverNativeSessions()
const supplementalFiles = discoverIncludedFiles()
const files = [...new Set([...nativeFiles, ...supplementalFiles].map((file) => resolve(file)))]
enrichCoworkFiles(files)
const stats = {
  filesVisited: 0,
  candidateFiles: files.length,
  accountsConsidered: discovery.accountsConsidered,
  scopeDescription: discovery.scopeDescription,
  nativeFilesConsidered: discovery.nativeFilesConsidered,
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
  includedFiles: supplementalFiles.length,
  unreadableFiles: discovery.unreadableFiles,
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
for (const candidate of opencodeDatabaseCandidates()) {
  discovery.nativeFilesConsidered += 1
  const databaseThreads = await parseOpenCodeDatabase(candidate.file, candidate.userHome, candidate.account)
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
stats.opencodeSessions = discovery.opencodeSessions
const parsedFiles = new Map()
for (const file of files) {
  stats.filesVisited += 1
  if (resolve(file) === markdownOutput || resolve(file) === htmlOutput || resolve(file) === dataOutput) continue
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
const dataset = buildDataset({
  generator: { skill: reportSkillName, title: reportTitle },
  scope: { machineWide: true },
  threads,
  stats,
  malformed,
  duplicateIds,
})
const markdown = report(datasetReportInputs(dataset))
const html = htmlReport(markdown)
mkdirSync(outputDir, { recursive: true })
writeFileSync(markdownOutput, markdown, { flag: explicitOutputDir ? "w" : "wx" })
writeFileSync(htmlOutput, html, { flag: explicitOutputDir ? "w" : "wx" })
writeFileSync(dataOutput, JSON.stringify(dataset, null, 2) + "\n", { flag: explicitOutputDir ? "w" : "wx" })
console.log(JSON.stringify({
  output: outputDir,
  outputDirectory: outputDir,
  markdownReport: markdownOutput,
  htmlReport: htmlOutput,
  dataReport: dataOutput,
  filesInspected: stats.candidateFiles,
  accountsConsidered: stats.accountsConsidered,
  scope: stats.scopeDescription,
  nativeFilesMetadataChecked: stats.nativeFilesConsidered,
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
  supplementalFilesInspected: stats.includedFiles,
  unreadableNativeFiles: stats.unreadableFiles,
  recognizedFiles: stats.recognizedFiles,
  claudeRecordsWithMessageId: stats.claudeRecordsWithMessageId,
  claudeUniqueMessageIds: stats.claudeUniqueMessageIds,
  claudeRetainedResponses: stats.claudeRetainedResponses,
  claudeDuplicatesRemoved: stats.claudeDuplicatesRemoved,
  claudeConflictingMessageIds: stats.claudeConflictingMessageIds,
  threads: rollup(threads).threadCount,
  knownTokens: rollup(threads).knownTokenThreads,
  knownCosts: rollup(threads).knownCostThreads,
  costUsd: sumAvailable(threads.map((thread) => thread.cost.totalUsd)),
  wallTimeMs: rollup(threads).wallTimeMs,
  activeTimeMs: rollup(threads).activeTimeMs,
  periods: Object.fromEntries(windowDefinitions().map((definition) => {
    const items = threadsForDefinition(threads, definition)
    const totals = rollup(items)
    return [definition.title, { threads: totals.threadCount, knownTokens: totals.tokens, knownCostUsd: totals.costUsd }]
  })),
  monthlyReports: Object.fromEntries(monthlyDefinitions(threads).map((definition) => {
    const items = threadsForDefinition(threads, definition)
    const totals = rollup(items)
    return [definition.title, { threads: totals.threadCount, knownTokens: totals.tokens, knownCostUsd: totals.costUsd }]
  })),
  quarterlyReports: Object.fromEntries(quarterlyDefinitions(threads).map((definition) => {
    const items = threadsForDefinition(threads, definition)
    const totals = rollup(items)
    return [definition.title, { threads: totals.threadCount, knownTokens: totals.tokens, knownCostUsd: totals.costUsd }]
  })),
  yearlyReports: Object.fromEntries(yearlyDefinitions(threads).map((definition) => {
    const items = threadsForDefinition(threads, definition)
    const totals = rollup(items)
    return [definition.title, { threads: totals.threadCount, knownTokens: totals.tokens, knownCostUsd: totals.costUsd }]
  })),
  malformedRecords: malformed.length,
}, null, 2))
