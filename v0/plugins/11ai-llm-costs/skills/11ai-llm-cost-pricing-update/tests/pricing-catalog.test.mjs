import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
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
  assert.deepEqual(findRate(pricing, "anthropic", "claude-opus-5").per1M, {
    input: 5,
    output: 25,
    cacheWrite5m: 6.25,
    cacheWrite1h: 10,
    cacheRead: 0.5,
  })
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

test("catalog validator rejects shadowed patterns and unofficial sources", () => {
  const fixture = mkdtempSync(join(tmpdir(), "11ai-pricing-validation-"))
  try {
    const seed = join(fixture, "pricing.json")
    writeFileSync(seed, JSON.stringify({
      version: 2,
      updatedAt: "2026-08-03",
      comment: "Validation fixture.",
      models: [
        { provider: "openai", match: ["gpt-5*"], per1M: { input: 1, output: 2 }, sourceUrl: "https://developers.openai.com/api/docs/pricing", verifiedAt: "2026-08-03" },
        { provider: "openai", match: ["gpt-5.6*"], per1M: { input: 3, output: 4 }, sourceUrl: "https://example.com/pricing", verifiedAt: "2026-08-03" },
      ],
    }))
    const result = spawnSync(process.execPath, [resolve(skillRoot, "scripts/sync-pricing-catalog.mjs"), "--seed", seed], { encoding: "utf8" })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /sourceUrl is not on an official openai domain/)
    assert.match(result.stderr, /gpt-5\.6\* is shadowed by earlier openai\/gpt-5\*/)
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
})
