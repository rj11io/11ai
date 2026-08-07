import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const skillRoot = dirname(scriptDir)
const skillsRoot = dirname(skillRoot)
const canonicalPath = resolve(skillRoot, "references/pricing.json")
const canonicalResolverPath = resolve(skillRoot, "scripts/pricing-history.mjs")
const reportCatalogs = [
  resolve(skillsRoot, "11ai-benchmarks-project/references/pricing.json"),
  resolve(skillsRoot, "11ai-benchmarks-machine/references/pricing.json"),
  resolve(skillsRoot, "11ai-benchmarks-single-thread/references/pricing.json"),
]
const reportResolvers = [
  resolve(skillsRoot, "11ai-benchmarks-project/scripts/pricing-history.mjs"),
  resolve(skillsRoot, "11ai-benchmarks-machine/scripts/pricing-history.mjs"),
  resolve(skillsRoot, "11ai-benchmarks-single-thread/scripts/pricing-history.mjs"),
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
const resolverText = readFileSync(canonicalResolverPath, "utf8")
if (write) {
  for (const target of [canonicalPath, ...reportCatalogs]) writeFileSync(target, canonicalText)
  for (const target of reportResolvers) writeFileSync(target, resolverText)
}

const divergent = []
for (const target of [canonicalPath, ...reportCatalogs]) {
  if (!existsSync(target) || readFileSync(target, "utf8") !== canonicalText) divergent.push(target)
}
for (const target of reportResolvers) {
  if (!existsSync(target) || readFileSync(target, "utf8") !== resolverText) divergent.push(target)
}
if (divergent.length) {
  console.error("Catalogs are not synchronized:")
  for (const target of divergent) console.error("- " + target)
  console.error("Run: node 11ai-benchmarks-pricing-update/scripts/sync-pricing-catalog.mjs --write")
  process.exit(1)
}

const providers = [...new Set(catalog.models.map((entry) => entry.provider))].sort()
console.log("Pricing catalog valid and synchronized.")
console.log("Models: " + catalog.models.length)
console.log("Rate periods: " + catalog.models.reduce((sum, entry) => sum + (Array.isArray(entry.rates) ? entry.rates.length : 1), 0))
console.log("Providers (" + providers.length + "): " + providers.join(", "))
console.log("Updated: " + catalog.updatedAt)

function validateCatalog(value) {
  const failures = []
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/
  const supportedRates = new Set(["input", "cachedInput", "output", "cacheWrite5m", "cacheWrite1h", "cacheRead"])
  const changeTypes = new Set(["initial-observation", "launch", "temporary-discount", "promotion-successor", "permanent-change", "correction"])
  const officialDomains = new Map([
    ["anthropic", ["anthropic.com", "claude.com"]],
    ["openai", ["openai.com"]],
    ["google", ["google.dev", "google.com"]],
    ["xai", ["x.ai"]],
    ["deepseek", ["deepseek.com"]],
    ["mistral", ["mistral.ai"]],
    ["cohere", ["cohere.com"]],
    ["perplexity", ["perplexity.ai"]],
  ])
  const globRegex = (pattern) => new RegExp("^" + pattern.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$", "i")
  const sampleFor = (pattern) => pattern.replaceAll("*", "shadow")
  const rateTime = (rate) => new Date(rate.effectiveDate ?? rate.detectedAt ?? value.detectedAt ?? rate.verifiedAt).getTime()
  if (!Number.isInteger(value?.version) || value.version < 3) failures.push("version must be at least 3 for temporal pricing histories")
  if (!datePattern.test(value?.updatedAt ?? "")) failures.push("updatedAt must use YYYY-MM-DD")
  if (!timestampPattern.test(value?.detectedAt ?? "")) failures.push("detectedAt must use an ISO-8601 UTC timestamp")
  if (typeof value?.comment !== "string" || !value.comment.trim()) failures.push("comment is required")
  if (!Array.isArray(value?.models) || value.models.length === 0) failures.push("models must be a non-empty array")

  const validateRate = (rate, label, provider, requireOwnDetection) => {
    if (!rate?.per1M || typeof rate.per1M !== "object" || Array.isArray(rate.per1M)) {
      failures.push(label + ".per1M must be an object")
    } else {
      for (const required of ["input", "output"]) {
        if (!Number.isFinite(rate.per1M[required]) || rate.per1M[required] <= 0) failures.push(label + ".per1M." + required + " must be a positive number")
      }
      for (const [name, amount] of Object.entries(rate.per1M)) {
        if (!supportedRates.has(name)) failures.push(label + ".per1M contains unsupported rate " + name)
        if (amount !== null && (!Number.isFinite(amount) || amount < 0)) failures.push(label + ".per1M." + name + " must be null or a non-negative number")
      }
    }
    if (rate.effectiveDate !== undefined && !datePattern.test(rate.effectiveDate)) failures.push(label + ".effectiveDate must use YYYY-MM-DD")
    if (rate.detectedAt !== undefined && !timestampPattern.test(rate.detectedAt)) failures.push(label + ".detectedAt must use an ISO-8601 UTC timestamp")
    if (rate.effectiveDate === undefined && requireOwnDetection && rate.detectedAt === undefined) failures.push(label + " requires detectedAt when no official effectiveDate is available")
    if (!Number.isFinite(rateTime(rate))) failures.push(label + " has no usable effective or detection timestamp")
    if (!datePattern.test(rate?.verifiedAt ?? "")) failures.push(label + ".verifiedAt must use YYYY-MM-DD")
    if (rate.changeType !== undefined && !changeTypes.has(rate.changeType)) failures.push(label + ".changeType is unsupported")
    try {
      const url = new URL(rate?.sourceUrl)
      if (url.protocol !== "https:") failures.push(label + ".sourceUrl must use HTTPS")
      const allowed = officialDomains.get(provider) ?? []
      if (allowed.length && !allowed.some((domain) => url.hostname === domain || url.hostname.endsWith("." + domain))) failures.push(label + ".sourceUrl is not on an official " + provider + " domain")
    } catch {
      failures.push(label + ".sourceUrl must be a valid URL")
    }
    if (rate.notes !== undefined && (typeof rate.notes !== "string" || !rate.notes.trim())) failures.push(label + ".notes must be a non-empty string when present")
  }

  const patterns = new Set()
  for (const [index, entry] of (value?.models ?? []).entries()) {
    const label = "models[" + index + "]"
    if (typeof entry?.provider !== "string" || !entry.provider.trim()) failures.push(label + ".provider is required")
    else if (!officialDomains.has(entry.provider)) failures.push(label + ".provider has no official source-domain allowlist")
    if (!Array.isArray(entry?.match) || entry.match.length === 0 || entry.match.some((pattern) => typeof pattern !== "string" || !pattern)) {
      failures.push(label + ".match must contain non-empty strings")
    } else {
      for (const pattern of entry.match) {
        if (pattern.includes("?")) failures.push(label + ".match uses unsupported wildcard ?: " + pattern)
        const key = entry.provider + "\u0000" + pattern
        if (patterns.has(key)) failures.push(label + ".match duplicates " + entry.provider + "/" + pattern)
        patterns.add(key)
      }
    }
    if (Array.isArray(entry.rates)) {
      if (entry.rates.length < 2) failures.push(label + ".rates must contain at least two periods; use the compact single-rate form otherwise")
      for (const field of ["per1M", "effectiveDate", "detectedAt", "sourceUrl", "verifiedAt", "changeType", "notes"]) {
        if (entry[field] !== undefined) failures.push(label + " must not mix top-level " + field + " with rates[]")
      }
      entry.rates.forEach((rate, rateIndex) => validateRate(rate, label + ".rates[" + rateIndex + "]", entry.provider, true))
      const times = entry.rates.map(rateTime)
      for (let rateIndex = 1; rateIndex < times.length; rateIndex += 1) {
        if (Number.isFinite(times[rateIndex - 1]) && Number.isFinite(times[rateIndex]) && times[rateIndex] <= times[rateIndex - 1]) failures.push(label + ".rates must be ordered by strictly increasing effective time")
      }
    } else {
      validateRate(entry, label, entry.provider, false)
    }
  }
  for (let laterIndex = 0; laterIndex < (value?.models ?? []).length; laterIndex += 1) {
    const later = value.models[laterIndex]
    for (let earlierIndex = 0; earlierIndex < laterIndex; earlierIndex += 1) {
      const earlier = value.models[earlierIndex]
      if (earlier.provider !== later.provider) continue
      for (const earlierPattern of earlier.match ?? []) {
        const expression = globRegex(earlierPattern)
        for (const laterPattern of later.match ?? []) {
          if (expression.test(sampleFor(laterPattern))) failures.push(`models[${laterIndex}].match ${laterPattern} is shadowed by earlier ${earlier.provider}/${earlierPattern}`)
        }
      }
    }
  }
  return failures
}
