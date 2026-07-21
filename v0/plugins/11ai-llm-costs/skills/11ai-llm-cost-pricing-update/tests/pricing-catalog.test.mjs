import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const testDir = dirname(fileURLToPath(import.meta.url))
const skillRoot = dirname(testDir)
const skillsRoot = dirname(skillRoot)
const canonicalPath = resolve(skillRoot, "references/pricing.json")
const targetPaths = [
  resolve(skillsRoot, "11ai-llm-cost-project/references/pricing.json"),
  resolve(skillsRoot, "11ai-llm-cost-global/references/pricing.json"),
  resolve(skillsRoot, "11ai-llm-cost-single-thread/references/pricing.json"),
]

function catalog(path) {
  return JSON.parse(readFileSync(path, "utf8"))
}

function findRate(pricing, provider, model) {
  return pricing.models.find((entry) => entry.provider === provider && entry.match.some((pattern) => {
    const expression = "^" + pattern.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replaceAll("*", ".*").replaceAll("?", ".") + "$"
    return new RegExp(expression, "i").test(model)
  }))
}

test("canonical catalog is synchronized and covers current common providers", () => {
  const pricing = catalog(canonicalPath)
  for (const path of targetPaths) assert.deepEqual(catalog(path), pricing)

  const providers = new Set(pricing.models.map((entry) => entry.provider))
  assert.deepEqual([...providers].sort(), ["anthropic", "cohere", "deepseek", "google", "mistral", "openai", "perplexity", "xai"])
  assert.deepEqual(findRate(pricing, "anthropic", "claude-sonnet-5").per1M, {
    input: 2,
    output: 10,
    cacheWrite5m: 2.5,
    cacheWrite1h: 4,
    cacheRead: 0.2,
  })
  assert.deepEqual(findRate(pricing, "google", "gemini-3.1-pro-preview").per1M, {
    input: 2,
    cachedInput: 0.2,
    output: 12,
  })
  assert.deepEqual(findRate(pricing, "xai", "grok-4.5").per1M, {
    input: 2,
    cachedInput: 0.3,
    output: 6,
  })
  assert.equal(findRate(pricing, "deepseek", "deepseek-v4-pro").per1M.output, 0.87)
})

test("catalog validator succeeds without rewriting files", () => {
  const output = execFileSync(process.execPath, [resolve(skillRoot, "scripts/sync-pricing-catalog.mjs")], { encoding: "utf8" })
  assert.match(output, /Pricing catalog valid and synchronized\./)
  assert.match(output, /Providers \(8\):/)
})
