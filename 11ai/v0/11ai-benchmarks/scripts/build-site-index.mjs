#!/usr/bin/env node
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"

const [rootArg, outputArg] = process.argv.slice(2)
if (!rootArg || !outputArg) {
  console.error("usage: node build-site-index.mjs <benchmark-tree-root> <site-index.json>")
  process.exit(2)
}
const root = resolve(rootArg)
const output = resolve(outputArg)
const ignored = new Set([".git", ".next", "node_modules"])
const reviewFiles = []

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue
    const file = join(dir, entry.name)
    if (entry.isDirectory()) walk(file)
    else {
      const unix = file.split(sep).join("/")
      if (/benchmark\/cycles\/[^/]+\/review\/data\.json$/.test(unix) || unix.endsWith("/benchmark/report/data.json")) reviewFiles.push(file)
    }
  }
}
walk(root)
reviewFiles.sort()

const digest = createHash("sha256")
const reviews = reviewFiles.flatMap((file) => {
  const bytes = readFileSync(file)
  digest.update(relative(root, file)).update(Buffer.from([0])).update(bytes).update(Buffer.from([0]))
  try { return [{ file, data: JSON.parse(bytes) }] } catch { return [] }
})
const sourceDigest = digest.digest("hex")
if (existsSync(output)) {
  const prior = JSON.parse(readFileSync(output, "utf8"))
  if (prior.sourceDigest === sourceDigest) {
    console.log(`unchanged ${output}`)
    process.exit(0)
  }
}

const rootId = `root:${root.split(sep).pop()}`
const nodes = [{ nodeId: rootId, nodeType: "root", title: root.split(sep).pop(), parentId: null, children: [], summary: {}, metadataCoverage: {} }]
const byId = new Map(nodes.map((node) => [node.nodeId, node]))

for (const { file, data } of reviews) {
  const benchmarkDir = file.includes(`${sep}cycles${sep}`)
    ? file.split(`${sep}benchmark${sep}cycles${sep}`)[0]
    : file.split(`${sep}benchmark${sep}report${sep}`)[0]
  const fallbackId = benchmarkDir.split(sep).pop()
  const benchmarkId = data.benchmark?.id ?? data.benchmark?.benchmarkId ?? fallbackId
  const cycleId = data.cycle?.cycleId ?? "legacy-current"
  const relParts = relative(root, benchmarkDir).split(sep).filter(Boolean)
  let parent = byId.get(rootId)
  for (const part of relParts.slice(0, -1)) {
    const id = `${parent.nodeId}/parent:${part}`
    if (!byId.has(id)) {
      const node = { nodeId: id, nodeType: "parent", title: part, parentId: parent.nodeId, children: [], summary: {}, metadataCoverage: {} }
      byId.set(id, node)
      nodes.push(node)
      parent.children.push(id)
    }
    parent = byId.get(id)
  }
  const benchmarkKey = relative(root, benchmarkDir).split(sep).join("/") || benchmarkId
  const benchmarkNodeId = `benchmark:${benchmarkKey}`
  let benchmark = byId.get(benchmarkNodeId)
  if (!benchmark) {
    benchmark = { nodeId: benchmarkNodeId, nodeType: "benchmark", benchmarkId, title: data.benchmark?.title ?? benchmarkId, parentId: parent.nodeId, children: [], summary: data.summary ?? {}, metadataCoverage: data.metadataCoverage ?? {}, sourcePath: relative(root, benchmarkDir) }
    byId.set(benchmarkNodeId, benchmark)
    nodes.push(benchmark)
    parent.children.push(benchmarkNodeId)
  }
  const cycleNodeId = `${benchmarkNodeId}/cycle:${cycleId}`
  if (byId.has(cycleNodeId)) continue
  const cycle = { nodeId: cycleNodeId, nodeType: "cycle", title: cycleId, parentId: benchmarkNodeId, children: [], summary: { judging: data.judging, accounting: data.accounting }, metadataCoverage: data.metadataCoverage ?? {}, dataPath: relative(root, file) }
  byId.set(cycleNodeId, cycle)
  nodes.push(cycle)
  benchmark.children.push(cycleNodeId)
  for (const run of data.runs ?? []) {
    const runNodeId = `${cycleNodeId}/run:${run.id}`
    const node = { nodeId: runNodeId, nodeType: "run", title: run.id, parentId: cycleNodeId, children: [], summary: run, metadataCoverage: run.metadataCoverage ?? {} }
    byId.set(runNodeId, node)
    nodes.push(node)
    cycle.children.push(runNodeId)
  }
}

for (const node of nodes) node.children.sort()
const result = { schemaVersion: 2, artifactId: `site-index:${rootId}`, status: "complete", generatedAt: new Date().toISOString(), sourceDigest, rootId, nodes, sourceCount: reviews.length }
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`)
console.log(`wrote ${output} (${nodes.length} nodes from ${reviews.length} reviews)`)
