import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const skillRoot = dirname(scriptDir)
const skillsRoot = dirname(skillRoot)
const canonicalPath = resolve(skillRoot, "references/pricing.json")
const reportCatalogs = [
  resolve(skillsRoot, "11ai-llm-cost-project/references/pricing.json"),
  resolve(skillsRoot, "11ai-llm-cost-global/references/pricing.json"),
  resolve(skillsRoot, "11ai-llm-cost-single-thread/references/pricing.json"),
]

const args = process.argv.slice(2)
const write = args.includes("--write")
const seedIndex = args.indexOf("--seed")
if (seedIndex >= 0 && !args[seedIndex + 1]) throw new Error("--seed requires a catalog path")
const sourcePath = seedIndex >= 0 ? resolve(process.cwd(), args[seedIndex + 1]) : canonicalPath

if (!existsSync(sourcePath)) throw new Error("Pricing catalog does not exist: " + sourcePath)

const catalog = JSON.parse(readFileSync(sourcePath, "utf8"))
const errors = validateCatalog(catalog)
if (errors.length) {
  for (const error of errors) console.error("ERROR: " + error)
  process.exit(1)
}

const canonicalText = JSON.stringify(catalog, null, 2) + "\n"
if (write) {
  for (const target of [canonicalPath, ...reportCatalogs]) writeFileSync(target, canonicalText)
}

const divergent = []
for (const target of [canonicalPath, ...reportCatalogs]) {
  if (!existsSync(target) || readFileSync(target, "utf8") !== canonicalText) divergent.push(target)
}
if (divergent.length) {
  console.error("Catalogs are not synchronized:")
  for (const target of divergent) console.error("- " + target)
  console.error("Run: node scripts/sync-pricing-catalog.mjs --write")
  process.exit(1)
}

const providers = [...new Set(catalog.models.map((entry) => entry.provider))].sort()
console.log("Pricing catalog valid and synchronized.")
console.log("Models: " + catalog.models.length)
console.log("Providers (" + providers.length + "): " + providers.join(", "))
console.log("Updated: " + catalog.updatedAt)

function validateCatalog(value) {
  const failures = []
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  const supportedRates = new Set(["input", "cachedInput", "output", "cacheWrite5m", "cacheWrite1h", "cacheRead"])
  if (!Number.isInteger(value?.version) || value.version < 1) failures.push("version must be a positive integer")
  if (!datePattern.test(value?.updatedAt ?? "")) failures.push("updatedAt must use YYYY-MM-DD")
  if (typeof value?.comment !== "string" || !value.comment.trim()) failures.push("comment is required")
  if (!Array.isArray(value?.models) || value.models.length === 0) failures.push("models must be a non-empty array")

  const patterns = new Set()
  for (const [index, entry] of (value?.models ?? []).entries()) {
    const label = "models[" + index + "]"
    if (typeof entry?.provider !== "string" || !entry.provider.trim()) failures.push(label + ".provider is required")
    if (!Array.isArray(entry?.match) || entry.match.length === 0 || entry.match.some((pattern) => typeof pattern !== "string" || !pattern)) {
      failures.push(label + ".match must contain non-empty strings")
    } else {
      for (const pattern of entry.match) {
        const key = entry.provider + "\u0000" + pattern
        if (patterns.has(key)) failures.push(label + ".match duplicates " + entry.provider + "/" + pattern)
        patterns.add(key)
      }
    }
    if (!entry?.per1M || typeof entry.per1M !== "object" || Array.isArray(entry.per1M)) {
      failures.push(label + ".per1M must be an object")
    } else {
      for (const required of ["input", "output"]) {
        if (!Number.isFinite(entry.per1M[required]) || entry.per1M[required] < 0) failures.push(label + ".per1M." + required + " must be a non-negative number")
      }
      for (const [name, rate] of Object.entries(entry.per1M)) {
        if (!supportedRates.has(name)) failures.push(label + ".per1M contains unsupported rate " + name)
        if (rate !== null && (!Number.isFinite(rate) || rate < 0)) failures.push(label + ".per1M." + name + " must be null or a non-negative number")
      }
    }
    if (entry.effectiveDate !== undefined && !datePattern.test(entry.effectiveDate)) failures.push(label + ".effectiveDate must use YYYY-MM-DD")
    if (!datePattern.test(entry?.verifiedAt ?? "")) failures.push(label + ".verifiedAt must use YYYY-MM-DD")
    try {
      const url = new URL(entry?.sourceUrl)
      if (url.protocol !== "https:") failures.push(label + ".sourceUrl must use HTTPS")
    } catch {
      failures.push(label + ".sourceUrl must be a valid URL")
    }
    if (entry.notes !== undefined && (typeof entry.notes !== "string" || !entry.notes.trim())) failures.push(label + ".notes must be a non-empty string when present")
  }
  return failures
}
