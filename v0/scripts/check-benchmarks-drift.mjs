#!/usr/bin/env node
// Guards the 11ai-benchmarks plugin against copy drift. The three analyzer skills
// carry deliberate per-skill copies of shared code; this check fails when a copy
// that must stay identical diverges, so a fix applied to one copy cannot silently
// miss the others. Intentionally divergent functions are allowlisted below.

import { readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

const root = resolve(process.cwd())
const benchmarks = join(root, "v0", "plugins", "11ai-benchmarks", "skills")
const write = process.argv.includes("--write")
const failures = []

// 1. Files that must be byte-identical across their copies.
// In every group the FIRST file is the canonical copy that --write propagates.
const IDENTICAL_FILE_GROUPS = [
  {
    label: "benchmarks-core.mjs",
    syncable: true,
    files: [
      "11ai-benchmarks-project/scripts/benchmarks-core.mjs",
      "11ai-benchmarks-single-thread/scripts/benchmarks-core.mjs",
      "11ai-benchmarks-machine/scripts/benchmarks-core.mjs",
    ],
  },
  {
    label: "harness-support.mjs",
    syncable: true,
    files: [
      "11ai-benchmarks-project/scripts/harness-support.mjs",
      "11ai-benchmarks-single-thread/scripts/harness-support.mjs",
      "11ai-benchmarks-machine/scripts/harness-support.mjs",
    ],
  },
  {
    label: "pricing-history.mjs",
    files: [
      "11ai-benchmarks-pricing-update/scripts/pricing-history.mjs",
      "11ai-benchmarks-single-thread/scripts/pricing-history.mjs",
      "11ai-benchmarks-project/scripts/pricing-history.mjs",
      "11ai-benchmarks-machine/scripts/pricing-history.mjs",
    ],
  },
  {
    label: "pricing.json",
    files: [
      "11ai-benchmarks-pricing-update/references/pricing.json",
      "11ai-benchmarks-single-thread/references/pricing.json",
      "11ai-benchmarks-project/references/pricing.json",
      "11ai-benchmarks-machine/references/pricing.json",
    ],
  },
]

for (const group of IDENTICAL_FILE_GROUPS) {
  let reference = null
  for (const file of group.files) {
    let text
    try { text = readFileSync(join(benchmarks, file), "utf8") } catch (error) {
      failures.push(`${group.label}: ${file} could not be read (${error.message})`)
      continue
    }
    if (reference === null) {
      reference = { file, text }
    } else if (text !== reference.text) {
      if (write && group.syncable) {
        writeFileSync(join(benchmarks, file), reference.text)
        console.log(`synced ${file} from ${reference.file}`)
      } else {
        failures.push(`${group.label}: ${file} diverges from ${reference.file}`)
      }
    }
  }
}

// 2. Top-level functions shared by the three analyzers must stay byte-identical
// unless their divergence is deliberate. The allowlist names the functions whose
// scope legitimately differs between the single-thread, project, and machine
// analyzers (selection, sub-agent lineage, multi-home accounts, report shape).
const ANALYZERS = {
  "single-thread": "11ai-benchmarks-single-thread/scripts/analyze-llm-cost-single-thread.mjs",
  "project": "11ai-benchmarks-project/scripts/analyze-llm-cost-project.mjs",
  "machine": "11ai-benchmarks-machine/scripts/analyze-llm-cost-global.mjs",
}
const INTENTIONALLY_DIVERGENT = new Set([
  "baseThread",
  "buildClaudeDedupState",
  "coworkRootCandidates",
  "discoverNativeSessions",
  "enrichCoworkFiles",
  "folderLabel",
  "geminiSessionMetadata",
  "htmlReport",
  "indexClaudeDesktopSessions",
  "indexRemoteCoworkSessions",
  "opencodeDatabaseCandidates",
  "parseClaude",
  "parseCodex",
  "parseOpenCodeDatabase",
  "report",
  "sourceLabel",
])

// Extraction relies on the analyzers' consistent formatting: top-level function
// declarations start at column 0 and close with a lone } at column 0.
function extractFunctions(text) {
  const functions = new Map()
  const lines = text.split("\n")
  for (let i = 0; i < lines.length; i += 1) {
    const match = /^(?:async )?function (\w+)\s*\(/.exec(lines[i])
    if (!match) continue
    const body = [lines[i]]
    while (i + 1 < lines.length && lines[i] !== "}") {
      i += 1
      body.push(lines[i])
    }
    functions.set(match[1], body.join("\n"))
  }
  return functions
}

const extracted = new Map()
for (const [label, file] of Object.entries(ANALYZERS)) {
  try { extracted.set(label, extractFunctions(readFileSync(join(benchmarks, file), "utf8"))) } catch (error) {
    failures.push(`analyzer ${label}: ${file} could not be read (${error.message})`)
  }
}

if (extracted.size === Object.keys(ANALYZERS).length) {
  const names = new Set()
  for (const functions of extracted.values()) for (const name of functions.keys()) names.add(name)
  for (const name of [...names].sort()) {
    const holders = [...extracted.entries()].filter(([, functions]) => functions.has(name))
    if (holders.length < 2) continue
    if (INTENTIONALLY_DIVERGENT.has(name)) continue
    const [firstLabel, firstFunctions] = holders[0]
    for (const [label, functions] of holders.slice(1)) {
      if (functions.get(name) !== firstFunctions.get(name)) {
        failures.push(`shared analyzer function '${name}' differs between ${firstLabel} and ${label}; sync the copies or allowlist it as intentionally divergent`)
      }
    }
  }
  // The allowlist itself must not go stale: every entry must still exist somewhere.
  for (const name of INTENTIONALLY_DIVERGENT) {
    if (![...extracted.values()].some((functions) => functions.has(name))) {
      failures.push(`allowlisted function '${name}' no longer exists in any analyzer; remove it from INTENTIONALLY_DIVERGENT`)
    }
  }
}

if (failures.length) {
  for (const failure of failures) console.error("DRIFT: " + failure)
  process.exit(1)
}
console.log("Benchmarks copies are synchronized: shared files byte-identical, shared analyzer functions in sync.")
