#!/usr/bin/env node

// Refresh stale generated report prose after transcript accounting is repaired.
// This only edits review report.html files; it never enters benchmark run folders.
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

const root = resolve(process.argv[2] ?? ".")
const projects = [
  ["crypto-dashboard-bench", "cycle-1"],
  ["cv-redesign-bench", "cycle-1"],
  ["cyber-dashboard-bench", "cyber-dashboard-2026-07-17-v2"],
  ["gh-readme-bench", "cycle-1"],
]

const money = (value) => `$${Number(value ?? 0).toFixed(2)}`
for (const [project, cycle] of projects) {
  const benchmark = join(root, project, "benchmark")
  const summary = JSON.parse(readFileSync(join(benchmark, "costs", "summary.json"), "utf8"))
  const accounting = JSON.parse(readFileSync(join(benchmark, "costs", "accounting.json"), "utf8"))
  const review = JSON.parse(readFileSync(join(benchmark, "cycles", cycle, "review", "data.json"), "utf8"))
  const report = join(benchmark, "cycles", cycle, "report", "report.html")
  if (!existsSync(report)) continue
  let html = readFileSync(report, "utf8")
  const threads = accounting.threads.length
  const tokens = accounting.total.tokens.toLocaleString("en-US")
  const runs = summary.runs.filter((run) => run.sourceCount && Number.isFinite(run.costUsd))
  const runCost = summary.costSummary?.benchmarkRunsUsd ?? runs.reduce((sum, run) => sum + run.costUsd, 0)
  const judgeCost = summary.costSummary?.judgeUsd ?? 0
  const unknown = summary.costSummary?.unknownCostThreads ?? accounting.threads.filter((thread) => !Number.isFinite(thread.cost?.totalUsd)).length
  const accountingText = `${threads} usage-bearing local transcript threads were discovered and reconciled, totaling ${tokens} measured tokens. Matched benchmark runs total ${money(runCost)} API-equivalent, the judge is ${money(judgeCost)}, and ${unknown} synthetic or otherwise unpriced threads remain explicitly unavailable.`

  if (project === "crypto-dashboard-bench") {
    html = html.replace("Pricing and USD costs are unavailable.", `Measured transcript accounting recovered ${threads} usage-bearing threads; matched benchmark runs total ${money(runCost)} API-equivalent and the judge is ${money(judgeCost)}.`)
    html = html.replace("25 logical local transcript threads reconciled; verified pricing unavailable.", `${threads} usage-bearing transcript threads reconciled; ${runs.length} benchmark runs have verified API-equivalent pricing; synthetic operations without a verified price remain explicitly unavailable.`)
  } else if (project === "cv-redesign-bench") {
    html = html.replace(/36 known logical threads reconcile: 35 benchmark route outputs and one judge\. Token and cost data are unavailable because no attributable local transcripts or verified prices were found; values remain <code>null<\/code>\./, accountingText)
  } else if (project === "cyber-dashboard-bench") {
    html = html.replace("Token/cost accounting is structurally reconciled but unavailable because no harness transcript or stable session accounting record was exposed in the workspace.", `Transcript accounting is structurally reconciled: ${threads} usage-bearing threads and ${tokens} measured tokens; matched benchmark runs total ${money(runCost)} and the judge is ${money(judgeCost)}.`)
    html = html.replace("Two classified publication-scope threads reconcile: one benchmark-operation and one judge. Token and cost values are unavailable and remain null; no costs were inferred.", accountingText)
  } else if (project === "gh-readme-bench") {
    html = html.replace("49 local transcript threads were discovered and reconciled. Token and cost values are unavailable because the transcripts contained no usable token-count events; no usage values were inferred.", accountingText)
  }
  html = html.replace(/Review source digest: (?:<code>)?[0-9a-f]{64}(?:<\/code>)?/i, (match) => match.replace(/[0-9a-f]{64}/i, review.sourceDigest))
  writeFileSync(report, html)
  console.log(`updated ${report}`)
}
