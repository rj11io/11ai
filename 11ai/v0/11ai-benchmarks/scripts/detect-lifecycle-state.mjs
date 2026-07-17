#!/usr/bin/env node
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"

const [rootArg, outputArg] = process.argv.slice(2)
if (!rootArg) {
  console.error("usage: node detect-lifecycle-state.mjs <benchmark-root> [output.json]")
  process.exit(2)
}

const root = path.resolve(rootArg)
const benchmarkDir = existsSync(path.join(root, "benchmark")) ? path.join(root, "benchmark") : root
const repoRoot = benchmarkDir === root ? path.dirname(root) : root
const output = path.resolve(outputArg || path.join(benchmarkDir, "lifecycle-state.json"))

function readJson(file, fallback = null) {
  if (!existsSync(file)) return fallback
  try {
    return JSON.parse(readFileSync(file, "utf8"))
  } catch (error) {
    return { __invalid: error.message }
  }
}

function listJson(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(dir, entry.name))
    .sort()
}

function cycleFiles() {
  const dir = path.join(benchmarkDir, "cycles")
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dir, entry.name, "cycle.json"))
    .filter(existsSync)
    .sort()
}

const sourceFiles = [
  path.join(repoRoot, "PROMPT.md"),
  path.join(repoRoot, "JUDGE.md"),
  path.join(benchmarkDir, "benchmark.json"),
  path.join(benchmarkDir, "run-plan.json"),
  path.join(benchmarkDir, "runs.json"),
  path.join(benchmarkDir, "rubric.json"),
  path.join(benchmarkDir, "current.json"),
  ...listJson(path.join(benchmarkDir, "audits")),
  ...cycleFiles(),
]

for (const cycleFile of cycleFiles()) {
  const cycleDir = path.dirname(cycleFile)
  sourceFiles.push(
    path.join(cycleDir, "judging", "evidence.json"),
    path.join(cycleDir, "judging", "aggregate.json"),
    path.join(cycleDir, "review", "data.json"),
    path.join(cycleDir, "report", "report.html"),
    path.join(cycleDir, "report", "report.md"),
    ...listJson(path.join(cycleDir, "judging", "judges")),
  )
}

const digest = createHash("sha256")
for (const file of [...new Set(sourceFiles)].filter(existsSync).sort()) {
  const relative = path.relative(repoRoot, file).split(path.sep).join("/")
  const bytes = readFileSync(file)
  digest.update(`${relative.length}:${relative}:${bytes.length}:`)
  digest.update(bytes)
}
const sourceDigest = digest.digest("hex")

const config = readJson(path.join(benchmarkDir, "benchmark.json"))
const plan = readJson(path.join(benchmarkDir, "run-plan.json"), { campaignStatus: "open", closurePolicy: "manual", targets: [] })
const ledger = readJson(path.join(benchmarkDir, "runs.json"), { runs: [] })
const current = readJson(path.join(benchmarkDir, "current.json"))
const targets = Array.isArray(plan?.targets) ? plan.targets : []
const runs = Array.isArray(ledger?.runs) ? ledger.runs : []
const finishedRuns = runs.filter((run) => run.finishedAt || ["complete", "finished"].includes(run.status))
const auditByRun = new Map()
for (const file of listJson(path.join(benchmarkDir, "audits"))) {
  const audit = readJson(file)
  if (audit?.runId) auditByRun.set(audit.runId, audit)
}
const eligibleRuns = finishedRuns.filter((run) => {
  const audit = auditByRun.get(run.id)
  return audit?.status === "complete" && audit.pass === true
})

const cycles = cycleFiles()
  .map((file) => ({ file, data: readJson(file) }))
  .filter(({ data }) => data && !data.__invalid)
  .sort((a, b) => (a.data.publicationSequence || 0) - (b.data.publicationSequence || 0) || a.file.localeCompare(b.file))
const latest = cycles.at(-1)?.data || null
const latestDir = latest ? path.join(benchmarkDir, "cycles", latest.cycleId) : null
const latestRunIds = new Set(latest?.runIds || [])
const newEligible = eligibleRuns.filter((run) => !latestRunIds.has(run.id))
const completeJudges = latestDir
  ? listJson(path.join(latestDir, "judging", "judges")).map(readJson).filter((judge) => judge?.status === "complete").length
  : 0
const evidence = latestDir ? readJson(path.join(latestDir, "judging", "evidence.json")) : null
const aggregate = latestDir ? readJson(path.join(latestDir, "judging", "aggregate.json")) : null
const review = latestDir ? readJson(path.join(latestDir, "review", "data.json")) : null
const reportsComplete = latestDir
  ? existsSync(path.join(latestDir, "report", "report.html")) && existsSync(path.join(latestDir, "report", "report.md"))
  : false

const targetCounts = Object.fromEntries(
  ["planned", "available", "running", "complete", "time-gated", "failed", "excluded"].map((status) => [
    status.replace("-g", "G"),
    targets.filter((target) => target.status === status).length,
  ]),
)
const targetsSettled = targets.length > 0 && targets.every((target) => ["complete", "excluded"].includes(target.status))
const blockers = []
for (const target of targets.filter((item) => item.status === "time-gated")) {
  blockers.push({ code: "time-gated-target", detail: `${target.targetId} is time-gated`, targetId: target.targetId, notBefore: target.notBefore ?? null })
}
for (const run of finishedRuns.filter((item) => !auditByRun.has(item.id))) {
  blockers.push({ code: "missing-audit", detail: `${run.id} has no complete passing audit`, runId: run.id })
}

const missingInitialization = []
if (!config || config.__invalid) missingInitialization.push("benchmark/benchmark.json")
if (!existsSync(path.join(repoRoot, "PROMPT.md"))) missingInitialization.push("PROMPT.md")
if (!existsSync(path.join(benchmarkDir, "rubric.json"))) missingInitialization.push("benchmark/rubric.json")
if (missingInitialization.length) blockers.unshift({ code: "missing-initialization", detail: `Missing ${missingInitialization.join(", ")}`, paths: missingInitialization })
if (!existsSync(path.join(repoRoot, "JUDGE.md"))) {
  blockers.push({ code: "missing-judge-template", detail: "JUDGE.md will be created from the canonical template before judging", path: "JUDGE.md" })
}

let stage
let nextActions
const campaignStatus = plan?.campaignStatus === "hard-closed" ? "hard-closed" : config ? "open" : "draft"
if (missingInitialization.length) {
  stage = "initialization-required"
  nextActions = ["Run $11ai-benchmark-initialize"]
} else if (campaignStatus === "hard-closed") {
  stage = "hard-closed"
  nextActions = ["Do nothing, or explicitly reopen as a new campaign revision"]
} else if (!runs.length) {
  stage = targets.some((target) => ["planned", "running", "time-gated"].includes(target.status)) ? "waiting-for-runs" : "ready-for-runs"
  nextActions = ["Run available targets with $11ai-benchmark-runner"]
} else if (!eligibleRuns.length) {
  stage = "waiting-for-runs"
  nextActions = ["Finish runs and complete passing audits"]
} else if (!latest || newEligible.length) {
  stage = targetsSettled ? "ready-for-final-cycle" : "ready-for-interim-cycle"
  nextActions = ["Run $11ai-benchmark-freeze-cycle to freeze the cumulative eligible cohort"]
} else if (!evidence || ["draft", "stale"].includes(evidence.status)) {
  stage = "preparing-judging"
  nextActions = ["Complete anonymized judging evidence with $11ai-benchmark-freeze-cycle"]
} else if (!completeJudges || !aggregate || aggregate.status !== "complete") {
  stage = "waiting-for-judges"
  nextActions = ["Run an AI or human judge from the frozen JUDGE.md instance"]
} else if (!review || review.status !== "complete") {
  stage = "ready-to-publish"
  nextActions = ["Run $11ai-benchmark-publish-cycle"]
} else if (!reportsComplete || current?.cycleId !== latest.cycleId) {
  stage = "ready-to-sync"
  nextActions = ["Run $11ai-benchmark-sync"]
} else if (latest.releaseType === "final") {
  stage = "ready-to-sync"
  nextActions = ["Complete hard-close bookkeeping with $11ai-benchmark-publish-cycle"]
} else if (targetsSettled) {
  stage = "ready-for-final-cycle"
  nextActions = ["Run a hard lifecycle to publish the final cumulative cycle"]
} else {
  stage = "interim-published-open"
  nextActions = ["Wait for targets, add available runs, or run another soft lifecycle"]
}

const state = {
  schemaVersion: 2,
  artifactId: `lifecycle-state:${config?.benchmarkId || "unconfigured"}`,
  status: "complete",
  sourceDigest,
  generatedAt: new Date().toISOString(),
  benchmarkId: config?.benchmarkId || null,
  campaignStatus,
  stage,
  latestCycleId: latest?.cycleId || null,
  latestReleaseType: latest?.releaseType || null,
  counts: {
    targets: targets.length,
    runs: runs.length,
    finishedRuns: finishedRuns.length,
    eligibleRuns: eligibleRuns.length,
    newEligibleRuns: newEligible.length,
    cycles: cycles.length,
    completeJudges,
  },
  coverage: { closurePolicy: plan?.closurePolicy || "manual", targetsSettled, targetCounts },
  blockers,
  nextActions,
  provenance: {
    producer: "detect-lifecycle-state.mjs",
    method: "derived",
    sources: [...new Set(sourceFiles)].filter(existsSync).map((file) => path.relative(repoRoot, file).split(path.sep).join("/")),
  },
}

const previous = readJson(output)
const withoutGeneratedAt = (value) => {
  if (!value || typeof value !== "object") return value
  const { generatedAt: _generatedAt, ...comparable } = value
  return comparable
}
if (
  previous?.sourceDigest === sourceDigest &&
  JSON.stringify(withoutGeneratedAt(previous)) === JSON.stringify(withoutGeneratedAt(state))
) {
  console.log(`unchanged ${output}`)
  process.exit(0)
}
mkdirSync(path.dirname(output), { recursive: true })
const temporary = `${output}.tmp-${process.pid}`
writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`)
renameSync(temporary, output)
console.log(`wrote ${output} (${stage})`)
