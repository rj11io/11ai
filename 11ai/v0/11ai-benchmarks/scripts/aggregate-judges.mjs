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
  for (const dimension of dimensions) {
    const values = judges.map((j) => j.runs.find((r) => r.anonymizedAs === runId)?.dimensions?.[dimension.id]?.score)
    if (values.some((v) => !Number.isFinite(v))) throw new Error(`missing ${dimension.id} score for ${runId}`)
    dimensionScores[dimension.id] = median(values)
    dispersion[dimension.id] = {
      min: Math.min(...values), max: Math.max(...values), range: Math.max(...values) - Math.min(...values),
    }
  }
  const ranks = judges.map((j) => j.overallRanking.indexOf(runId) + 1)
  if (ranks.some((rank) => rank < 1)) throw new Error(`missing holistic rank for ${runId}`)
  const total = dimensions.reduce((sum, d) => sum + dimensionScores[d.id] * d.weight / 100, 0)
  const borda = ranks.reduce((sum, rank) => sum + (anonymized.length - rank), 0)
  return { anonymizedAs: runId, dimensions: dimensionScores, total, holisticMedianRank: median(ranks), holisticBorda: borda, dispersion }
})

const heaviest = [...dimensions].sort((a, b) => b.weight - a.weight)[0].id
runs.sort((a, b) => b.total - a.total || a.holisticMedianRank - b.holisticMedianRank || b.dimensions[heaviest] - a.dimensions[heaviest])
let prior = null
let rank = 0
runs.forEach((run, index) => {
  const key = `${run.total}|${run.holisticMedianRank}|${run.dimensions[heaviest]}`
  if (key !== prior) rank = index + 1
  run.rank = rank
  run.scoreHolisticDisagreement = Math.abs(rank - run.holisticMedianRank)
  prior = key
})

const output = {
  schemaVersion: 2,
  artifactId: `judging-aggregate:${judges[0].cycleId}`,
  status: "complete",
  generatedAt: new Date().toISOString(),
  sourceDigest,
  cycleId: judges[0].cycleId,
  rubricSha,
  evidenceSha,
  algorithmVersion: "median-weighted+borda-v1",
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
