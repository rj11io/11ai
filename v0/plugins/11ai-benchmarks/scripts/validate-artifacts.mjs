#!/usr/bin/env node
import { readFileSync } from "node:fs"

const files = process.argv.slice(2)
if (!files.length) {
  console.error("usage: node validate-artifacts.mjs <artifact.json> [artifact.json ...]")
  process.exit(2)
}

let failures = 0
for (const file of files) {
  try {
    const data = JSON.parse(readFileSync(file, "utf8"))
    if (data.schemaVersion !== 2) throw new Error("schemaVersion must be 2")
    if (!data.artifactId || typeof data.artifactId !== "string") throw new Error("artifactId missing")
    if (!data.status || typeof data.status !== "string") throw new Error("status missing")
    if (data.sourceDigest != null && !/^[a-f0-9]{64}$/.test(data.sourceDigest)) throw new Error("invalid sourceDigest")
    if (Array.isArray(data.judgeIds) && new Set(data.judgeIds).size !== data.judgeIds.length) throw new Error("duplicate judgeIds")
    if (Array.isArray(data.targets)) {
      const ids = data.targets.map((target) => target.targetId)
      if (ids.some((id) => !id)) throw new Error("targetId missing")
      if (new Set(ids).size !== ids.length) throw new Error("duplicate targetIds")
      if (data.campaignStatus === "hard-closed" && !data.finalCycleId) throw new Error("hard-closed plan missing finalCycleId")
    }
    if (Array.isArray(data.runIds) && data.coverageSnapshot?.includedRunIds) {
      const runIds = [...data.runIds].sort()
      const included = [...data.coverageSnapshot.includedRunIds].sort()
      if (JSON.stringify(runIds) !== JSON.stringify(included)) throw new Error("cycle runIds do not match coverageSnapshot.includedRunIds")
      if (data.releaseType === "final" && data.coverageSnapshot.timeGated > 0 && !data.coverageSnapshot.waiver) throw new Error("final cycle has time-gated targets without waiver")
    }
    if (data.judgePromptTemplateSha != null && !/^[a-f0-9]{64}$/.test(data.judgePromptTemplateSha)) throw new Error("invalid judgePromptTemplateSha")
    if (data.judgePromptInstanceSha != null && !/^[a-f0-9]{64}$/.test(data.judgePromptInstanceSha)) throw new Error("invalid judgePromptInstanceSha")
    if (Array.isArray(data.runs)) {
      const ids = data.runs.map((r) => r.id ?? r.anonymizedAs).filter(Boolean)
      if (new Set(ids).size !== ids.length) throw new Error("duplicate run identities")
    }
    console.log(`ok ${file}`)
  } catch (error) {
    failures += 1
    console.error(`fail ${file}: ${error.message}`)
  }
}
process.exitCode = failures ? 1 : 0
