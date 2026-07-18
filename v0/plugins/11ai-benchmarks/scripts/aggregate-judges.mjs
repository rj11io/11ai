#!/usr/bin/env node
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

const [judgesArg, rubricArg, outputArg] = process.argv.slice(2)
if (!judgesArg || !rubricArg || !outputArg) {
  console.error("usage: node aggregate-judges.mjs <judges-dir> <rubric.json> <aggregate.json>")
  process.exit(2)
}

const judgesDir = resolve(judgesArg)
const rubricPath = resolve(rubricArg)
const outputPath = resolve(outputArg)
const rubricBytes = readFileSync(rubricPath)
const rubric = JSON.parse(rubricBytes)
const dimensions = rubric.dimensions ?? []
if (!dimensions.length || dimensions.reduce((n, d) => n + d.weight, 0) !== 100) {
  throw new Error("rubric.json needs dimensions whose weights sum to 100")
}

const files = readdirSync(judgesDir).filter((f) => f.endsWith(".json")).sort()
const raw = files.map((file) => ({ file, bytes: readFileSync(join(judgesDir, file)) }))
const parsed = raw.map(({ file, bytes }) => ({ file, bytes, data: JSON.parse(bytes) }))
const complete = parsed.filter((item) => item.data.status === "complete")
const judges = complete.map(({ file, data }) => ({ file, ...data }))
const ids = judges.map((j) => j.judgeId)
if (new Set(ids).size !== ids.length) throw new Error("duplicate judgeId")
if (!judges.length) throw new Error("no complete judge artifacts")

const rubricSha = judges[0].rubricSha
const evidenceSha = judges[0].evidenceSha
for (const judge of judges) {
  if (judge.rubricSha !== rubricSha || judge.evidenceSha !== evidenceSha) {
    throw new Error(`judge ${judge.judgeId} used different rubric or evidence`)
  }
}
if (rubric.rubricSha && rubric.rubricSha !== rubricSha) throw new Error("rubric.json hash does not match judge artifacts")

const digest = createHash("sha256")
  .update(rubricBytes)
  .update(Buffer.from([0]))
for (const item of complete) digest.update(item.file).update(Buffer.from([0])).update(item.bytes).update(Buffer.from([0]))
const sourceDigest = digest.digest("hex")
if (existsSync(outputPath)) {
  const current = JSON.parse(readFileSync(outputPath, "utf8"))
  if (current.sourceDigest === sourceDigest) {
    console.log(`unchanged ${outputPath}`)
    process.exit(0)
  }
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
const anonymized = [...new Set(judges.flatMap((j) => j.runs.map((r) => r.anonymizedAs)))].sort()
const runs = anonymized.map((runId) => {
  const dimensionScores = {}
  const dispersion = {}
  let availableWeight = 0
  let availableDimensionCount = 0
  for (const dimension of dimensions) {
    const values = judges
      .map((j) => j.runs.find((r) => r.anonymizedAs === runId)?.dimensions?.[dimension.id]?.score)
      .filter(Number.isFinite)
    if (!values.length) {
      dimensionScores[dimension.id] = null
      dispersion[dimension.id] = { min: null, max: null, range: null, count: 0 }
      continue
    }
    dimensionScores[dimension.id] = median(values)
    dispersion[dimension.id] = {
      min: Math.min(...values), max: Math.max(...values), range: Math.max(...values) - Math.min(...values), count: values.length,
    }
    availableWeight += dimension.weight
    availableDimensionCount += 1
  }
  const ranks = judges.map((j) => j.overallRanking.indexOf(runId) + 1).filter((rank) => rank > 0)
  const total = availableWeight
    ? dimensions.reduce((sum, d) => sum + (Number.isFinite(dimensionScores[d.id]) ? dimensionScores[d.id] * d.weight : 0), 0) / availableWeight
    : null
  const maxRanked = Math.max(0, ...judges.map((j) => j.overallRanking.length))
  const borda = ranks.length ? ranks.reduce((sum, rank) => sum + (maxRanked - rank), 0) : null
  return {
    anonymizedAs: runId,
    dimensions: dimensionScores,
    total,
    scoreCoverage: availableWeight,
    dimensionCoverage: `${availableDimensionCount}/${dimensions.length}`,
    rankable: availableDimensionCount > 0,
    holisticMedianRank: ranks.length ? median(ranks) : null,
    holisticBorda: borda,
    dispersion,
  }
})

const heaviest = [...dimensions].sort((a, b) => b.weight - a.weight)[0].id
const rankableRuns = runs.filter((run) => run.rankable)
const unrankableRuns = runs.filter((run) => !run.rankable)
rankableRuns.sort((a, b) => b.total - a.total || (a.holisticMedianRank ?? Number.POSITIVE_INFINITY) - (b.holisticMedianRank ?? Number.POSITIVE_INFINITY) || (b.dimensions[heaviest] ?? -1) - (a.dimensions[heaviest] ?? -1))
let prior = null
let rank = 0
rankableRuns.forEach((run, index) => {
  const key = `${run.total}|${run.holisticMedianRank}|${run.dimensions[heaviest]}`
  if (key !== prior) rank = index + 1
  run.rank = rank
  run.scoreHolisticDisagreement = run.holisticMedianRank == null ? null : Math.abs(rank - run.holisticMedianRank)
  prior = key
})
unrankableRuns.forEach((run) => { run.rank = null; run.scoreHolisticDisagreement = null })
runs.splice(0, runs.length, ...rankableRuns, ...unrankableRuns)

const output = {
  schemaVersion: 2,
  artifactId: `judging-aggregate:${judges[0].cycleId}`,
  status: "complete",
  generatedAt: new Date().toISOString(),
  sourceDigest,
  cycleId: judges[0].cycleId,
  rubricSha,
  evidenceSha,
  algorithmVersion: "median-weighted+borda-v2-partial-aware",
  judgeIds: ids.sort(),
  judgeCounts: {
    total: judges.length,
    ai: judges.filter((j) => j.judgeType === "ai").length,
    human: judges.filter((j) => j.judgeType === "human").length,
  },
  runs,
  provenance: { producer: "aggregate-judges.mjs", method: "derived", sources: complete.map((r) => r.file) },
}
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(`wrote ${outputPath}`)
