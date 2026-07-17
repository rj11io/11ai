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
