#!/usr/bin/env node
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"

const [rootArg, cycleId, mode] = process.argv.slice(2)
if (!rootArg || !cycleId || ![undefined, "--hard-close"].includes(mode)) {
  console.error("usage: node finalize-cycle.mjs <benchmark-root> <cycle-id> [--hard-close]")
  process.exit(2)
}
const root = path.resolve(rootArg)
const benchmarkDir = existsSync(path.join(root, "benchmark")) ? path.join(root, "benchmark") : root
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"))
const writeAtomic = (file, value) => {
  const temporary = `${file}.tmp-${process.pid}`
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`)
  renameSync(temporary, file)
}
const config = readJson(path.join(benchmarkDir, "benchmark.json"))
const cycleFile = path.join(benchmarkDir, "cycles", cycleId, "cycle.json")
const reviewFile = path.join(benchmarkDir, "cycles", cycleId, "review", "data.json")
const reportHtml = path.join(benchmarkDir, "cycles", cycleId, "report", "report.html")
const reportMarkdown = path.join(benchmarkDir, "cycles", cycleId, "report", "report.md")
for (const file of [cycleFile, reviewFile, reportHtml, reportMarkdown]) {
  if (!existsSync(file)) throw new Error(`missing publication prerequisite ${file}`)
}
const cycle = readJson(cycleFile)
const review = readJson(reviewFile)
if (review.status !== "complete" || review.gate?.pass !== true) throw new Error("review gate is not complete and passing")
const hardClose = mode === "--hard-close"
if (hardClose && cycle.releaseType !== "final") throw new Error("only a final cycle can hard-close a campaign")
if (!hardClose && cycle.releaseType !== "interim") throw new Error("final cycles require --hard-close")

const planFile = path.join(benchmarkDir, "run-plan.json")
const plan = existsSync(planFile)
  ? readJson(planFile)
  : { schemaVersion: 2, artifactId: `run-plan:${config.benchmarkId}`, status: "complete", benchmarkId: config.benchmarkId, campaignStatus: "open", closurePolicy: "manual", campaignRevision: 1, targets: [], latestInterimCycleId: null, finalCycleId: null, hardClosedAt: null, hardCloseWaiver: null, provenance: { producer: "finalize-cycle.mjs", method: "reported", sources: [] } }
if (hardClose && plan.closurePolicy === "target-set") {
  const unresolved = (plan.targets || []).filter((target) => !["complete", "excluded"].includes(target.status))
  if (unresolved.length && !cycle.coverageSnapshot?.waiver) throw new Error(`unresolved target-set closure: ${unresolved.map((target) => target.targetId).join(", ")}`)
}

const now = new Date().toISOString()
const currentFile = path.join(benchmarkDir, "current.json")
const priorCurrent = existsSync(currentFile) ? readJson(currentFile) : null
if (priorCurrent && priorCurrent.publicationSequence > cycle.publicationSequence) {
  throw new Error("refusing to move current pointer backwards")
}
const current = {
  schemaVersion: 2,
  artifactId: `current:${config.benchmarkId}`,
  status: "complete",
  benchmarkId: config.benchmarkId,
  cycleId,
  releaseType: cycle.releaseType,
  publicationSequence: cycle.publicationSequence,
  reviewSourceDigest: review.sourceDigest,
  updatedAt: priorCurrent?.cycleId === cycleId ? priorCurrent.updatedAt : now,
}
if (JSON.stringify(priorCurrent) !== JSON.stringify(current)) writeAtomic(currentFile, current)

const updatedCycle = {
  ...cycle,
  status: "published",
  reviewedAt: cycle.reviewedAt || review.generatedAt || now,
  publishedAt: cycle.publishedAt || now,
}
if (JSON.stringify(updatedCycle) !== JSON.stringify(cycle)) writeAtomic(cycleFile, updatedCycle)

const updatedPlan = hardClose
  ? { ...plan, campaignStatus: "hard-closed", finalCycleId: cycleId, hardClosedAt: plan.hardClosedAt || now, hardCloseWaiver: cycle.coverageSnapshot?.waiver || plan.hardCloseWaiver || null }
  : { ...plan, campaignStatus: "open", latestInterimCycleId: cycleId }
if (JSON.stringify(updatedPlan) !== JSON.stringify(plan)) writeAtomic(planFile, updatedPlan)
console.log(`${hardClose ? "hard-closed" : "published interim"} ${cycleId}`)
