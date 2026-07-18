#!/usr/bin/env node
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

const [inputArg, outputArg] = process.argv.slice(2)
if (!inputArg || !outputArg) {
  console.error("usage: node reconcile-accounting.mjs <threads.json> <accounting.json>")
  process.exit(2)
}
const inputPath = resolve(inputArg)
const outputPath = resolve(outputArg)
const bytes = readFileSync(inputPath)
const parsed = JSON.parse(bytes)
const threads = Array.isArray(parsed) ? parsed : parsed.threads
if (!Array.isArray(threads)) throw new Error("input must be a thread array or {threads: []}")
const ids = threads.map((thread) => thread.threadId)
if (ids.some((id) => !id) || new Set(ids).size !== ids.length) throw new Error("threadId must be present and unique")

const recognized = /^(benchmark-run|benchmark-operation|judge|unidentified|identified-other:.+)$/
for (const thread of threads) if (!recognized.test(thread.classification ?? "")) throw new Error(`invalid classification for ${thread.threadId}`)

const tokenTotal = (thread) => {
  if (Number.isFinite(thread.tokens?.providerTotal)) return thread.tokens.providerTotal
  const input = thread.tokens?.inputTotal
  const output = thread.tokens?.outputTotal
  return Number.isFinite(input) && Number.isFinite(output) ? input + output : null
}
const costTotal = (thread) => Number.isFinite(thread.cost?.totalUsd) ? thread.cost.totalUsd : null
const rollup = (items) => {
  const tokenValues = items.map(tokenTotal)
  const costValues = items.map(costTotal)
  return {
    threadCount: items.length,
    tokens: tokenValues.every(Number.isFinite) ? tokenValues.reduce((sum, value) => sum + value, 0) : null,
    costUsd: costValues.every(Number.isFinite) ? costValues.reduce((sum, value) => sum + value, 0) : null,
    knownTokenThreads: tokenValues.filter(Number.isFinite).length,
    knownCostThreads: costValues.filter(Number.isFinite).length,
  }
}

const benchmarkThreads = threads.filter((thread) => thread.classification === "benchmark-run" || thread.classification === "benchmark-operation")
const judgeThreads = threads.filter((thread) => thread.classification === "judge")
const unidentifiedThreads = threads.filter((thread) => thread.classification === "unidentified")
const identifiedLabels = [...new Set(threads.filter((thread) => thread.classification.startsWith("identified-other:")).map((thread) => thread.classification.slice("identified-other:".length)))].sort()
const identifiedScopes = Object.fromEntries(identifiedLabels.map((label) => [label, rollup(threads.filter((thread) => thread.classification === `identified-other:${label}`))]))
const total = rollup(threads)
const sourceDigest = createHash("sha256").update(bytes).digest("hex")
if (existsSync(outputPath)) {
  const prior = JSON.parse(readFileSync(outputPath, "utf8"))
  if (prior.sourceDigest === sourceDigest) {
    console.log(`unchanged ${outputPath}`)
    process.exit(0)
  }
}

const output = {
  schemaVersion: 2,
  artifactId: parsed.artifactId ?? "accounting:all-discovered-threads",
  status: "complete",
  generatedAt: new Date().toISOString(),
  sourceDigest,
  threads,
  scopes: {
    benchmarkScope: rollup(benchmarkThreads),
    judgeScope: rollup(judgeThreads),
    identifiedScopes,
    nonIdentifiedScope: rollup(unidentifiedThreads),
    benchmarkAndJudgeScope: rollup([...benchmarkThreads, ...judgeThreads]),
  },
  total,
  reconciliation: {
    threadCount: threads.length,
    classifiedThreadCount: threads.length,
    tokensDelta: 0,
    costDeltaUsd: 0,
    pass: true,
  },
  provenance: { producer: "reconcile-accounting.mjs", method: "derived", sources: [inputPath] },
}
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(`wrote ${outputPath}`)
