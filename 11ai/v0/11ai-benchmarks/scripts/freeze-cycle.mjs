#!/usr/bin/env node
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const [rootArg, cycleId, releaseType] = args.splice(0, 3)
if (!rootArg || !cycleId || !["interim", "final"].includes(releaseType)) {
  console.error("usage: node freeze-cycle.mjs <benchmark-root> <cycle-id> <interim|final> [run-id ...] [--confirm-hard-close] [--waiver reason]")
  process.exit(2)
}
let confirmHardClose = false
let waiver = null
const requestedRunIds = []
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--confirm-hard-close") confirmHardClose = true
  else if (args[index] === "--waiver") waiver = args[++index]
  else requestedRunIds.push(args[index])
}

const root = path.resolve(rootArg)
const benchmarkDir = existsSync(path.join(root, "benchmark")) ? path.join(root, "benchmark") : root
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"))
const config = readJson(path.join(benchmarkDir, "benchmark.json"))
const ledger = readJson(path.join(benchmarkDir, "runs.json"))
const rubric = readJson(path.join(benchmarkDir, "rubric.json"))
const planFile = path.join(benchmarkDir, "run-plan.json")
const plan = existsSync(planFile) ? readJson(planFile) : { closurePolicy: "manual", targets: [] }
const auditDir = path.join(benchmarkDir, "audits")
const audits = new Map(
  (existsSync(auditDir) ? readdirSync(auditDir).filter((name) => name.endsWith(".json")) : [])
    .map((name) => readJson(path.join(auditDir, name)))
    .filter((audit) => audit.runId)
    .map((audit) => [audit.runId, audit]),
)
const eligible = (ledger.runs || []).filter((run) => {
  const finished = run.finishedAt || ["complete", "finished"].includes(run.status)
  const audit = audits.get(run.id)
  return finished && audit?.status === "complete" && audit.pass === true
})
const selected = requestedRunIds.length
  ? requestedRunIds.map((id) => eligible.find((run) => run.id === id) || (() => { throw new Error(`run ${id} is not eligible`) })())
  : eligible
if (selected.length < 2) throw new Error("a judging cycle requires at least two eligible runs")
selected.sort((a, b) => a.id.localeCompare(b.id))

for (const field of ["promptTemplateSha", "contentSha"]) {
  if (new Set(selected.map((run) => run[field])).size !== 1) throw new Error(`selected runs do not share ${field}`)
}
const targets = Array.isArray(plan.targets) ? plan.targets : []
const unresolved = targets.filter((target) => !["complete", "excluded"].includes(target.status))
if (releaseType === "final") {
  if (!confirmHardClose) throw new Error("final cycles require --confirm-hard-close")
  if (plan.closurePolicy === "target-set" && unresolved.length && !waiver) {
    throw new Error(`final cycle has unresolved targets (${unresolved.map((target) => target.targetId).join(", ")}); provide --waiver with a reason`)
  }
}

const cyclesDir = path.join(benchmarkDir, "cycles")
mkdirSync(cyclesDir, { recursive: true })
const cycleDir = path.join(cyclesDir, cycleId)
const cycleFile = path.join(cycleDir, "cycle.json")
const existingCycle = existsSync(cycleFile) ? readJson(cycleFile) : null
const prior = readdirSync(cyclesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== cycleId && existsSync(path.join(cyclesDir, entry.name, "cycle.json")))
  .map((entry) => readJson(path.join(cyclesDir, entry.name, "cycle.json")))
  .sort((a, b) => (a.publicationSequence || 0) - (b.publicationSequence || 0))
const previous = prior.at(-1) || null
const targetCount = (status) => targets.filter((target) => target.status === status).length
const core = {
  schemaVersion: 2,
  artifactId: `cycle:${config.benchmarkId}:${cycleId}`,
  status: "collecting",
  cycleId,
  benchmarkId: config.benchmarkId,
  releaseType,
  publicationSequence: existingCycle?.publicationSequence ?? (previous?.publicationSequence || 0) + 1,
  previousCycleId: existingCycle?.previousCycleId ?? previous?.cycleId ?? null,
  runIds: selected.map((run) => run.id),
  promptTemplateSha: selected[0].promptTemplateSha,
  contentSha: selected[0].contentSha,
  rubricSha: rubric.rubricSha,
  rubricVersion: rubric.version,
  evidenceSurfaces: config.evidenceSurfaces,
  coverageSnapshot: {
    planned: targets.length,
    complete: targetCount("complete"),
    timeGated: targetCount("time-gated"),
    failed: targetCount("failed"),
    excluded: targetCount("excluded"),
    includedRunIds: selected.map((run) => run.id),
    targetIds: targets.map((target) => target.targetId).sort(),
    waiver: waiver ? { reason: waiver, unresolvedTargetIds: unresolved.map((target) => target.targetId) } : null,
  },
}
const sourceDigest = createHash("sha256").update(JSON.stringify(core)).digest("hex")
const cycle = { ...core, sourceDigest, createdAt: existingCycle?.createdAt ?? new Date().toISOString(), reviewedAt: null, publishedAt: null }
if (existsSync(cycleFile)) {
  const existing = readJson(cycleFile)
  if (existing.sourceDigest === sourceDigest) {
    console.log(`unchanged ${cycleFile}`)
    process.exit(0)
  }
  throw new Error(`refusing to mutate existing cycle ${cycleId}`)
}
for (const dir of ["judging/judges", "judging/prompts", "review", "report"]) mkdirSync(path.join(cycleDir, dir), { recursive: true })
const temporary = `${cycleFile}.tmp-${process.pid}`
writeFileSync(temporary, `${JSON.stringify(cycle, null, 2)}\n`)
renameSync(temporary, cycleFile)
console.log(`wrote ${cycleFile} (${releaseType}, ${selected.length} runs)`)
