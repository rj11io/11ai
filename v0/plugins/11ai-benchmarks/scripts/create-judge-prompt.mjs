#!/usr/bin/env node
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const [rootArg, cycleId, judgeId, judgeType] = process.argv.slice(2)
const ensureOnly = cycleId === "--ensure-template"
if (!rootArg || (!ensureOnly && (!cycleId || !judgeId || !["ai", "human"].includes(judgeType)))) {
  console.error("usage: node create-judge-prompt.mjs <benchmark-root> [--ensure-template | <cycle-id> <judge-id> <ai|human>]")
  process.exit(2)
}

const root = path.resolve(rootArg)
const benchmarkDir = existsSync(path.join(root, "benchmark")) ? path.join(root, "benchmark") : root
const repoRoot = benchmarkDir === root ? path.dirname(root) : root
const bundled = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "references", "judge-prompt-template.md")
const templateFile = path.join(repoRoot, "JUDGE.md")
if (!existsSync(templateFile)) {
  writeFileSync(templateFile, readFileSync(bundled, "utf8"))
  console.log(`created ${templateFile}`)
}
if (ensureOnly) {
  console.log(`ready ${templateFile}`)
  process.exit(0)
}

const cycleFile = path.join(benchmarkDir, "cycles", cycleId, "cycle.json")
if (!existsSync(cycleFile)) throw new Error(`missing cycle ${cycleFile}`)

const template = readFileSync(templateFile, "utf8")
for (const variable of ["CYCLE_ID", "JUDGE_ID", "JUDGE_TYPE"]) {
  if (!template.includes(`{{${variable}}}`)) throw new Error(`JUDGE.md is missing {{${variable}}}`)
}
const variables = { CYCLE_ID: cycleId, JUDGE_ID: judgeId, JUDGE_TYPE: judgeType }
let instance = template
for (const [key, value] of Object.entries(variables)) instance = instance.replaceAll(`{{${key}}}`, value)
if (/{{[A-Z0-9_]+}}/.test(instance)) throw new Error("JUDGE.md contains unresolved variables")

const sha = (value) => createHash("sha256").update(value).digest("hex")
const templateSha = sha(template)
const instanceSha = sha(instance)
const sourceDigest = sha(`${templateSha}\0${instanceSha}\0${JSON.stringify(variables)}`)
const promptDir = path.join(benchmarkDir, "cycles", cycleId, "judging", "prompts")
const promptFile = path.join(promptDir, `${judgeId}.md`)
const metadataFile = path.join(promptDir, `${judgeId}.json`)
mkdirSync(promptDir, { recursive: true })

if (existsSync(promptFile) && readFileSync(promptFile, "utf8") !== instance) {
  throw new Error(`refusing to overwrite changed judge prompt ${promptFile}`)
}
if (!existsSync(promptFile)) writeFileSync(promptFile, instance)

let previous = null
if (existsSync(metadataFile)) previous = JSON.parse(readFileSync(metadataFile, "utf8"))
if (previous?.sourceDigest === sourceDigest) {
  console.log(`unchanged ${metadataFile}`)
  process.exit(0)
}
if (previous) throw new Error(`refusing to replace changed judge prompt metadata ${metadataFile}`)

const metadata = {
  schemaVersion: 2,
  artifactId: `judge-prompt:${cycleId}:${judgeId}`,
  status: "complete",
  sourceDigest,
  generatedAt: new Date().toISOString(),
  cycleId,
  judgeId,
  judgeType,
  judgePromptTemplateSha: templateSha,
  judgePromptInstanceSha: instanceSha,
  judgePromptVariables: variables,
  promptPath: path.relative(repoRoot, promptFile).split(path.sep).join("/"),
  provenance: { producer: "create-judge-prompt.mjs", method: "derived", sources: ["JUDGE.md", path.relative(repoRoot, cycleFile).split(path.sep).join("/")] },
}
const temporary = `${metadataFile}.tmp-${process.pid}`
writeFileSync(temporary, `${JSON.stringify(metadata, null, 2)}\n`)
renameSync(temporary, metadataFile)
console.log(`wrote ${promptFile} and ${metadataFile}`)
