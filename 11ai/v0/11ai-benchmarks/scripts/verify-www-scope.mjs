#!/usr/bin/env node

/**
 * Fail closed if a benchmark-www change crosses into benchmark-owned or
 * run-owned files. The website skill can read those artifacts, but may only
 * write website source and generated website data.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, relative, resolve, sep } from "node:path"

const [rootArg, ...changedArgs] = process.argv.slice(2)
if (!rootArg || !changedArgs.length) {
  console.error("usage: node verify-www-scope.mjs <tree-root> <changed-path>...")
  process.exit(2)
}

const root = resolve(rootArg)
const runIds = new Set()

function walk(dir) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name)
    if (entry.isDirectory() && ![".git", ".next", "node_modules"].includes(entry.name)) walk(file)
    else if (entry.isFile() && entry.name === "runs.json") {
      try {
        const parsed = JSON.parse(readFileSync(file, "utf8"))
        for (const run of Array.isArray(parsed) ? parsed : (parsed.runs ?? [])) if (run.id) runIds.add(String(run.id))
      } catch {
        // Invalid benchmark source is still protected by the path rules below.
      }
    }
  }
}
walk(root)

const protectedPath = (file) => {
  const rel = relative(root, resolve(file)).split(sep).join("/")
  const parts = rel.split("/")
  if (parts.includes("benchmark")) return true
  const appIndex = parts.indexOf("app")
  if (appIndex >= 0 && runIds.has(parts[appIndex + 1])) return true
  if (parts.includes("judging") || parts.includes("evidence") || parts.includes("prompts")) return true
  return false
}

const violations = changedArgs.filter(protectedPath)
if (violations.length) {
  console.error("benchmark-www scope violation; protected benchmark/run paths:")
  for (const file of violations) console.error(`- ${file}`)
  process.exit(1)
}

console.log(`benchmark-www scope ok (${changedArgs.length} paths checked; ${runIds.size} known runs protected)`)
