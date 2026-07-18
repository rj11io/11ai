#!/usr/bin/env node

// Read-only diagnostic inventory for benchmark lifecycle and projection drift.
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, relative, resolve, sep } from "node:path"

const rootArg = process.argv[2]
if (!rootArg) {
  console.error("usage: node inspect-benchmark-health.mjs <benchmark-tree-root>")
  process.exit(2)
}

const root = resolve(rootArg)
const files = []
const skip = new Set([".git", ".next", "node_modules"])
function walk(dir) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue
    const file = join(dir, entry.name)
    if (entry.isDirectory()) walk(file)
    else files.push(file)
  }
}
walk(root)

const readJson = (file) => {
  try { return JSON.parse(readFileSync(file, "utf8")) } catch { return null }
}
const rel = (file) => relative(root, file).split(sep).join("/")
const benchmarkFiles = files.filter((file) => file.endsWith("/benchmark/benchmark.json"))
const benchmarks = []

for (const benchmarkFile of benchmarkFiles) {
  const benchmarkDir = join(benchmarkFile, "..")
  const benchmarkRoot = join(benchmarkDir, "..")
  const currentFile = join(benchmarkDir, "current.json")
  const current = readJson(currentFile)
  const cycleRoot = join(benchmarkDir, "cycles")
  const cycleDirs = existsSync(cycleRoot)
    ? readdirSync(cycleRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
    : []
  const cycleReports = {}
  for (const cycleId of cycleDirs) {
    const cycleFile = join(cycleRoot, cycleId, "cycle.json")
    const reviewFile = join(cycleRoot, cycleId, "review", "data.json")
    const cycle = readJson(cycleFile)
    const review = readJson(reviewFile)
    cycleReports[cycleId] = {
      status: cycle?.status ?? (review ? "review-present" : "missing"),
      reviewPresent: Boolean(review),
      sourceDigest: review?.sourceDigest ?? null,
    }
  }
  const currentReviewFile = current?.cycleId ? join(cycleRoot, current.cycleId, "review", "data.json") : null
  const currentReview = currentReviewFile ? readJson(currentReviewFile) : null
  const summary = readJson(join(benchmarkDir, "costs", "summary.json"))
  const accounting = readJson(join(benchmarkDir, "costs", "accounting.json"))
  const siteIndexes = files.filter((file) => file.endsWith("site-index.json") && !file.split(sep).includes("benchmark"))
  const undefinedRunNodes = siteIndexes.flatMap((file) => {
    const index = readJson(file)
    return (index?.nodes ?? []).filter((node) => node.nodeType === "run" && String(node.nodeId).includes("undefined")).map(() => rel(file))
  })
  const knownTokens = accounting?.total?.knownTokenThreads ?? null
  const knownCosts = accounting?.total?.knownCostThreads ?? null
  benchmarks.push({
    benchmarkId: readJson(benchmarkFile)?.benchmarkId ?? null,
    path: rel(benchmarkRoot),
    current: current ? {
      cycleId: current.cycleId,
      digestMatchesReview: Boolean(currentReview && current.reviewSourceDigest === currentReview.sourceDigest),
      reviewPresent: Boolean(currentReview),
    } : null,
    cycles: cycleReports,
    interruptedCycle2Present: cycleDirs.includes("cycle-2"),
    collectingCycles: cycleDirs.filter((cycleId) => cycleReports[cycleId].status === "collecting"),
    accounting: accounting ? {
      threads: accounting.threads?.length ?? null,
      knownTokens,
      knownCosts,
      allCostsMissing: Boolean(accounting.threads?.length && knownCosts === 0),
      totalTokens: accounting.total?.tokens ?? null,
    } : null,
    summaryPresent: Boolean(summary),
    undefinedRunNodes,
  })
}

console.log(JSON.stringify({
  schemaVersion: 1,
  root,
  benchmarkCount: benchmarks.length,
  benchmarks,
}, null, 2))
